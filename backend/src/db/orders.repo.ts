import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export type OrderType = "pickup" | "delivery";

export type OrderStatus =
  | "awaiting_payment"
  | "new"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "momo";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export interface OrderDoc {
  _id?: ObjectId;
  branchId: string;
  orderCode: string;
  customerName: string;
  phone: string;
  type: OrderType;
  address?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  customerConfirmedAt?: Date; // 🆕 when customer clicked "I have paid"
  createdAt: Date;
  updatedAt?: Date;
}

function orders() {
  return getDb().collection<OrderDoc>("orders");
}

/* ═══════════════════════════════════════════════════════
   Indexes
═══════════════════════════════════════════════════════ */

export async function ensureOrdersIndexes() {
  await orders().deleteMany({
    $or: [{ orderCode: null }, { orderCode: { $exists: false } }],
  });

  await orders().createIndex({ branchId: 1, createdAt: -1 });
  await orders().createIndex({ branchId: 1, status: 1 });
  await orders().createIndex({ branchId: 1, paymentStatus: 1 });

  await orders().createIndex(
    { orderCode: 1 },
    {
      unique: true,
      partialFilterExpression: { orderCode: { $type: "string" } },
    }
  );
}

/* ═══════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════ */

function generateOrderCode() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CS-${rand}`;
}

/* ═══════════════════════════════════════════════════════
   Create
═══════════════════════════════════════════════════════ */

export async function createOrder(
  data: Omit<
    OrderDoc,
    "_id" | "status" | "createdAt" | "orderCode" | "paymentStatus"
  >
) {
  // MoMo orders wait for payment; cash orders go straight to "new"
  const status: OrderStatus =
    data.paymentMethod === "momo" ? "awaiting_payment" : "new";

  const paymentStatus: PaymentStatus = "pending";

  const doc: OrderDoc = {
    ...data,
    orderCode: generateOrderCode(),
    status,
    paymentStatus,
    createdAt: new Date(),
  };

  const result = await orders().insertOne(doc);

  // Return the actual saved doc so _id is guaranteed correct
  const saved = await orders().findOne({ _id: result.insertedId });
  return saved!;
}

/* ═══════════════════════════════════════════════════════
   Read
═══════════════════════════════════════════════════════ */

export async function findOrdersByBranch(branchId: string) {
  return orders()
    .find({ branchId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
}

export async function findOrderByCode(orderCode: string) {
  return orders().findOne({ orderCode });
}

/* ═══════════════════════════════════════════════════════
   Update — status
═══════════════════════════════════════════════════════ */

export async function updateOrderStatus(
  id: string,
  branchId: string,
  status: OrderStatus
) {
  await orders().updateOne(
    { _id: new ObjectId(id), branchId },
    { $set: { status, updatedAt: new Date() } }
  );
  return orders().findOne({ _id: new ObjectId(id) });
}

/* ═══════════════════════════════════════════════════════
   Update — payments
═══════════════════════════════════════════════════════ */

/** 🆕 Customer taps "I have paid" — flags order for reception attention */
export async function markCustomerConfirmedPayment(orderCode: string) {
  await orders().updateOne(
    { orderCode },
    {
      $set: {
        customerConfirmedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
  return orders().findOne({ orderCode });
}

/** Reception confirms MoMo payment received — moves order to "new" */
export async function confirmOrderPayment(id: string, branchId: string) {
  await orders().updateOne(
    { _id: new ObjectId(id), branchId },
    {
      $set: {
        paymentStatus: "paid",
        status: "new", // ✅ moves from awaiting_payment → new (kitchen sees it)
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
  return orders().findOne({ _id: new ObjectId(id) });
}

/** Reception rejects payment — cancels the order */
export async function rejectOrderPayment(id: string, branchId: string) {
  await orders().updateOne(
    { _id: new ObjectId(id), branchId },
    {
      $set: {
        paymentStatus: "failed",
        status: "cancelled",
        updatedAt: new Date(),
      },
    }
  );
  return orders().findOne({ _id: new ObjectId(id) });
}

/* ═══════════════════════════════════════════════════════
   Delete
═══════════════════════════════════════════════════════ */

export async function deleteOrder(id: string, branchId: string) {
  const result = await orders().deleteOne({
    _id: new ObjectId(id),
    branchId,
  });
  return result.deletedCount > 0;
}