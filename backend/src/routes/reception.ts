import { ObjectId } from "mongodb";
import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/mongo";

export const receptionRouter = Router();

const chatUpdateSchema = z.object({
  status: z.enum(["new", "in_progress", "closed"]).optional(),
  reply: z.string().min(1).optional(),
});

const orderStatusSchema = z.object({
  status: z.enum(["new", "preparing", "ready", "out_for_delivery", "delivered"]),
});

const deliveryStatusSchema = z.object({
  status: z.enum(["assigned", "on_the_way", "completed"]),
});

receptionRouter.get("/:branchId/dashboard", async (req, res, next) => {
  try {
    const db = getDb();
    const branchId = req.params.branchId;

    const [chats, orders, deliveries] = await Promise.all([
      db.collection("chats").find({ branchId }).sort({ createdAt: -1 }).limit(30).toArray(),
      db.collection("orders").find({ branchId }).sort({ createdAt: -1 }).limit(30).toArray(),
      db.collection("deliveries").find({ branchId }).sort({ createdAt: -1 }).limit(30).toArray(),
    ]);

    res.json({ chats, orders, deliveries });
  } catch (error) {
    next(error);
  }
});

receptionRouter.patch("/:branchId/chats/:chatId", async (req, res, next) => {
  try {
    const payload = chatUpdateSchema.parse(req.body);
    const db = getDb();

    const result = await db.collection("chats").updateOne(
      { _id: new ObjectId(req.params.chatId), branchId: req.params.branchId },
      {
        $set: {
          ...payload,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: "Chat not found." });
    }

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

receptionRouter.patch("/:branchId/orders/:orderId", async (req, res, next) => {
  try {
    const payload = orderStatusSchema.parse(req.body);
    const db = getDb();

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(req.params.orderId), branchId: req.params.branchId },
      { $set: { status: payload.status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: "Order not found." });
    }

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

receptionRouter.patch("/:branchId/deliveries/:deliveryId", async (req, res, next) => {
  try {
    const payload = deliveryStatusSchema.parse(req.body);
    const db = getDb();

    const result = await db.collection("deliveries").updateOne(
      { _id: new ObjectId(req.params.deliveryId), branchId: req.params.branchId },
      { $set: { status: payload.status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: "Delivery task not found." });
    }

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});
