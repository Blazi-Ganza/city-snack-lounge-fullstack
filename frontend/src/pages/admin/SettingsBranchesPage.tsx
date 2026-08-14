import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Building2,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Building,
  X,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import { usePortalAuth } from "../../context/PortalAuthContext";
import { useBranches, type Branch } from "../../hooks/useBranches";

export function SettingsBranchesPage() {
  const navigate = useNavigate();
  const { session } = usePortalAuth();
  const { items, loading, error, create, update, toggleActive, remove, getUsage } =
    useBranches();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [session, navigate]);

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (statusFilter === "active" && !b.isActive) return false;
      if (statusFilter === "inactive" && b.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !b.name.toLowerCase().includes(q) &&
          !b.id.toLowerCase().includes(q) &&
          !(b.city ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((b) => b.isActive).length,
      inactive: items.filter((b) => !b.isActive).length,
    }),
    [items]
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave(data: Partial<Branch>) {
    try {
      if (editing) {
        await update(editing.id, data);
        showToast("Branch updated");
      } else {
        await create(data);
        showToast("Branch created");
      }
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleToggle(branch: Branch) {
    try {
      await toggleActive(branch.id);
      showToast(branch.isActive ? "Deactivated" : "Activated");
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleDelete(branch: Branch) {
    try {
      const usage = await getUsage(branch.id);
      if (usage.total > 0) {
        alert(
          `Cannot delete "${branch.name}" — it has data:\n\n` +
            `• ${usage.orders} orders\n` +
            `• ${usage.menu} menu items\n` +
            `• ${usage.events} events\n` +
            `• ${usage.promos} promos\n` +
            `• ${usage.chats} chats\n\n` +
            `Deactivate the branch instead to hide it from customers.`
        );
        return;
      }
      if (
        !confirm(
          `Permanently delete "${branch.name}"?\n\nThis branch has no data and can be safely deleted. This cannot be undone.`
        )
      )
        return;
      await remove(branch.id);
      showToast("Branch deleted");
    } catch (err: any) {
      showToast(err.message);
    }
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] text-[var(--ink)]">
      {/* Header */}
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
                Settings · Branches
              </p>
              <h1 className="text-4xl font-serif font-bold text-[var(--ink)] flex items-center gap-3">
                <Building2 size={32} strokeWidth={2} className="text-purple-600" />
                Manage Branches
              </h1>
              <p className="text-[var(--muted)] mt-2">
                {stats.total} total • {stats.active} active • {stats.inactive} inactive
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
              Add Branch
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatChip label="Total" value={stats.total} color="purple" />
          <StatChip label="Active" value={stats.active} color="green" />
          <StatChip label="Inactive" value={stats.inactive} color="gray" />
        </div>

        {/* Filters */}
        <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branches by name, id, or city..."
            className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
          />
          <div className="flex flex-wrap gap-2">
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

        {/* Loading / Error / Empty */}
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
            <Building2 size={48} className="mx-auto mb-4 text-[var(--muted)] opacity-40" strokeWidth={1.5} />
            <p className="font-serif italic text-[var(--muted)] mb-4">
              {items.length === 0
                ? "No branches yet. Add your first one!"
                : "No branches match your filters"}
            </p>
          </div>
        )}

        {/* Branch grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((b) => (
              <BranchCard
                key={b.id}
                branch={b}
                onEdit={() => {
                  setEditing(b);
                  setShowForm(true);
                }}
                onToggle={() => handleToggle(b)}
                onDelete={() => handleDelete(b)}
                onOpen={() => navigate(`/admin/branches/${b.id}`)}
              />
            ))}
          </div>
        )}

        {showForm && (
          <BranchFormModal
            item={editing}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
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
  color: "purple" | "green" | "gray";
}) {
  const colors = {
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
    green: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
    gray: "bg-[var(--bg-soft)] text-[var(--muted)]",
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-4`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">
        {label}
      </p>
      <p className="text-2xl font-serif font-bold">{value}</p>
    </div>
  );
}

/* ─── Card ─── */
function BranchCard({
  branch,
  onEdit,
  onToggle,
  onDelete,
  onOpen,
}: {
  branch: Branch;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={`bg-[var(--card)] rounded-3xl border overflow-hidden transition ${
        branch.isActive
          ? "border-[var(--line)] hover:border-purple-600"
          : "border-[var(--line)] opacity-70"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase">
                {branch.id}
              </p>
              {!branch.isActive && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 uppercase">
                  <Lock size={10} strokeWidth={2.5} />
                  Inactive
                </span>
              )}
              {branch.isActive && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white uppercase">
                  <CircleDot size={10} strokeWidth={2.5} />
                  Live
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-xl text-[var(--ink)] truncate flex items-center gap-2">
              <Building2 size={20} strokeWidth={2} className="text-purple-600 shrink-0" />
              {branch.name}
            </h3>
            {branch.subtitle && (
              <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                {branch.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 mb-4 text-xs">
          {branch.city && (
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Building size={12} strokeWidth={2} />
              <span>{branch.city}</span>
            </div>
          )}
          {branch.address && (
            <div className="flex items-start gap-2 text-[var(--muted)]">
              <MapPin size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Phone size={12} strokeWidth={2} />
              <a
                href={`tel:${branch.phone}`}
                className="hover:text-purple-600 transition"
              >
                {branch.phone}
              </a>
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Mail size={12} strokeWidth={2} />
              <a
                href={`mailto:${branch.email}`}
                className="hover:text-purple-600 transition truncate"
              >
                {branch.email}
              </a>
            </div>
          )}
          {!branch.city && !branch.address && !branch.phone && !branch.email && (
            <p className="text-[var(--muted)] italic text-[11px]">
              No contact info added yet
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={onOpen}
            className="flex items-center justify-center gap-1.5 py-2 rounded-full text-xs bg-purple-600 text-white hover:bg-purple-700 transition font-medium"
          >
            <ExternalLink size={13} strokeWidth={2} />
            Open
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
            className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition ${
              branch.isActive
                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-300"
                : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300"
            }`}
          >
            {branch.isActive ? (
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
            className="flex items-center justify-center gap-1.5 py-2 rounded-full text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 transition font-medium"
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
function BranchFormModal({
  item,
  onSave,
  onClose,
}: {
  item: Branch | null;
  onSave: (data: Partial<Branch>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [address, setAddress] = useState(item?.address ?? "");
  const [phone, setPhone] = useState(item?.phone ?? "");
  const [email, setEmail] = useState(item?.email ?? "");
  const [city, setCity] = useState(item?.city ?? "");
  const [saving, setSaving] = useState(false);

  const previewSlug = useMemo(() => {
    if (item) return item.id;
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "branch"
    );
  }, [name, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        subtitle: subtitle.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
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
                Edit Branch
              </>
            ) : (
              <>
                <Plus size={20} strokeWidth={2.5} className="text-purple-600" />
                New Branch
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
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Branch Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. Kigali Branch"
            />
            {!item && name && (
              <p className="text-[10px] text-[var(--muted)] mt-1.5">
                URL slug will be:{" "}
                <code className="px-1 py-0.5 rounded bg-[var(--bg-soft)] text-purple-600">
                  {previewSlug}
                </code>{" "}
                (permanent, cannot be changed later)
              </p>
            )}
            {item && (
              <p className="text-[10px] text-[var(--muted)] mt-1.5">
                Slug:{" "}
                <code className="px-1 py-0.5 rounded bg-[var(--bg-soft)] text-purple-600">
                  {item.id}
                </code>{" "}
                (locked)
              </p>
            )}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Tagline / Subtitle
            </label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. Late-night lounge and quick table service"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              City
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. Kigali"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. KG 123 St, Kigali"
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="+250 788 123 456"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="huye@citysnack.rw"
              />
            </div>
          </div>

          {/* Buttons */}
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
              disabled={saving || !name.trim()}
              className="flex-1 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Update Branch" : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}