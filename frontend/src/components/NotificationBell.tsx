import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, type AppNotification } from "../context/NotificationsContext";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  order: "🆕",
  chat: "💬",
  reservation: "📅",
  stale_payment: "⚠️",
};

const TYPE_COLORS: Record<string, string> = {
  order: "bg-orange-500",
  chat: "bg-blue-500",
  reservation: "bg-purple-500",
  stale_payment: "bg-yellow-500",
};

/* ─── SVG Icons ─── */
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, muted, toggleMuted, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener("mousedown", onClick);
      return () => window.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  useEffect(() => {
    if (open && unreadCount > 0) {
      const t = setTimeout(() => markAllRead(), 500);
      return () => clearTimeout(t);
    }
  }, [open, unreadCount, markAllRead]);

  function handleClick(n: AppNotification) {
    setOpen(false);
    switch (n.type) {
      case "order":
      case "stale_payment":
        navigate("/admin/dashboard");
        break;
      case "chat":
        navigate("/admin/dashboard");
        break;
      case "reservation":
        navigate("/admin/dashboard");
        break;
    }
  }

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1">
      {/* Mute toggle */}
      <button
        onClick={toggleMuted}
        title={muted ? "Unmute notifications" : "Mute notifications"}
        className="w-10 h-10 border border-[var(--line)] rounded-full hover:bg-[var(--bg-soft)] text-[var(--ink)] flex items-center justify-center transition"
      >
        {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>

      {/* Bell */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 border border-[var(--line)] rounded-full hover:bg-[var(--bg-soft)] text-[var(--ink)] flex items-center justify-center transition"
        title="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--card)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="fixed sm:absolute right-4 sm:right-0 top-20 sm:top-12 w-[calc(100vw-2rem)] sm:w-96 max-h-[500px] bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col"
          style={{ maxWidth: "24rem" }}
        >
          <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
            <div>
              <p className="font-serif font-bold text-[var(--ink)]">Notifications</p>
              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                {items.length} recent
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-2">🔔</p>
                <p className="text-sm text-[var(--muted)] italic">No notifications yet</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  You'll see new orders, chats, and reservations here.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition flex gap-3 ${
                    !n.read ? "bg-purple-50/50 dark:bg-purple-950/20" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm ${
                      TYPE_COLORS[n.type] ?? "bg-gray-500"
                    }`}
                  >
                    {TYPE_ICONS[n.type] ?? "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-[var(--ink)] truncate">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted)]">
                      {n.branchId && (
                        <span className="uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-400">
                          {n.branchId}
                        </span>
                      )}
                      <span>·</span>
                      <span>{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}