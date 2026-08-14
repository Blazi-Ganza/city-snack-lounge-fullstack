import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export type EventCategory = "music" | "dining" | "special" | "workshop";

export interface EventDoc {
  _id?: ObjectId;
  branchId: string;
  title: string;
  description: string;
  date: string;          // ISO date "YYYY-MM-DD"
  time: string;          // "7:00 PM"
  image: string;         // URL or base64 data URL
  category: EventCategory;
  spotsLeft?: number;
  price?: number;        // in RWF
  isFeatured: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

function events() {
  return getDb().collection<EventDoc>("events");
}

export async function ensureEventIndexes() {
  await events().createIndex({ branchId: 1, date: 1 });
  await events().createIndex({ branchId: 1, isFeatured: 1 });
  await events().createIndex({ branchId: 1, category: 1 });
}

/* ═══════════════════════════════════════════════
   READ
═══════════════════════════════════════════════ */

/** Admin: get ALL events (including past) for a branch */
export async function getEventsByBranch(branchId: string) {
  return events()
    .find({ branchId })
    .sort({ date: 1, time: 1 })
    .toArray();
}

/** Customer: get only UPCOMING events (auto-expire past events) */
export async function getUpcomingEventsByBranch(branchId: string) {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  return events()
    .find({ branchId, date: { $gte: today } })
    .sort({ date: 1, time: 1 })
    .toArray();
}

/** Customer: get the single featured upcoming event (for homepage banner) */
export async function getFeaturedUpcomingEvent(branchId: string) {
  const today = new Date().toISOString().split("T")[0];
  return events().findOne(
    { branchId, isFeatured: true, date: { $gte: today } },
    { sort: { date: 1 } }
  );
}

/* ═══════════════════════════════════════════════
   CREATE
═══════════════════════════════════════════════ */

export async function createEvent(
  data: Omit<EventDoc, "_id" | "createdAt">
) {
  // Rule B1: only ONE featured at a time. If this one is featured, unfeature others.
  if (data.isFeatured) {
    await events().updateMany(
      { branchId: data.branchId, isFeatured: true },
      { $set: { isFeatured: false, updatedAt: new Date() } }
    );
  }

  const doc: EventDoc = {
    ...data,
    createdAt: new Date(),
  };

  const result = await events().insertOne(doc);
  return events().findOne({ _id: result.insertedId });
}

/* ═══════════════════════════════════════════════
   UPDATE
═══════════════════════════════════════════════ */

export async function updateEvent(
  id: string,
  branchId: string,
  updates: Partial<Omit<EventDoc, "_id" | "branchId" | "createdAt">>
) {
  // Rule B1: if setting this event as featured, unfeature others
  if (updates.isFeatured === true) {
    await events().updateMany(
      {
        branchId,
        isFeatured: true,
        _id: { $ne: new ObjectId(id) },
      },
      { $set: { isFeatured: false, updatedAt: new Date() } }
    );
  }

  await events().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return events().findOne({ _id: new ObjectId(id) });
}

/** Toggle featured — enforces "only ONE at a time" */
export async function toggleEventFeatured(id: string, branchId: string) {
  const event = await events().findOne({ _id: new ObjectId(id), branchId });
  if (!event) return null;

  const willBeFeatured = !event.isFeatured;

  if (willBeFeatured) {
    // Unfeature all others first
    await events().updateMany(
      { branchId, isFeatured: true },
      { $set: { isFeatured: false, updatedAt: new Date() } }
    );
  }

  await events().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { isFeatured: willBeFeatured, updatedAt: new Date() } }
  );

  return events().findOne({ _id: new ObjectId(id) });
}

/* ═══════════════════════════════════════════════
   DELETE
═══════════════════════════════════════════════ */

export async function deleteEvent(id: string, branchId: string) {
  const result = await events().deleteOne({
    _id: new ObjectId(id),
    branchId,
  });
  return result.deletedCount > 0;
}