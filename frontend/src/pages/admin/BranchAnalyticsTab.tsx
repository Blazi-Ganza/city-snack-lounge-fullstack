import { useState } from "react";
import { useBranchAnalytics, type RangeKey } from "../../hooks/useBranchAnalytics";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  preparing: "bg-amber-500",
  ready: "bg-purple-500",
  out_for_delivery: "bg-indigo-500",
  delivered: "bg-emerald-500",
  awaiting_payment: "bg-orange-500",
  cancelled: "bg-rose-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  awaiting_payment: "Awaiting Payment",
  cancelled: "Cancelled",
};

const CATEGORY_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

function formatRWF(n: number) {
  return `${n.toLocaleString()} RWF`;
}

function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
}

export function BranchAnalyticsTab({ branchId }: { branchId: string }) {
  const [range, setRange] = useState<RangeKey>("7d");
  const { data, loading, error } = useBranchAnalytics(branchId, range);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--card)] rounded-3xl p-16 border border-[var(--line)] text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <p className="font-serif italic text-[var(--muted)]">
          Failed to load analytics: {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Range Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase">
            Analytics
          </p>
          <h2 className="font-serif text-2xl font-bold text-[var(--ink)] mt-1">
            Performance Insights
          </h2>
        </div>
        <div className="inline-flex bg-[var(--card)] border border-[var(--line)] rounded-full p-1">
          {(["7d", "30d", "90d"] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                range === r
                  ? "bg-purple-600 text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue"
          value={formatRWF(data.kpis.revenue.value)}
          change={data.kpis.revenue.change}
          icon="💰"
        />
        <KpiCard
          label="Orders"
          value={data.kpis.orders.value.toString()}
          change={data.kpis.orders.change}
          icon="📦"
        />
        <KpiCard
          label="Avg Order"
          value={formatRWF(data.kpis.avgOrderValue.value)}
          change={data.kpis.avgOrderValue.change}
          icon="🧾"
        />
        <KpiCard
          label="Completion"
          value={`${data.kpis.completionRate.value}%`}
          change={data.kpis.completionRate.change}
          icon="✅"
          isPercentagePoints
        />
      </div>

      {/* Operations Live Panel */}
      <section>
        <SectionLabel>Live Operations</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OpsCard
            icon="🔥"
            label="Pending Orders"
            value={data.operations.pendingOrders}
            hint="new + preparing + ready"
          />
          <OpsCard
            icon="🚚"
            label="Active Deliveries"
            value={data.operations.activeDeliveries}
            hint="on the way"
          />
          <OpsCard
            icon="💬"
            label="Open Chats"
            value={data.operations.openChats}
            hint="need response"
          />
          <OpsCard
            icon="⏱️"
            label="Avg Fulfillment"
            value={
              data.operations.avgFulfillmentMinutes !== null
                ? `${data.operations.avgFulfillmentMinutes}m`
                : "—"
            }
            hint="order → delivered"
          />
        </div>
      </section>

      {/* Revenue Trend */}
      <section>
        <SectionLabel>Revenue Trend</SectionLabel>
        <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
          <RevenueTrendChart data={data.revenueTrend} />
        </div>
      </section>

      {/* Peak Hours & Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionLabel>Peak Hours</SectionLabel>
          <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
            <PeakHoursChart data={data.peakHours} />
            <p className="text-xs text-[var(--muted)] mt-4">
              Late-night lounge insight — when are your customers ordering most?
            </p>
          </div>
        </section>

        <section>
          <SectionLabel>Peak Days</SectionLabel>
          <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
            <PeakDaysChart data={data.peakDays} />
          </div>
        </section>
      </div>

      {/* Top Items & Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionLabel>Top Selling Items</SectionLabel>
          <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
            {data.topItems.length === 0 ? (
              <EmptyMini text="No sales yet in this range" />
            ) : (
              <div className="space-y-3">
                {data.topItems.map((item, i) => {
                  const max = data.topItems[0].qty;
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-300">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-[var(--ink)] truncate">
                            {item.name}
                          </span>
                          <span className="text-[var(--muted)] text-xs ml-2">
                            {item.qty} · {formatRWF(item.revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-[var(--line)] rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(item.qty / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionLabel>Sales by Category</SectionLabel>
          <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
            {data.categoryBreakdown.length === 0 ? (
              <EmptyMini text="No data" />
            ) : (
              <CategoryChart data={data.categoryBreakdown} />
            )}
          </div>
        </section>
      </div>

      {/* Order Status */}
      <section>
        <SectionLabel>Order Status Breakdown</SectionLabel>
        <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
          <OrderStatusBars data={data.ordersByStatus} />
        </div>
      </section>

      {/* Menu, Events, Promos Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthCard
          title="Menu Health"
          icon="🍽️"
          rows={[
            { label: "Total items", value: data.menuHealth.total },
            { label: "Available", value: data.menuHealth.available, tone: "good" },
            { label: "Unavailable", value: data.menuHealth.unavailable, tone: data.menuHealth.unavailable > 0 ? "warn" : "muted" },
            { label: "Featured", value: data.menuHealth.featured },
          ]}
        />
        <HealthCard
          title="Events"
          icon="🎉"
          rows={[
            { label: "Upcoming", value: data.eventsStats.upcoming },
            { label: "This month", value: data.eventsStats.thisMonth },
            { label: "Spots left", value: data.eventsStats.totalSpotsLeft },
          ]}
        />
        <HealthCard
          title="Promos"
          icon="🏷️"
          rows={[
            { label: "Active", value: data.promosStats.active },
            { label: "Featured", value: data.promosStats.featured },
            { label: "Expiring in 7d", value: data.promosStats.expiringSoon, tone: data.promosStats.expiringSoon > 0 ? "warn" : "muted" },
          ]}
        />
      </div>
    </div>
  );
}

/* ─── UI Bits ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-4">
      {children}
    </p>
  );
}

function KpiCard({
  label,
  value,
  change,
  icon,
  isPercentagePoints,
}: {
  label: string;
  value: string;
  change: number;
  icon: string;
  isPercentagePoints?: boolean;
}) {
  const positive = change >= 0;
  return (
    <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--line)]">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-lg">
          {icon}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            positive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {positive ? "↑" : "↓"} {Math.abs(change)}
          {isPercentagePoints ? "pp" : "%"}
        </span>
      </div>
      <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)] font-semibold mb-1">
        {label}
      </p>
      <p className="font-serif text-2xl font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}

function OpsCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--line)] relative overflow-hidden">
      <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)] font-semibold mb-1">
        {label}
      </p>
      <p className="font-serif text-3xl font-bold text-[var(--ink)]">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>
    </div>
  );
}

function HealthCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: string;
  rows: Array<{ label: string; value: number; tone?: "good" | "warn" | "muted" }>;
}) {
  return (
    <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <p className="font-serif font-bold text-[var(--ink)]">{title}</p>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">{row.label}</span>
            <span
              className={`font-semibold ${
                row.tone === "good"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : row.tone === "warn"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-[var(--ink)]"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <p className="text-center text-sm text-[var(--muted)] italic py-8">{text}</p>
  );
}

/* ─── Charts (pure SVG, no library) ─── */
function RevenueTrendChart({
  data,
}: {
  data: Array<{ date: string; revenue: number; orders: number }>;
}) {
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - (d.revenue / maxRev) * chartH;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? padding.left} ${
    padding.top + chartH
  } L ${padding.left} ${padding.top + chartH} Z`;

  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div>
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-xs text-[var(--muted)]">Total Revenue</p>
          <p className="font-serif text-xl font-bold text-[var(--ink)]">
            {formatRWF(totalRev)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Total Orders</p>
          <p className="font-serif text-xl font-bold text-[var(--ink)]">
            {totalOrders}
          </p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding.left}
            x2={padding.left + chartW}
            y1={padding.top + chartH * t}
            y2={padding.top + chartH * t}
            stroke="currentColor"
            className="text-[var(--line)]"
            strokeDasharray="3 3"
          />
        ))}
        <path d={areaD} fill="url(#revGradient)" />
        <path d={pathD} stroke="#8b5cf6" strokeWidth="2.5" fill="none" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#8b5cf6" />
            <title>{`${p.date}: ${formatRWF(p.revenue)} (${p.orders} orders)`}</title>
          </g>
        ))}
        {/* X labels — show every Nth */}
        {points.map((p, i) => {
          const step = Math.ceil(points.length / 7);
          if (i % step !== 0 && i !== points.length - 1) return null;
          return (
            <text
              key={i}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] fill-[var(--muted)]"
            >
              {p.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function PeakHoursChart({ data }: { data: Array<{ hour: number; orders: number }> }) {
  const max = Math.max(...data.map((d) => d.orders), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {data.map((h) => (
          <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex items-end h-full">
              <div
                className="w-full rounded-t bg-gradient-to-t from-purple-600 to-pink-500 hover:opacity-80 transition"
                style={{ height: `${(h.orders / max) * 100}%`, minHeight: h.orders > 0 ? "2px" : "0" }}
                title={`${formatHour(h.hour)}: ${h.orders} orders`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-[var(--muted)]">
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>11PM</span>
      </div>
    </div>
  );
}

function PeakDaysChart({
  data,
}: {
  data: Array<{ label: string; orders: number; revenue: number }>;
}) {
  const max = Math.max(...data.map((d) => d.orders), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--muted)] w-8">{d.label}</span>
          <div className="flex-1 bg-[var(--line)] rounded-full h-6 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all flex items-center px-2"
              style={{ width: `${(d.orders / max) * 100}%`, minWidth: d.orders > 0 ? "30px" : "0" }}
            >
              <span className="text-[10px] font-semibold text-white">{d.orders}</span>
            </div>
          </div>
          <span className="text-xs text-[var(--muted)] w-24 text-right">
            {formatRWF(d.revenue)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CategoryChart({
  data,
}: {
  data: Array<{ category: string; qty: number; revenue: number }>;
}) {
  const total = data.reduce((s, d) => s + d.revenue, 0);
  let cumulative = 0;
  const size = 160;
  const radius = 60;
  const stroke = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          className="text-[var(--line)]"
          strokeWidth={stroke}
          fill="none"
        />
        {data.map((d, i) => {
          const frac = total > 0 ? d.revenue / total : 0;
          const dashArray = `${frac * circumference} ${circumference}`;
          const dashOffset = -cumulative * circumference;
          cumulative += frac;
          return (
            <circle
              key={d.category}
              cx={center}
              cy={center}
              r={radius}
              stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="text-[10px] fill-[var(--muted)]"
        >
          Total
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          className="text-xs font-bold fill-[var(--ink)]"
        >
          {(total / 1000).toFixed(0)}K
        </text>
      </svg>
      <div className="flex-1 space-y-2 min-w-[140px]">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
            />
            <span className="flex-1 text-[var(--ink)]">{d.category}</span>
            <span className="text-[var(--muted)] text-xs">
              {total > 0 ? Math.round((d.revenue / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderStatusBars({ data }: { data: Array<{ status: string; count: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <EmptyMini text="No orders yet" />;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-[var(--line)]">
        {data.map((d) => (
          <div
            key={d.status}
            className={STATUS_COLORS[d.status] ?? "bg-gray-400"}
            style={{ width: `${(d.count / total) * 100}%` }}
            title={`${STATUS_LABELS[d.status] ?? d.status}: ${d.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[d.status] ?? "bg-gray-400"}`} />
            <span className="text-[var(--muted)] flex-1">
              {STATUS_LABELS[d.status] ?? d.status}
            </span>
            <span className="font-semibold text-[var(--ink)]">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}