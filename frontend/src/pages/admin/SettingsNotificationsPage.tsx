import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Check,
  MessageSquare,
  ShoppingBag,
  Trash2,
  Volume2,
  VolumeX,
  AlertTriangle,
  MapPin,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useNotifications,
  type NotificationType,
  type AppNotification,
} from "../../context/NotificationsContext";

const typeConfig: Record<
  NotificationType,
  { icon: LucideIcon; label: string; color: string; bg: string }
> = {
  order: {
    icon: ShoppingBag,
    label: "Order",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  reservation: {
    icon: Calendar,
    label: "Reservation",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-950/40",
  },
  chat: {
    icon: MessageSquare,
    label: "Chat",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-100 dark:bg-purple-950/40",
  },
  stale_payment: {
    icon: AlertTriangle,
    label: "Payment Alert",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-950/40",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationRow({ n }: { n: AppNotification }) {
  const cfg = typeConfig[n.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 p-4 rounded-2xl border transition ${
        !n.read
          ? "bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
          : "bg-[var(--card)] border-[var(--line)]"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="font-semibold text-sm text-[var(--ink)]">{n.title}</div>

            <div className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>

              {n.branchId && (
                <span className="inline-flex items-center gap-1 capitalize">
                  <MapPin size={10} strokeWidth={2} />
                  {n.branchId}
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-[var(--muted)] shrink-0">
            {timeAgo(n.createdAt)}
          </div>
        </div>

        <div className="text-sm text-[var(--muted)] mt-2 leading-snug">
          {n.message}
        </div>

        {n.orderCode && (
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono mt-1">
            #{n.orderCode}
          </div>
        )}
      </div>

      {!n.read && (
        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
      )}
    </motion.div>
  );
}

export function SettingsNotificationsPage() {
  const { items, unreadCount, muted, toggleMuted, markAllRead, clearAll } =
    useNotifications();

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] text-[var(--ink)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-purple-600 transition mb-6"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-purple-600 dark:text-purple-400 font-medium mb-2">
            Settings · Notifications
          </div>

          <h1 className="text-4xl font-serif font-bold flex items-center gap-3 text-[var(--ink)]">
            <Bell size={32} strokeWidth={2} className="text-purple-600" />
            Notifications
          </h1>

          <p className="text-[var(--muted)] mt-2">
            Manage real-time alerts and view your recent activity.
          </p>
        </div>

        {/* Preferences card */}
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--line)] p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[var(--ink)]">
            Preferences
          </h2>

          <div className="space-y-3">
            {/* Sound toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--line)]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    muted
                      ? "bg-[var(--card)] text-[var(--muted)]"
                      : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {muted ? (
                    <VolumeX size={18} strokeWidth={2} />
                  ) : (
                    <Volume2 size={18} strokeWidth={2} />
                  )}
                </div>

                <div>
                  <div className="font-medium text-sm text-[var(--ink)]">Sound Alerts</div>
                  <div className="text-xs text-[var(--muted)]">
                    Play a beep when a new notification arrives
                  </div>
                </div>
              </div>

              <button
                onClick={toggleMuted}
                className={`relative w-12 h-6 rounded-full transition ${
                  muted ? "bg-black/20 dark:bg-white/20" : "bg-emerald-500"
                }`}
                aria-label={muted ? "Unmute notification sounds" : "Mute notification sounds"}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                  animate={{ x: muted ? 2 : 26 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Real-time status */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--line)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Radio size={18} strokeWidth={2} />
                </div>

                <div>
                  <div className="font-medium text-sm text-[var(--ink)]">
                    Real-time Delivery
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Notifications arrive instantly via WebSocket
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Recent notifications */}
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--line)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Recent Notifications
              </h2>

              <div className="text-xs text-[var(--muted)] mt-0.5">
                {items.length === 0
                  ? "No notifications yet"
                  : `${items.length} total · ${unreadCount} unread`}
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               text-xs font-medium bg-emerald-50 text-emerald-700
                               hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300
                               transition"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    Mark all read
                  </button>
                )}

                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             text-xs font-medium bg-red-50 text-red-700
                             hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300
                             transition"
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--bg-soft)] flex items-center justify-center mb-4">
                <BellOff size={28} className="text-[var(--muted)] opacity-50" strokeWidth={1.8} />
              </div>

              <div className="text-[var(--muted)] font-medium">All caught up</div>

              <div className="text-xs text-[var(--muted)] opacity-70 mt-1">
                New notifications will appear here in real time
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <NotificationRow key={n.id} n={n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}