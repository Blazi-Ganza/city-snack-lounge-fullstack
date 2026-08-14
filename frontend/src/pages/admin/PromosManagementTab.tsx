import { useState, useMemo } from "react";
import { usePromos, type Promo, type DiscountType } from "../../hooks/usePromos";
import { useMenu } from "../../hooks/useMenu";

export function PromosManagementTab({ branchId }: { branchId: string }) {
  const { items, loading, error, create, update, toggleActive, toggleFeatured, remove } = usePromos(branchId);
  const { items: menuItems } = useMenu(branchId);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Promo | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "featured">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      if (statusFilter === "featured" && !p.isFeatured) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((p) => p.isActive && p.startDate <= today && p.endDate >= today).length,
    featured: items.filter((p) => p.isFeatured).length,
    expired: items.filter((p) => p.endDate < today).length,
  }), [items, today]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave(data: Partial<Promo>) {
    try {
      if (editingItem) {
        await update(editingItem._id, data);
        showToast("✅ Promo updated");
      } else {
        await create(data);
        showToast("✅ Promo created");
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  async function handleDelete(item: Promo) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await remove(item._id);
      showToast("🗑 Promo deleted");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  async function handleToggleActive(item: Promo) {
    try {
      await toggleActive(item._id);
      showToast(item.isActive ? "🔴 Deactivated" : "🟢 Activated");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  async function handleToggleFeatured(item: Promo) {
    try {
      await toggleFeatured(item._id);
      showToast(item.isFeatured ? "☆ Removed from banner" : "⭐ Now in menu banner");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
        <p className="text-red-700 dark:text-red-300 mb-2">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">
            Promos
          </p>
          <h2 className="text-3xl font-serif font-bold text-[var(--ink)]">
            🏷️ Promo Management
          </h2>
          <p className="text-[var(--muted)] mt-1">
            {stats.total} total • {stats.active} live now • {stats.featured} in menu banner
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="px-5 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-md shadow-purple-600/25"
        >
          <span>+</span> Create Promo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Total" value={stats.total} color="purple" />
        <StatChip label="Live Now" value={stats.active} color="green" />
        <StatChip label="Featured" value={stats.featured} color="orange" />
        <StatChip label="Expired" value={stats.expired} color="gray" />
      </div>

      {/* Filters */}
      <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search promos..."
          className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">🟢 Active</option>
            <option value="inactive">🔴 Inactive</option>
            <option value="featured">⭐ Featured</option>
          </select>
          <span className="text-sm text-[var(--muted)] ml-auto self-center">
            Showing {filtered.length} of {items.length}
          </span>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
          <p className="text-6xl mb-4">🏷️</p>
          <p className="font-serif italic text-[var(--muted)] mb-4">
            {items.length === 0 ? "No promos yet. Create your first one!" : "No promos match your filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <PromoCard
              key={item._id}
              item={item}
              menuItems={menuItems}
              today={today}
              onEdit={() => {
                setEditingItem(item);
                setShowForm(true);
              }}
              onToggleActive={() => handleToggleActive(item)}
              onToggleFeatured={() => handleToggleFeatured(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PromoFormModal
          item={editingItem}
          menuItems={menuItems}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */

function StatChip({ label, value, color }: { label: string; value: number; color: "purple" | "green" | "orange" | "gray" }) {
  const colors = {
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
    green: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
    gray: "bg-[var(--bg-soft)] text-[var(--muted)]",
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-4`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-serif font-bold">{value}</p>
    </div>
  );
}

function PromoCard({
  item,
  menuItems,
  today,
  onEdit,
  onToggleActive,
  onToggleFeatured,
  onDelete,
}: {
  item: Promo;
  menuItems: any[];
  today: string;
  onEdit: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const isExpired = item.endDate < today;
  const notStarted = item.startDate > today;
  const isLive = item.isActive && !isExpired && !notStarted;

  const appliedItems = menuItems.filter((m) => item.itemIds.includes(m._id));

  return (
    <div className={`bg-[var(--card)] rounded-3xl border overflow-hidden transition hover:border-purple-600 ${
      item.isFeatured ? "border-orange-400 ring-2 ring-orange-200 dark:ring-orange-900" : "border-[var(--line)]"
    } ${!item.isActive || isExpired ? "opacity-60" : ""}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1 mb-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isLive ? "bg-green-500 text-white" : notStarted ? "bg-blue-500 text-white" : isExpired ? "bg-gray-500 text-white" : "bg-red-500 text-white"
              }`}>
                {isLive ? "🟢 Live" : notStarted ? "⏳ Scheduled" : isExpired ? "⏳ Expired" : "🔴 Off"}
              </span>
              {item.isFeatured && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white uppercase">
                  ⭐ In Banner
                </span>
              )}
            </div>
            <h4 className="font-serif font-bold text-lg text-[var(--ink)] leading-tight">{item.title}</h4>
            {item.description && (
              <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-serif font-bold text-2xl text-purple-600">
              {item.discountType === "percentage" ? `${item.discountValue}%` : `${item.discountValue.toLocaleString()}`}
            </p>
            <p className="text-[9px] font-semibold uppercase text-[var(--muted)]">
              {item.discountType === "percentage" ? "OFF" : "RWF OFF"}
            </p>
          </div>
        </div>

        {/* Dates + times */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] mb-3 bg-[var(--bg-soft)] rounded-xl p-3">
          <span>📅 {item.startDate} → {item.endDate}</span>
          {item.startTime && item.endTime && (
            <span>🕐 {item.startTime} – {item.endTime} daily</span>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
            Applies to {appliedItems.length} item{appliedItems.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-1">
            {appliedItems.slice(0, 4).map((m) => (
              <span key={m._id} className="text-[10px] bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                {m.name}
              </span>
            ))}
            {appliedItems.length > 4 && (
              <span className="text-[10px] text-[var(--muted)] px-2 py-0.5">
                +{appliedItems.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={onToggleActive}
            title={item.isActive ? "Deactivate" : "Activate"}
            className={`py-2 rounded-full text-xs font-medium transition ${
              item.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-300"
                : "bg-[var(--bg-soft)] text-[var(--muted)] hover:bg-[var(--line)]"
            }`}
          >
            {item.isActive ? "🟢" : "🔴"}
          </button>
          <button
            onClick={onToggleFeatured}
            title="Feature in menu banner"
            className={`py-2 rounded-full text-xs font-medium transition ${
              item.isFeatured
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-950/40 dark:text-orange-300"
                : "bg-[var(--bg-soft)] text-[var(--muted)] hover:bg-[var(--line)]"
            }`}
          >
            ⭐
          </button>
          <button onClick={onEdit} className="py-2 rounded-full text-xs bg-[var(--bg-soft)] text-[var(--ink)] hover:bg-[var(--line)] transition">
            ✏️
          </button>
          <button onClick={onDelete} className="py-2 rounded-full text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 transition">
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Form Modal
═══════════════════════════════════════════════════════ */
function PromoFormModal({
  item,
  menuItems,
  onSave,
  onClose,
}: {
  item: Promo | null;
  menuItems: any[];
  onSave: (data: Partial<Promo>) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(item?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(item?.discountValue?.toString() ?? "");
  const [itemIds, setItemIds] = useState<string[]>(item?.itemIds ?? []);
  const [startDate, setStartDate] = useState(item?.startDate ?? new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(item?.endDate ?? "");
  const [useTimeWindow, setUseTimeWindow] = useState(!!(item?.startTime && item?.endTime));
  const [startTime, setStartTime] = useState(item?.startTime ?? "17:00");
  const [endTime, setEndTime] = useState(item?.endTime ?? "19:00");
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  const [itemSearch, setItemSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredMenuItems = useMemo(() => {
    if (!itemSearch) return menuItems;
    const q = itemSearch.toLowerCase();
    return menuItems.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.subcategory.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [menuItems, itemSearch]);

  function toggleItem(id: string) {
    setItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setItemIds(filteredMenuItems.map((m) => m._id));
  }

  function clearAll() {
    setItemIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (itemIds.length === 0) {
      alert("Please select at least one menu item");
      return;
    }
    if (discountType === "percentage" && Number(discountValue) > 100) {
      alert("Percentage cannot exceed 100%");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        itemIds,
        startDate,
        endDate,
        startTime: useTimeWindow ? startTime : undefined,
        endTime: useTimeWindow ? endTime : undefined,
        isActive,
        isFeatured,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--line)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h3 className="font-serif font-bold text-xl text-[var(--ink)]">
            {item ? "✏️ Edit Promo" : "➕ Create New Promo"}
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--muted)]">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Promo Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. Happy Hour Drinks"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. 20% off all drinks 5-7 PM daily"
            />
          </div>

          {/* Discount Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Discount Type *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              >
                <option value="percentage">% Percentage</option>
                <option value="fixed">RWF Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                {discountType === "percentage" ? "Percentage (1-100)" : "Amount (RWF)"} *
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                min="1"
                max={discountType === "percentage" ? 100 : undefined}
                step={discountType === "percentage" ? 1 : 100}
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder={discountType === "percentage" ? "20" : "1000"}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
                className="w-full h-11 px-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Time window (Happy Hour) */}
          <div className="bg-[var(--bg-soft)] rounded-2xl p-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useTimeWindow}
                onChange={(e) => setUseTimeWindow(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              <span className="text-sm font-medium text-[var(--ink)]">⏰ Happy Hour — apply only during specific hours (daily)</span>
            </label>
            {useTimeWindow && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[var(--muted)] mb-1">From</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[var(--muted)] mb-1">To</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Menu items picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Apply to menu items * ({itemIds.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] font-semibold uppercase tracking-wider text-red-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full h-10 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 mb-2 text-sm"
            />

            <div className="max-h-64 overflow-y-auto border border-[var(--line)] rounded-2xl p-2 space-y-1">
              {filteredMenuItems.length === 0 ? (
                <p className="text-center text-sm text-[var(--muted)] py-4">No items found</p>
              ) : (
                filteredMenuItems.map((m) => {
                  const selected = itemIds.includes(m._id);
                  return (
                    <label
                      key={m._id}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                        selected ? "bg-purple-50 dark:bg-purple-950/30" : "hover:bg-[var(--bg-soft)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleItem(m._id)}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-soft)] overflow-hidden shrink-0">
                        {m.image && <img src={m.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{m.name}</p>
                        <p className="text-[10px] text-[var(--muted)]">{m.category} · {m.subcategory}</p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)]">{m.price.toLocaleString()} RWF</p>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 bg-[var(--bg-soft)] rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-green-600"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-[var(--ink)]">🟢 Active</p>
                <p className="text-[10px] text-[var(--muted)]">Enable this promo</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 accent-orange-500"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-[var(--ink)]">⭐ Show in Menu Banner</p>
                <p className="text-[10px] text-[var(--muted)]">Highlight to customers</p>
              </div>
            </label>
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
              disabled={saving || !title || !discountValue || !endDate}
              className="flex-1 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Update Promo" : "Create Promo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}