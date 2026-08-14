import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import {
  getMenuByBranch,
  getAvailableMenuByBranch,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemFeatured,
  copyMenuBetweenBranches,
  clearMenuForBranch,
} from "../db/menu.repo";
import { getIO } from "../realtime/chat.socket";

export const menuRouter = Router();

/* ═══════════════════════════════════════════════════════
   Middleware
═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   Real-time broadcast helper
═══════════════════════════════════════════════════════ */
function broadcastMenuUpdate(
  branchId: string,
  action: "created" | "updated" | "deleted",
  item?: any
) {
  try {
    const io = getIO();
    if (!io) {
      console.warn("⚠️ Socket.IO not initialized — skipping broadcast");
      return;
    }
    const room = `menu:${branchId}`;
    const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    io.to(room).emit("menu:updated", { branchId, action, item });
    console.log(`📡 Menu ${action} broadcast to ${room} (${roomSize} clients)`);
  } catch (err) {
    console.warn("⚠️ Menu broadcast failed:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   PUBLIC — customers fetch available menu items
═══════════════════════════════════════════════════════ */
menuRouter.get("/public/:branchId", async (req, res, next) => {
  try {
    const items = await getAvailableMenuByBranch(req.params.branchId);
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — full menu (including unavailable)
═══════════════════════════════════════════════════════ */
menuRouter.get("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const items = await getMenuByBranch(req.params.branchId);
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — create menu item
═══════════════════════════════════════════════════════ */
menuRouter.post("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      category,
      subcategory,
      description,
      price,
      image,
      featured = false,
      prepTime = "10–15 min",
      isAvailable = true,
    } = req.body;

    if (!name || typeof price !== "number" || !category || !subcategory) {
      res.status(400).json({
        ok: false,
        message: "Missing required fields: name, price, category, subcategory",
      });
      return;
    }

    const validCategories = ["Meals", "Drinks", "Desserts"];
    if (!validCategories.includes(category)) {
      res.status(400).json({
        ok: false,
        message: "Category must be one of: Meals, Drinks, Desserts",
      });
      return;
    }

    const item = await createMenuItem({
      branchId: req.params.branchId,
      name,
      category,
      subcategory,
      description: description ?? "",
      price,
      image: image ?? "",
      featured,
      prepTime,
      isAvailable,
    });

    broadcastMenuUpdate(req.params.branchId, "created", item);
    res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — update menu item
═══════════════════════════════════════════════════════ */
menuRouter.patch("/:branchId/:id", requireAdmin, async (req, res, next) => {
  try {
    const item = await updateMenuItem(req.params.id, req.params.branchId, req.body);
    if (!item) {
      res.status(404).json({ ok: false, message: "Item not found" });
      return;
    }
    broadcastMenuUpdate(req.params.branchId, "updated", item);
    res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — toggle availability (on/off for customers)
═══════════════════════════════════════════════════════ */
menuRouter.post("/:branchId/:id/toggle", requireAdmin, async (req, res, next) => {
  try {
    const item = await toggleMenuItemAvailability(req.params.id, req.params.branchId);
    if (!item) {
      res.status(404).json({ ok: false, message: "Item not found" });
      return;
    }
    broadcastMenuUpdate(req.params.branchId, "updated", item);
    res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — toggle featured (popular badge)
═══════════════════════════════════════════════════════ */
menuRouter.post("/:branchId/:id/featured", requireAdmin, async (req, res, next) => {
  try {
    const item = await toggleMenuItemFeatured(req.params.id, req.params.branchId);
    if (!item) {
      res.status(404).json({ ok: false, message: "Item not found" });
      return;
    }
    broadcastMenuUpdate(req.params.branchId, "updated", item);
    res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — delete menu item
═══════════════════════════════════════════════════════ */
menuRouter.delete("/:branchId/:id", requireAdmin, async (req, res, next) => {
  try {
    const ok = await deleteMenuItem(req.params.id, req.params.branchId);
    if (ok) {
      broadcastMenuUpdate(req.params.branchId, "deleted", { _id: req.params.id });
    }
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — clear all menu items for a branch (dangerous)
═══════════════════════════════════════════════════════ */
menuRouter.delete("/:branchId/all/clear", requireAdmin, async (req, res, next) => {
  try {
    const count = await clearMenuForBranch(req.params.branchId);
    broadcastMenuUpdate(req.params.branchId, "deleted");
    res.json({ ok: true, deleted: count });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — copy menu from one branch to another
═══════════════════════════════════════════════════════ */
menuRouter.post("/copy", requireAdmin, async (req, res, next) => {
  try {
    const { fromBranchId, toBranchId } = req.body;
    if (!fromBranchId || !toBranchId) {
      res.status(400).json({ ok: false, message: "Missing branch IDs" });
      return;
    }
    if (fromBranchId === toBranchId) {
      res.status(400).json({ ok: false, message: "Source and target branches must differ" });
      return;
    }
    const count = await copyMenuBetweenBranches(fromBranchId, toBranchId);
    broadcastMenuUpdate(toBranchId, "created");
    res.json({ ok: true, copied: count });
  } catch (err) {
    next(err);
  }
});