import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export type DiscountType = "percentage" | "fixed";

export interface PromoDoc {
  _id?: ObjectId;
  branchId: string;
  title: string;              // "Happy Hour Drinks"
  description: string;        // "20% off all drinks 5-7 PM"
  discountType: DiscountType;
  discountValue: number;      // 20 (for %) or 1000 (for RWF)
  itemIds: string[];          // menu item _ids this applies to
  startDate: string;          // "YYYY-MM-DD"
  endDate: string;            // "YYYY-MM-DD"
  startTime?: string;         // "17:00" (24h) — optional daily window start
  endTime?: string;           // "19:00" (24h) — optional daily window end
  isActive: boolean;          // admin on/off toggle
  isFeatured: boolean;        // show in menu banner
  createdAt: Date;
  updatedAt?: Date;
}

function promos() {
  return getDb().collection<PromoDoc>("promos");
}

export async function ensurePromoIndexes() {
  await promos().createIndex({ branchId: 1, isActive: 1 });
  await promos().createIndex({ branchId: 1, startDate: 1, endDate: 1 });
  await promos().createIndex({ branchId: 1, isFeatured: 1 });
}

/* ═══════════════════════════════════════════════
   READ
═══════════════════════════════════════════════ */

/** Admin: get ALL promos for a branch */
export async function getPromosByBranch(branchId: string) {
  return promos()
    .find({ branchId })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Customer: get currently ACTIVE promos (respects date + time window)
 * "Active" means:
 *   - isActive = true
 *   - today falls within startDate..endDate
 *   - if startTime/endTime set, current time falls within window
 */
export async function getActivePromosByBranch(branchId: string) {
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  const all = await promos()
    .find({
      branchId,
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today },
    })
    .toArray();

  // Filter by time window (if defined)
  return all.filter((p) => {
    if (!p.startTime || !p.endTime) return true; // no time window = always on today
    return currentTime >= p.startTime && currentTime <= p.endTime;
  });
}

/* ═══════════════════════════════════════════════
   CREATE
═══════════════════════════════════════════════ */

export async function createPromo(
  data: Omit<PromoDoc, "_id" | "createdAt">
) {
  const doc: PromoDoc = {
    ...data,
    createdAt: new Date(),
  };
  const result = await promos().insertOne(doc);
  return promos().findOne({ _id: result.insertedId });
}

/* ═══════════════════════════════════════════════
   UPDATE
═══════════════════════════════════════════════ */

export async function updatePromo(
  id: string,
  branchId: string,
  updates: Partial<Omit<PromoDoc, "_id" | "branchId" | "createdAt">>
) {
  await promos().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return promos().findOne({ _id: new ObjectId(id) });
}

export async function togglePromoActive(id: string, branchId: string) {
  const promo = await promos().findOne({ _id: new ObjectId(id), branchId });
  if (!promo) return null;
  await promos().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { isActive: !promo.isActive, updatedAt: new Date() } }
  );
  return promos().findOne({ _id: new ObjectId(id) });
}

export async function togglePromoFeatured(id: string, branchId: string) {
  const promo = await promos().findOne({ _id: new ObjectId(id), branchId });
  if (!promo) return null;
  await promos().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { isFeatured: !promo.isFeatured, updatedAt: new Date() } }
  );
  return promos().findOne({ _id: new ObjectId(id) });
}

/* ═══════════════════════════════════════════════
   DELETE
═══════════════════════════════════════════════ */

export async function deletePromo(id: string, branchId: string) {
  const result = await promos().deleteOne({
    _id: new ObjectId(id),
    branchId,
  });
  return result.deletedCount > 0;
}