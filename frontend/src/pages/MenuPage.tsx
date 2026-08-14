import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Clock, Filter, Search, ShoppingCart, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { useBranch } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";
import { getBranchName } from "../data";
import { useCustomerMenu, type CustomerMenuItem } from "../hooks/useCustomerMenu";
import { useActivePromos } from "../hooks/useActivePromos";
import { cn } from "../utils/cn";

function fmt(price: number) {
  return price.toLocaleString() + " RWF";
}

// ── Product modal ─────────────────────────────────────────────────────────────

function ProductModal({
  item,
  discount,
  onClose,
}: {
  item: CustomerMenuItem;
  discount: ReturnType<ReturnType<typeof useActivePromos>["getItemDiscount"]>;
  onClose: () => void;
}) {
  const { addItem, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const effectivePrice = discount?.discountedPrice ?? item.price;

  function handleAdd() {
    for (let i = 0; i < qty; i++) addItem({ ...item, price: effectivePrice } as any);
    openCart();
    onClose();
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-[var(--card)] sm:rounded-2xl"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 sm:h-64">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card)]/80 text-[var(--muted)] backdrop-blur-sm hover:text-[var(--ink)]"
          >
            <X size={16} />
          </button>
          {item.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
              POPULAR
            </span>
          )}
          {discount && (
            <span className="absolute left-3 top-11 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
              🔥 {discount.label}
            </span>
          )}
        </div>

        <div className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">{item.subcategory}</p>
          <h2 className="font-display mt-1 text-xl font-bold text-[var(--ink)]">{item.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1"><Clock size={12} /> {item.prepTime}</span>
          </div>

          {discount && (
            <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                🔥 {discount.promo.title}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                You save {fmt(discount.savings)} on this item!
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-lg border border-[var(--line)]">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-base font-semibold text-[var(--muted)] hover:bg-[var(--card-hover)]"
              >−</button>
              <span className="w-8 text-center text-sm font-semibold text-[var(--ink)]">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center text-base font-semibold text-[var(--muted)] hover:bg-[var(--card-hover)]"
              >+</button>
            </div>
            <button
              onClick={handleAdd}
              className="flex flex-1 flex-col items-center justify-center gap-0 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[0.98]"
            >
              <span>Add to order · {fmt(effectivePrice * qty)}</span>
              {discount && (
                <span className="text-[10px] font-normal opacity-80 line-through">
                  {fmt(item.price * qty)}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Food card ─────────────────────────────────────────────────────────────────

function MenuCard({
  item,
  discount,
  onOpen,
}: {
  item: CustomerMenuItem;
  discount: ReturnType<ReturnType<typeof useActivePromos>["getItemDiscount"]>;
  onOpen: (i: CustomerMenuItem) => void;
}) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const effectivePrice = discount?.discountedPrice ?? item.price;

  function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    setAdded(true);
    addItem({ ...item, price: effectivePrice } as any);
    openCart();
    setTimeout(() => setAdded(false), 700);
  }

  return (
    <article
      onClick={() => onOpen(item)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)] transition hover:shadow-md hover:border-[var(--primary)]/30"
    >
      <div className="relative h-40 overflow-hidden sm:h-48">
        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {item.featured && (
          <span className="absolute left-2.5 top-2.5 rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
            POPULAR
          </span>
        )}
        {discount && (
          <span className="absolute right-2.5 top-2.5 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg animate-pulse">
            🔥 {discount.label}
          </span>
        )}
        <div className="absolute bottom-2.5 right-2.5 flex flex-col items-end gap-0.5">
          {discount && (
            <span className="text-[9px] font-medium text-white/90 line-through bg-black/50 px-1.5 rounded backdrop-blur-sm">
              {fmt(item.price)}
            </span>
          )}
          <span className={cn(
            "rounded px-2 py-0.5 text-xs font-bold backdrop-blur-sm",
            discount ? "bg-red-500 text-white" : "bg-[var(--card)]/90 text-[var(--ink)]"
          )}>
            {fmt(effectivePrice)}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">{item.subcategory}</p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-[var(--ink)]">{item.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{item.description}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
            <Clock size={10} /> {item.prepTime}
          </span>
          <button
            onClick={handleQuickAdd}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95",
              added
                ? "bg-green-500 text-white"
                : "bg-[var(--ink)] text-[var(--bg)] hover:bg-orange-500 hover:text-white"
            )}
          >
            {added ? "Added ✓" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Promo Banner ─────────────────────────────────────────────────────────────

function PromoBanner({ promos }: { promos: ReturnType<typeof useActivePromos>["featuredPromos"] }) {
  const [index, setIndex] = useState(0);
  const active = promos[index];

  if (!active) return null;

  return (
    <div className="border-b border-red-200 dark:border-red-900 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-white/10"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 flex items-center gap-3 relative">
        <span className="text-lg animate-pulse">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {active.title}
            {active.description && <span className="font-normal text-white/90"> — {active.description}</span>}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white text-red-600 px-3 py-1 text-xs font-bold shadow-lg">
          {active.discountType === "percentage" ? `${active.discountValue}% OFF` : `${active.discountValue.toLocaleString()} RWF OFF`}
        </span>

        {promos.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar group ────────────────────────────────────────────────────────────

function SidebarGroup({
  label,
  subs,
  activeSub,
  onSelect,
  allItems,
}: {
  label: string;
  subs: string[];
  activeSub: string;
  onSelect: (s: string) => void;
  allItems: CustomerMenuItem[];
}) {
  const isActive = subs.includes(activeSub);
  const [open, setOpen] = useState(isActive);
  const totalCount = subs.reduce((sum, s) => sum + allItems.filter((i) => i.subcategory === s).length, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-bold transition",
          isActive
            ? "bg-orange-500 text-white"
            : "text-[var(--ink)] hover:bg-[var(--card-hover)]"
        )}
      >
        <span className="flex items-center gap-2.5">
          {label}
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            isActive ? "bg-white/20 text-white" : "bg-[var(--bg-soft)] text-[var(--muted)]"
          )}>
            {totalCount}
          </span>
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="py-1">
              {subs.map((s) => {
                const count = allItems.filter((i) => i.subcategory === s).length;
                if (count === 0) return null;
                const isSubActive = activeSub === s;
                return (
                  <li key={s}>
                    <button
                      onClick={() => onSelect(s)}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2 text-xs transition",
                        isSubActive
                          ? "bg-orange-500/10 font-semibold text-orange-500"
                          : "text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--ink)]"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <ChevronRight size={10} className={cn(isSubActive ? "text-orange-400" : "text-[var(--muted)]")} />
                        {s}
                      </span>
                      <span className={cn(
                        "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium",
                        isSubActive ? "bg-orange-500/20 text-orange-500" : "bg-[var(--bg-soft)] text-[var(--muted)]"
                      )}>
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Category tree ─────────────────────────────────────────────────────────────

function buildCategoryTree(items: CustomerMenuItem[]) {
  const tree: { label: string; category: string; subs: string[] }[] = [
    { label: "Drinks", category: "Drinks", subs: [] },
    { label: "Meals", category: "Meals", subs: [] },
    { label: "Desserts", category: "Desserts", subs: [] },
  ];

  const seen = new Set<string>();
  for (const item of items) {
    const key = `${item.category}::${item.subcategory}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const group = tree.find((g) => g.category === item.category);
    if (group && !group.subs.includes(item.subcategory)) {
      group.subs.push(item.subcategory);
    }
  }

  return tree.filter((g) => g.subs.length > 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function MenuPage() {
  const { selectedBranch } = useBranch();
  const { t } = useLanguage();
  const { count, total, openCart } = useCart();
  const branchLabel = getBranchName(selectedBranch);

  const { items: menuItems, loading, error } = useCustomerMenu(selectedBranch);
  const { featuredPromos, getItemDiscount } = useActivePromos(selectedBranch);

  const [activeSub, setActiveSub] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [selectedItem, setSelectedItem] = useState<CustomerMenuItem | null>(null);
  const [mobileFilter, setMobileFilter] = useState(false);

  const categoryTree = useMemo(() => buildCategoryTree(menuItems), [menuItems]);

  const pills = useMemo(() => {
    const base = [
      { label: "All", value: "All" },
      { label: "Meals", value: "Meals" },
      { label: "Drinks", value: "Drinks" },
      { label: "Desserts", value: "Desserts" },
    ];
    const popularSubs = ["BBQ", "Pizza", "Burgers", "Coffee"];
    for (const sub of popularSubs) {
      if (menuItems.some((i) => i.subcategory === sub)) {
        base.push({ label: sub, value: sub });
      }
    }
    return base;
  }, [menuItems]);

  const displayed = useMemo(() => {
    let list = menuItems;

    if (activeSub !== "All") {
      const cats = ["Meals", "Drinks", "Desserts"];
      list = cats.includes(activeSub)
        ? list.filter((i) => i.category === activeSub)
        : list.filter((i) => i.subcategory === activeSub);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.subcategory.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [menuItems, activeSub, search, sort]);

  const featured = menuItems.filter((i) => i.featured).slice(0, 6);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-[var(--muted)]">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg)] p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="mb-2 text-4xl">⚠️</p>
          <p className="mb-1 font-semibold text-red-800 dark:text-red-300">Menu unavailable</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg)] p-6">
        <div className="text-center">
          <p className="mb-3 text-5xl">🍽️</p>
          <p className="font-serif text-lg italic text-[var(--muted)]">Menu coming soon</p>
          <p className="mt-2 text-sm text-[var(--muted)]">This branch hasn't set up its menu yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg)]">
      {/* Hero */}
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
          alt="" className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />
        <div className="absolute bottom-0 p-5 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-widest text-orange-400">{branchLabel}</p>
          <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">Our Menu</h1>
          <p className="mt-1 text-xs text-white/60">{menuItems.length} items · Open daily 10 AM – 11 PM</p>
        </div>
        {count > 0 && (
          <button onClick={openCart} className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg">
            <ShoppingCart size={13} /> {count} · {fmt(total)}
          </button>
        )}
      </div>

      {/* 🆕 PROMO BANNER — shows only if featured promos exist */}
      {featuredPromos.length > 0 && <PromoBanner promos={featuredPromos} />}

      {/* Category pills */}
      <div className="sticky top-16 z-30 border-b border-[var(--line)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {pills.map((p) => (
            <button
              key={p.value}
              onClick={() => setActiveSub(p.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                activeSub === p.value
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--muted)] hover:bg-[var(--card-hover)]"
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px shrink-0 bg-[var(--line)]" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-7 shrink-0 rounded-full border border-[var(--line)] bg-[var(--input-bg)] px-2 text-[11px] font-medium text-[var(--muted)] outline-none"
          >
            <option value="default">Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name A–Z</option>
          </select>
          <button
            onClick={() => setMobileFilter(true)}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)] lg:hidden"
          >
            <Filter size={11} /> Filter
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-36 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-9 pr-8 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              onClick={() => setActiveSub("All")}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                activeSub === "All"
                  ? "bg-orange-500 text-white"
                  : "border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--card-hover)]"
              )}
            >
              <span className="text-base">📋</span>
              All Items
              <span className={cn(
                "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                activeSub === "All" ? "bg-white/20 text-white" : "bg-[var(--bg-soft)] text-[var(--muted)]"
              )}>
                {menuItems.length}
              </span>
            </button>

            {categoryTree.map((g) => (
              <SidebarGroup
                key={g.label}
                label={g.label}
                subs={g.subs}
                activeSub={activeSub}
                onSelect={setActiveSub}
                allItems={menuItems}
              />
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="relative mb-4 lg:hidden">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu…"
              className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] pl-8 pr-8 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-orange-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {activeSub === "All" && !search && featured.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-bold text-[var(--ink)]">Popular right now</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {featured.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="relative w-36 shrink-0 cursor-pointer overflow-hidden rounded-lg sm:w-44"
                  >
                    <img src={item.image} alt={item.name} className="h-24 w-full object-cover sm:h-28" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 p-2">
                      <p className="text-[11px] font-semibold leading-tight text-white">{item.name}</p>
                      <p className="text-[10px] font-semibold text-orange-300">{fmt(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">
              {displayed.length} item{displayed.length !== 1 ? "s" : ""}
              {activeSub !== "All" && <span className="text-[var(--ink)]"> in {activeSub}</span>}
            </p>
            {(search || activeSub !== "All") && (
              <button
                onClick={() => { setSearch(""); setActiveSub("All"); }}
                className="text-[11px] font-medium text-orange-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {displayed.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[var(--muted)]">No items match your search.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {displayed.map((item) => (
                <MenuCard
                  key={item._id}
                  item={item}
                  discount={getItemDiscount(item._id, item.price)}
                  onOpen={setSelectedItem}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilter && (
          <motion.div
            className="fixed inset-0 z-50 flex lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileFilter(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              className="relative ml-auto flex h-full w-72 flex-col overflow-y-auto bg-[var(--card)] p-5"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--ink)]">Filter</h2>
                <button onClick={() => setMobileFilter(false)}>
                  <X size={18} className="text-[var(--muted)]" />
                </button>
              </div>

              <button
                onClick={() => { setActiveSub("All"); setMobileFilter(false); }}
                className={cn(
                  "mb-3 flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                  activeSub === "All"
                    ? "bg-orange-500 text-white"
                    : "border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--card-hover)]"
                )}
              >
                <span className="text-base">📋</span>
                All Items
                <span className={cn(
                  "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  activeSub === "All" ? "bg-white/20 text-white" : "bg-[var(--bg-soft)] text-[var(--muted)]"
                )}>
                  {menuItems.length}
                </span>
              </button>

              <div className="space-y-2.5">
                {categoryTree.map((g) => (
                  <SidebarGroup
                    key={g.label}
                    label={g.label}
                    subs={g.subs}
                    activeSub={activeSub}
                    onSelect={(s) => { setActiveSub(s); setMobileFilter(false); }}
                    allItems={menuItems}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <ProductModal
            item={selectedItem}
            discount={getItemDiscount(selectedItem._id, selectedItem.price)}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}