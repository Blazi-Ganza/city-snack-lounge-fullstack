import { getDb } from "./mongo";

export interface BranchSnapshot {
  id: string;
  name: string;
  chats: number;
  newChats: number;
  orders: number;
  awaitingPayment: number;
  deliveries: number;
  revenueToday: number;
  ordersToday: number;
}

export interface AdminOverview {
  totals: {
    branches: number;
    chats: number;
    newChats: number;
    orders: number;
    ordersToday: number;
    revenueToday: number;
    revenueThisWeek: number;
    deliveries: number;
    awaitingPayment: number;
    reservations: number;
  };
  branches: BranchSnapshot[];
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
}

const BRANCH_NAMES: Record<string, string> = {
  huye: "Huye Branch",
  musanze: "Musanze Branch",
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - 7);
  return x;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = getDb();
  const today = startOfDay();
  const weekAgo = startOfWeek();

  const [allChats, allOrders, ordersToday, ordersThisWeek, reservations, topItemsAgg, revenueByDayAgg] =
    await Promise.all([
      db.collection("chats").find({}).toArray(),
      db.collection("orders").find({}).toArray(),
      db.collection("orders").find({ createdAt: { $gte: today } }).toArray(),
      db.collection("orders").find({ createdAt: { $gte: weekAgo } }).toArray(),
      db.collection("reservations").find({}).toArray(),

      db.collection("orders").aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            qty: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 5 },
      ]).toArray(),

      db.collection("orders").aggregate([
        { $match: { createdAt: { $gte: weekAgo }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray(),
    ]);

  const branchIds = new Set<string>(["huye", "musanze"]);
  allOrders.forEach((o: any) => branchIds.add(o.branchId));
  allChats.forEach((c: any) => branchIds.add(c.branchId));

  const branches: BranchSnapshot[] = Array.from(branchIds).map((bid) => {
    const branchChats = allChats.filter((c: any) => c.branchId === bid);
    const branchOrders = allOrders.filter((o: any) => o.branchId === bid);
    const branchOrdersToday = ordersToday.filter((o: any) => o.branchId === bid);
    const revenueToday = branchOrdersToday
      .filter((o: any) => o.status !== "cancelled")
      .reduce((s: number, o: any) => s + (o.total ?? 0), 0);
    return {
      id: bid,
      name: BRANCH_NAMES[bid] ?? bid,
      chats: branchChats.length,
      newChats: branchChats.filter((c: any) => c.status === "new").length,
      orders: branchOrders.length,
      awaitingPayment: branchOrders.filter((o: any) => o.status === "awaiting_payment").length,
      deliveries: branchOrders.filter((o: any) => o.status === "out_for_delivery").length,
      revenueToday,
      ordersToday: branchOrdersToday.length,
    };
  });

  const revenueToday = ordersToday
    .filter((o: any) => o.status !== "cancelled")
    .reduce((s: number, o: any) => s + (o.total ?? 0), 0);
  const revenueThisWeek = ordersThisWeek
    .filter((o: any) => o.status !== "cancelled")
    .reduce((s: number, o: any) => s + (o.total ?? 0), 0);

  return {
    totals: {
      branches: branches.length,
      chats: allChats.length,
      newChats: allChats.filter((c: any) => c.status === "new").length,
      orders: allOrders.length,
      ordersToday: ordersToday.length,
      revenueToday,
      revenueThisWeek,
      deliveries: allOrders.filter((o: any) => o.status === "out_for_delivery").length,
      awaitingPayment: allOrders.filter((o: any) => o.status === "awaiting_payment").length,
      reservations: reservations.length,
    },
    branches,
    topItems: topItemsAgg.map((t: any) => ({ name: t._id, qty: t.qty, revenue: t.revenue })),
    revenueByDay: revenueByDayAgg.map((r: any) => ({ date: r._id, revenue: r.revenue, orders: r.orders })),
  };
}

export async function getAllChats() {
  return getDb().collection("chats").find({}).sort({ updatedAt: -1 }).limit(200).toArray();
}

export async function getAllOrders(limit = 200, includeArchived = false) {
  const query: any = {};
  if (!includeArchived) {
    query.isArchived = { $ne: true };
  }
  return getDb()
    .collection("orders")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}