import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import {
  getPromosByBranch,
  createPromo,
  updatePromo,
  deletePromo,
  togglePromoActive,
  togglePromoFeatured,
} from "../db/promos.repo";
import { getIO } from "../realtime/chat.socket";

export const promosRouter = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ ok: false, message: "No token provided" });
    return;
  }
  try {
    const decoded = verifyStaffToken(token) as StaffToken;
    if (decoded.role !== "admin") {
      res.status(403).json({ ok: false, message: "Admin access only" });
      return;
    }
    (req as Request & { staff?: StaffToken }).staff = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
}

function broadcastPromoUpdate(
  branchId: string,
  action: "created" | "updated" | "deleted",
  promo?: any
) {
  try {
    const io = getIO();
    if (!io) return;
    io.to(`promos:${branchId}`).emit("promos:updated", { branchId, action, promo });
    console.log(`📡 Promo ${action} broadcast to promos:${branchId}`);
  } catch (err) {
    console.warn("⚠️ Promo broadcast failed:", err);
  }
}

/* ADMIN — list all promos */
promosRouter.get("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const items = await getPromosByBranch(req.params.branchId);
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

/* ADMIN — create promo */
promosRouter.post("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      itemIds = [],
      startDate,
      endDate,
      startTime,
      endTime,
      isActive = true,
      isFeatured = false,
    } = req.body;

    if (!title || !discountType || discountValue == null || !startDate || !endDate) {
      res.status(400).json({
        ok: false,
        message: "Missing required: title, discountType, discountValue, startDate, endDate",
      });
      return;
    }
    if (!["percentage", "fixed"].includes(discountType)) {
      res.status(400).json({ ok: false, message: "discountType must be 'percentage' or 'fixed'" });
      return;
    }
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      res.status(400).json({ ok: false, message: "Select at least one menu item" });
      return;
    }

    const promo = await createPromo({
      branchId: req.params.branchId,
      title,
      description: description ?? "",
      discountType,
      discountValue: Number(discountValue),
      itemIds,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      isActive: Boolean(isActive),
      isFeatured: Boolean(isFeatured),
    });

    broadcastPromoUpdate(req.params.branchId, "created", promo);
    res.json({ ok: true, promo });
  } catch (err) {
    next(err);
  }
});

/* ADMIN — update promo */
promosRouter.patch("/:branchId/:id", requireAdmin, async (req, res, next) => {
  try {
    const promo = await updatePromo(req.params.id, req.params.branchId, req.body);
    if (!promo) {
      res.status(404).json({ ok: false, message: "Promo not found" });
      return;
    }
    broadcastPromoUpdate(req.params.branchId, "updated", promo);
    res.json({ ok: true, promo });
  } catch (err) {
    next(err);
  }
});

/* ADMIN — toggle active */
promosRouter.post("/:branchId/:id/toggle", requireAdmin, async (req, res, next) => {
  try {
    const promo = await togglePromoActive(req.params.id, req.params.branchId);
    if (!promo) {
      res.status(404).json({ ok: false, message: "Promo not found" });
      return;
    }
    broadcastPromoUpdate(req.params.branchId, "updated", promo);
    res.json({ ok: true, promo });
  } catch (err) {
    next(err);
  }
});

/* ADMIN — toggle featured */
promosRouter.post("/:branchId/:id/featured", requireAdmin, async (req, res, next) => {
  try {
    const promo = await togglePromoFeatured(req.params.id, req.params.branchId);
    if (!promo) {
      res.status(404).json({ ok: false, message: "Promo not found" });
      return;
    }
    broadcastPromoUpdate(req.params.branchId, "updated", promo);
    res.json({ ok: true, promo });
  } catch (err) {
    next(err);
  }
});

/* ADMIN — delete */
promosRouter.delete("/:branchId/:id", requireAdmin, async (req, res, next) => {
  try {
    const ok = await deletePromo(req.params.id, req.params.branchId);
    if (ok) broadcastPromoUpdate(req.params.branchId, "deleted", { _id: req.params.id });
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});