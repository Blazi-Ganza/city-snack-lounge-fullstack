import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import {
  getAllBranchesAdmin,
  getActiveBranchesPublic,
  getBranchById,
  createBranch,
  updateBranch,
  setBranchActive,
  hardDeleteBranch,
  getBranchUsage,
} from "../db/branches.repo";
import { getIO } from "../realtime/chat.socket";
import { updateBranchHours, DEFAULT_HOURS } from "../db/branches.repo";

export const branchesRouter = Router();

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

function broadcastBranchUpdate(
  action: "created" | "updated" | "deleted",
  branch?: any
) {
  try {
    const io = getIO();
    if (!io) return;
    io.emit("branches:updated", { action, branch });
    console.log(`📡 Branch ${action} broadcast to all clients`);
  } catch (err) {
    console.warn("⚠️ Branch broadcast failed:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   PUBLIC — customers see only active branches
═══════════════════════════════════════════════════════ */
branchesRouter.get("/", async (_req, res, next) => {
  try {
    const branches = await getActiveBranchesPublic();
    res.json({ branches });
  } catch (error) {
    next(error);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — full list including inactive
═══════════════════════════════════════════════════════ */
branchesRouter.get("/admin/all", requireAdmin, async (_req, res, next) => {
  try {
    const branches = await getAllBranchesAdmin();
    res.json({ ok: true, branches });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — get one branch with usage stats
═══════════════════════════════════════════════════════ */
branchesRouter.get("/admin/:id", requireAdmin, async (req, res, next) => {
  try {
    const branch = await getBranchById(req.params.id);
    if (!branch) {
      res.status(404).json({ ok: false, message: "Branch not found" });
      return;
    }
    const usage = await getBranchUsage(req.params.id);
    res.json({ ok: true, branch, usage });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — create branch
═══════════════════════════════════════════════════════ */
branchesRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, subtitle, address, phone, email, city } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ ok: false, message: "Branch name is required" });
      return;
    }

    const branch = await createBranch({
      name,
      subtitle,
      address,
      phone,
      email,
      city,
    });

    broadcastBranchUpdate("created", branch);
    res.json({ ok: true, branch });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — update branch (name, subtitle, contact, etc.)
   NOTE: id/slug cannot be changed
═══════════════════════════════════════════════════════ */
branchesRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { name, subtitle, address, phone, email, city, isActive } = req.body;

    const patch: any = {};
    if (name !== undefined) patch.name = String(name).trim();
    if (subtitle !== undefined) patch.subtitle = String(subtitle).trim();
    if (address !== undefined) patch.address = String(address).trim();
    if (phone !== undefined) patch.phone = String(phone).trim();
    if (email !== undefined) patch.email = String(email).trim();
    if (city !== undefined) patch.city = String(city).trim();
    if (typeof isActive === "boolean") patch.isActive = isActive;

    const branch = await updateBranch(req.params.id, patch);
    if (!branch) {
      res.status(404).json({ ok: false, message: "Branch not found" });
      return;
    }

    broadcastBranchUpdate("updated", branch);
    res.json({ ok: true, branch });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — update branch hours
═══════════════════════════════════════════════════════ */
branchesRouter.patch("/:id/hours", requireAdmin, async (req, res, next) => {
  try {
    const { hours } = req.body;
    if (!hours) {
      res.status(400).json({ ok: false, message: "hours object is required" });
      return;
    }
    const branch = await updateBranchHours(req.params.id, hours);
    if (!branch) {
      res.status(404).json({ ok: false, message: "Branch not found" });
      return;
    }
    broadcastBranchUpdate("updated", branch);
    res.json({ ok: true, branch });
  } catch (err: any) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — toggle active (soft delete / restore)
═══════════════════════════════════════════════════════ */
branchesRouter.post("/:id/toggle", requireAdmin, async (req, res, next) => {
  try {
    const current = await getBranchById(req.params.id);
    if (!current) {
      res.status(404).json({ ok: false, message: "Branch not found" });
      return;
    }
    const branch = await setBranchActive(req.params.id, !current.isActive);
    broadcastBranchUpdate("updated", branch);
    res.json({ ok: true, branch });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — hard delete (only if branch is empty)
═══════════════════════════════════════════════════════ */
branchesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const usage = await getBranchUsage(req.params.id);
    if (usage.total > 0) {
      res.status(400).json({
        ok: false,
        message: `Cannot delete: branch has data (${usage.total} records). Deactivate instead.`,
        usage,
      });
      return;
    }
    const ok = await hardDeleteBranch(req.params.id);
    if (ok) broadcastBranchUpdate("deleted", { id: req.params.id });
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});