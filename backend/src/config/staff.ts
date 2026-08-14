// In production, store these in DB with hashed passwords (bcrypt)
// For now, one passcode per branch + one admin passcode.

export interface StaffCredential {
  role: "receptionist" | "admin";
  branchId?: string; // required for receptionist, omitted for admin
  passcode: string;
}

export const STAFF: StaffCredential[] = [
  { role: "receptionist", branchId: "huye",    passcode: "huye2026"    },
  { role: "receptionist", branchId: "musanze", passcode: "musanze2026" },
  { role: "admin",                              passcode: "boss2026"    },
];

export function findStaff(role: string, branchId: string | undefined, passcode: string) {
  return STAFF.find(
    (s) =>
      s.role === role &&
      s.passcode === passcode &&
      (s.role === "admin" || s.branchId === branchId)
  );
}
