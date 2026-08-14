import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  UtensilsCrossed,
  PartyPopper,
  Tag,
  TrendingUp,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { usePortalAuth } from "../../context/PortalAuthContext";
import { useAdminOverview } from "../../hooks/useAdminData";
import { MenuManagementTab } from "./MenuManagementTab";
import { EventsManagementTab } from "./EventsManagementTab";
import { PromosManagementTab } from "./PromosManagementTab";
import { BranchAnalyticsTab } from "./BranchAnalyticsTab";

type Tab = "overview" | "menu" | "events" | "promos" | "analytics";

const BRANCH_NAMES: Record<string, string> = {
  huye: "Huye Branch",
  musanze: "Musanze Branch",
};

const BRANCH_SUBTITLES: Record<string, string> = {
  huye: "Fast pickup and mountain-view dining",
  musanze: "Late-night lounge and quick table service",
};

export function BranchDetailPage() {
  const navigate = useNavigate();
  const { branchId = "" } = useParams<{ branchId: string }>();
  const { session } = usePortalAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const { data, loading } = useAdminOverview(0);

  // Auth guard
  useEffect(() => {
    if (!session || session.role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [session, navigate]);

  const branch = data?.branches.find((b) => b.id === branchId);
  const branchName = BRANCH_NAMES[branchId] ?? branchId;
  const branchSubtitle = BRANCH_SUBTITLES[branchId] ?? "";

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] text-[var(--ink)]">
      {/* HEADER */}
      <header className="border-b border-[var(--line)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-sm text-[var(--muted)] hover:text-purple-600 mb-4 flex items-center gap-1.5"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">
                Branch
              </p>
              <h1 className="text-4xl font-serif font-bold text-[var(--ink)] flex items-center gap-3">
                <Building2 size={32} strokeWidth={2} className="text-purple-600" />
                {branchName}
              </h1>
              <p className="text-[var(--muted)] mt-2">{branchSubtitle}</p>
            </div>

            <div className="flex items-center gap-2 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-2 bg-purple-50 dark:bg-purple-950/30">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-[10px] tracking-[0.2em] text-purple-700 dark:text-purple-300 uppercase font-semibold">
                Managing Branch
              </span>
            </div>
          </div>

          {/* TABS */}
          <div className="mt-8 flex gap-1 border-b border-[var(--line)] overflow-x-auto">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutDashboard} label="Overview" />
            <TabButton active={tab === "menu"} onClick={() => setTab("menu")} icon={UtensilsCrossed} label="Menu" />
            <TabButton active={tab === "events"} onClick={() => setTab("events")} icon={PartyPopper} label="Events" />
            <TabButton active={tab === "promos"} onClick={() => setTab("promos")} icon={Tag} label="Promos" />
            <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={TrendingUp} label="Analytics" />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        {loading && <LoadingState />}

        {!loading && tab === "overview" && (
          <BranchOverviewTab branch={branch} branchId={branchId} setTab={setTab} />
        )}

        {!loading && tab === "menu" && <MenuManagementTab branchId={branchId} />}
        {!loading && tab === "events" && <EventsManagementTab branchId={branchId} />}
        {!loading && tab === "promos" && <PromosManagementTab branchId={branchId} />}
        {!loading && tab === "analytics" && <BranchAnalyticsTab branchId={branchId} />}
      </main>
    </div>
  );
}

/* ─── Tab Button ─── */
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 border-b-2 transition font-medium text-sm whitespace-nowrap ${
        active
          ? "border-purple-600 text-purple-600 dark:text-purple-400"
          : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

/* ─── Loading ─── */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/* ─── Overview Tab ─── */
function BranchOverviewTab({
  branch,
  branchId,
  setTab,
}: {
  branch?: any;
  branchId: string;
  setTab: (t: Tab) => void;
}) {
  if (!branch) {
    return (
      <div className="bg-[var(--card)] rounded-3xl p-16 border border-[var(--line)] text-center">
        <Building2
          size={48}
          className="mx-auto mb-4 text-[var(--muted)] opacity-40"
          strokeWidth={1.5}
        />
        <p className="font-serif italic text-[var(--muted)]">
          Branch data not available yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-4">
          Live Stats
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Chats" value={branch.chats} sub={`${branch.newChats} new`} />
          <StatBox label="Active Orders" value={branch.orders} sub={`${branch.awaitingPayment} awaiting pay`} />
          <StatBox label="Deliveries" value={branch.deliveries} sub="out for delivery" />
          <StatBox label="Today's Revenue" value={`${branch.revenueToday.toLocaleString()} RWF`} sub={`${branch.ordersToday} orders`} isText />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-4">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            icon={UtensilsCrossed}
            title="Manage Menu"
            desc="Add or edit menu items"
            onClick={() => setTab("menu")}
          />
          <ActionCard
            icon={PartyPopper}
            title="Create Event"
            desc="Schedule an upcoming event"
            onClick={() => setTab("events")}
          />
          <ActionCard
            icon={Tag}
            title="New Promo"
            desc="Launch a discount campaign"
            onClick={() => setTab("promos")}
          />
        </div>
      </div>

      {/* Branch Info */}
      <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)]">
        <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-3">
          Branch Info
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Branch ID" value={branchId} />
          <InfoRow label="Status" value="Active" showStatusDot />
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  isText,
}: {
  label: string;
  value: number | string;
  sub: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--line)]">
      <p className="text-[10px] tracking-[0.25em] font-semibold uppercase text-[var(--muted)] mb-2">{label}</p>
      <p className={`font-serif font-bold text-[var(--ink)] ${isText ? "text-xl" : "text-4xl"}`}>{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--line)] hover:border-purple-600 text-left transition group"
    >
      <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3 group-hover:bg-purple-100 dark:group-hover:bg-purple-950/60 transition">
        <Icon size={22} strokeWidth={2} />
      </div>
      <p className="font-serif font-bold text-[var(--ink)] mb-1">{title}</p>
      <p className="text-sm text-[var(--muted)]">{desc}</p>
    </button>
  );
}

function InfoRow({
  label,
  value,
  showStatusDot,
}: {
  label: string;
  value: string;
  showStatusDot?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-wider uppercase text-[var(--muted)] mb-1">{label}</p>
      <p className="font-medium text-[var(--ink)] flex items-center gap-1.5">
        {showStatusDot && (
          <CircleDot size={14} strokeWidth={2} className="text-emerald-500" />
        )}
        {value}
      </p>
    </div>
  );
}