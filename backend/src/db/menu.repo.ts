import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export type MenuCategory = "Meals" | "Drinks" | "Desserts";

export interface MenuItemDoc {
  _id?: ObjectId;
  branchId: string;
  name: string;
  category: MenuCategory;
  subcategory: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  prepTime: string;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt?: Date;
}

function menu() {
  return getDb().collection<MenuItemDoc>("menuItems");
}

export async function ensureMenuIndexes() {
  await menu().createIndex({ branchId: 1, category: 1 });
  await menu().createIndex({ branchId: 1, subcategory: 1 });
  await menu().createIndex({ branchId: 1, isAvailable: 1 });
  await menu().createIndex({ branchId: 1, featured: 1 });
}

/* READ */
export async function getMenuByBranch(branchId: string) {
  return menu()
    .find({ branchId })
    .sort({ category: 1, subcategory: 1, displayOrder: 1 })
    .toArray();
}

export async function getAvailableMenuByBranch(branchId: string) {
  return menu()
    .find({ branchId, isAvailable: true })
    .sort({ category: 1, subcategory: 1, displayOrder: 1 })
    .toArray();
}

/* CREATE */
export async function createMenuItem(
  data: Omit<MenuItemDoc, "_id" | "createdAt" | "displayOrder">
) {
  const count = await menu().countDocuments({
    branchId: data.branchId,
    subcategory: data.subcategory,
  });

  const doc: MenuItemDoc = {
    ...data,
    displayOrder: count,
    createdAt: new Date(),
  };

  const result = await menu().insertOne(doc);
  return menu().findOne({ _id: result.insertedId });
}

/* BULK CREATE (for seeding) */
export async function bulkCreateMenuItems(items: Omit<MenuItemDoc, "_id" | "createdAt">[]) {
  if (items.length === 0) return 0;
  const docs = items.map((item) => ({ ...item, createdAt: new Date() }));
  const result = await menu().insertMany(docs);
  return result.insertedCount;
}

/* UPDATE */
export async function updateMenuItem(
  id: string,
  branchId: string,
  updates: Partial<Omit<MenuItemDoc, "_id" | "branchId" | "createdAt">>
) {
  await menu().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return menu().findOne({ _id: new ObjectId(id) });
}

export async function toggleMenuItemAvailability(id: string, branchId: string) {
  const item = await menu().findOne({ _id: new ObjectId(id), branchId });
  if (!item) return null;

  await menu().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { isAvailable: !item.isAvailable, updatedAt: new Date() } }
  );
  return menu().findOne({ _id: new ObjectId(id) });
}

export async function toggleMenuItemFeatured(id: string, branchId: string) {
  const item = await menu().findOne({ _id: new ObjectId(id), branchId });
  if (!item) return null;

  await menu().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { featured: !item.featured, updatedAt: new Date() } }
  );
  return menu().findOne({ _id: new ObjectId(id) });
}

/* DELETE */
export async function deleteMenuItem(id: string, branchId: string) {
  const result = await menu().deleteOne({
    _id: new ObjectId(id),
    branchId,
  });
  return result.deletedCount > 0;
}

/* BULK OPS */
export async function copyMenuBetweenBranches(fromBranchId: string, toBranchId: string) {
  const items = await menu().find({ branchId: fromBranchId }).toArray();
  if (items.length === 0) return 0;

  const newItems = items.map((item) => {
    const { _id, ...rest } = item;
    return { ...rest, branchId: toBranchId, createdAt: new Date() };
  });

  const result = await menu().insertMany(newItems);
  return result.insertedCount;
}

export async function clearMenuForBranch(branchId: string) {
  const result = await menu().deleteMany({ branchId });
  return result.deletedCount;
}