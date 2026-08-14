import { getDb } from "../db/mongo";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // every hour

async function runAutoArchive() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const result = await db.collection("orders").updateMany(
      {
        status: { $in: ["delivered", "cancelled"] },
        updatedAt: { $lt: cutoff },
        isArchived: { $ne: true },
      },
      {
        $set: { isArchived: true, archivedAt: new Date() },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `📦 Auto-archived ${result.modifiedCount} order(s) older than 7 days`
      );
    }
  } catch (err) {
    console.error("❌ Auto-archive job failed:", err);
  }
}

export function startAutoArchiveJob() {
  // Run once at startup
  runAutoArchive();
  // Then every hour
  setInterval(runAutoArchive, CHECK_INTERVAL_MS);
  console.log("🕐 Auto-archive job scheduled (runs every hour)");
}