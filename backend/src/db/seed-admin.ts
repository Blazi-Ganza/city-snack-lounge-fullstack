import { getDb } from "./mongo";
import bcrypt from "bcrypt";

/**
 * Creates the default admin user if not present.
 * Login credentials:
 *   Role: admin
 *   Passcode: admin123   (⚠️ CHANGE THIS BEFORE PRODUCTION!)
 */
export async function seedAdmin() {
  const db = getDb();
  const users = db.collection("users");

  const existing = await users.findOne({ role: "admin" });
  if (existing) {
    console.log("👤 Admin already exists — skipping seed");
    return;
  }

  const passcode = "admin123"; // 👈 CHANGE ME
  const hash = await bcrypt.hash(passcode, 10);

  await users.insertOne({
    role: "admin",
    passcodeHash: hash,
    name: "Owner",
    createdAt: new Date(),
  });

  console.log("✅ Admin user created!");
  console.log("   Passcode: admin123  (⚠️ CHANGE THIS!)");
}