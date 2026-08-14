import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { getDb } from "./mongo";

export type StaffRole = "admin" | "receptionist";

export interface Staff {
  _id: string;
  name: string;
  email?: string;
  role: StaffRole;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Public-facing staff (no hash!)
export interface StaffSafe extends Omit<Staff, "_id"> {
  _id: string;
}

const SALT_ROUNDS = 10;

function toSafeStaff(doc: any): StaffSafe {
  const { passcodeHash, _id, ...rest } = doc;
  return {
    _id: _id.toString(),
    ...rest,
  } as StaffSafe;
}

export function generatePasscode(): string {
  // 6-digit numeric passcode
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashPasscode(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPasscode(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ═══════════════════════════════════════════════════════
   Queries
═══════════════════════════════════════════════════════ */

export async function findStaffForLogin(
  role: StaffRole,
  branchId: string | undefined,
  passcode: string
): Promise<StaffSafe | null> {
  const db = getDb();
  const query: any = { role, isActive: { $ne: false } };
  if (role === "receptionist") {
    if (!branchId) return null;
    query.branchId = branchId;
  }

  const candidates = await db.collection("users").find(query).toArray();
  for (const doc of candidates) {
    if (!doc.passcodeHash) continue;
    const ok = await verifyPasscode(passcode, doc.passcodeHash);
    if (ok) {
      // Update lastLoginAt (don't await — non-critical)
      db.collection("users").updateOne(
        { _id: doc._id },
        { $set: { lastLoginAt: new Date() } }
      ).catch(() => {});
      return toSafeStaff(doc);
    }
  }
  return null;
}

export async function listAllStaff(): Promise<StaffSafe[]> {
  const db = getDb();
  const docs = await db
    .collection("users")
    .find({})
    .sort({ isActive: -1, role: 1, name: 1 })
    .toArray();
  return docs.map(toSafeStaff);
}

export async function getStaffById(id: string): Promise<StaffSafe | null> {
  const db = getDb();
  if (!ObjectId.isValid(id)) return null;
  const doc = await db.collection("users").findOne({ _id: new ObjectId(id) });
  return doc ? toSafeStaff(doc) : null;
}

export async function countAdmins(activeOnly = true): Promise<number> {
  const db = getDb();
  const query: any = { role: "admin" };
  if (activeOnly) query.isActive = { $ne: false };
  return db.collection("users").countDocuments(query);
}

/* ═══════════════════════════════════════════════════════
   Mutations
═══════════════════════════════════════════════════════ */

export async function createStaff(input: {
  name: string;
  role: StaffRole;
  branchId?: string;
  email?: string;
  passcode: string; // plaintext — will be hashed
}): Promise<StaffSafe> {
  const db = getDb();
  if (input.role === "receptionist" && !input.branchId) {
    throw new Error("branchId required for receptionist");
  }
  if (input.passcode.length < 4) {
    throw new Error("Passcode must be at least 4 characters");
  }

  const passcodeHash = await hashPasscode(input.passcode);
  const now = new Date();
  const doc = {
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    role: input.role,
    branchId: input.role === "receptionist" ? input.branchId : undefined,
    passcodeHash,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("users").insertOne(doc as any);
  return toSafeStaff({ ...doc, _id: result.insertedId });
}

export async function updateStaff(
  id: string,
  patch: {
    name?: string;
    email?: string;
    branchId?: string;
    isActive?: boolean;
  }
): Promise<StaffSafe | null> {
  const db = getDb();
  if (!ObjectId.isValid(id)) return null;

  const set: any = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.email !== undefined) set.email = patch.email.trim() || undefined;
  if (patch.branchId !== undefined) set.branchId = patch.branchId;
  if (typeof patch.isActive === "boolean") set.isActive = patch.isActive;

  const result = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: set },
    { returnDocument: "after" }
  );
  return result ? toSafeStaff(result) : null;
}

export async function resetStaffPasscode(
  id: string,
  newPasscode: string
): Promise<StaffSafe | null> {
  const db = getDb();
  if (!ObjectId.isValid(id)) return null;
  if (newPasscode.length < 4) {
    throw new Error("Passcode must be at least 4 characters");
  }

  const passcodeHash = await hashPasscode(newPasscode);
  const result = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { passcodeHash, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? toSafeStaff(result) : null;
}

export async function deleteStaff(id: string): Promise<boolean> {
  const db = getDb();
  if (!ObjectId.isValid(id)) return false;
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}