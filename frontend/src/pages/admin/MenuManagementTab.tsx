import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  IceCream,
  Image as ImageIcon,
  Pencil,
  Plus,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMenu, type MenuItem, type MenuCategory } from "../../hooks/useMenu";

const CATEGORY_TREE: { category: MenuCategory; subs: string[] }[] = [
  { category: "Drinks", subs: ["Tea", "Coffee", "Smoothies", "Milkshakes", "Lemonades", "Fresh Juices", "Detox Drinks"] },
  { category: "Meals", subs: ["Salads", "Soups", "Beef Dishes", "Chicken Dishes", "Fish Dishes", "Pork Dishes", "Pasta", "Pizza", "Burgers", "Wraps", "Sandwiches", "BBQ", "Snacks"] },
  { category: "Desserts", subs: ["Desserts"] },
];

const ALL_SUBCATEGORIES = CATEGORY_TREE.flatMap((c) => c.subs);

// Icon for each category
const CATEGORY_ICONS: Record<MenuCategory, LucideIcon> = {
  Meals: UtensilsCrossed,
  Drinks: Coffee,
  Desserts: IceCream,
};

export function MenuManagementTab({ branchId }: { branchId: string }) {
  const { items, loading, error, create, update, toggleAvailable, toggleFeatured, remove } = useMenu(branchId);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory | "all">("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (subFilter !== "all" && item.subcategory !== subFilter) return false;
      if (availabilityFilter === "available" && !item.isAvailable) return false;
      if (availabilityFilter === "unavailable" && item.isAvailable) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) &&
            !item.subcategory.toLowerCase().includes(q) &&
            !item.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, categoryFilter, subFilter, availabilityFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      if (!map.has(item.subcategory)) map.set(item.subcategory, []);
      map.get(item.subcategory)!.push(item);
    }
    return map;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter((i) => i.isAvailable).length,
    featured: items.filter((i) => i.featured).length,
    unavailable: items.filter((i) => !i.isAvailable).length,
  }), [items]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave(data: Partial<MenuItem>) {
    try {
      if (editingItem) {
        await update(editingItem._id, data);
        showToast("Item updated");
      } else {
        await create(data as any);
        showToast("Item added");
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await remove(item._id);
      showToast("Item deleted");
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleToggleAvailable(item: MenuItem) {
    try {
      await toggleAvailable(item._id);
      showToast(item.isAvailable ? "Marked unavailable" : "Marked available");
    } catch (err: any) {
      showToast(err.message);
    }
  }

  async function handleToggleFeatured(item: MenuItem) {
    try {
      await toggleFeatured(item._id);
      showToast(item.featured ? "Unfeatured" : "Featured");
    } catch (err: any) {
      showToast(err.message);
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
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-600" strokeWidth={2} />
        <p className="text-red-700 dark:text-red-300 mb-2">{error}</p>
      </div>
    );
  }

  const availableSubs = categoryFilter === "all"
    ? ALL_SUBCATEGORIES
    : CATEGORY_TREE.find((c) => c.category === categoryFilter)?.subs ?? [];

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
            Menu
          </p>
          <h2 className="text-3xl font-serif font-bold text-[var(--ink)] flex items-center gap-3">
            <UtensilsCrossed size={28} strokeWidth={2} className="text-purple-600" />
            Menu Management
          </h2>
          <p className="text-[var(--muted)] mt-1">
            {stats.total} total • {stats.available} available • {stats.featured} featured
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="px-5 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-md shadow-purple-600/25"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Total" value={stats.total} color="purple" />
        <StatChip label="Available" value={stats.available} color="green" />
        <StatChip label="Featured" value={stats.featured} color="orange" />
        <StatChip label="Off Menu" value={stats.unavailable} color="gray" />
      </div>

      {/* Filters */}
      <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items by name, category, description..."
          className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as any);
              setSubFilter("all");
            }}
            className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Meals">Meals</option>
            <option value="Drinks">Drinks</option>
            <option value="Desserts">Desserts</option>
          </select>

          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
          >
            <option value="all">All Subcategories</option>
            {availableSubs.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Off Menu</option>
          </select>

          <span className="text-sm text-[var(--muted)] ml-auto self-center">
            Showing {filtered.length} of {items.length}
          </span>
        </div>
      </div>

      {/* Items by subcategory */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
          <UtensilsCrossed size={48} className="mx-auto mb-4 text-[var(--muted)] opacity-40" strokeWidth={1.5} />
          <p className="font-serif italic text-[var(--muted)] mb-4">No items match your filters</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([subcategory, subItems]) => (
          <div key={subcategory}>
            <h3 className="font-serif font-bold text-lg text-[var(--ink)] mb-3 flex items-center gap-2">
              <span>{subcategory}</span>
              <span className="text-sm text-[var(--muted)] font-normal">({subItems.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  onEdit={() => {
                    setEditingItem(item);
                    setShowForm(true);
                  }}
                  onToggleAvailable={() => handleToggleAvailable(item)}
                  onToggleFeatured={() => handleToggleFeatured(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <MenuItemFormModal
          item={editingItem}
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

function MenuItemCard({
  item,
  onEdit,
  onToggleAvailable,
  onToggleFeatured,
  onDelete,
}: {
  item: MenuItem;
  onEdit: () => void;
  onToggleAvailable: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-[var(--card)] rounded-3xl border border-[var(--line)] overflow-hidden transition hover:border-purple-600 ${!item.isAvailable ? "opacity-60" : ""}`}>
      {/* Image */}
      <div className="relative aspect-video bg-[var(--bg-soft)] flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ImageIcon size={40} className="text-[var(--muted)] opacity-30" strokeWidth={1.5} />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.featured && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white uppercase">
              <Star size={10} strokeWidth={2.5} fill="currentColor" />
              Popular
            </span>
          )}
          {!item.isAvailable && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white uppercase">
              Off Menu
            </span>
          )}
        </div>

        {/* Price */}
        <div className="absolute bottom-2 right-2 rounded-full bg-black/80 text-white px-3 py-1 text-xs font-bold backdrop-blur-sm">
          {item.price.toLocaleString()} RWF
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
          {item.subcategory}
        </p>
        <h4 className="font-serif font-bold text-[var(--ink)] leading-tight mb-2 line-clamp-1">{item.name}</h4>
        {item.description && (
          <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3">{item.description}</p>
        )}
        <p className="text-[10px] text-[var(--muted)] mb-3 flex items-center gap-1">
          <Clock size={11} strokeWidth={2} />
          {item.prepTime}
        </p>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={onToggleAvailable}
            title={item.isAvailable ? "Mark unavailable" : "Mark available"}
            className={`flex items-center justify-center py-2 rounded-full text-xs font-medium transition ${
              item.isAvailable
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-300"
                : "bg-[var(--bg-soft)] text-[var(--muted)] hover:bg-[var(--line)]"
            }`}
          >
            {item.isAvailable ? (
              <CheckCircle2 size={14} strokeWidth={2} />
            ) : (
              <XCircle size={14} strokeWidth={2} />
            )}
          </button>
          <button
            onClick={onToggleFeatured}
            title={item.featured ? "Unfeature" : "Feature"}
            className={`flex items-center justify-center py-2 rounded-full text-xs font-medium transition ${
              item.featured
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-950/40 dark:text-orange-300"
                : "bg-[var(--bg-soft)] text-[var(--muted)] hover:bg-[var(--line)]"
            }`}
          >
            <Star size={14} strokeWidth={2} fill={item.featured ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="flex items-center justify-center py-2 rounded-full text-xs bg-[var(--bg-soft)] text-[var(--ink)] hover:bg-[var(--line)] transition"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="flex items-center justify-center py-2 rounded-full text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 transition"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Form Modal
═══════════════════════════════════════════════════════ */
function MenuItemFormModal({
  item,
  onSave,
  onClose,
}: {
  item: MenuItem | null;
  onSave: (data: Partial<MenuItem>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<MenuCategory>(item?.category ?? "Meals");
  const [subcategory, setSubcategory] = useState(item?.subcategory ?? "Salads");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [image, setImage] = useState(item?.image ?? "");
  const [prepTime, setPrepTime] = useState(item?.prepTime ?? "10–15 min");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [saving, setSaving] = useState(false);

  const availableSubs = CATEGORY_TREE.find((c) => c.category === category)?.subs ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        subcategory,
        description: description.trim(),
        price: Number(price),
        image: image.trim(),
        prepTime,
        featured,
        isAvailable,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--line)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <h3 className="font-serif font-bold text-xl text-[var(--ink)] flex items-center gap-2">
            {item ? (
              <>
                <Pencil size={20} strokeWidth={2} className="text-purple-600" />
                Edit Menu Item
              </>
            ) : (
              <>
                <Plus size={20} strokeWidth={2.5} className="text-purple-600" />
                Add New Menu Item
              </>
            )}
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--muted)]">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image preview + URL input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Image URL
            </label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 rounded-2xl bg-[var(--bg-soft)] border border-[var(--line)] flex items-center justify-center overflow-hidden shrink-0">
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  <ImageIcon size={32} className="text-[var(--muted)] opacity-40" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1">
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 text-sm"
                />
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  Paste any image URL (Unsplash, imgur, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. Chicken Caesar Salad"
            />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as MenuCategory;
                  setCategory(newCat);
                  const firstSub = CATEGORY_TREE.find((c) => c.category === newCat)?.subs[0];
                  if (firstSub) setSubcategory(firstSub);
                }}
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              >
                <option value="Meals">Meals</option>
                <option value="Drinks">Drinks</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Subcategory *
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              >
                {availableSubs.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price + PrepTime */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Price (RWF) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="100"
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="8000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Prep Time
              </label>
              <input
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="10–15 min"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 resize-none"
              placeholder="Describe this item to customers..."
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 bg-[var(--bg-soft)] rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-5 h-5 accent-green-600"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-[var(--ink)] flex items-center gap-1.5">
                  <CheckCircle2 size={14} strokeWidth={2} className="text-green-600" />
                  Available
                </p>
                <p className="text-[10px] text-[var(--muted)]">Show on customer menu</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[var(--bg-soft)] rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 accent-orange-500"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-[var(--ink)] flex items-center gap-1.5">
                  <Star size={14} strokeWidth={2} className="text-orange-500" fill="currentColor" />
                  Featured
                </p>
                <p className="text-[10px] text-[var(--muted)]">Show "Popular" badge</p>
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
              disabled={saving || !name || !price}
              className="flex-1 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}