// backend/src/services/notifications.ts
import { getDb } from "../db/mongo";
import { getIO } from "../realtime/chat.socket";   // 👈 CHANGED

export type NotificationType = "order" | "chat" | "reservation" | "stale_payment";

export interface NotificationPayload {
  type: NotificationType;
  branchId?: string;
  title: string;
  message: string;
  orderCode?: string;
  metadata?: Record<string, unknown>;
}

export async function emitNotification(
  payload: NotificationPayload,
  options: { alsoNotifyReceptionist?: boolean } = {}
): Promise<void> {
  const notif = {
    ...payload,
    createdAt: new Date().toISOString(),
  };

  // 1. Persist to DB
  try {
    const db = getDb();
    await db.collection("notifications").insertOne({
      ...notif,
      createdAtDate: new Date(),
      read: false,
    });
  } catch (err) {
    console.error("⚠️  Failed to persist notification:", err);
  }

  // 2. Broadcast via SHARED socket instance
  try {
    const io = getIO();
    if (!io) {
      console.warn("⚠️  IO not ready — notification not broadcast");
      return;
    }

    io.to("role:admin").emit("admin:notification", notif);

    if (options.alsoNotifyReceptionist && payload.branchId) {
      io.to(`branch:${payload.branchId}`).emit("admin:notification", notif);
    }

    console.log(`🔔 Notification sent: ${payload.type} → ${payload.title}`);
  } catch (err) {
    console.error("⚠️  Failed to emit notification:", err);
  }
}