import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export interface ChatMessage {
  from: "customer" | "reception";
  text: string;
  createdAt: Date;
}

export interface ChatDoc {
  _id?: ObjectId;
  branchId: string;
  customerId: string;
  customerName: string;
  status: "new" | "in_progress" | "closed";
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

function chats() {
  return getDb().collection<ChatDoc>("chats");
}

/* ═══════════════════════════════════════════════════════
   Indexes
═══════════════════════════════════════════════════════ */

export async function ensureChatsIndexes() {
  await chats().createIndex({ branchId: 1, customerId: 1 }, { unique: true });
  await chats().createIndex({ branchId: 1, updatedAt: -1 });
  await chats().createIndex({ branchId: 1, status: 1 });
}

/* ═══════════════════════════════════════════════════════
   Read
═══════════════════════════════════════════════════════ */

export async function findChat(branchId: string, customerId: string) {
  return chats().findOne({ branchId, customerId });
}

export async function findChatsByBranch(branchId: string) {
  return chats()
    .find({ branchId })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
}

/** Returns ALL chats across ALL branches (for admin) */
export async function findAllChats() {
  return chats().find({}).sort({ updatedAt: -1 }).limit(500).toArray();
}

/* ═══════════════════════════════════════════════════════
   Customer sends a message (creates chat if not exists)
═══════════════════════════════════════════════════════ */

export async function upsertCustomerMessage(payload: {
  branchId: string;
  customerId: string;
  customerName: string;
  text: string;
}) {
  const now = new Date();
  const message: ChatMessage = {
    from: "customer",
    text: payload.text,
    createdAt: now,
  };

  await chats().updateOne(
    { branchId: payload.branchId, customerId: payload.customerId },
    {
      $setOnInsert: {
        branchId: payload.branchId,
        customerId: payload.customerId,
        createdAt: now,
        status: "new",
      },
      $set: {
        customerName: payload.customerName,
        updatedAt: now,
      },
      $push: { messages: message },
    },
    { upsert: true }
  );

  return chats().findOne({
    branchId: payload.branchId,
    customerId: payload.customerId,
  });
}

/* ═══════════════════════════════════════════════════════
   Reception replies
═══════════════════════════════════════════════════════ */

export async function addReceptionMessage(payload: {
  branchId: string;
  customerId: string;
  text: string;
}) {
  const now = new Date();
  const message: ChatMessage = {
    from: "reception",
    text: payload.text,
    createdAt: now,
  };

  await chats().updateOne(
    { branchId: payload.branchId, customerId: payload.customerId },
    {
      $set: { status: "in_progress", updatedAt: now },
      $push: { messages: message },
    }
  );

  return chats().findOne({
    branchId: payload.branchId,
    customerId: payload.customerId,
  });
}

/* ═══════════════════════════════════════════════════════
   Admin — status, delete, purge
═══════════════════════════════════════════════════════ */

export async function updateChatStatus(
  branchId: string,
  customerId: string,
  status: "new" | "in_progress" | "closed"
) {
  await chats().updateOne(
    { branchId, customerId },
    { $set: { status, updatedAt: new Date() } }
  );
  return chats().findOne({ branchId, customerId });
}

/** Alias — some routes use setChatStatus */
export const setChatStatus = updateChatStatus;

export async function deleteChat(branchId: string, customerId: string) {
  const result = await chats().deleteOne({ branchId, customerId });
  return result.deletedCount > 0;
}

export async function purgeOldClosedChats(
  branchId: string,
  olderThanDays: number
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const result = await chats().deleteMany({
    branchId,
    status: "closed",
    updatedAt: { $lt: cutoff },
  });

  return result.deletedCount ?? 0;
}