// backend/src/realtime/notifications.socket.ts
import { getIO } from "./chat.socket";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";

/**
 * Registers notification-related socket handlers on the SHARED Socket.IO instance.
 * Must be called AFTER initChatSocket().
 */
export function initNotificationsSocket(): void {
  const io = getIO();
  if (!io) {
    console.warn("⚠️  Notifications: IO not ready");
    return;
  }

  // We just add a listener for new connections that want to join notification rooms
  io.on("connection", (socket) => {
    // Client explicitly asks to subscribe to notifications with their token
    socket.on("notifications:subscribe", (payload: { token?: string }) => {
      if (!payload?.token) {
        console.warn(`⚠️  Notif subscribe rejected (no token): ${socket.id}`);
        return;
      }

      try {
        const decoded = verifyStaffToken(payload.token) as StaffToken;
        socket.data.staff = decoded;

        // Join role-based room
        socket.join(`role:${decoded.role}`);
        if (decoded.branchId) {
          socket.join(`branch:${decoded.branchId}`);
        }

        console.log(
          `🔔 ${socket.id} subscribed to notifications (${decoded.role}${
            decoded.branchId ? ` / ${decoded.branchId}` : ""
          })`
        );

        socket.emit("notifications:subscribed", { ok: true });
      } catch {
        console.warn(`⚠️  Notif subscribe rejected (bad token): ${socket.id}`);
        socket.emit("notifications:subscribed", { ok: false });
      }
    });
  });

  console.log("🔔 Notifications socket handlers registered");
}