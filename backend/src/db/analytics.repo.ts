import { getDb } from "./mongo";

export type RangeKey = "7d" | "30d" | "90d";

export interface KpiValue {
  value: number;
  change: number; // percentage change vs previous period
}

export interface BranchAnalytics {
  range: RangeKey;
  kpis: {
    revenue: KpiValue;
    orders: KpiValue;
    avgOrderValue: KpiValue;
    completionRate: KpiValue;
  };
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  peakHours: Array<{ hour: number; orders: number }>;
  peakDays: Array<{ dayOfWeek: number; label: string; orders: number; revenue: number }>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  categoryBreakdown: Array<{ category: string; qty: number; revenue: number }>;
  menuHealth: {
    total: number;
    available: number;
    unavailable: number;
    featured: number;
  };
  eventsStats: {
    upcoming: number;
    thisMonth: number;
    totalSpotsLeft: number;
  };
  promosStats: {
    active: number;
    featured: number;
    expiringSoon: number; // ends within next 7 days
  };
  operations: {
    pendingOrders: number;
    activeDeliveries: number;
    openChats: number;
    avgFulfillmentMinutes: number | null;
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function rangeToDays(range: RangeKey): number {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function getBranchAnalytics(
  branchId: string,
  range: RangeKey = "7d"
): Promise<BranchAnalytics> {
  const db = getDb();
  const days = rangeToDays(range);
  const rangeStart = daysAgo(days);
  const prevRangeStart = daysAgo(days * 2);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAhead = new Date();
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

  const orders = db.collection("orders");
  const menu = db.collection("menu");
  const events = db.collection("events");
  const promos = db.collection("promos");
  const chats = db.collection("chats");
  const deliveries = db.collection("deliveries");

  const matchCurrent = {
    branchId,
    createdAt: { $gte: rangeStart },
    status: { $ne: "cancelled" },
  };
  const matchPrevious = {
    branchId,
    createdAt: { $gte: prevRangeStart, $lt: rangeStart },
    status: { $ne: "cancelled" },
  };

  const [
    currentOrders,
    previousOrders,
    revenueTrendAgg,
    ordersByStatusAgg,
    peakHoursAgg,
    peakDaysAgg,
    topItemsAgg,
    categoryAgg,
    menuItems,
    upcomingEventsList,
    activePromosList,
    openChatsCount,
    activeDeliveriesCount,
    pendingOrdersCount,
    fulfillmentAgg,
  ] = await Promise.all([
    orders.find(matchCurrent).toArray(),
    orders.find(matchPrevious).toArray(),

    // Revenue trend by day
    orders.aggregate([
      { $match: matchCurrent },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),

    // Order status breakdown (all-time for branch)
    orders.aggregate([
      { $match: { branchId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),

    // Peak hours (current range)
    orders.aggregate([
      { $match: matchCurrent },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),

    // Peak days of week
    orders.aggregate([
      { $match: matchCurrent },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" }, // 1=Sun..7=Sat
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),

    // Top items
    orders.aggregate([
      { $match: matchCurrent },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 8 },
    ]).toArray(),

    // Category breakdown (join items with menu to get category)
    orders.aggregate([
      { $match: matchCurrent },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "menu",
          let: { itemName: "$items.name", bId: "$branchId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$name", "$$itemName"] },
                    { $eq: ["$branchId", "$$bId"] },
                  ],
                },
              },
            },
            { $project: { category: 1 } },
          ],
          as: "menuItem",
        },
      },
      {
        $addFields: {
          category: {
            $ifNull: [{ $arrayElemAt: ["$menuItem.category", 0] }, "Other"],
          },
        },
      },
      {
        $group: {
          _id: "$category",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]).toArray(),

    menu.find({ branchId }).toArray(),
    events.find({ branchId }).toArray(),
    promos.find({ branchId }).toArray(),
    chats.countDocuments({ branchId, status: "new" }),
    deliveries.countDocuments({ branchId, status: { $in: ["assigned", "on_the_way"] } }),
    orders.countDocuments({ branchId, status: { $in: ["new", "preparing", "ready"] } }),

    // Avg fulfillment time (createdAt -> updatedAt on delivered orders in range)
    orders.aggregate([
      {
        $match: {
          branchId,
          status: "delivered",
          createdAt: { $gte: rangeStart },
          updatedAt: { $exists: true },
        },
      },
      {
        $project: {
          minutes: {
            $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: "$minutes" } } },
    ]).toArray(),
  ]);

  // KPI calculations
  const currentRevenue = currentOrders.reduce((s, o: any) => s + (o.total ?? 0), 0);
  const previousRevenue = previousOrders.reduce((s, o: any) => s + (o.total ?? 0), 0);
  const currentCount = currentOrders.length;
  const previousCount = previousOrders.length;
  const currentAov = currentCount > 0 ? currentRevenue / currentCount : 0;
  const previousAov = previousCount > 0 ? previousRevenue / previousCount : 0;

  const totalCurrentAll = await orders.countDocuments({
    branchId,
    createdAt: { $gte: rangeStart },
  });
  const deliveredCurrent = await orders.countDocuments({
    branchId,
    createdAt: { $gte: rangeStart },
    status: "delivered",
  });
  const totalPrevAll = await orders.countDocuments({
    branchId,
    createdAt: { $gte: prevRangeStart, $lt: rangeStart },
  });
  const deliveredPrev = await orders.countDocuments({
    branchId,
    createdAt: { $gte: prevRangeStart, $lt: rangeStart },
    status: "delivered",
  });

  const currentCompletion = totalCurrentAll > 0 ? (deliveredCurrent / totalCurrentAll) * 100 : 0;
  const previousCompletion = totalPrevAll > 0 ? (deliveredPrev / totalPrevAll) * 100 : 0;

  // Fill missing days in revenue trend with zeros
  const trendMap = new Map(
    revenueTrendAgg.map((r: any) => [r._id, { revenue: r.revenue, orders: r.orders }])
  );
  const revenueTrend: Array<{ date: string; revenue: number; orders: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = trendMap.get(key) ?? { revenue: 0, orders: 0 };
    revenueTrend.push({ date: key, ...entry });
  }

  // Fill all 24 hours
  const hourMap = new Map(peakHoursAgg.map((h: any) => [h._id, h.orders]));
  const peakHours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    orders: (hourMap.get(h) as number) ?? 0,
  }));

  // Fill all 7 days
  const dayMap = new Map(
    peakDaysAgg.map((d: any) => [d._id, { orders: d.orders, revenue: d.revenue }])
  );
  const peakDays = Array.from({ length: 7 }, (_, i) => {
    const dow = i + 1; // 1..7
    const entry = (dayMap.get(dow) as any) ?? { orders: 0, revenue: 0 };
    return {
      dayOfWeek: dow,
      label: DAY_LABELS[i],
      orders: entry.orders,
      revenue: entry.revenue,
    };
  });

  const availableCount = menuItems.filter((m: any) => m.isAvailable !== false).length;
  const featuredCount = menuItems.filter((m: any) => m.featured === true).length;

  const upcomingEvents = upcomingEventsList.filter(
    (e: any) => new Date(e.date) >= new Date(now.toISOString().slice(0, 10))
  );
  const eventsThisMonth = upcomingEventsList.filter((e: any) => {
    const d = new Date(e.date);
    return d >= monthStart && d <= new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });
  const totalSpotsLeft = upcomingEvents.reduce(
    (s: number, e: any) => s + (typeof e.spotsLeft === "number" ? e.spotsLeft : 0),
    0
  );

  const activePromos = activePromosList.filter((p: any) => {
    if (p.isActive === false) return false;
    const end = new Date(p.endDate);
    return end >= new Date();
  });
  const featuredPromos = activePromos.filter((p: any) => p.isFeatured);
  const expiringSoon = activePromos.filter((p: any) => {
    const end = new Date(p.endDate);
    return end <= sevenDaysAhead;
  });

  return {
    range,
    kpis: {
      revenue: {
        value: currentRevenue,
        change: pctChange(currentRevenue, previousRevenue),
      },
      orders: {
        value: currentCount,
        change: pctChange(currentCount, previousCount),
      },
      avgOrderValue: {
        value: Math.round(currentAov),
        change: pctChange(currentAov, previousAov),
      },
      completionRate: {
        value: Number(currentCompletion.toFixed(1)),
        change: Number((currentCompletion - previousCompletion).toFixed(1)),
      },
    },
    revenueTrend,
    ordersByStatus: ordersByStatusAgg.map((s: any) => ({
      status: s._id ?? "unknown",
      count: s.count,
    })),
    peakHours,
    peakDays,
    topItems: topItemsAgg.map((t: any) => ({
      name: t._id,
      qty: t.qty,
      revenue: t.revenue,
    })),
    categoryBreakdown: categoryAgg.map((c: any) => ({
      category: c._id,
      qty: c.qty,
      revenue: c.revenue,
    })),
    menuHealth: {
      total: menuItems.length,
      available: availableCount,
      unavailable: menuItems.length - availableCount,
      featured: featuredCount,
    },
    eventsStats: {
      upcoming: upcomingEvents.length,
      thisMonth: eventsThisMonth.length,
      totalSpotsLeft,
    },
    promosStats: {
      active: activePromos.length,
      featured: featuredPromos.length,
      expiringSoon: expiringSoon.length,
    },
    operations: {
      pendingOrders: pendingOrdersCount,
      activeDeliveries: activeDeliveriesCount,
      openChats: openChatsCount,
      avgFulfillmentMinutes: fulfillmentAgg[0]?.avg
        ? Math.round(fulfillmentAgg[0].avg)
        : null,
    },
  };
}