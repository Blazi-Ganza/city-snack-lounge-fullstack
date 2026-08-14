import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Lightbulb,
  Lock,
  RotateCcw,
  Save,
} from "lucide-react";
import { usePortalAuth } from "../../context/PortalAuthContext";
import {
  useBranches,
  type Branch,
  type BranchHours,
  type DayKey,
  DAY_KEYS,
  DAY_LABELS,
  DEFAULT_HOURS,
} from "../../hooks/useBranches";

function to12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function SettingsHoursPage() {
  const navigate = useNavigate();
  const { session } = usePortalAuth();
  const { items, loading, error, updateHours } = useBranches();
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [session, navigate]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-sm text-[var(--muted)] hover:text-purple-600 mb-4 flex items-center gap-1.5"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to Dashboard
          </button>

          <div>
            <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">
              Settings · Business Hours
            </p>
            <h1 className="text-4xl font-serif font-bold text-[var(--ink)] flex items-center gap-3">
              <Clock size={32} strokeWidth={2} className="text-purple-600" />
              Business Hours
            </h1>
            <p className="text-[var(--muted)] mt-2">
              Set opening and closing times for each branch. All times are in 24-hour format.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6 relative">
        {toast && (
          <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
            {toast}
          </div>
        )}

        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Lightbulb size={18} strokeWidth={2} className="text-purple-600 dark:text-purple-300 mt-0.5 shrink-0" />
          <p className="text-xs text-purple-700 dark:text-purple-300">
            For late-night hours like closing at 2:00 AM, enter the closing time as{" "}
            <code className="px-1 rounded bg-purple-100 dark:bg-purple-900/50">02:00</code>.
            The system understands this means the next morning.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-red-600" strokeWidth={2} />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
            <Building2
              size={48}
              className="mx-auto mb-4 text-[var(--muted)] opacity-40"
              strokeWidth={1.5}
            />
            <p className="font-serif italic text-[var(--muted)]">No branches yet</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((branch) => (
              <BranchHoursCard
                key={branch.id}
                branch={branch}
                expanded={expandedId === branch.id}
                onToggle={() =>
                  setExpandedId(expandedId === branch.id ? null : branch.id)
                }
                onSave={async (hours) => {
                  try {
                    await updateHours(branch.id, hours);
                    showToast("Hours saved for " + branch.name);
                  } catch (err: any) {
                    showToast(err.message);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Branch Card with Editor ─── */
function BranchHoursCard({
  branch,
  expanded,
  onToggle,
  onSave,
}: {
  branch: Branch;
  expanded: boolean;
  onToggle: () => void;
  onSave: (hours: BranchHours) => Promise<void>;
}) {
  const initialHours = branch.hours ?? DEFAULT_HOURS;
  const [hours, setHours] = useState<BranchHours>(initialHours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHours(branch.hours ?? DEFAULT_HOURS);
  }, [branch.hours]);

  const hasChanges = useMemo(
    () => JSON.stringify(hours) !== JSON.stringify(branch.hours ?? DEFAULT_HOURS),
    [hours, branch.hours]
  );

  function updateDay(
    day: DayKey,
    patch: Partial<{ closed: boolean; open: string; close: string }>
  ) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  }

  function copyMondayToWeekdays() {
    const monday = hours.monday;
    setHours((prev) => ({
      ...prev,
      tuesday: { ...monday },
      wednesday: { ...monday },
      thursday: { ...monday },
      friday: { ...monday },
    }));
  }

  function copyMondayToAllDays() {
    const monday = hours.monday;
    setHours((prev) => {
      const next: BranchHours = { ...prev };
      DAY_KEYS.forEach((d) => {
        next[d] = { ...monday };
      });
      return next;
    });
  }

  function resetToDefaults() {
    setHours(DEFAULT_HOURS);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(hours);
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(() => {
    const openDays = DAY_KEYS.filter((d) => !hours[d].closed).length;
    return `${openDays} of 7 days open`;
  }, [hours]);

  return (
    <div
      className={`bg-[var(--card)] rounded-3xl border transition ${
        branch.isActive ? "border-[var(--line)]" : "border-[var(--line)] opacity-70"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-soft)] transition rounded-t-3xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Building2 size={20} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)] truncate">
                {branch.name}
              </h3>
              {!branch.isActive && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 uppercase">
                  <Lock size={10} strokeWidth={2.5} />
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)]">{summary}</p>
          </div>
        </div>

        <ChevronRight
          size={18}
          strokeWidth={2}
          className={`text-[var(--muted)] transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Editor */}
      {expanded && (
        <div className="p-5 border-t border-[var(--line)] space-y-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyMondayToWeekdays}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 transition"
            >
              <Copy size={13} strokeWidth={2} />
              Copy Monday → Tue–Fri
            </button>
            <button
              onClick={copyMondayToAllDays}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 transition"
            >
              <Copy size={13} strokeWidth={2} />
              Copy Monday → All Days
            </button>
            <button
              onClick={resetToDefaults}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[var(--bg-soft)] text-[var(--muted)] hover:bg-[var(--line)] transition"
            >
              <RotateCcw size={13} strokeWidth={2} />
              Reset to Defaults
            </button>
          </div>

          {/* Day rows */}
          <div className="space-y-2">
            {DAY_KEYS.map((day) => (
              <DayRow
                key={day}
                day={day}
                value={hours[day]}
                onChange={(patch) => updateDay(day, patch)}
              />
            ))}
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
            <div
              className={`flex items-center gap-1.5 text-xs ${
                hasChanges ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {hasChanges ? (
                <AlertTriangle size={14} strokeWidth={2} />
              ) : (
                <CheckCircle2 size={14} strokeWidth={2} />
              )}
              <span>{hasChanges ? "Unsaved changes" : "All saved"}</span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition font-medium text-sm disabled:opacity-50"
            >
              <Save size={15} strokeWidth={2} />
              {saving ? "Saving..." : "Save Hours"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Single Day Row ─── */
function DayRow({
  day,
  value,
  onChange,
}: {
  day: DayKey;
  value: { closed: boolean; open: string; close: string };
  onChange: (patch: Partial<{ closed: boolean; open: string; close: string }>) => void;
}) {
  const label = DAY_LABELS[day];

  return (
    <div
      className={`p-3 rounded-2xl border transition ${
        value.closed
          ? "border-[var(--line)] bg-[var(--bg-soft)]"
          : "border-[var(--line)] bg-[var(--card)]"
      }`}
    >
      {/* Row 1: Day name + Closed toggle */}
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-0 sm:justify-start">
        <span className="font-medium text-sm text-[var(--ink)] sm:w-28">{label}</span>

        <label className="flex items-center gap-2 cursor-pointer sm:w-24">
          <input
            type="checkbox"
            checked={value.closed}
            onChange={(e) => onChange({ closed: e.target.checked })}
            className="w-4 h-4 accent-purple-600"
          />
          <span className="text-xs text-[var(--muted)]">Closed</span>
        </label>

        {/* Times inline on desktop */}
        {!value.closed && (
          <div className="hidden sm:flex items-center gap-2 text-sm flex-1">
            <input
              type="time"
              value={value.open}
              onChange={(e) => onChange({ open: e.target.value })}
              className="h-9 px-2 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 font-mono text-sm"
            />
            <span className="text-[var(--muted)] text-xs">to</span>
            <input
              type="time"
              value={value.close}
              onChange={(e) => onChange({ close: e.target.value })}
              className="h-9 px-2 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 font-mono text-sm"
            />
            <span className="text-xs text-[var(--muted)] ml-2 hidden lg:inline">
              {to12h(value.open)} – {to12h(value.close)}
            </span>
          </div>
        )}

        {value.closed && (
          <span className="hidden sm:inline text-sm text-[var(--muted)] italic flex-1">
            — closed all day —
          </span>
        )}
      </div>

      {/* Row 2: Times stack on mobile */}
      {!value.closed && (
        <div className="sm:hidden flex items-center gap-2 text-sm mt-2 pt-2 border-t border-[var(--line)]">
          <input
            type="time"
            value={value.open}
            onChange={(e) => onChange({ open: e.target.value })}
            className="h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 font-mono flex-1"
          />
          <span className="text-[var(--muted)] text-xs">to</span>
          <input
            type="time"
            value={value.close}
            onChange={(e) => onChange({ close: e.target.value })}
            className="h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 font-mono flex-1"
          />
        </div>
      )}

      {value.closed && (
        <p className="sm:hidden text-xs text-[var(--muted)] italic mt-2 text-center">
          — closed all day —
        </p>
      )}
    </div>
  );
}