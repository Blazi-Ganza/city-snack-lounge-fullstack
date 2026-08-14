import { Router } from "express";
import { z } from "zod";
import { findStaffForLogin } from "../db/staff.repo";
import { signStaffToken, verifyStaffToken } from "../lib/jwt";

export const authRouter = Router();

const loginBody = z.object({
  role: z.enum(["receptionist", "admin"]),
  branchId: z.string().optional(),
  passcode: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, message: "Invalid input" });
      return;
    }

    const { role, branchId, passcode } = parsed.data;

    if (role === "receptionist" && !branchId) {
      res.status(400).json({ ok: false, message: "branchId required for receptionist" });
      return;
    }

    const staff = await findStaffForLogin(role, branchId, passcode);
    if (!staff) {
      res.status(401).json({ ok: false, message: "Invalid credentials" });
      return;
    }

    const token = signStaffToken({
      role: staff.role,
      branchId: staff.branchId,
    });

    res.json({
      ok: true,
      token,
      session: {
        role: staff.role,
        branchId: staff.branchId,
        name: staff.name,
        staffId: staff._id,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ ok: false });
    return;
  }

  try {
    const decoded = verifyStaffToken(token);
    res.json({ ok: true, session: { role: decoded.role, branchId: decoded.branchId } });
  } catch {
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
});