import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import {
  addReceptionMessage,
  deleteChat,
  findAllChats,
  findChat,
  findChatsByBranch,
  purgeOldClosedChats,
  setChatStatus,
  upsertCustomerMessage,
} from "../db/chats.repo";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";

export const chatRouter = Router();

const branchParam = z.object({ branchId: z.string().min(1) });
const chatParam = branchParam.extend({ customerId: z.string().min(1) });

const customerMessageBody = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(80),
  text: z.string().min(1).max(2000),
});

const receptionMessageBody = z.object({
  text: z.string().min(1).max(2000),
});

const statusBody = z.object({
  status: z.enum(["new", "in_progress", "closed"]),
});

function requireStaff(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: "No token" });
  try {
    const decoded = verifyStaffToken(token);
    (req as Request & { staff?: StaffToken }).staff = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

function requireBranchAccess(req: Request, res: Response, next: NextFunction) {
  const staff = (req as Request & { staff?: StaffToken }).staff;
  const { branchId } = req.params;
  if (!staff) return res.status(401).json({ ok: false });
  if (staff.role === "admin") return next();
  if (staff.branchId !== branchId) {
    return res.status(403).json({ ok: false, message: "Forbidden: wrong branch" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const staff = (req as Request & { staff?: StaffToken }).staff;
  if (!staff || staff.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Admin only" });
  }
  next();
}

// --- Admin: all chats across all branches ---
chatRouter.get("/", requireStaff, requireAdmin, async (_req, res, next) => {
  try {
    const list = await findAllChats();
    res.json({ ok: true, chats: list });
  } catch (err) { next(err); }
});

// --- Reception: chats for one branch ---
chatRouter.get("/:branchId", requireStaff, requireBranchAccess, async (req, res, next) => {
  try {
    const { branchId } = branchParam.parse(req.params);
    const list = await findChatsByBranch(branchId);
    res.json({ ok: true, chats: list });
  } catch (err) { next(err); }
});

chatRouter.get("/:branchId/:customerId", requireStaff, requireBranchAccess, async (req, res, next) => {
  try {
    const { branchId, customerId } = chatParam.parse(req.params);
    const chat = await findChat(branchId, customerId);
    res.json({ ok: true, chat });
  } catch (err) { next(err); }
});

chatRouter.post("/:branchId/:customerId/reply", requireStaff, requireBranchAccess, async (req, res, next) => {
  try {
    const { branchId, customerId } = chatParam.parse(req.params);
    const { text } = receptionMessageBody.parse(req.body);
    const chat = await addReceptionMessage({ branchId, customerId, text });
    res.json({ ok: true, chat });
  } catch (err) { next(err); }
});

// Change status (mark closed / reopen)
chatRouter.patch("/:branchId/:customerId/status", requireStaff, requireBranchAccess, async (req, res, next) => {
  try {
    const { branchId, customerId } = chatParam.parse(req.params);
    const { status } = statusBody.parse(req.body);
    const chat = await setChatStatus(branchId, customerId, status);
    res.json({ ok: true, chat });
  } catch (err) { next(err); }
});

// Delete one chat
chatRouter.delete("/:branchId/:customerId", requireStaff, requireBranchAccess, async (req, res, next) => {
  try {
    const { branchId, customerId } = chatParam.parse(req.params);
    const ok = await deleteChat(branchId, customerId);
    res.json({ ok });
  } catch (err) { next(err); }
});

// Purge old closed chats
chatRouter.post("/:branchId/purge-closed", requireStaff, requireBranchAccess, async (req, res, next) => {
  try {
    const { branchId } = branchParam.parse(req.params);
    const days = Number(req.body?.olderThanDays ?? 7);
    const count = await purgeOldClosedChats(branchId, days);
    res.json({ ok: true, deleted: count });
  } catch (err) { next(err); }
});

// --- Customer (public) ---
chatRouter.post("/:branchId/customer-message", async (req, res, next) => {
  try {
    const { branchId } = branchParam.parse(req.params);
    const body = customerMessageBody.parse(req.body);
    const chat = await upsertCustomerMessage({ branchId, ...body });
    res.json({ ok: true, chat });
  } catch (err) { next(err); }
});
