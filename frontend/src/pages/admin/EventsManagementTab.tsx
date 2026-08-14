import { useState, useMemo } from "react";
import { useEvents, type EventItem, type EventCategory } from "../../hooks/useEvents";

const CATEGORIES: { value: EventCategory; label: string; emoji: string }[] = [
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "dining", label: "Dining", emoji: "🍽️" },
  { value: "special", label: "Special", emoji: "✨" },
  { value: "workshop", label: "Workshop", emoji: "🎨" },
];

export function EventsManagementTab({ branchId }: { branchId: string }) {
  // ─── ALL HOOKS AT THE TOP — NEVER conditional ───
  const { items, loading, error, create, update, toggleFeatured, remove } = useEvents(branchId);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past" | "featured">("all");
  const [toast, setToast] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (statusFilter === "upcoming" && item.date < today) return false;
      if (statusFilter === "past" && item.date >= today) return false;
      if (statusFilter === "featured" && !item.isFeatured) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) &&
            !item.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, categoryFilter, statusFilter, search, today]);

  const stats = useMemo(() => ({
    total: items.length,
    upcoming: items.filter((i) => i.date >= today).length,
    past: items.filter((i) => i.date < today).length,
    featured: items.filter((i) => i.isFeatured).length,
  }), [items, today]);

  // ─── HANDLERS (not hooks — safe below) ───
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave(data: Partial<EventItem>) {
    try {
      if (editingItem) {
        await update(editingItem._id, data);
        showToast("✅ Event updated");
      } else {
        await create(data);
        showToast("✅ Event created");
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  async function handleDelete(item: EventItem) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await remove(item._id);
      showToast("🗑 Event deleted");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  async function handleToggleFeatured(item: EventItem) {
    try {
      await toggleFeatured(item._id);
      showToast(item.isFeatured ? "☆ Unfeatured" : "⭐ Featured — now showing on homepage");
    } catch (err: any) {
      showToast("❌ " + err.message);
    }
  }

  // ─── EARLY RETURNS (only AFTER all hooks) ───
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
            Events
          </p>
          <h2 className="text-3xl font-serif font-bold text-[var(--ink)]">
            Events Management
          </h2>
          <p className="text-[var(--muted)] mt-1">
            {stats.total} total • {stats.upcoming} upcoming • {stats.featured} featured on homepage
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="px-5 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-md shadow-purple-600/25"
        >
          <span>+</span> Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Total" value={stats.total} color="purple" />
        <StatChip label="Upcoming" value={stats.upcoming} color="green" />
        <StatChip label="Featured" value={stats.featured} color="orange" />
        <StatChip label="Past" value={stats.past} color="gray" />
      </div>  

      {/* Filters */}
      <div className="bg-[var(--card)] rounded-3xl p-4 border border-[var(--line)] space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events by title or description..."
          className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-full border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] px-4 text-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="upcoming">🟢 Upcoming</option>
            <option value="featured">⭐ Featured</option>
            <option value="past">⏳ Past</option>
          </select>

          <span className="text-sm text-[var(--muted)] ml-auto self-center">
            Showing {filtered.length} of {items.length}
          </span>
        </div>
      </div>

      {/* Event grid */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-3xl p-16 border border-dashed border-[var(--line)] text-center">
          <p className="text-6xl mb-4">🎉</p>
          <p className="font-serif italic text-[var(--muted)] mb-4">
            {items.length === 0 ? "No events yet. Create your first one!" : "No events match your filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <EventCard
              key={item._id}
              item={item}
              isPast={item.date < today}
              onEdit={() => {
                setEditingItem(item);
                setShowForm(true);
              }}
              onToggleFeatured={() => handleToggleFeatured(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <EventFormModal
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

function EventCard({
  item,
  isPast,
  onEdit,
  onToggleFeatured,
  onDelete,
}: {
  item: EventItem;
  isPast: boolean;
  onEdit: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const category = CATEGORIES.find((c) => c.value === item.category);
  const dateObj = new Date(item.date);

  return (
    <div className={`bg-[var(--card)] rounded-3xl border overflow-hidden transition hover:border-purple-600 ${
      item.isFeatured ? "border-orange-400 ring-2 ring-orange-200 dark:ring-orange-900" : "border-[var(--line)]"
    } ${isPast ? "opacity-60" : ""}`}>
      {/* Image */}
      <div className="relative aspect-video bg-[var(--bg-soft)] flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-5xl opacity-30">{category?.emoji ?? "🎉"}</span>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.isFeatured && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white uppercase">
              ⭐ Featured
            </span>
          )}
          {isPast && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-500 text-white uppercase">
              Past
            </span>
          )}
        </div>

        {/* Date card */}
        <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-black/80 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center">
          <p className="text-[8px] font-bold uppercase text-purple-600">
            {dateObj.toLocaleDateString("en-US", { month: "short" })}
          </p>
          <p className="text-lg font-serif font-bold leading-none text-[var(--ink)]">
            {dateObj.getDate()}
          </p>
        </div>

        {/* Category */}
        <div className="absolute top-2 right-2 rounded-full bg-black/80 text-white px-3 py-1 text-[10px] font-bold backdrop-blur-sm uppercase">
          {category?.emoji} {category?.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-serif font-bold text-[var(--ink)] leading-tight mb-2 line-clamp-1">{item.title}</h4>
        {item.description && (
          <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3">{item.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-[var(--muted)] mb-3">
          <span>🕐 {item.time}</span>
          {item.price != null && <span>💰 {item.price.toLocaleString()} RWF</span>}
          {item.spotsLeft != null && (
            <span className={item.spotsLeft <= 10 ? "text-red-500 font-bold" : ""}>
              🎟 {item.spotsLeft} left
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={onToggleFeatured}
            title={item.isFeatured ? "Unfeature" : "Feature on homepage"}
            className={`py-2 rounded-full text-xs font-medium transition ${
              item.isFeatured
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-950/40 dark:text-orange-300"
                : "bg-[var(--bg-soft)] text-[var(--muted)] hover:bg-[var(--line)]"
            }`}
          >
            ⭐ {item.isFeatured ? "Featured" : "Feature"}
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="py-2 rounded-full text-xs bg-[var(--bg-soft)] text-[var(--ink)] hover:bg-[var(--line)] transition"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="py-2 rounded-full text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 transition"
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Form Modal
═══════════════════════════════════════════════════════ */

function EventFormModal({
  item,
  onSave,
  onClose,
}: {
  item: EventItem | null;
  onSave: (data: Partial<EventItem>) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [date, setDate] = useState(item?.date ?? "");
  const [time, setTime] = useState(item?.time ?? "7:00 PM");
  const [image, setImage] = useState(item?.image ?? "");
  const [category, setCategory] = useState<EventCategory>(item?.category ?? "music");
  const [spotsLeft, setSpotsLeft] = useState(item?.spotsLeft?.toString() ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Please use an image under 2MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read image");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        image,
        category,
        spotsLeft: spotsLeft ? Number(spotsLeft) : undefined,
        price: price ? Number(price) : undefined,
        isFeatured,
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
          <h3 className="font-serif font-bold text-xl text-[var(--ink)]">
            {item ? "✏️ Edit Event" : "➕ Create New Event"}
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--muted)]">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Event Image
            </label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 rounded-2xl bg-[var(--bg-soft)] border border-[var(--line)] flex items-center justify-center overflow-hidden shrink-0">
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl opacity-30">🎉</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="w-full h-11 px-4 rounded-2xl border border-dashed border-purple-400 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 flex items-center justify-center text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-950/40 transition">
                    {uploading ? "Uploading..." : image ? "📤 Change Image" : "📤 Upload Image"}
                  </div>
                </label>
                <input
                  value={image.startsWith("data:") ? "" : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full h-10 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500 text-sm"
                />
                <p className="text-[10px] text-[var(--muted)]">
                  Upload from device (max 2MB) or paste a URL
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Event Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              placeholder="e.g. Live Jazz Night with The Groove Collective"
            />
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
              placeholder="Describe this event to customers..."
            />
          </div>

          {/* Category + Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full h-11 px-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Time *
              </label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="7:00 PM"
              />
            </div>
          </div>

          {/* Price + Spots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Price (RWF) — leave empty for FREE
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="500"
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="15000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Available Spots
              </label>
              <input
                type="number"
                value={spotsLeft}
                onChange={(e) => setSpotsLeft(e.target.value)}
                min="0"
                className="w-full h-11 px-4 rounded-2xl border border-[var(--line)] bg-[var(--input-bg)] text-[var(--ink)] outline-none focus:border-purple-500"
                placeholder="50"
              />
            </div>
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <div className="flex-1">
              <p className="font-medium text-sm text-[var(--ink)]">⭐ Feature on Homepage</p>
              <p className="text-[10px] text-[var(--muted)]">
                Show this event as the main banner on customer homepage. Only ONE event can be featured — this will replace any current featured event.
              </p>
            </div>
          </label>

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
              disabled={saving || !title || !date || !time}
              className="flex-1 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}