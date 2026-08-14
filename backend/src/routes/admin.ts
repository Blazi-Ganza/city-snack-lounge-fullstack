import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo";
import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import { getAdminOverview, getAllChats, getAllOrders } from "../db/admin.repo";

export const adminRouter = Router();

/* ═══════════════════════════════════════════════════════
   Admin-only middleware — with better error handling
═══════════════════════════════════════════════════════ */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      res.status(401).json({ ok: false, message: "No token provided" });
      return;
    }

    const decoded = verifyStaffToken(token) as StaffToken;

    if (decoded.role !== "admin") {
      res.status(403).json({ ok: false, message: "Admin access only" });
      return;
    }

    (req as Request & { staff?: StaffToken }).staff = decoded;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
}

/* ═══════════════════════════════════════════════════════
   Routes
═══════════════════════════════════════════════════════ */

// Dashboard overview
adminRouter.get("/overview", requireAdmin, async (_req, res, next) => {
  try {
    console.log("📊 Fetching admin overview...");
    const overview = await getAdminOverview();
    console.log("✅ Overview fetched, branches:", overview.branches.length);
    res.json({ ok: true, overview });
  } catch (err) {
    console.error("❌ /overview error:", err);
    next(err);
  }
});

// All chats across all branches
adminRouter.get("/chats", requireAdmin, async (_req, res, next) => {
  try {
    console.log("💬 Fetching all chats...");
    const chats = await getAllChats();
    console.log("✅ Chats fetched:", chats.length);
    res.json({ ok: true, chats });
  } catch (err) {
    console.error("❌ /chats error:", err);
    next(err);
  }
});

// All orders across all branches
adminRouter.get("/orders", requireAdmin, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 200);
    const includeArchived = req.query.includeArchived === "true";
    const orders = await getAllOrders(limit, includeArchived);
    res.json({ ok: true, orders });
  } catch (err) {
    next(err);
  }
});
/* ═══════════════════════════════════════════════════════
   Delete a chat (admin)
═══════════════════════════════════════════════════════ */
adminRouter.delete("/chats/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ ok: false, message: "Invalid chat id" });
      return;
    }
    const db = getDb();
    const result = await db
      .collection("chats")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ ok: false, message: "Chat not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   Archive an order (soft-hide)
═══════════════════════════════════════════════════════ */
adminRouter.post("/orders/:id/archive", requireAdmin, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ ok: false, message: "Invalid order id" });
      return;
    }
    const db = getDb();
    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { isArchived: true, archivedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) {
      res.status(404).json({ ok: false, message: "Order not found" });
      return;
    }
    res.json({ ok: true, order: result });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   Un-archive an order
═══════════════════════════════════════════════════════ */
adminRouter.post("/orders/:id/unarchive", requireAdmin, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ ok: false, message: "Invalid order id" });
      return;
    }
    const db = getDb();
    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { isArchived: false }, $unset: { archivedAt: "" } },
      { returnDocument: "after" }
    );
    if (!result) {
      res.status(404).json({ ok: false, message: "Order not found" });
      return;
    }
    res.json({ ok: true, order: result });
  } catch (err) {
    next(err);
  }
});