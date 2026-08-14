import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyStaffToken, type StaffToken } from "../lib/jwt";
import {
  getEventsByBranch,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventFeatured,
  type EventCategory,
} from "../db/events.repo";
import { getIO } from "../realtime/chat.socket";

export const eventsRouter = Router();

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
function broadcastEventUpdate(
  branchId: string,
  action: "created" | "updated" | "deleted",
  event?: any
) {
  try {
    const io = getIO();
    if (!io) {
      console.warn("⚠️ Socket.IO not initialized — skipping event broadcast");
      return;
    }
    const room = `events:${branchId}`;
    const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    io.to(room).emit("events:updated", { branchId, action, event });
    console.log(`📡 Event ${action} broadcast to ${room} (${roomSize} clients)`);
  } catch (err) {
    console.warn("⚠️ Event broadcast failed:", err);
  }
}

const VALID_CATEGORIES: EventCategory[] = ["music", "dining", "special", "workshop"];

/* ═══════════════════════════════════════════════════════
   ADMIN — list all events (including past)
═══════════════════════════════════════════════════════ */
eventsRouter.get("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const items = await getEventsByBranch(req.params.branchId);
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — create event
═══════════════════════════════════════════════════════ */
eventsRouter.post("/:branchId", requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      date,
      time,
      image,
      category,
      spotsLeft,
      price,
      isFeatured = false,
    } = req.body;

    if (!title || !date || !time || !category) {
      res.status(400).json({
        ok: false,
        message: "Missing required fields: title, date, time, category",
      });
      return;
    }

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({
        ok: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
      return;
    }

    const event = await createEvent({
      branchId: req.params.branchId,
      title,
      description: description ?? "",
      date,
      time,
      image: image ?? "",
      category,
      spotsLeft: spotsLeft != null ? Number(spotsLeft) : undefined,
      price: price != null ? Number(price) : undefined,
      isFeatured: Boolean(isFeatured),
    });

    broadcastEventUpdate(req.params.branchId, "created", event);
    res.json({ ok: true, event });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — update event
═══════════════════════════════════════════════════════ */
eventsRouter.patch("/:branchId/:id", requireAdmin, async (req, res, next) => {
  try {
    const event = await updateEvent(req.params.id, req.params.branchId, req.body);
    if (!event) {
      res.status(404).json({ ok: false, message: "Event not found" });
      return;
    }
    broadcastEventUpdate(req.params.branchId, "updated", event);
    res.json({ ok: true, event });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — toggle featured (only one can be featured)
═══════════════════════════════════════════════════════ */
eventsRouter.post("/:branchId/:id/featured", requireAdmin, async (req, res, next) => {
  try {
    const event = await toggleEventFeatured(req.params.id, req.params.branchId);
    if (!event) {
      res.status(404).json({ ok: false, message: "Event not found" });
      return;
    }
    broadcastEventUpdate(req.params.branchId, "updated", event);
    res.json({ ok: true, event });
  } catch (err) {
    next(err);
  }
});

/* ═══════════════════════════════════════════════════════
   ADMIN — delete event
═══════════════════════════════════════════════════════ */
eventsRouter.delete("/:branchId/:id", requireAdmin, async (req, res, next) => {
  try {
    const ok = await deleteEvent(req.params.id, req.params.branchId);
    if (ok) {
      broadcastEventUpdate(req.params.branchId, "deleted", { _id: req.params.id });
    }
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});