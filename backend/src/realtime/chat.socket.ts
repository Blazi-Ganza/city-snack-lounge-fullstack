import type { Server as HttpServer } from "node:http";
import { Server as IOServer } from "socket.io";
import { env } from "../config/env";
import {
  addReceptionMessage,
  findChat,
  findChatsByBranch,
  upsertCustomerMessage,
} from "../db/chats.repo";

interface CustomerJoin {
  branchId: string;
  customerId: string;
  customerName: string;
}
interface CustomerMessage {
  branchId: string;
  customerId: string;
  customerName: string;
  text: string;
}
interface ReceptionJoin {
  branchId: string;
}
interface ReceptionReply {
  branchId: string;
  customerId: string;
  text: string;
}

const customerRoom = (b: string, c: string) => `cust:${b}:${c}`;
const receptionRoom = (b: string) => `recep:${b}`;

let ioInstance: IOServer | null = null;
export function getIO(): IOServer | null {
  return ioInstance;
}

export function initChatSocket(httpServer: HttpServer) {
  const io = new IOServer(httpServer, {
    cors: { origin: env.FRONTEND_ORIGIN, credentials: true },
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // ═══════════════════════════════════════════════════
    // 🍽️ MENU — Real-time menu updates (public + admin)
    // ═══════════════════════════════════════════════════
    socket.on("menu:subscribe", (p: { branchId: string }) => {
      if (!p?.branchId) return;
      const room = `menu:${p.branchId}`;
      socket.join(room);
      console.log(`🍽️  ${socket.id} subscribed to ${room}`);
    });

    socket.on("menu:unsubscribe", (p: { branchId: string }) => {
      if (!p?.branchId) return;
      const room = `menu:${p.branchId}`;
      socket.leave(room);
      console.log(`🍽️  ${socket.id} unsubscribed from ${room}`);
    });

    // CUSTOMER
    socket.on("customer:join", async (p: CustomerJoin) => {
      socket.join(customerRoom(p.branchId, p.customerId));
      const chat = await findChat(p.branchId, p.customerId);
      socket.emit("chat:history", chat ?? { messages: [] });
    });

    socket.on("customer:message", async (p: CustomerMessage) => {
      const chat = await upsertCustomerMessage(p);
      if (!chat) return;
      io.to(customerRoom(p.branchId, p.customerId)).emit(
        "chat:message",
        chat.messages[chat.messages.length - 1]
      );
      io.to(receptionRoom(p.branchId)).emit("reception:chat-updated", chat);
    });

    // RECEPTION
    socket.on("reception:join", async (p: ReceptionJoin) => {
      console.log("👔 reception:join", p);
      socket.join(receptionRoom(p.branchId));
      const list = await findChatsByBranch(p.branchId);
      socket.emit("reception:chats", list);
    });

    socket.on("reception:reply", async (p: ReceptionReply) => {
      const chat = await addReceptionMessage(p);
      if (!chat) return;
      io.to(customerRoom(p.branchId, p.customerId)).emit(
        "chat:message",
        chat.messages[chat.messages.length - 1]
      );
      io.to(receptionRoom(p.branchId)).emit("reception:chat-updated", chat);
    });

    // ORDERS
    socket.on("reception:orders-list", async (p: { branchId: string }) => {
      console.log("📋 orders-list for", p.branchId);
      const { findOrdersByBranch } = await import("../db/orders.repo");
      const list = await findOrdersByBranch(p.branchId);
      console.log(`📋 Sending ${list.length} orders`);
      socket.emit("reception:orders", list);
    });

    socket.on(
      "reception:order-status",
      async (p: { branchId: string; id: string; status: string }) => {
        console.log("🔄 order-status:", p);
        const { updateOrderStatus } = await import("../db/orders.repo");
        const updated = await updateOrderStatus(
          p.id,
          p.branchId,
          p.status as never
        );
        if (updated) {
          console.log("✅ Order status updated:", updated.orderCode, "→", updated.status);
          io.to(receptionRoom(p.branchId)).emit("reception:order-updated", updated);
        } else {
          console.warn("⚠️ Order not found for status update");
        }
      }
    );

    socket.on(
      "reception:order-delete",
      async (p: { branchId: string; id: string }) => {
        console.log("🗑️ order-delete:", p);
        const { deleteOrder } = await import("../db/orders.repo");
        const ok = await deleteOrder(p.id, p.branchId);
        if (ok) {
          io.to(receptionRoom(p.branchId)).emit("reception:order-deleted", {
            id: p.id,
          });
        }
      }
    );

    // 🆕 Confirm MoMo payment
    socket.on(
      "reception:order-confirm-payment",
      async (p: { branchId: string; id: string }) => {
        console.log("💰💰💰 CONFIRM PAYMENT RECEIVED:", p);
        try {
          const { confirmOrderPayment } = await import("../db/orders.repo");
          const updated = await confirmOrderPayment(p.id, p.branchId);
          if (updated) {
            console.log(
              "✅ Payment confirmed:",
              updated.orderCode,
              "→ status:",
              updated.status,
              "paymentStatus:",
              updated.paymentStatus
            );
            io.to(receptionRoom(p.branchId)).emit("reception:order-updated", updated);
            console.log("📢 Emitted reception:order-updated to recep:" + p.branchId);
          } else {
            console.error("❌ Order NOT FOUND for id:", p.id, "branchId:", p.branchId);
          }
        } catch (err) {
          console.error("❌ Error confirming payment:", err);
        }
      }
    );

    // 🆕 Reject MoMo payment
    socket.on(
      "reception:order-reject-payment",
      async (p: { branchId: string; id: string }) => {
        console.log("❌ REJECT PAYMENT:", p);
        try {
          const { rejectOrderPayment } = await import("../db/orders.repo");
          const updated = await rejectOrderPayment(p.id, p.branchId);
          if (updated) {
            console.log("✅ Payment rejected:", updated.orderCode);
            io.to(receptionRoom(p.branchId)).emit("reception:order-updated", updated);
          }
        } catch (err) {
          console.error("❌ Error rejecting payment:", err);
        }
      }
    );

    // RESERVATIONS
    socket.on(
      "reception:reservations-list",
      async (p: { branchId: string }) => {
        const { findReservationsByBranch } = await import("../db/reservations.repo");
        const list = await findReservationsByBranch(p.branchId);
        socket.emit("reception:reservations", list);
      }
    );

    socket.on(
      "reception:reservation-status",
      async (p: { branchId: string; id: string; status: string }) => {
        const { updateReservationStatus } = await import("../db/reservations.repo");
        const updated = await updateReservationStatus(
          p.id,
          p.branchId,
          p.status as never
        );
        if (updated) {
          io.to(receptionRoom(p.branchId)).emit("reception:reservation-updated", updated);
        }
      }
    );

    socket.on(
      "reception:reservation-delete",
      async (p: { branchId: string; id: string }) => {
        const { deleteReservation } = await import("../db/reservations.repo");
        const ok = await deleteReservation(p.id, p.branchId);
        if (ok) {
          io.to(receptionRoom(p.branchId)).emit("reception:reservation-deleted", {
            id: p.id,
          });
        }
      }
    );

    // CHAT ADMIN
    socket.on(
      "reception:chat-status",
      async (p: { branchId: string; customerId: string; status: string }) => {
        const { updateChatStatus } = await import("../db/chats.repo");
        const chat = await updateChatStatus(
          p.branchId,
          p.customerId,
          p.status as never
        );
        if (chat) {
          io.to(receptionRoom(p.branchId)).emit("reception:chat-updated", chat);
        }
      }
    );

    socket.on(
      "reception:chat-delete",
      async (p: { branchId: string; customerId: string }) => {
        const { deleteChat } = await import("../db/chats.repo");
        const ok = await deleteChat(p.branchId, p.customerId);
        if (ok) {
          io.to(receptionRoom(p.branchId)).emit("reception:chat-deleted", {
            customerId: p.customerId,
          });
        }
      }
    );

    socket.on(
      "reception:purge-closed",
      async (p: { branchId: string; olderThanDays: number }) => {
        const { purgeOldClosedChats } = await import("../db/chats.repo");
        const deleted = await purgeOldClosedChats(p.branchId, p.olderThanDays);
        io.to(receptionRoom(p.branchId)).emit("reception:purge-done", {
          deleted,
        });
      }
    );

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
}