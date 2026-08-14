import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import { getBranchAnalytics, type RangeKey } from "../db/analytics.repo";

export const analyticsRouter = Router();

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

analyticsRouter.get("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const range = (req.query.range as RangeKey) ?? "7d";
    if (!["7d", "30d", "90d"].includes(range)) {
      res.status(400).json({ ok: false, message: "Invalid range" });
      return;
    }
    const analytics = await getBranchAnalytics(req.params.branchId, range);
    res.json({ ok: true, analytics });
  } catch (err) {
    console.error("❌ /analytics error:", err);
    next(err);
  }
});