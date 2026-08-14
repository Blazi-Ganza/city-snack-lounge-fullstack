import { getDb } from "./mongo";

export interface Branch {
  id: string;
  name: string;
  subtitle: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  isActive: boolean;
  hours?: BranchHours;     
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchUsage {
  orders: number;
  menu: number;
  events: number;
  promos: number;
  chats: number;
  deliveries: number;
  total: number;
}

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DayHours {
  closed: boolean;
  open: string;   // "HH:MM" 24-hour format
  close: string;  // "HH:MM" 24-hour format
}

export type BranchHours = Record<DayKey, DayHours>;

export const DAY_KEYS: DayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

export const DEFAULT_HOURS: BranchHours = {
  monday:    { closed: false, open: "10:00", close: "23:00" },
  tuesday:   { closed: false, open: "10:00", close: "23:00" },
  wednesday: { closed: false, open: "10:00", close: "23:00" },
  thursday:  { closed: false, open: "10:00", close: "23:00" },
  friday:    { closed: false, open: "10:00", close: "02:00" },
  saturday:  { closed: false, open: "10:00", close: "02:00" },
  sunday:    { closed: false, open: "10:00", close: "23:00" },
};

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

function isValidTime(t: string): boolean {
  return typeof t === "string" && TIME_REGEX.test(t);
}

export function validateHours(input: any): BranchHours {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid hours object");
  }
  const result = {} as BranchHours;
  for (const day of DAY_KEYS) {
    const entry = input[day];
    if (!entry || typeof entry !== "object") {
      throw new Error(`Missing hours for ${day}`);
    }
    const closed = Boolean(entry.closed);
    const open = String(entry.open ?? "10:00");
    const close = String(entry.close ?? "23:00");
    if (!closed && (!isValidTime(open) || !isValidTime(close))) {
      throw new Error(`Invalid time for ${day} (must be HH:MM 24-hour)`);
    }
    result[day] = { closed, open, close };
  }
  return result;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const db = getDb();
  const base = slugify(name) || "branch";
  let candidate = base;
  let n = 2;
  while (await db.collection("branches").findOne({ id: candidate })) {
    candidate = `${base}-${n}`;
    n++;
  }
  return candidate;
}

export async function getAllBranchesAdmin(): Promise<Branch[]> {
  const db = getDb();
  return (await db
    .collection("branches")
    .find({}, { projection: { _id: 0 } })
    .sort({ isActive: -1, name: 1 })
    .toArray()) as unknown as Branch[];
}

export async function getActiveBranchesPublic(): Promise<Branch[]> {
  const db = getDb();
  return (await db
    .collection("branches")
    .find({ isActive: { $ne: false } }, { projection: { _id: 0 } })
    .sort({ name: 1 })
    .toArray()) as unknown as Branch[];
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const db = getDb();
  return (await db
    .collection("branches")
    .findOne({ id }, { projection: { _id: 0 } })) as unknown as Branch | null;
}

export async function createBranch(input: {
  name: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
}): Promise<Branch> {
  const db = getDb();
  const id = await generateUniqueSlug(input.name);
  const now = new Date();

  const doc: Branch = {
    id,
    name: input.name.trim(),
    subtitle: input.subtitle?.trim() ?? "",
    address: input.address?.trim(),
    phone: input.phone?.trim(),
    email: input.email?.trim(),
    city: input.city?.trim() ?? input.name.trim(),
    isActive: true,
    hours: DEFAULT_HOURS,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("branches").insertOne(doc as any);
  return doc;
}

export async function updateBranchHours(
  id: string,
  hours: BranchHours
): Promise<Branch | null> {
  const db = getDb();
  const validated = validateHours(hours);
  const result = await db.collection("branches").findOneAndUpdate(
    { id },
    { $set: { hours: validated, updatedAt: new Date() } },
    { returnDocument: "after", projection: { _id: 0 } }
  );
  return (result as any) as Branch | null;
}

export async function updateBranch(
  id: string,
  patch: Partial<Omit<Branch, "id" | "createdAt">>
): Promise<Branch | null> {
  const db = getDb();

  // Never allow changing the slug/id
  const { id: _ignored, createdAt: _c, ...safe } = patch as any;

  const result = await db.collection("branches").findOneAndUpdate(
    { id },
    { $set: { ...safe, updatedAt: new Date() } },
    { returnDocument: "after", projection: { _id: 0 } }
  );

  return (result as any) as Branch | null;
}

export async function setBranchActive(
  id: string,
  isActive: boolean
): Promise<Branch | null> {
  return updateBranch(id, { isActive });
}

export async function getBranchUsage(id: string): Promise<BranchUsage> {
  const db = getDb();
  const [orders, menu, events, promos, chats, deliveries] = await Promise.all([
    db.collection("orders").countDocuments({ branchId: id }),
    db.collection("menu").countDocuments({ branchId: id }),
    db.collection("events").countDocuments({ branchId: id }),
    db.collection("promos").countDocuments({ branchId: id }),
    db.collection("chats").countDocuments({ branchId: id }),
    db.collection("deliveries").countDocuments({ branchId: id }),
  ]);
  return {
    orders,
    menu,
    events,
    promos,
    chats,
    deliveries,
    total: orders + menu + events + promos + chats + deliveries,
  };
}

export async function hardDeleteBranch(id: string): Promise<boolean> {
  const db = getDb();
  const usage = await getBranchUsage(id);
  if (usage.total > 0) {
    throw new Error(
      `Cannot delete: branch has ${usage.orders} orders, ${usage.menu} menu items, ${usage.events} events, ${usage.promos} promos, ${usage.chats} chats, ${usage.deliveries} deliveries. Deactivate instead.`
    );
  }
  const result = await db.collection("branches").deleteOne({ id });
  return result.deletedCount > 0;
}