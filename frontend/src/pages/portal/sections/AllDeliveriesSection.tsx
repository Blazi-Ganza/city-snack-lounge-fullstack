import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Phone, MapPin, Search } from "lucide-react";
import { useAdminOrders, type AdminOrder } from "../../../hooks/useAdminData";
import { cn } from "../../../utils/cn";

function fmtRWF(n: number) {
  return n.toLocaleString() + " RWF";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_STEPS = [
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "En Route" },
  { key: "delivered", label: "Delivered" },
] as const;

export function AllDeliveriesSection({ refreshKey }: { refreshKey: number }) {
  const { data: orders, loading, error } = useAdminOrders(refreshKey);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // Only delivery-type orders
  const deliveries = useMemo(
    () => orders.filter((o) => o.type === "delivery"),
    [orders]
  );

  const branches = useMemo(
    () => Array.from(new Set(deliveries.map((o) => o.branchId))),
    [deliveries]
  );

  const filtered = useMemo(() => {
    return deliveries.filter((o) => {
      if (statusFilter === "active" && (o.status === "delivered" || o.status === "cancelled"))
        return false;
      if (statusFilter === "completed" && o.status !== "delivered")
        return false;
      if (branchFilter !== "all" && o.branchId !== branchFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !o.customerName.toLowerCase().includes(q) &&
          !o.orderCode.toLowerCase().includes(q) &&
          !o.phone.includes(q) &&
          !(o.address ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [deliveries, search, statusFilter, branchFilter]);

  const stats = useMemo(() => {
    const active = deliveries.filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled"
    );
    return {
      total: deliveries.length,
      active: active.length,
      inTransit: deliveries.filter((o) => o.status === "out_for_delivery").length,
      completed: deliveries.filter((o) => o.status === "delivered").length,
    };
  }, [deliveries]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[var(--muted)]">
        Loading deliveries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--error)]/20 bg-[var(--error)]/10 p-6 text-sm text-[var(--error)]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} accent />
        <StatCard label="In Transit" value={stats.inTransit} />
        <StatCard label="Delivered" value={stats.completed} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, address, order code..."
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm text-[var(--ink)] outline-none"
        >
          <option value="active">Active Only</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm text-[var(--ink)] outline-none"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--muted)]">
          {filtered.length} deliveries
        </span>
      </div>

      {/* Delivery cards */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--card)] py-16 text-center">
          <Truck className="mx-auto mb-3 text-[var(--muted)]" size={32} />
          <p className="text-sm text-[var(--muted)]">No deliveries found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <DeliveryCard key={o._id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent
          ? "border-[var(--primary)]/30 bg-[var(--primary)]/10"
          : "border-[var(--line)] bg-[var(--card)]"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-1 text-xl font-bold sm:text-2xl",
          accent ? "text-[var(--primary)]" : "text-[var(--ink)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DeliveryCard({ order }: { order: AdminOrder }) {
  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]/30 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-[var(--primary)]">
            {order.orderCode}
          </p>
          <h4 className="font-display mt-0.5 truncate text-lg font-bold text-[var(--ink)]">
            {order.customerName}
          </h4>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            {order.branchId} · {timeAgo(order.createdAt)}
          </p>
        </div>
        <p className="font-display shrink-0 text-lg font-bold text-[var(--ink)]">
          {fmtRWF(order.total)}
        </p>
      </div>

      {/* Progress bar */}
      {!isCancelled && (
        <div className="mb-4">
          <div className="mb-2 flex gap-1">
            {STATUS_STEPS.map((step, i) => (
              <div
                key={step.key}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= currentStep
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--bg-soft)]"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider">
            {STATUS_STEPS.map((step, i) => (
              <span
                key={step.key}
                className={cn(
                  i <= currentStep
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted)]"
                )}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mb-4 rounded-xl bg-[var(--error)]/10 p-3 text-center text-xs font-bold text-[var(--error)]">
          CANCELLED
        </div>
      )}

      {isDelivered && (
        <div className="mb-4 rounded-xl bg-[var(--success)]/10 p-3 text-center text-xs font-bold text-[var(--success)]">
          ✓ DELIVERED
        </div>
      )}

      {/* Contact */}
      <div className="space-y-2 rounded-xl bg-[var(--bg-soft)] p-3">
        <a
          href={`tel:${order.phone}`}
          className="flex items-center gap-2 text-sm text-[var(--ink)] hover:text-[var(--primary)]"
        >
          <Phone size={14} className="text-[var(--muted)]" />
          {order.phone}
        </a>
        {order.address && (
          <div className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <MapPin
              size={14}
              className="mt-0.5 flex-shrink-0 text-[var(--muted)]"
            />
            <span className="line-clamp-2">{order.address}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <a
          href={`tel:${order.phone}`}
          className="flex-1 rounded-full bg-[var(--primary)] py-2 text-center text-xs font-semibold text-white transition hover:opacity-90"
        >
          Call
        </a>
        <a
          href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full border border-[var(--line)] py-2 text-center text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--card-hover)]"
        >
          WhatsApp
        </a>
      </div>
    </motion.article>
  );
}