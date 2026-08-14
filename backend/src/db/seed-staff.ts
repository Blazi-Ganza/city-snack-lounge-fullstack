import bcrypt from "bcrypt";
import { getDb, connectMongo, closeMongo } from "./mongo";

/**
 * One-time migration: ensures all staff in `users` collection
 * have hashed passcodes matching the old hardcoded values.
 *
 * Safe to run multiple times (idempotent).
 */
async function seedStaff() {
  await connectMongo();
  const db = getDb();
  const now = new Date();

  const SEED = [
    {
      match: { role: "admin", name: "Owner" },
      defaults: {
        name: "Owner",
        email: "owner@citysnack.rw",
        role: "admin",
        isActive: true,
      },
      passcode: "boss2026", // Option A — overwrite
      overwritePasscode: true,
    },
    {
      match: { role: "receptionist", branchId: "huye" },
      defaults: {
        name: "Reception Huye",
        email: "reception.huye@citysnack.rw",
        role: "receptionist",
        branchId: "huye",
        isActive: true,
      },
      passcode: "huye2026",
      overwritePasscode: false, // only set if missing
    },
    {
      match: { role: "receptionist", branchId: "musanze" },
      defaults: {
        name: "Reception Musanze",
        email: "reception.musanze@citysnack.rw",
        role: "receptionist",
        branchId: "musanze",
        isActive: true,
      },
      passcode: "musanze2026",
      overwritePasscode: false,
    },
  ];

  for (const entry of SEED) {
    const existing = await db.collection("users").findOne(entry.match);

    if (!existing) {
      // Create new
      const passcodeHash = await bcrypt.hash(entry.passcode, 10);
      await db.collection("users").insertOne({
        ...entry.defaults,
        passcodeHash,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      } as any);
      console.log(`✅ Created ${entry.defaults.role} "${entry.defaults.name}" with passcode "${entry.passcode}"`);
    } else {
      // Update — fill missing fields + optionally overwrite passcode
      const set: any = { updatedAt: now };

      if (existing.email === undefined && entry.defaults.email) set.email = entry.defaults.email;
      if (existing.isActive === undefined) set.isActive = true;
      if (existing.lastLoginAt === undefined) set.lastLoginAt = null;
      if (existing.createdAt === undefined) set.createdAt = now;
      if (!existing.name && entry.defaults.name) set.name = entry.defaults.name;

      if (entry.overwritePasscode || !existing.passcodeHash) {
        set.passcodeHash = await bcrypt.hash(entry.passcode, 10);
        console.log(
          `🔑 ${entry.overwritePasscode ? "Overwrote" : "Set"} passcode for "${existing.name || entry.defaults.name}" → "${entry.passcode}"`
        );
      }

      await db.collection("users").updateOne({ _id: existing._id }, { $set: set });
      console.log(`✅ Updated ${entry.defaults.role} "${existing.name || entry.defaults.name}"`);
    }
  }

  console.log("\n🎉 Staff seed complete.\n");
  console.log("Login credentials:");
  console.log("  Admin:              boss2026");
  console.log("  Huye receptionist:  huye2026");
  console.log("  Musanze receptionist: musanze2026");
  console.log("\n⚠️  You can now safely delete backend/src/config/staff.ts");

  await closeMongo();
  process.exit(0);
}

seedStaff().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});