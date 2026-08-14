import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Users,
  Shield,
  Headphones,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  KeyRound,
  Mail,
  MapPin,
  Clock,
  X,
  Check,
  Copy,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { usePortalAuth } from "../../context/PortalAuthContext";
import { useStaff, type Staff, type StaffRole } from "../../hooks/useStaff";
import { useBranches } from "../../hooks/useBranches";

export function SettingsStaffPage() {
  const navigate = useNavigate();
  const { session } = usePortalAuth();
  const { items, loading, error, create, update, resetPasscode, remove } = useStaff();
  const { items: branches } = useBranches();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [passcodeReveal, setPasscodeReveal] = useState<{ name: string; passcode: string } | null>(
    null
  );

  useEffect(() => {
    if (!session || session.role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [session, navigate]);

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.email ?? "").toLowerCase().includes(q) &&
          !(s.branchId ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, roleFilter, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      admins: items.filter((s) => s.role === "admin").length,
      receptionists: items.filter((s) => s.role === "receptionist").length,
      inactive: items.filter((s) => !s.isActive).length,
    }),
    [items]
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave(data: {
    name: string;
    role: StaffRole;
    branchId?: string;
    email?: string;
    passcode?: string;
  }) {
    try {
      if (editing) {
        await update(editing._id, {
          name: data.name,
          email: data.email,
          branchId: data.branchId,
        });
        showToast("Staff updated");
        setShowForm(false);
        setEditing(null);
      } else {
        const result = await create(data);
        setShowForm(false);
        setEditing(null);
        setPasscodeReveal({ name: result.staff.name, passcode: result.passcode });
      }
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleToggle(staff: Staff) {
    try {
      await update(staff._id, { isActive: !staff.isActive });
      showToast(staff.isActive ? "Deactivated" : "Activated");
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleReset(staff: Staff) {
    if (
      !confirm(
        `Generate a new passcode for "${staff.name}"?\n\nThe old passcode will stop working immediately.`
      )
    )
      return;
    try {
      const result = await resetPasscode(staff._id);
      setPasscodeReveal({ name: result.staff.name, passcode: result.passcode });
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleDelete(staff: Staff) {
    if (
      !confirm(
        `Permanently delete "${staff.name}"?\n\nThey won't be able to log in ever again. This cannot be undone.`
      )
    )
      return;
    try {
      await remove(staff._id);
      showToast("Staff deleted");
    } catch (err: any) {
      showToast(err.message);
    }
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

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">
                Settings · Staff Access
              </p>
              <h1 className="text-4xl font-serif font-bold text-[var(--ink)] flex items-center gap-3">
                <Users size={32} strokeWidth={2} className="text-purple-600" />
                Manage Staff
              </h1>
              <p className="text-[var(--muted)] mt-2">
                {stats.total} total • {stats.admins} admins • {stats.receptionists} receptionists
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="px-5 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-md shadow-purple-600/25"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Staff
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6 relative">
        {toast && (
          <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatChip label="Total" value={stats.total} color="purple" />
          <StatChip label="Admins" value={stats.admins} color="orange" />
          <StatChip label="Receptionists" value={stats.receptionists} color="green" />
          <StatChip label="Inactive" value={stats.inactive} color="gray" />
        </div>

        <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or branch..."
            className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="text-sm text-[var(--muted)] ml-auto self-center">
              Showing {filtered.length} of {items.length}
            </span>
          </div>
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

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
            <Users size={48} className="mx-auto mb-4 text-[var(--muted)] opacity-40" strokeWidth={1.5} />
            <p className="font-serif italic text-[var(--muted)] mb-4">
              {items.length === 0
                ? "No staff yet. Add your first one!"
                : "No staff match your filters"}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <StaffCard
                key={s._id}
                staff={s}
                isSelf={session.staffId === s._id}
                onEdit={() => {
                  setEditing(s);
                  setShowForm(true);
                }}
                onToggle={() => handleToggle(s)}
                onReset={() => handleReset(s)}
                onDelete={() => handleDelete(s)}
              />
            ))}
          </div>
        )}

        {showForm && (
          <StaffFormModal
            item={editing}
            branches={branches.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name }))}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}

        {passcodeReveal && (
          <PasscodeRevealModal
            name={passcodeReveal.name}
            passcode={passcodeReveal.passcode}
            onClose={() => setPasscodeReveal(null)}
          />
        )}
      </main>
    </div>
  );
}

/* ─── Chips ─── */
function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "purple" | "orange" | "green" | "gray";
}) {
  const colors = {
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
    green: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
    gray: "bg-[var(--bg-soft)] text-[var(--muted)]",
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-4`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-serif font-bold">{value}</p>
    </div>
  );
}

/* ─── Card ─── */
function StaffCard({
  staff,
  isSelf,
  onEdit,
  onToggle,
  onReset,
  onDelete,
}: {
  staff: Staff;
  isSelf: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const roleConfig = {
    admin: {
      color: "bg-orange-500 text-white",
      icon: Crown,
      label: "Admin",
    },
    receptionist: {
      color: "bg-blue-500 text-white",
      icon: Headphones,
      label: "Receptionist",
    },
  };
  const RoleIcon = roleConfig[staff.role].icon;

  return (
    <div
      className={`bg-[var(--card)] rounded-3xl border overflow-hidden transition ${
        staff.isActive ? "border-[var(--line)] hover:border-purple-600" : "border-[var(--line)] opacity-70"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-serif font-bold text-lg flex-shrink-0">
            {staff.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${roleConfig[staff.role].color}`}>
                <RoleIcon size={10} strokeWidth={2.5} />
                {roleConfig[staff.role].label}
              </span>
              {!staff.isActive && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 uppercase">
                  <Lock size={10} strokeWidth={2.5} />
                  Inactive
                </span>
              )}
              {isSelf && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white uppercase">
                  You
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-lg text-[var(--ink)] truncate">
              {staff.name}
            </h3>
            {staff.branchId && (
              <p className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-1">
                <MapPin size={11} strokeWidth={2} />
                {staff.branchId}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 mb-4 text-xs text-[var(--muted)]">
          {staff.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} strokeWidth={2} />
              <span className="truncate">{staff.email}</span>
            </div>
          )}
          {staff.lastLoginAt ? (
            <div className="flex items-center gap-2">
              <Clock size={12} strokeWidth={2} />
              <span>Last login: {new Date(staff.lastLoginAt).toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 italic">
              <Clock size={12} strokeWidth={2} />
              <span>Never logged in</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 py-2 rounded-full text-xs bg-purple-600 text-white hover:bg-purple-700 transition font-medium"
          >
            <KeyRound size={13} strokeWidth={2} />
            Reset Passcode
          </button>
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 py-2 rounded-full text-xs bg-[var(--bg-soft)] text-[var(--ink)] hover:bg-[var(--line)] transition font-medium"
          >
            <Pencil size={13} strokeWidth={2} />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggle}
            disabled={isSelf}
            title={isSelf ? "You cannot deactivate yourself" : ""}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              staff.isActive
                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-300"
                : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300"
            }`}
          >
            {staff.isActive ? (
              <>
                <Lock size={13} strokeWidth={2} />
                Deactivate
              </>
            ) : (
              <>
                <Unlock size={13} strokeWidth={2} />
                Activate
              </>
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={isSelf}
            title={isSelf ? "You cannot delete yourself" : ""}
            className="flex items-center justify-center gap-1.5 py-2 rounded-full text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Form Modal ─── */
function StaffFormModal({
  item,
  branches,
  onSave,
  onClose,
}: {
  item: Staff | null;
  branches: { id: string; name: string }[];
  onSave: (data: {
    name: string;
    role: StaffRole;
    branchId?: string;
    email?: string;
    passcode?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [role, setRole] = useState<StaffRole>(item?.role ?? "receptionist");
  const [branchId, setBranchId] = useState(item?.branchId ?? branches[0]?.id ?? "");
  const [email, setEmail] = useState(item?.email ?? "");
  const [customPasscode, setCustomPasscode] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        role,
        branchId: role === "receptionist" ? branchId : undefined,
        email: email.trim() || undefined,
        passcode: useCustom && customPasscode ? customPasscode : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--line)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h3 className="font-serif font-bold text-xl text-[var(--ink)] flex items-center gap-2">
            {item ? (
              <>
                <Pencil size={20} strokeWidth={2} className="text-purple-600" />
                Edit Staff
              </>
            ) : (
              <>
                <Plus size={20} strokeWidth={2.5} className="text-purple-600" />
                New Staff Member
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--muted)]"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Full Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              disabled={!!item}
              title={item ? "Role cannot be changed after creation" : ""}
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 disabled:opacity-60"
            >
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
            {item && (
              <p className="text-[10px] text-[var(--muted)] mt-1.5">
                Role cannot be changed after creation
              </p>
            )}
          </div>

          {role === "receptionist" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Assigned Branch *
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              >
                {branches.length === 0 && <option value="">No active branches</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="john@citysnack.rw"
            />
          </div>

          {!item && (
            <div className="border border-[var(--line)] rounded-2xl p-4 space-y-3 bg-[var(--bg-soft)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm font-medium text-[var(--ink)]">
                  Set custom passcode
                </span>
              </label>

              {useCustom ? (
                <div>
                  <input
                    type="text"
                    value={customPasscode}
                    onChange={(e) => setCustomPasscode(e.target.value)}
                    minLength={4}
                    className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-none focus:border-purple-500 font-mono"
                    placeholder="Minimum 4 characters"
                  />
                  <p className="text-[10px] text-[var(--muted)] mt-1.5">
                    Use letters, numbers, or symbols. At least 4 characters.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] italic">
                  A random 6-digit passcode will be generated and shown once after creation.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg-soft)] transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || (useCustom && customPasscode.length < 4)}
              className="flex-1 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Update Staff" : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Passcode Reveal Modal ─── */
function PasscodeRevealModal({
  name,
  passcode,
  onClose,
}: {
  name: string;
  passcode: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(passcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please copy manually: " + passcode);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[var(--card)] rounded-3xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={22} strokeWidth={2} className="text-purple-600" />
            <h3 className="font-serif font-bold text-xl text-[var(--ink)]">Passcode Generated</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">
            For <strong>{name}</strong>
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-800 rounded-2xl p-6 text-center">
            <p className="text-[10px] tracking-[0.3em] text-purple-600 dark:text-purple-400 font-bold uppercase mb-2">
              Passcode
            </p>
            <p className="text-4xl font-mono font-bold text-[var(--ink)] tracking-widest select-all">
              {passcode}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium transition ${
              copied
                ? "bg-green-600 text-white"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2} />
                Copy to Clipboard
              </>
            )}
          </button>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-3 flex items-start gap-2">
            <AlertTriangle size={16} strokeWidth={2} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">
              <strong>This is the only time this passcode will be shown.</strong> Copy it now and
              share it securely with {name}. If lost, you'll need to reset it.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg-soft)] transition font-medium"
          >
            I've Saved It — Close
          </button>
        </div>
      </div>
    </div>
  );
}