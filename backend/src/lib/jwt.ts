import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface StaffToken {
  role: "receptionist" | "admin";
  branchId?: string;
  iat?: number;
  exp?: number;
}

export function signStaffToken(payload: Omit<StaffToken, "iat" | "exp">) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "12h" });
}

export function verifyStaffToken(token: string): StaffToken {
  return jwt.verify(token, env.JWT_SECRET) as StaffToken;
}
