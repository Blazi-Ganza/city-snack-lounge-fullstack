import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/mongo";
import { createReservation } from "../db/reservations.repo";
import { getIO } from "../realtime/chat.socket";
import {
  createOrder,
  findOrderByCode,
  markCustomerConfirmedPayment,
} from "../db/orders.repo";
import {
  getUpcomingEventsByBranch,
  getFeaturedUpcomingEvent,
} from "../db/events.repo";
import { getActivePromosByBranch } from "../db/promos.repo";

export const customerRouter = Router();

/* ═══════════════════════════════════════════════════════
   Helper — send notification to admin dashboard
═══════════════════════════════════════════════════════ */
function notifyAdmin(payload: {
  type: "order" | "chat" | "reservation" | "stale_payment";
  branchId?: string;
  title: string;
  message: string;
  orderCode?: string;
}) {
  try {
    const io = getIO();
    if (!io) return;
    io.emit("admin:notification", {
      ...payload,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("⚠️ Failed to send admin notification:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   Schemas
═══════════════════════════════════════════════════════ */

const reservationSchema = z.object({
  branchId: z.enum(["musanze", "huye"]),
  name: z.string().min(2),
  phone: z.string().min(7),
  date: z.string().min(4),
  time: z.string().min(2),
  guests: z.coerce.number().int().min(1).max(20),
});

const orderItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  qty: z.number().int().min(1),
});

const orderSchema = z.object({
  branchId: z.enum(["musanze", "huye"]),
  customerName: z.string().min(2),
  phone: z.string().min(7),
  type: z.enum(["pickup", "delivery"]),
  address: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  total: z.number().min(0),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "momo"]).default("cash"),
});

const chatMessageSchema = z.object({
  branchId: z.enum(["musanze", "huye"]),
  customerName: z.string().min(2),
  message: z.string().min(1),
});

/* ═══════════════════════════════════════════════════════
   Menu
═══════════════════════════════════════════════════════ */

customerRouter.get("/:branchId/menu", async (req, res, next) => {
  try {
    const branchId = req.params.branchId;
    const category = req.query.category
      ? String(req.query.category)
      : undefined;
    const search = req.query.search ? String(req.query.search).trim() : "";

    const db = getDb();
    const query: Record<string, unknown> = { branchId };

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const menu = await db
      .collection("menu_items")
      .find(query, { projection: { _id: 0 } })
      .toArray();
    res.json({ menu });
  } catch (error) {
    next(error);
  }
});

/* ═══════════════════════════════════════════════════════
   Events (public)
═══════════════════════════════════════════════════════ */

customerRouter.get("/:branchId/events", async (req, res, next) => {
  try {
    const events = await getUpcomingEventsByBranch(req.params.branchId);
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

customerRouter.get("/:branchId/events/featured", async (req, res, next) => {
  try {
    const event = await getFeaturedUpcomingEvent(req.params.branchId);
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

/* ═══════════════════════════════════════════════════════
   Promos (public — only active ones)
═══════════════════════════════════════════════════════ */

customerRouter.get("/:branchId/promos", async (req, res, next) => {
  try {
    const promos = await getActivePromosByBranch(req.params.branchId);
    res.json({ promos });
  } catch (error) {
    next(error);
  }
});

/* ═══════════════════════════════════════════════════════
   Reviews
═══════════════════════════════════════════════════════ */

customerRouter.get("/:branchId/reviews", async (req, res, next) => {
  try {
    const db = getDb();
    const reviews = await db
      .collection("reviews")
      .find({ branchId: req.params.branchId }, { projection: { _id: 0 } })
      .toArray();

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

/* ═══════════════════════════════════════════════════════
   Reservations
═══════════════════════════════════════════════════════ */

customerRouter.post("/reservations", async (req, res, next) => {
  try {
    const payload = reservationSchema.parse(req.body);
    const reservation = await createReservation(payload);

    const io = getIO();
    if (io) {
      io.to(`recep:${payload.branchId}`).emit(
        "reception:reservation-new",
        reservation
      );
    }

    // 🔔 Notify admin dashboard
    notifyAdmin({
      type: "reservation",
      branchId: payload.branchId,
      title: "New reservation",
      message: `${payload.name} · ${payload.guests} guests · ${payload.date} at ${payload.time}`,
    });

    res.status(201).json({
      ok: true,
      message: "Reservation received.",
      reservation,
    });
  } catch (error) {
    next(error);
  }
});

/* ═══════════════════════════════════════════════════════
   Orders
═══════════════════════════════════════════════════════ */

customerRouter.get("/orders/:orderCode", async (req, res, next) => {
  try {
    const order = await findOrderByCode(req.params.orderCode);
    if (!order) {
      return res.status(404).json({ ok: false, message: "Order not found." });
    }
    return res.json({ ok: true, order });
  } catch (error) {
    return next(error);
  }
});

customerRouter.post("/orders", async (req, res, next) => {
  try {
    console.log("🔵 Incoming order body:", JSON.stringify(req.body, null, 2));

    const payload = orderSchema.parse(req.body);

    console.log("🟢 Parsed payload:", {
      customerName: payload.customerName,
      paymentMethod: payload.paymentMethod,
      type: payload.type,
      total: payload.total,
    });

    if (payload.type === "delivery" && !payload.address?.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Address is required for delivery orders.",
      });
    }

    const order = await createOrder(payload);

    console.log("✅ Created order:", {
      orderCode: order.orderCode,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });

    const io = getIO();
    if (io) {
      io.to(`recep:${payload.branchId}`).emit("reception:order-new", order);
      console.log(
        `📢 Emitted reception:order-new to recep:${payload.branchId}`
      );
    } else {
      console.warn("⚠️ Socket IO not available!");
    }

    // 🔔 Notify admin dashboard
    notifyAdmin({
      type: "order",
      branchId: payload.branchId,
      title: "New order",
      message: `${payload.customerName} · ${payload.total.toLocaleString()} RWF · ${payload.type}`,
      orderCode: order.orderCode,
    });

    return res.status(201).json({
      ok: true,
      message: "Order received.",
      order,
    });
  } catch (error) {
    console.error("❌ Order error:", error);
    return next(error);
  }
});

/** 🆕 Customer taps "I have paid" — notify reception */
customerRouter.post(
  "/orders/:orderCode/confirm-payment",
  async (req, res, next) => {
    try {
      const { orderCode } = req.params;
      console.log(`💰 Customer confirming payment for: ${orderCode}`);

      const order = await markCustomerConfirmedPayment(orderCode);

      if (!order) {
        return res
          .status(404)
          .json({ ok: false, message: "Order not found." });
      }

      const io = getIO();
      if (io) {
        io.to(`recep:${order.branchId}`).emit(
          "reception:order-updated",
          order
        );
        console.log(
          `📢 Customer paid alert sent to recep:${order.branchId} for ${orderCode}`
        );
      }

      // 🔔 Notify admin dashboard
      notifyAdmin({
        type: "order",
        branchId: order.branchId,
        title: "Customer confirmed payment",
        message: `${order.orderCode} — ${order.customerName ?? "Guest"} says paid`,
        orderCode: order.orderCode,
      });

      return res.json({
        ok: true,
        message: "Reception has been notified. Thank you!",
      });
    } catch (error) {
      console.error("❌ Confirm payment error:", error);
      return next(error);
    }
  }
);

/* ═══════════════════════════════════════════════════════
   Chats
═══════════════════════════════════════════════════════ */

customerRouter.post("/chats", async (req, res, next) => {
  try {
    const payload = chatMessageSchema.parse(req.body);
    const db = getDb();

    await db.collection("chats").insertOne({
      ...payload,
      status: "new",
      createdAt: new Date(),
    });

    // 🔔 Notify admin dashboard
    notifyAdmin({
      type: "chat",
      branchId: payload.branchId,
      title: "New customer chat",
      message: `${payload.customerName}: ${payload.message.substring(0, 80)}${payload.message.length > 80 ? "..." : ""}`,
    });

    res.status(201).json({ ok: true, message: "Message sent to reception." });
  } catch (error) {
    next(error);
  }
});