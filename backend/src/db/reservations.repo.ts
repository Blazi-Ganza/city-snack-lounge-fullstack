import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export type ReservationStatus = "pending" | "confirmed" | "seated" | "cancelled";

export interface ReservationDoc {
  _id?: ObjectId;
  branchId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt?: Date;
}

function reservations() {
  return getDb().collection<ReservationDoc>("reservations");
}

export async function ensureReservationsIndexes() {
  await reservations().createIndex({ branchId: 1, createdAt: -1 });
  await reservations().createIndex({ branchId: 1, status: 1 });
}

export async function createReservation(data: Omit<ReservationDoc, "_id" | "status" | "createdAt">) {
  const doc: ReservationDoc = {
    ...data,
    status: "pending",
    createdAt: new Date(),
  };
  const result = await reservations().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function findReservationsByBranch(branchId: string) {
  return reservations().find({ branchId }).sort({ createdAt: -1 }).limit(100).toArray();
}

export async function updateReservationStatus(id: string, branchId: string, status: ReservationStatus) {
  await reservations().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { status, updatedAt: new Date() } }
  );
  return reservations().findOne({ _id: new ObjectId(id) });
}

export async function deleteReservation(id: string, branchId: string) {
  const result = await reservations().deleteOne({ _id: new ObjectId(id), branchId });
  return result.deletedCount > 0;
}