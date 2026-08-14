import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalAuth } from "../../context/PortalAuthContext";
import { resetSocket } from "../../lib/socket";
import { useAdminOverview, useAdminChats, useAdminOrders, type AdminChat, type AdminOrder } from "../../hooks/useAdminData";
import { NotificationBell } from "../../components/NotificationBell";

import { useAdminActions } from "../../hooks/useAdminActions";

const ORDER_STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "bg-yellow-500 text-white",
  new: "bg-orange-500 text-white",
  preparing: "bg-blue-500 text-white",
  ready: "bg-purple-500 text-white",
  out_for_delivery: "bg-indigo-500 text-white",
  delivered: "bg-green-500 text-white",
  cancelled: "bg-neutral-300 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting Pay",
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Delivering",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type Section = "overview" | "branches" | "chats" | "orders" | "deliveries" | "settings";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { session, signOut } = usePortalAuth();

  // 🌗 Dark mode
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!session || session.role !== "admin") {
      signOut();
      resetSocket();
      navigate("/admin/login", { replace: true });
    }
  }, [session, signOut, navigate]);

  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { data, loading, error } = useAdminOverview(refreshKey);

  function handleLogout() {
  signOut("manual");
  resetSocket();
  // Use replace so back button can't return to dashboard
  navigate("/admin/login", { replace: true });
}

  const greeting = getGreeting(now);
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] flex text-[var(--ink)]">
      {/* ============ SIDEBAR ============ */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-[var(--card)] border-r border-[var(--line)] transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-[var(--line)]">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/images/city-snack-logo.png"
              alt="City Snack Lounge"
              data-no-dim
              className="logo-light h-11 w-auto object-contain"
            />
            <img
              src="/images/city-snack-logo-white.png"
              alt="City Snack Lounge"
              data-no-dim
              className="logo-dark h-11 w-auto object-contain"
            />
            <div>
              <p className="font-serif font-bold leading-tight text-[15px] text-[var(--ink)]">City Snack</p>
              <p className="font-serif font-bold leading-tight text-[15px] -mt-0.5 text-[var(--ink)]">Lounge</p>
            </div>
          </div>
          <div className="pt-3 border-t border-[var(--line)]">
            <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-1">Admin Portal</p>
            <p className="text-xs text-[var(--muted)]">{dateStr}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <AdminNavItem icon={<IconGrid />} label="Overview" active={section === "overview"} onClick={() => { setSection("overview"); setSidebarOpen(false); }} />
          <AdminNavItem icon={<IconBranches />} label="Branches" badge={data?.totals.branches} active={section === "branches"} onClick={() => { setSection("branches"); setSidebarOpen(false); }} />
          <AdminNavItem icon={<IconChat />} label="All Chats" badge={data?.totals.chats} active={section === "chats"} onClick={() => { setSection("chats"); setSidebarOpen(false); }} />
          <AdminNavItem icon={<IconBag />} label="All Orders" badge={data?.totals.orders} active={section === "orders"} onClick={() => { setSection("orders"); setSidebarOpen(false); }} />
          <AdminNavItem icon={<IconTruck />} label="All Deliveries" badge={data?.totals.deliveries} active={section === "deliveries"} onClick={() => { setSection("deliveries"); setSidebarOpen(false); }} />
          <div className="pt-4 mt-4 border-t border-[var(--line)]">
            <AdminNavItem icon={<IconSettings />} label="Settings" active={section === "settings"} onClick={() => { setSection("settings"); setSidebarOpen(false); }} />
          </div>
        </nav>

        <div className="p-4 border-t border-[var(--line)] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/30">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-serif font-bold">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--ink)]">Administrator</p>
              <p className="text-[10px] text-purple-700 dark:text-purple-300 tracking-wider uppercase">Full Access</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full bg-[var(--ink)] text-[var(--card)] py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition">
            Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ============ MAIN ============ */}
      <main className="flex-1 min-w-0">
        <header className="bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--line)] sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 md:px-10 py-5 gap-4">
            <div className="flex items-center gap-4">
              <button className="lg:hidden w-10 h-10 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink)]" onClick={() => setSidebarOpen(true)}>☰</button>
              <div>
                <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase">{sectionLabel(section)}</p>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-[var(--ink)]">Business Overview</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="w-10 h-10 border border-[var(--line)] bg-[var(--bg-soft)] rounded-full hover:bg-purple-600 hover:text-white text-[var(--ink)] flex items-center justify-center transition"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <IconSun /> : <IconMoon />}
              </button>
              <NotificationBell />

  <div className="hidden sm:flex items-center gap-2 border border-purple-200 ..."></div>

              <div className="hidden sm:flex items-center gap-2 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-2 bg-purple-50 dark:bg-purple-950/30">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] text-purple-700 dark:text-purple-300 uppercase font-semibold">All Branches</span>
              </div>
              <button onClick={() => setRefreshKey((k) => k + 1)} className="w-10 h-10 border border-[var(--line)] rounded-full hover:bg-[var(--bg-soft)] text-[var(--ink)] flex items-center justify-center" title="Refresh">
                <IconRefresh />
              </button>
              <button onClick={() => navigate("/")} className="hidden sm:inline px-5 py-2.5 border border-[var(--line)] text-[var(--ink)] rounded-full hover:bg-[var(--ink)] hover:text-[var(--card)] transition text-sm font-medium">
                Customer View
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          {loading && <LoadingState />}
          {error && <ErrorState msg={error} onRetry={() => setRefreshKey((k) => k + 1)} />}
          {!loading && !error && data && (
            <>
              {section === "overview" && <OverviewSection data={data} greeting={greeting} onNavigate={setSection} />}
              {section === "branches" && <BranchesSection data={data} />}
              {section === "chats" && <AllChatsSection refreshKey={refreshKey} />}
              {section === "orders" && <AllOrdersSection refreshKey={refreshKey} />}
              {section === "deliveries" && <AllDeliveriesSection refreshKey={refreshKey} />}
              {section === "settings" && <SettingsSection />}
            </>
          )}
          {/* Fallback: if no data and no error and not loading, show empty state */}
          {!loading && !error && !data && (
            <div className="bg-[var(--card)] rounded-3xl p-16 border border-[var(--line)] text-center">
              <p className="text-6xl mb-4">📊</p>
              <p className="font-serif italic text-[var(--muted)] mb-4">No data available yet</p>
              <button onClick={() => setRefreshKey((k) => k + 1)} className="px-5 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition">
                Reload
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getGreeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function sectionLabel(s: Section) {
  return { overview: "Overview", branches: "Branches", chats: "Messages", orders: "Kitchen", deliveries: "Dispatch", settings: "Settings" }[s];
}

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

// ============================================================
// Nav Item
// ============================================================
function AdminNavItem({ icon, label, badge, active, onClick }: { icon: React.ReactNode; label: string; badge?: number; active?: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left group ${active ? "bg-purple-600 text-white shadow-md shadow-purple-600/25" : "hover:bg-[var(--bg-soft)] text-[var(--ink)]"}`}>
      <span className="flex items-center gap-3">
        <span className={`transition ${active ? "text-white" : "text-[var(--muted)] group-hover:text-purple-600"}`}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center ${active ? "bg-white text-purple-600" : "bg-purple-600 text-white"}`}>{badge}</span>
      )}
    </button>
  );
}

// ============================================================
// Icons
// ============================================================
function IconGrid() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>); }
function IconBranches() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>); }
function IconChat() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>); }
function IconBag() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>); }
function IconTruck() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>); }
function IconSettings() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>); }
function IconRefresh() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>); }
function IconArrow() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>); }
function IconSearch() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>); }
function IconClose() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>); }
function IconPhone() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>); }
function IconPin() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>); }
function IconSun() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>); }
function IconMoon() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>); }

// ============================================================
// Loading / Error states
// ============================================================
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--muted)]">Loading dashboard...</p>
    </div>
  );
}

function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
      <p className="text-4xl mb-3">⚠️</p>
      <p className="font-serif italic text-red-700 dark:text-red-300 mb-4">{msg}</p>
      <button onClick={onRetry} className="px-5 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition">Try again</button>
    </div>
  );
}

// ============================================================
// Overview
// ============================================================
function OverviewSection({ data, greeting, onNavigate }: {
  data: import("../../hooks/useAdminData").AdminOverview;
  greeting: string;
  onNavigate: (s: Section) => void;
}) {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-neutral-900 text-white p-10 md:p-14">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] tracking-[0.25em] text-purple-300 font-semibold uppercase mb-4">Business Overview</p>
          <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-4">{greeting}, Boss.</h2>
          <p className="text-neutral-300 text-lg max-w-xl">Everything happening across all your branches, at a glance.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onNavigate("branches")} className="px-6 py-3 bg-white text-purple-800 rounded-full text-sm font-medium hover:bg-purple-50 transition flex items-center gap-2">
              Explore Branches <IconArrow />
            </button>
            <button onClick={() => onNavigate("chats")} className="px-6 py-3 border border-white/30 rounded-full text-sm font-medium hover:bg-white/10 transition">
              Monitor Chats
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-4">Live Totals</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Branches" value={data.totals.branches} accent="purple" onClick={() => onNavigate("branches")} />
          <KpiCard label="Orders" value={data.totals.orders} accent="orange" onClick={() => onNavigate("orders")} />
          <KpiCard label="Chats" value={data.totals.chats} accent="blue" onClick={() => onNavigate("chats")} />
          <KpiCard label="Deliveries" value={data.totals.deliveries} accent="green" onClick={() => onNavigate("deliveries")} />
        </div>
      </div>

      {/* Per-branch snapshot */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-1">Branches</p>
            <h3 className="text-2xl font-serif font-bold text-[var(--ink)]">Snapshot per branch</h3>
          </div>
          <button onClick={() => onNavigate("branches")} className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1">
            View all <IconArrow />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.branches.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent, onClick }: {
  label: string;
  value: number;
  accent: "purple" | "orange" | "blue" | "green";
  onClick: () => void;
}) {
  const accents = {
    purple: { bg: "from-purple-500/10 to-purple-500/0 group-hover:from-purple-500/20", dot: "bg-purple-600" },
    orange: { bg: "from-orange-500/10 to-orange-500/0 group-hover:from-orange-500/20", dot: "bg-orange-500" },
    blue:   { bg: "from-blue-500/10 to-blue-500/0 group-hover:from-blue-500/20", dot: "bg-blue-500" },
    green:  { bg: "from-green-500/10 to-green-500/0 group-hover:from-green-500/20", dot: "bg-green-500" },
  };
  const a = accents[accent];
  return (
    <button onClick={onClick} className="relative text-left bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)] hover:border-[var(--ink)] transition-all group overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${a.bg} transition-opacity`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-1.5 h-1.5 rounded-full ${a.dot} animate-pulse`} />
          <p className="text-[10px] tracking-[0.25em] font-semibold uppercase text-[var(--muted)]">{label}</p>
        </div>
        <p className="text-5xl font-serif font-bold tracking-tight text-[var(--ink)]">{value}</p>
      </div>
    </button>
  );
}

function BranchCard({ branch }: {
  branch: { id: string; name: string; chats: number; newChats: number; orders: number; deliveries: number; };
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/admin/branches/${branch.id}`)}
      className="text-left w-full bg-[var(--card)] rounded-3xl p-7 border border-[var(--line)] hover:border-purple-600 transition group"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-1">{branch.id}</p>
          <h4 className="font-serif font-bold text-2xl text-[var(--ink)]">{branch.name}</h4>
        </div>
        {branch.newChats > 0 && (
          <span className="text-[10px] tracking-widest uppercase font-bold bg-orange-500 text-white px-3 py-1 rounded-full animate-pulse">
            {branch.newChats} new
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--line)]">
        <MiniStat label="Chats" value={branch.chats} />
        <MiniStat label="Orders" value={branch.orders} />
        <MiniStat label="Deliveries" value={branch.deliveries} />
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">Click to manage branch</p>
        <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition">→</span>
      </div>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] text-[var(--muted)] font-semibold uppercase mb-1">{label}</p>
      <p className="text-2xl font-serif font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}

// ============================================================
// Branches Section
// ============================================================
function BranchesSection({ data }: { data: import("../../hooks/useAdminData").AdminOverview }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">Locations</p>
        <h2 className="text-4xl font-serif font-bold mb-2 text-[var(--ink)]">Your Branches</h2>
        <p className="text-[var(--muted)]">Full snapshot of every location.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.branches.map((b) => (
          <BranchCard key={b.id} branch={b} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// All Chats Section
// ============================================================
function AllChatsSection({ refreshKey }: { refreshKey: number }) {
  const { data: chats, loading, error } = useAdminChats(refreshKey);
  const { deleteChat } = useAdminActions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AdminChat | null>(null);
  const [localChats, setLocalChats] = useState<AdminChat[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Sync local copy so we can update instantly after delete
  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);

  const branches = useMemo(() => Array.from(new Set(localChats.map((c) => c.branchId))), [localChats]);

  const filtered = useMemo(() => {
    return localChats.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (branchFilter !== "all" && c.branchId !== branchFilter) return false;
      if (search && !(c.customerName || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [localChats, search, statusFilter, branchFilter]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleDelete(chat: AdminChat) {
    if (!confirm(`Delete chat with "${chat.customerName || "Anonymous"}"?\n\nThis will permanently remove ${chat.messages.length} messages. Cannot be undone.`)) return;
    try {
      await deleteChat(chat._id);
      setLocalChats((prev) => prev.filter((c) => c._id !== chat._id));
      showToast("🗑 Chat deleted");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={() => {}} />;

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">Communications</p>
        <h2 className="text-4xl font-serif font-bold mb-2 text-[var(--ink)]">All Chats</h2>
        <p className="text-[var(--muted)]">Every customer conversation across all branches. Hover to see delete button.</p>
      </div>

      <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"><IconSearch /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer..."
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] text-sm outline-none focus:border-purple-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">Active</option>
          <option value="closed">Closed</option>
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
          ))}
        </select>
        <span className="text-xs text-[var(--muted)] font-medium">{filtered.length} of {localChats.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
          <p className="text-6xl mb-4">💬</p>
          <p className="font-serif italic text-[var(--muted)]">No chats found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((chat) => (
            <ChatCard
              key={chat._id}
              chat={chat}
              onClick={() => setSelected(chat)}
              onDelete={(e) => {
                e.stopPropagation();
                handleDelete(chat);
              }}
            />
          ))}
        </div>
      )}

      {selected && <ChatDetailModal chat={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ChatCard({
  chat,
  onClick,
  onDelete,
}: {
  chat: AdminChat;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const lastMsg = chat.messages[chat.messages.length - 1];
  const statusColors = {
    new: "bg-orange-500 text-white",
    in_progress: "bg-green-500 text-white",
    closed: "bg-[var(--bg-soft)] text-[var(--muted)]",
  };
  const statusLabel = { new: "New", in_progress: "Active", closed: "Closed" }[chat.status];

  return (
    <div className="relative bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)] hover:border-purple-600 transition group">
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        title="Delete chat"
      >
        🗑
      </button>
      <button onClick={onClick} className="text-left w-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-serif font-bold flex-shrink-0">
              {(chat.customerName || "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-serif font-bold truncate text-[var(--ink)]">{chat.customerName || "Anonymous"}</p>
              <p className="text-[10px] tracking-[0.2em] text-purple-600 dark:text-purple-400 uppercase font-semibold">{chat.branchId}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[chat.status]} mr-8`}>{statusLabel}</span>
        </div>

        {lastMsg && (
          <div className="bg-[var(--bg-soft)] rounded-2xl p-3 mb-3">
            <p className="text-[10px] tracking-wider text-[var(--muted)] uppercase font-semibold mb-1">
              {lastMsg.from === "customer" ? "Customer" : "Staff"}
            </p>
            <p className="text-sm text-[var(--ink)] line-clamp-2">{lastMsg.text}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>{chat.messages.length} messages</span>
          <span>{timeAgo(chat.updatedAt)}</span>
        </div>
      </button>
    </div>
  );
}

function ChatDetailModal({ chat, onClose }: { chat: AdminChat; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center font-serif font-bold">
              {(chat.customerName || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-serif font-bold text-[var(--ink)]">{chat.customerName || "Anonymous"}</h3>
              <p className="text-[10px] tracking-widest text-purple-600 dark:text-purple-400 uppercase font-semibold">{chat.branchId} · {chat.status}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--muted)]">
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--bg-soft)] p-4 space-y-3">
          {chat.messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] rounded-2xl p-3 text-sm ${m.from === "customer" ? "ml-auto bg-purple-600 text-white" : "bg-[var(--card)] border border-[var(--line)] text-[var(--ink)]"}`}>
              <p>{m.text}</p>
              <p className={`text-[10px] mt-1 ${m.from === "customer" ? "text-purple-200" : "text-[var(--muted)]"}`}>{timeAgo(m.createdAt)}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--line)] bg-[var(--card)] text-center text-xs text-[var(--muted)]">
          View only — reply from branch reception dashboard
        </div>
      </div>
    </div>
  );
}

// ============================================================
// All Orders Section
// ============================================================
function AllOrdersSection({ refreshKey }: { refreshKey: number }) {
  const [showArchived, setShowArchived] = useState(false);
  const { data: orders, loading, error } = useAdminOrders(refreshKey, showArchived);
  const { archiveOrder, unarchiveOrder } = useAdminActions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [localOrders, setLocalOrders] = useState<AdminOrder[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const branches = useMemo(() => Array.from(new Set(localOrders.map((o) => o.branchId))), [localOrders]);

  const filtered = useMemo(() => {
    return localOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (branchFilter !== "all" && o.branchId !== branchFilter) return false;
      if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) &&
            !o.orderCode.toLowerCase().includes(q) &&
            !o.phone.includes(q)) return false;
      }
      return true;
    });
  }, [localOrders, search, statusFilter, branchFilter, paymentFilter]);

  const stats = useMemo(() => ({
    total: filtered.length,
    revenue: filtered.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
    awaitingPayment: filtered.filter((o) => o.status === "awaiting_payment").length,
  }), [filtered]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleArchive(order: AdminOrder) {
    try {
      await archiveOrder(order._id);
      setLocalOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, isArchived: true } : o)));
      if (!showArchived) {
        // Remove from view since we're not showing archived
        setLocalOrders((prev) => prev.filter((o) => o._id !== order._id));
      }
      showToast("📦 Order archived");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  async function handleUnarchive(order: AdminOrder) {
    try {
      await unarchiveOrder(order._id);
      setLocalOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, isArchived: false } : o)));
      showToast("↩️ Order restored");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={() => {}} />;

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">Kitchen</p>
          <h2 className="text-4xl font-serif font-bold mb-2 text-[var(--ink)]">All Orders</h2>
          <p className="text-[var(--muted)]">Every order across all branches. Delivered orders older than 7 days are auto-archived.</p>
        </div>
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            showArchived
              ? "bg-purple-600 text-white"
              : "bg-[var(--bg-soft)] text-[var(--ink)] hover:bg-[var(--line)]"
          }`}
        >
          {showArchived ? "📦 Showing Archived" : "📦 Show Archived"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Orders" value={stats.total.toString()} />
        <StatCard label="Revenue" value={fmtRWF(stats.revenue)} />
        <StatCard label="Awaiting Payment" value={stats.awaitingPayment.toString()} accent={stats.awaitingPayment > 0} />
      </div>

      <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"><IconSearch /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, code..."
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] text-sm outline-none focus:border-purple-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="all">All Statuses</option>
          <option value="awaiting_payment">Awaiting Payment</option>
          <option value="new">New</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Delivering</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="momo">MoMo</option>
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="all">All Branches</option>
          {branches.map((b) => (<option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
          <p className="text-6xl mb-4">📦</p>
          <p className="font-serif italic text-[var(--muted)]">No orders found</p>
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--line)] overflow-hidden">
          {filtered.map((o) => (
            <OrderRow
              key={o._id}
              order={o as any}
              onClick={() => setSelected(o)}
              onArchive={(e) => { e.stopPropagation(); handleArchive(o); }}
              onUnarchive={(e) => { e.stopPropagation(); handleUnarchive(o); }}
            />
          ))}
        </div>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 border ${accent ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800" : "bg-[var(--card)] border-[var(--line)]"}`}>
      <p className="text-[10px] tracking-[0.25em] font-semibold uppercase text-[var(--muted)] mb-2">{label}</p>
      <p className={`text-2xl md:text-3xl font-serif font-bold ${accent ? "text-yellow-700 dark:text-yellow-300" : "text-[var(--ink)]"}`}>{value}</p>
    </div>
  );
}
 
function OrderRow({
  order,
  onClick,
  onArchive,
  onUnarchive,
}: {
  order: AdminOrder & { isArchived?: boolean };
  onClick: () => void;
  onArchive: (e: React.MouseEvent) => void;
  onUnarchive: (e: React.MouseEvent) => void;
}) {
  const isPending = order.status === "awaiting_payment";
  const canArchive = order.status === "delivered" || order.status === "cancelled";

  return (
    <div className={`w-full flex items-center gap-4 p-5 border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition ${isPending ? "bg-yellow-50/40 dark:bg-yellow-950/20" : ""} ${order.isArchived ? "opacity-60" : ""}`}>
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{order.orderCode}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
          {order.paymentMethod === "momo" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">MoMo</span>
          )}
          {order.isArchived && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 uppercase">Archived</span>
          )}
        </div>
        <p className="mt-1 font-serif font-bold truncate text-[var(--ink)]">{order.customerName}</p>
        <p className="text-xs text-[var(--muted)]">
          {order.branchId} · {order.items.length} items · {timeAgo(order.createdAt)}
        </p>
      </button>
      <div className="text-right shrink-0">
        <p className="font-serif font-bold text-[var(--ink)]">{fmtRWF(order.total)}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{order.type}</p>
      </div>
      {canArchive && !order.isArchived && (
        <button
          onClick={onArchive}
          title="Archive order"
          className="w-9 h-9 rounded-full bg-[var(--bg-soft)] hover:bg-purple-100 dark:hover:bg-purple-950/40 text-[var(--muted)] hover:text-purple-600 flex items-center justify-center transition shrink-0"
        >
          📦
        </button>
      )}
      {order.isArchived && (
        <button
          onClick={onUnarchive}
          title="Restore from archive"
          className="w-9 h-9 rounded-full bg-[var(--bg-soft)] hover:bg-green-100 dark:hover:bg-green-950/40 text-[var(--muted)] hover:text-green-600 flex items-center justify-center transition shrink-0"
        >
          ↩️
        </button>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[var(--line)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{order.orderCode}</p>
              <h3 className="font-serif font-bold text-xl mt-1 text-[var(--ink)]">{order.customerName}</h3>
              <p className="text-[10px] tracking-widest uppercase text-[var(--muted)] mt-0.5">{order.branchId} · {timeAgo(order.createdAt)}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--muted)]">
              <IconClose />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--bg-soft)] text-[var(--ink)]">{order.type.toUpperCase()}</span>
            {order.paymentMethod && (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--bg-soft)] text-[var(--ink)]">
                {order.paymentMethod.toUpperCase()}{order.paymentStatus ? ` · ${order.paymentStatus}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-[var(--bg-soft)] rounded-2xl p-4 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <span className="text-[var(--muted)]"><IconPhone /></span>
              <a href={`tel:${order.phone}`} className="hover:text-purple-600">{order.phone}</a>
            </div>
            {order.address && (
              <div className="flex items-start gap-2 text-sm text-[var(--ink)]">
                <span className="text-[var(--muted)] mt-0.5 flex-shrink-0"><IconPin /></span>
                <span>{order.address}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] tracking-[0.25em] font-semibold uppercase text-[var(--muted)] mb-2">Items</p>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between items-center border border-[var(--line)] rounded-2xl p-3 text-sm">
                <div>
                  <p className="font-serif font-bold text-[var(--ink)]">{it.name}</p>
                  <p className="text-xs text-[var(--muted)]">{it.qty} × {fmtRWF(it.price)}</p>
                </div>
                <p className="font-serif font-bold text-[var(--ink)]">{fmtRWF(it.price * it.qty)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--line)] flex justify-between items-center">
            <span className="text-sm text-[var(--muted)] font-medium">Total</span>
            <span className="text-2xl font-serif font-bold text-[var(--ink)]">{fmtRWF(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// All Deliveries Section
// ============================================================
function AllDeliveriesSection({ refreshKey }: { refreshKey: number }) {
  const { data: orders, loading, error } = useAdminOrders(refreshKey);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const deliveries = useMemo(() => orders.filter((o) => o.type === "delivery"), [orders]);
  const branches = useMemo(() => Array.from(new Set(deliveries.map((o) => o.branchId))), [deliveries]);

  const filtered = useMemo(() => {
    return deliveries.filter((o) => {
      if (statusFilter === "active" && (o.status === "delivered" || o.status === "cancelled")) return false;
      if (statusFilter === "completed" && o.status !== "delivered") return false;
      if (branchFilter !== "all" && o.branchId !== branchFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) &&
            !o.orderCode.toLowerCase().includes(q) &&
            !o.phone.includes(q) &&
            !(o.address ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [deliveries, search, statusFilter, branchFilter]);

  const stats = useMemo(() => ({
    total: deliveries.length,
    active: deliveries.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
    inTransit: deliveries.filter((o) => o.status === "out_for_delivery").length,
    completed: deliveries.filter((o) => o.status === "delivered").length,
  }), [deliveries]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={() => {}} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">Dispatch</p>
        <h2 className="text-4xl font-serif font-bold mb-2 text-[var(--ink)]">All Deliveries</h2>
        <p className="text-[var(--muted)]">Track every delivery across all branches.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Active" value={stats.active.toString()} accent />
        <StatCard label="In Transit" value={stats.inTransit.toString()} />
        <StatCard label="Delivered" value={stats.completed.toString()} />
      </div>

      <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"><IconSearch /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, address, code..."
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] text-sm outline-none focus:border-purple-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="active">Active Only</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="h-11 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none">
          <option value="all">All Branches</option>
          {branches.map((b) => (<option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>))}
        </select>
        <span className="text-xs text-[var(--muted)] font-medium">{filtered.length} deliveries</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
          <p className="text-6xl mb-4">🛵</p>
          <p className="font-serif italic text-[var(--muted)]">No deliveries found</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <DeliveryCard key={o._id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

const DELIVERY_STEPS = [
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "En Route" },
  { key: "delivered", label: "Delivered" },
];

function DeliveryCard({ order }: { order: AdminOrder }) {
  const currentStep = DELIVERY_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  return (
    <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)] hover:border-purple-600 transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{order.orderCode}</p>
          <h4 className="font-serif font-bold text-lg mt-0.5 truncate text-[var(--ink)]">{order.customerName}</h4>
          <p className="text-[10px] tracking-widest uppercase text-[var(--muted)]">{order.branchId} · {timeAgo(order.createdAt)}</p>
        </div>
        <p className="font-serif font-bold shrink-0 text-[var(--ink)]">{fmtRWF(order.total)}</p>
      </div>

      {!isCancelled && (
        <div className="mb-4">
          <div className="flex gap-1 mb-2">
            {DELIVERY_STEPS.map((step, i) => (
              <div key={step.key} className={`h-1 flex-1 rounded-full ${i <= currentStep ? "bg-purple-600" : "bg-[var(--line)]"}`} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
            {DELIVERY_STEPS.map((step, i) => (
              <span key={step.key} className={i <= currentStep ? "text-purple-600 dark:text-purple-400" : "text-[var(--muted)]"}>{step.label}</span>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs font-bold text-center py-2 rounded-xl mb-4">
          CANCELLED
        </div>
      )}
      {isDelivered && (
        <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-xs font-bold text-center py-2 rounded-xl mb-4">
          ✓ DELIVERED
        </div>
      )}

      <div className="bg-[var(--bg-soft)] rounded-2xl p-3 space-y-2">
        <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-sm hover:text-purple-600 text-[var(--ink)]">
          <span className="text-[var(--muted)]"><IconPhone /></span>
          {order.phone}
        </a>
        {order.address && (
          <div className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <span className="text-[var(--muted)] mt-0.5 flex-shrink-0"><IconPin /></span>
            <span className="line-clamp-2">{order.address}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <a href={`tel:${order.phone}`} className="flex-1 text-center py-2 rounded-full bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition">Call</a>
        <a href={`https://wa.me/${order.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 rounded-full border border-[var(--line)] text-xs font-medium hover:bg-[var(--bg-soft)] text-[var(--ink)] transition">WhatsApp</a>
      </div>
    </div>
  );
}

// ============================================================
// Settings
// ============================================================
function SettingCard({ title, desc, onClick }: { title: string; desc: string; onClick?: () => void; }) {
  return (
    <button onClick={onClick} className="w-full text-left p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:shadow-md transition">
      <p className="text-sm font-semibold text-[var(--ink)] mb-1">{title}</p>
      <p className="text-[13px] text-[var(--muted)]">{desc}</p>
    </button>
  );
}

function SettingsSection() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">System</p>
        <h2 className="text-4xl font-serif font-bold mb-2 text-[var(--ink)]">Settings</h2>
        <p className="text-[var(--muted)]">Configure your business.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SettingCard
          title="Branches"
          desc="Add, edit, or remove branch locations."
          onClick={() => navigate("/admin/settings/branches")}
        />
        <SettingCard
          title="Staff Access"
          desc="Manage receptionist accounts and passcodes."
          onClick={() => navigate("/admin/settings/staff")}
        />
        <SettingCard
          title="Business Hours"
          desc="Set opening times per branch."
          onClick={() => navigate("/admin/settings/hours")}
        />
        <SettingCard
          title="Notifications"
          desc="Configure alerts and email preferences."
          onClick={() => navigate("/admin/settings/notifications")}
        />
      </div>
    </div>
  );
}