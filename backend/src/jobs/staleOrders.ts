import { getDb } from "../db/mongo";
import { getIO } from "../realtime/chat.socket";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const notified = new Set<string>();

async function checkStaleOrders() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

    const staleOrders = await db
      .collection("orders")
      .find({
        status: "awaiting_payment",
        createdAt: { $lt: cutoff },
        isArchived: { $ne: true },
      })
      .toArray();

    const io = getIO();
    if (!io) return;

    for (const order of staleOrders) {
      const id = order._id.toString();
      if (notified.has(id)) continue;
      notified.add(id);

      io.emit("admin:notification", {
        type: "stale_payment",
        branchId: order.branchId,
        title: "Order awaiting payment",
        message: `${order.orderCode} — ${order.customerName ?? "Guest"} hasn't paid for 10+ min`,
        orderCode: order.orderCode,
        createdAt: new Date().toISOString(),
      });
    }

    // Clean up notified set (remove IDs that no longer match)
    const staleIds = new Set(staleOrders.map((o) => o._id.toString()));
    for (const id of notified) {
      if (!staleIds.has(id)) notified.delete(id);
    }
  } catch (err) {
    console.error("❌ Stale orders check failed:", err);
  }
}

export function startStaleOrdersJob() {
  checkStaleOrders();
  setInterval(checkStaleOrders, CHECK_INTERVAL_MS);
  console.log("🕐 Stale orders check scheduled (every 5 min)");
}