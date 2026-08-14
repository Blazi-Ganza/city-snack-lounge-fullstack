import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import {
  listAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  resetStaffPasscode,
  deleteStaff,
  countAdmins,
  generatePasscode,
  type StaffRole,
} from "../db/staff.repo";

export const staffRouter = Router();

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

/* GET /api/staff — list all */
staffRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const items = await listAllStaff();
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

/* POST /api/staff — create new */
staffRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, role, branchId, email, passcode: customPasscode } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ ok: false, message: "Name is required" });
      return;
    }
    if (!["admin", "receptionist"].includes(role)) {
      res.status(400).json({ ok: false, message: "Invalid role" });
      return;
    }
    if (role === "receptionist" && !branchId) {
      res.status(400).json({ ok: false, message: "branchId required for receptionist" });
      return;
    }

    const plainPasscode = (customPasscode && String(customPasscode).trim()) || generatePasscode();
    if (plainPasscode.length < 4) {
      res.status(400).json({ ok: false, message: "Passcode must be at least 4 characters" });
      return;
    }

    const staff = await createStaff({
      name,
      role: role as StaffRole,
      branchId,
      email,
      passcode: plainPasscode,
    });

    // Return plaintext passcode ONCE
    res.json({ ok: true, staff, passcode: plainPasscode });
  } catch (err: any) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

/* PATCH /api/staff/:id — update name/email/branch/active */
staffRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const requesterId = "unknown"; // JWT doesn't currently carry staffId — see note below
    const target = await getStaffById(req.params.id);
    if (!target) {
      res.status(404).json({ ok: false, message: "Staff not found" });
      return;
    }

    const { name, email, branchId, isActive } = req.body;

    // Safety: prevent deactivating the last active admin
    if (typeof isActive === "boolean" && !isActive && target.role === "admin" && target.isActive) {
      const activeAdmins = await countAdmins(true);
      if (activeAdmins <= 1) {
        res.status(400).json({
          ok: false,
          message: "Cannot deactivate the last active admin. Create another admin first.",
        });
        return;
      }
    }

    const staff = await updateStaff(req.params.id, { name, email, branchId, isActive });
    res.json({ ok: true, staff });
  } catch (err) {
    next(err);
  }
});

/* POST /api/staff/:id/reset — generate new passcode */
staffRouter.post("/:id/reset", requireAdmin, async (req, res, next) => {
  try {
    const target = await getStaffById(req.params.id);
    if (!target) {
      res.status(404).json({ ok: false, message: "Staff not found" });
      return;
    }

    const custom = req.body?.passcode ? String(req.body.passcode).trim() : "";
    const plainPasscode = custom || generatePasscode();

    if (plainPasscode.length < 4) {
      res.status(400).json({ ok: false, message: "Passcode must be at least 4 characters" });
      return;
    }

    const staff = await resetStaffPasscode(req.params.id, plainPasscode);
    res.json({ ok: true, staff, passcode: plainPasscode });
  } catch (err: any) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

/* DELETE /api/staff/:id — delete (with safety checks) */
staffRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const target = await getStaffById(req.params.id);
    if (!target) {
      res.status(404).json({ ok: false, message: "Staff not found" });
      return;
    }

    // Safety: prevent deleting the last admin
    if (target.role === "admin") {
      const totalAdmins = await countAdmins(false);
      if (totalAdmins <= 1) {
        res.status(400).json({
          ok: false,
          message: "Cannot delete the last admin. Create another admin first.",
        });
        return;
      }
    }

    const ok = await deleteStaff(req.params.id);
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});