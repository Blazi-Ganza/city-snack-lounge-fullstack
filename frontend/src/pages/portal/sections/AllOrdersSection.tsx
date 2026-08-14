import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ShoppingBag, X, Phone, MapPin } from "lucide-react";
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

const STATUS_META: Record<
  AdminOrder["status"],
  { label: string; className: string }
> = {
  awaiting_payment: {
    label: "Awaiting Pay",
    className: "bg-[var(--warning)] text-white",
  },
  new: { label: "New", className: "bg-[var(--primary)] text-white" },
  preparing: {
    label: "Preparing",
    className: "bg-blue-500 text-white",
  },
  ready: { label: "Ready", className: "bg-purple-500 text-white" },
  out_for_delivery: {
    label: "Delivering",
    className: "bg-orange-600 text-white",
  },
  delivered: {
    label: "Delivered",
    className: "bg-[var(--success)] text-white",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[var(--bg-soft)] text-[var(--muted)]",
  },
};

export function AllOrdersSection({ refreshKey }: { refreshKey: number }) {
  const { data: orders, loading, error } = useAdminOrders(refreshKey);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const branches = useMemo(
    () => Array.from(new Set(orders.map((o) => o.branchId))),
    [orders]
  );

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (branchFilter !== "all" && o.branchId !== branchFilter) return false;
      if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !o.customerName.toLowerCase().includes(q) &&
          !o.orderCode.toLowerCase().includes(q) &&
          !o.phone.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, branchFilter, paymentFilter]);

  const stats = useMemo(() => {
    return {
      total: filtered.length,
      revenue: filtered
        .filter((o) => o.status !== "cancelled")
        .reduce((s, o) => s + o.total, 0),
      awaitingPayment: filtered.filter((o) => o.status === "awaiting_payment")
        .length,
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[var(--muted)]">
        Loading orders...
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
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Orders" value={stats.total.toString()} />
        <SummaryCard label="Revenue" value={fmtRWF(stats.revenue)} />
        <SummaryCard
          label="Awaiting Pay"
          value={stats.awaitingPayment.toString()}
          accent={stats.awaitingPayment > 0}
        />
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
            placeholder="Search name, phone, order code..."
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm text-[var(--ink)] outline-none"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm text-[var(--ink)] outline-none"
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="momo">MoMo</option>
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
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--card)] py-16 text-center">
          <ShoppingBag
            className="mx-auto mb-3 text-[var(--muted)]"
            size={32}
          />
          <p className="text-sm text-[var(--muted)]">No orders found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
          {filtered.map((o) => (
            <OrderRow key={o._id} order={o} onClick={() => setSelected(o)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent
          ? "border-[var(--warning)]/30 bg-[var(--warning)]/10"
          : "border-[var(--line)] bg-[var(--card)]"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-1 text-lg font-bold sm:text-xl",
          accent ? "text-[var(--warning)]" : "text-[var(--ink)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function OrderRow({
  order,
  onClick,
}: {
  order: AdminOrder;
  onClick: () => void;
}) {
  const status = STATUS_META[order.status];
  const isPending = order.status === "awaiting_payment";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 border-b border-[var(--line)] p-4 text-left transition last:border-0 hover:bg-[var(--card-hover)]",
        isPending && "bg-[var(--warning)]/5"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs font-bold text-[var(--primary)]">
            {order.orderCode}
          </p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-bold",
              status.className
            )}
          >
            {status.label}
          </span>
          {order.paymentMethod === "momo" && (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-bold text-yellow-700 dark:text-yellow-400">
              MoMo
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--ink)]">
          {order.customerName}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {order.branchId} · {order.items.length} items · {timeAgo(order.createdAt)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display font-bold text-[var(--ink)]">
          {fmtRWF(order.total)}
        </p>
        <p className="text-xs uppercase text-[var(--muted)]">{order.type}</p>
      </div>
    </button>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: AdminOrder;
  onClose: () => void;
}) {
  const status = STATUS_META[order.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[var(--line)] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm font-bold text-[var(--primary)]">
                {order.orderCode}
              </p>
              <h3 className="font-display mt-1 text-xl font-bold text-[var(--ink)]">
                {order.customerName}
              </h3>
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                {order.branchId} · {timeAgo(order.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--card-hover)]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold",
                status.className
              )}
            >
              {status.label}
            </span>
            <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[10px] font-bold text-[var(--ink)]">
              {order.type.toUpperCase()}
            </span>
            {order.paymentMethod && (
              <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[10px] font-bold text-[var(--ink)]">
                {order.paymentMethod.toUpperCase()}
                {order.paymentStatus && ` · ${order.paymentStatus}`}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Contact */}
          <div className="mb-4 space-y-2 rounded-xl bg-[var(--bg-soft)] p-3">
            <div className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <Phone size={14} className="text-[var(--muted)]" />
              <a
                href={`tel:${order.phone}`}
                className="hover:text-[var(--primary)]"
              >
                {order.phone}
              </a>
            </div>
            {order.address && (
              <div className="flex items-start gap-2 text-sm text-[var(--ink)]">
                <MapPin
                  size={14}
                  className="mt-0.5 flex-shrink-0 text-[var(--muted)]"
                />
                {order.address}
              </div>
            )}
          </div>

          {/* Items */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Items
          </p>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">{it.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {it.qty} × {fmtRWF(it.price)}
                  </p>
                </div>
                <p className="font-bold text-[var(--ink)]">
                  {fmtRWF(it.price * it.qty)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4">
            <span className="text-sm font-semibold text-[var(--muted)]">
              Total
            </span>
            <span className="font-display text-2xl font-bold text-[var(--ink)]">
              {fmtRWF(order.total)}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}