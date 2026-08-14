import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalAuth } from "../../context/PortalAuthContext";
import { useReceptionLanguage as useLanguage } from "../../context/LanguageContext";
import { getSocket, resetSocket } from "../../lib/socket";

/* ═══════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════ */

function formatRWF(amount: number): string {
  if (amount == null || isNaN(amount)) return "RWF 0";
  return `RWF ${Math.round(amount).toLocaleString("en-RW")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function printDeliveryTicket(order: Order, branchName: string) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;

  const itemsHtml = (Array.isArray(order.items) ? order.items : [])
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;">${item.qty}× ${escapeHtml(item.name)}</td>
          <td style="padding:6px 0;text-align:right;">${formatRWF(
            item.price * item.qty,
          )}</td>
        </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Delivery Ticket · ${order.orderCode}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111; padding: 20px; max-width: 340px; margin: 0 auto; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .code { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
    .muted { color: #666; font-size: 11px; }
    .section { border-top: 1px dashed #ccc; margin-top: 12px; padding-top: 12px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em;
      color: #999; margin-bottom: 2px; }
    .value { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .total { display: flex; justify-content: space-between; font-size: 16px;
      font-weight: 700; margin-top: 8px; border-top: 1px solid #000; padding-top: 8px; }
    .notes { background: #FFF7ED; border: 1px solid #FED7AA; padding: 8px;
      border-radius: 8px; font-size: 12px; margin-top: 8px; }
    .payment { background: ${
      order.paymentMethod === "momo" ? "#FEF3C7" : "#DCFCE7"
    }; padding: 8px; border-radius: 8px; font-size: 12px;
      margin-top: 8px; text-align: center; font-weight: 600; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body>
  <div style="text-align:center;">
    <h1>City Snack Lounge</h1>
    <div class="muted">${escapeHtml(branchName)} · Delivery Ticket</div>
    <div class="code" style="margin-top:8px;">${escapeHtml(order.orderCode)}</div>
    <div class="muted">${new Date().toLocaleString()}</div>
  </div>

  <div class="section">
    <div class="label">Customer</div>
    <div class="value">${escapeHtml(order.customerName)}</div>
    <div class="muted">${escapeHtml(order.phone)}</div>
  </div>

  ${
    order.address
      ? `<div class="section">
          <div class="label">Delivery Address</div>
          <div class="value">📍 ${escapeHtml(order.address)}</div>
        </div>`
      : ""
  }

  <div class="section">
    <div class="label">Order Items</div>
    <table>${itemsHtml}</table>
    <div class="total"><span>Total</span><span>${formatRWF(order.total)}</span></div>
    <div class="payment">
      ${
        order.paymentMethod === "momo"
          ? `📱 Paid via MoMo ${order.paymentStatus === "paid" ? "✓" : "⏳"}`
          : `💵 Cash on delivery`
      }
    </div>
  </div>

  ${
    order.notes
      ? `<div class="section">
          <div class="label">Notes</div>
          <div class="notes">📝 ${escapeHtml(order.notes)}</div>
        </div>`
      : ""
  }

  <div class="section" style="text-align:center;">
    <div class="muted">Thank you for choosing us!</div>
  </div>

  <div style="text-align:center;margin-top:16px;">
    <button onclick="window.print()"
      style="padding:8px 20px;border-radius:20px;border:none;background:#F97316;color:white;cursor:pointer;">
      Print
    </button>
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

/* ═══════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════ */

interface ChatMessage {
  from: "customer" | "reception";
  text: string;
  createdAt: string;
}

interface Chat {
  _id?: string;
  branchId: string;
  customerId: string;
  customerName: string;
  status: "new" | "in_progress" | "closed";
  messages: ChatMessage[];
  updatedAt: string;
}

interface Reservation {
  _id: string;
  branchId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: "pending" | "confirmed" | "seated" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface Order {
  _id: string;
  branchId: string;
  orderCode: string;
  customerName: string;
  phone: string;
  type: "pickup" | "delivery";
  address?: string;
  items: OrderItem[];
  total: number;
  status:
    | "awaiting_payment"
    | "new"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  notes?: string;
  paymentMethod?: "cash" | "momo";
  paymentStatus?: "pending" | "paid" | "failed";
  paidAt?: string;
  customerConfirmedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

type Section =
  | "overview"
  | "chats"
  | "reservations"
  | "orders"
  | "deliveries";

const ORDER_FLOW: Record<Order["status"], Order["status"] | null> = {
  awaiting_payment: null,
  new: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

/* ═══════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════ */

export function ReceptionDashboardPage() {
  const navigate = useNavigate();
  const { session, signOut } = usePortalAuth();
  const { t } = useLanguage();

  // 🌗 DARK MODE STATE
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
    }
  }, [isDark]);

  const BRANCH_NAMES: Record<string, string> = {
    huye: t("branch.huye"),
    musanze: t("branch.musanze"),
  };

  useEffect(() => {
    if (!session || session.role !== "receptionist" || !session.branchId) {
      signOut();
      resetSocket();
      navigate("/reception/login", { replace: true });
    }
  }, [session, signOut, navigate]);

  const branchId = session?.branchId ?? "";
  const branchName = BRANCH_NAMES[branchId] ?? branchId;

  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now] = useState(new Date());

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!branchId) return;

    const socket = getSocket();

    setChats([]);
    setReservations([]);
    setOrders([]);
    setSelectedId(null);

    const onAuthError = (message: string) => {
      console.warn("Socket authentication error:", message);
      signOut();
      resetSocket();
      navigate("/reception/login", { replace: true });
    };

    const onChats = (list: Chat[]) => setChats(list);
    const onChatUpdate = (chat: Chat) => {
      if (chat.branchId !== branchId) return;
      setChats((prev) => {
        const others = prev.filter((i) => i.customerId !== chat.customerId);
        return [chat, ...others];
      });
    };
    const onChatDeleted = (p: { customerId: string }) => {
      setChats((prev) => prev.filter((i) => i.customerId !== p.customerId));
      setSelectedId((c) => (c === p.customerId ? null : c));
    };
    const onPurgeDone = (p: { deleted: number }) =>
      console.log(`Purged ${p.deleted} old closed chats`);

    const onReservations = (list: Reservation[]) => setReservations(list);
    const onReservationNew = (r: Reservation) => {
      if (r.branchId !== branchId) return;
      setReservations((prev) => [r, ...prev.filter((i) => i._id !== r._id)]);
    };
    const onReservationUpdated = (r: Reservation) => {
      if (r.branchId !== branchId) return;
      setReservations((prev) => prev.map((i) => (i._id === r._id ? r : i)));
    };
    const onReservationDeleted = (p: { id: string }) =>
      setReservations((prev) => prev.filter((i) => i._id !== p.id));

    const onOrders = (list: Order[]) => setOrders(list);
    const onOrderNew = (o: Order) => {
      if (o.branchId !== branchId) return;
      setOrders((prev) => [o, ...prev.filter((i) => i._id !== o._id)]);
    };
    const onOrderUpdated = (o: Order) => {
      if (o.branchId !== branchId) return;
      setOrders((prev) => prev.map((i) => (i._id === o._id ? o : i)));
    };
    const onOrderDeleted = (p: { id: string }) =>
      setOrders((prev) => prev.filter((i) => i._id !== p.id));

    socket.on("auth:error", onAuthError);
    socket.on("reception:chats", onChats);
    socket.on("reception:chat-updated", onChatUpdate);
    socket.on("reception:chat-deleted", onChatDeleted);
    socket.on("reception:purge-done", onPurgeDone);
    socket.on("reception:reservations", onReservations);
    socket.on("reception:reservation-new", onReservationNew);
    socket.on("reception:reservation-updated", onReservationUpdated);
    socket.on("reception:reservation-deleted", onReservationDeleted);
    socket.on("reception:orders", onOrders);
    socket.on("reception:order-new", onOrderNew);
    socket.on("reception:order-updated", onOrderUpdated);
    socket.on("reception:order-deleted", onOrderDeleted);

    socket.emit("reception:join", { branchId });
    socket.emit("reception:reservations-list", { branchId });
    socket.emit("reception:orders-list", { branchId });

    return () => {
      socket.off("auth:error", onAuthError);
      socket.off("reception:chats", onChats);
      socket.off("reception:chat-updated", onChatUpdate);
      socket.off("reception:chat-deleted", onChatDeleted);
      socket.off("reception:purge-done", onPurgeDone);
      socket.off("reception:reservations", onReservations);
      socket.off("reception:reservation-new", onReservationNew);
      socket.off("reception:reservation-updated", onReservationUpdated);
      socket.off("reception:reservation-deleted", onReservationDeleted);
      socket.off("reception:orders", onOrders);
      socket.off("reception:order-new", onOrderNew);
      socket.off("reception:order-updated", onOrderUpdated);
      socket.off("reception:order-deleted", onOrderDeleted);
    };
  }, [branchId, signOut, navigate]);

  const selected = chats.find((c) => c.customerId === selectedId) ?? null;

  const newChatsCount = useMemo(
    () => chats.filter((c) => c.status === "new").length,
    [chats],
  );
  const pendingReservationsCount = useMemo(
    () => reservations.filter((r) => r.status === "pending").length,
    [reservations],
  );
  const awaitingPaymentCount = useMemo(
    () => orders.filter((o) => o.status === "awaiting_payment").length,
    [orders],
  );
  const customerConfirmedCount = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "awaiting_payment" && o.customerConfirmedAt,
      ).length,
    [orders],
  );
  const activeOrdersCount = useMemo(
    () =>
      orders.filter((o) =>
        ["awaiting_payment", "new", "preparing", "ready"].includes(o.status),
      ).length,
    [orders],
  );
  const deliveriesCount = useMemo(
    () => orders.filter((o) => o.status === "out_for_delivery").length,
    [orders],
  );

  function sendReply() {
    const text = reply.trim();
    if (!text || !selected) return;
    getSocket().emit("reception:reply", {
      branchId,
      customerId: selected.customerId,
      text,
    });
    setReply("");
  }

  function handleLogout() {
    signOut();
    resetSocket();
    navigate("/reception/login");
  }

  const greeting = getGreeting(now, t);
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (!session || !branchId) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-soft)] text-[var(--ink)]">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 transform flex-col border-r border-[var(--line)] bg-[var(--card)] transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[var(--line)] p-6">
          <div className="mb-4 flex items-center gap-3">
   <img
  src="/images/city-snack-logo.png"
  alt="City Snack Lounge"
  data-no-dim
  className="logo-light h-10 w-auto object-contain"
/>
<img
  src="/images/city-snack-logo-white.png"
  alt="City Snack Lounge"
  data-no-dim
  className="logo-dark h-10 w-auto object-contain"
/>
            <div>
              <p className="font-serif text-[15px] font-bold leading-tight text-[var(--ink)]">
                City Snack
              </p>
              <p className="-mt-0.5 font-serif text-[15px] font-bold leading-tight text-[var(--ink)]">
                Lounge
              </p>
            </div>
          </div>

          <div className="border-t border-[var(--line)] pt-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
              {t("reception.portal")}
            </p>
            <p className="text-xs text-[var(--muted)]">{dateStr}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          <NavItem
            icon={<IconGrid />}
            label={t("reception.nav.overview")}
            active={section === "overview"}
            onClick={() => {
              setSection("overview");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={<IconChat />}
            label={t("reception.nav.chats")}
            badge={newChatsCount}
            active={section === "chats"}
            onClick={() => {
              setSection("chats");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={<IconCalendar />}
            label={t("reception.nav.reservations")}
            badge={pendingReservationsCount}
            active={section === "reservations"}
            onClick={() => {
              setSection("reservations");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={<IconBag />}
            label={t("reception.nav.orders")}
            badge={activeOrdersCount}
            badgeUrgent={customerConfirmedCount > 0}
            active={section === "orders"}
            onClick={() => {
              setSection("orders");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={<IconTruck />}
            label={t("reception.nav.deliveries")}
            badge={deliveriesCount}
            active={section === "deliveries"}
            onClick={() => {
              setSection("deliveries");
              setSidebarOpen(false);
            }}
          />
        </nav>

        <div className="space-y-2 border-t border-[var(--line)] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg-soft)] px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] font-serif font-bold text-white">
              R
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--ink)]">
                {t("reception.receptionist")}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {branchName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-full bg-[var(--ink)] py-2.5 text-sm font-medium text-[var(--card)] transition hover:opacity-90"
          >
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1">
        {/* HEADER WITH DARK MODE TOGGLE */}
        <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--card)]/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-6 py-5 md:px-10">
            <div className="flex items-center gap-4">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
                  {sectionLabel(section, t)}
                </p>
                <h1 className="font-serif text-xl font-bold text-[var(--ink)] md:text-2xl">
                  {t("reception.console")}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 🔘 DARK MODE TOGGLE BUTTON */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--ink)] hover:bg-[var(--primary)] hover:text-white transition-all"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  // Sun icon for light mode switch
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  // Moon icon for dark mode switch
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>

              <div className="hidden items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-2 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                  {branchName}
                </span>
                <span
                  className="text-xs text-[var(--primary)]/70"
                  title={t("reception.branchLocked")}
                >
                  🔒
                </span>
              </div>

              <button
                onClick={() => navigate(`/${branchId}`)}
                className="hidden rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--card)] sm:inline"
              >
                {t("reception.customerView")}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-6 md:p-10">
          {section === "overview" && (
            <OverviewSection
              branchName={branchName}
              greeting={greeting}
              newChatsCount={newChatsCount}
              pendingReservationsCount={pendingReservationsCount}
              activeOrdersCount={activeOrdersCount}
              deliveriesCount={deliveriesCount}
              awaitingPaymentCount={awaitingPaymentCount}
              customerConfirmedCount={customerConfirmedCount}
              onNavigate={setSection}
            />
          )}

          {section === "chats" && (
            <ChatsSection
              branchName={branchName}
              branchId={branchId}
              chats={chats}
              selected={selected}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              reply={reply}
              setReply={setReply}
              onSend={sendReply}
            />
          )}

          {section === "reservations" && (
            <ReservationsSection
              branchName={branchName}
              branchId={branchId}
              reservations={reservations}
            />
          )}

          {section === "orders" && (
            <OrdersSection
              branchName={branchName}
              branchId={branchId}
              orders={orders}
            />
          )}

          {section === "deliveries" && (
            <DeliveriesSection
              branchName={branchName}
              branchId={branchId}
              orders={orders}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Overview Section — FIXED DARK MODE HERO
═══════════════════════════════════════════════════════ */

function OverviewSection({
  branchName,
  greeting,
  newChatsCount,
  pendingReservationsCount,
  activeOrdersCount,
  deliveriesCount,
  awaitingPaymentCount,
  customerConfirmedCount,
  onNavigate,
}: {
  branchName: string;
  greeting: string;
  newChatsCount: number;
  pendingReservationsCount: number;
  activeOrdersCount: number;
  deliveriesCount: number;
  awaitingPaymentCount: number;
  customerConfirmedCount: number;
  onNavigate: (section: Section) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-10">
      {/* 🎨 FIXED HERO CARD — uses var(--card), not hardcoded white */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] p-10 shadow-xl md:p-14">
        {/* Decorative blobs that adapt to theme */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />

        <div className="relative">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
            {branchName}
          </p>
          <h2 className="mb-4 font-serif text-4xl font-bold leading-tight text-[var(--ink)] md:text-6xl">
            {greeting}.
          </h2>
          <p className="max-w-xl text-lg text-[var(--muted)]">
            {t("reception.overview.subtitle")}
          </p>

          {/* URGENT: Customer confirmed payment banner */}
          {customerConfirmedCount > 0 && (
            <button
              onClick={() => onNavigate("orders")}
              className="mt-6 flex items-center gap-3 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
            >
              <span className="animate-pulse text-xl">🔔</span>
              <span>
                {customerConfirmedCount} customer{customerConfirmedCount > 1 ? "s say they've" : " says they've"} paid — verify now!
              </span>
              <IconArrow />
            </button>
          )}

          {awaitingPaymentCount > 0 && customerConfirmedCount === 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-2 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
              <span className="font-medium text-[var(--ink)]">
                {awaitingPaymentCount} MoMo payment{awaitingPaymentCount > 1 ? "s" : ""} waiting for customer to pay
              </span>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("chats")}
              className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              {t("reception.overview.openChats")}
              <IconArrow />
            </button>
            <button
              onClick={() => onNavigate("reservations")}
              className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--bg-soft)]"
            >
              {t("reception.overview.viewReservations")}
            </button>
            <button
              onClick={() => onNavigate("orders")}
              className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--bg-soft)]"
            >
              {t("reception.overview.viewOrders")}
            </button>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
          {t("reception.overview.liveSnapshot")}
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("reception.stat.messages")}
            value={newChatsCount}
            hint={t("reception.stat.messagesHint")}
            accent="orange"
            onClick={() => onNavigate("chats")}
          />
          <StatCard
            label={t("reception.stat.reservations")}
            value={pendingReservationsCount}
            hint={t("reception.stat.reservationsHint")}
            accent="purple"
            onClick={() => onNavigate("reservations")}
          />
          <StatCard
            label={t("reception.stat.kitchen")}
            value={activeOrdersCount}
            hint={t("reception.stat.kitchenHint")}
            accent="blue"
            onClick={() => onNavigate("orders")}
          />
          <StatCard
            label={t("reception.stat.dispatch")}
            value={deliveriesCount}
            hint={t("reception.stat.dispatchHint")}
            accent="green"
            onClick={() => onNavigate("deliveries")}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Stat Card Component
═══════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  hint: string;
  accent: "orange" | "purple" | "blue" | "green";
  onClick: () => void;
}) {
  const dots = {
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] p-7 text-left transition-all hover:border-[var(--primary)]/50 hover:shadow-md"
    >
      <div className="relative">
        <div className="mb-5 flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 animate-pulse rounded-full ${dots[accent]}`}
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
            {label}
          </p>
        </div>

        <p className="mb-3 font-serif text-6xl font-bold tracking-tight text-[var(--ink)]">
          {value}
        </p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">{hint}</p>
          <span className="text-[var(--ink)] opacity-0 transition group-hover:opacity-100">
            <IconArrow />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Chats Section
═══════════════════════════════════════════════════════ */

function ChatsSection({
  branchName,
  branchId,
  chats,
  selected,
  selectedId,
  setSelectedId,
  reply,
  setReply,
  onSend,
}: {
  branchName: string;
  branchId: string;
  chats: Chat[];
  selected: Chat | null;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  reply: string;
  setReply: (v: string) => void;
  onSend: () => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "new" | "in_progress" | "closed">("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filteredChats = useMemo(() => {
    let result = chats;
    if (filter !== "all") result = result.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [chats, filter, search]);

  const counts = useMemo(
    () => ({
      all: chats.length,
      new: chats.filter((c) => c.status === "new").length,
      in_progress: chats.filter((c) => c.status === "in_progress").length,
      closed: chats.filter((c) => c.status === "closed").length,
    }),
    [chats],
  );

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 2500);
  }

  function setStatus(customerId: string, status: "closed" | "in_progress") {
    getSocket().emit("reception:chat-status", { branchId, customerId, status });
    showToast(status === "closed" ? t("chat.toast.closed") : t("chat.toast.reopened"));
  }

  function deleteConversation(customerId: string) {
    getSocket().emit("reception:chat-delete", { branchId, customerId });
    setConfirmDelete(null);
    if (selectedId === customerId) setSelectedId(null);
    showToast(t("chat.toast.deleted"));
  }

  function purgeOld() {
    if (!window.confirm(t("chat.confirm.purge"))) return;
    getSocket().emit("reception:purge-closed", { branchId, olderThanDays: 7 });
    showToast(t("chat.toast.purged"));
  }

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    new: t("chat.status.new"),
    in_progress: t("chat.status.active"),
    closed: t("chat.status.closed"),
  };

  return (
    <div className="relative space-y-4 sm:space-y-6">
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-xs text-[var(--card)] shadow-lg sm:left-auto sm:right-6 sm:top-24 sm:translate-x-0 sm:px-5 sm:py-3 sm:text-sm">
          {toast}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
          {branchName} · {t("reception.section.messages")}
        </p>
        <h2 className="mb-2 font-serif text-2xl font-bold text-[var(--ink)] sm:text-4xl">
          {t("chat.inbox.title")}
        </h2>
        <p className="text-sm text-[var(--muted)] sm:text-base">{t("chat.inbox.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="-mx-1 flex gap-1 overflow-x-auto rounded-full border border-[var(--line)] bg-[var(--card)] p-1 sm:mx-0 sm:overflow-visible">
          {(["all", "new", "in_progress", "closed"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 ${
                filter === item
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--ink)] hover:bg-[var(--bg-soft)]"
              }`}
            >
              {filterLabels[item]}
              <span className="ml-1.5 text-[10px] opacity-70">({counts[item]})</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder={t("chat.search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0 rounded-full border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2 text-sm text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none sm:min-w-[200px] sm:max-w-xs sm:flex-1"
        />

        {counts.closed > 0 && (
          <button
            onClick={purgeOld}
            className="self-start rounded-full border border-[var(--line)] px-4 py-2 text-xs text-[var(--muted)] transition hover:border-red-300 hover:text-red-600 sm:self-auto"
          >
            🧹 {t("chat.purge")}
          </button>
        )}
      </div>

      <div className="grid h-[calc(100vh-320px)] min-h-[500px] grid-cols-1 gap-4 sm:gap-5 md:h-[calc(100vh-360px)] md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]">
        {/* Conversations List */}
        <div className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] sm:rounded-3xl md:min-h-0">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3 sm:px-5 sm:py-4">
            <p className="truncate font-serif font-bold text-[var(--ink)]">{t("chat.conversations")}</p>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {filteredChats.length} {t("common.shown")}
            </span>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto p-2 sm:p-3">
            {filteredChats.map((chat) => {
              const last = chat.messages[chat.messages.length - 1];
              const active = selectedId === chat.customerId;
              const time = last
                ? new Date(last.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              const initial = chat.customerName.charAt(0).toUpperCase();

              const statusPill = {
                new: { text: t("chat.status.new"), className: "bg-orange-500 text-white" },
                in_progress: { text: t("chat.status.active"), className: "bg-blue-500 text-white" },
                closed: { text: t("chat.status.closed"), className: "bg-neutral-400 text-white" },
              }[chat.status];

              return (
                <div
                  key={chat.customerId}
                  className={`group rounded-2xl border transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-transparent hover:border-[var(--line)] hover:bg-[var(--bg-soft)]"
                  }`}
                >
                  <button
                    onClick={() => setSelectedId(chat.customerId)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif font-bold ${
                          active
                            ? "bg-[var(--primary)] text-white"
                            : chat.status === "closed"
                              ? "bg-[var(--bg-soft)] text-[var(--muted)]"
                              : "bg-[var(--bg-soft)] text-[var(--ink)]"
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                          <strong
                            className={`truncate font-serif text-sm ${
                              chat.status === "closed" ? "text-[var(--muted)]" : "text-[var(--ink)]"
                            }`}
                          >
                            {chat.customerName}
                          </strong>
                          <span className="shrink-0 text-[10px] tracking-wide text-[var(--muted)]">
                            {time}
                          </span>
                        </div>
                        <p className="mb-1.5 truncate text-xs text-[var(--muted)]">
                          {last?.text ?? t("chat.noMessages")}
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${statusPill.className}`}
                        >
                          {statusPill.text}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-wrap gap-1 px-3 pb-2">
                    {chat.status !== "closed" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatus(chat.customerId, "closed");
                        }}
                        className="rounded-full bg-[var(--bg-soft)] px-2 py-1 text-[10px] text-[var(--ink)] hover:opacity-80"
                      >
                        ✓ {t("common.close")}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatus(chat.customerId, "in_progress");
                        }}
                        className="rounded-full bg-blue-100 px-2 py-1 text-[10px] text-blue-700 hover:bg-blue-200"
                      >
                        ↺ {t("common.reopen")}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(chat.customerId);
                      }}
                      className="rounded-full bg-red-50 px-2 py-1 text-[10px] text-red-600 hover:bg-red-100"
                    >
                      🗑 {t("common.delete")}
                    </button>
                  </div>

                  {confirmDelete === chat.customerId && (
                    <div className="px-3 pb-3">
                      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3 text-xs">
                        <p className="mb-2 font-medium text-[var(--ink)]">{t("chat.confirm.deleteTitle")}</p>
                        <p className="mb-2 text-[11px] text-[var(--muted)]">{t("chat.confirm.deleteBody")}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(chat.customerId);
                            }}
                            className="flex-1 rounded-full bg-red-600 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
                          >
                            {t("common.yesDelete")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            className="flex-1 rounded-full border border-[var(--line)] bg-[var(--card)] py-1.5 text-[11px] font-medium text-[var(--ink)] hover:bg-[var(--bg-soft)]"
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredChats.length === 0 && (
              <div className="py-16 text-center">
                <p className="mb-2 font-serif italic text-[var(--muted)]">
                  {search ? t("chat.empty.search") : t("chat.empty.none")}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {search ? t("chat.empty.searchHint") : t("chat.empty.filterHint")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] sm:rounded-3xl md:min-h-0">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] font-serif font-bold text-white">
                  {selected.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base font-bold leading-tight text-[var(--ink)] sm:text-lg">
                    {selected.customerName}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                    {selected.status === "new"
                      ? t("chat.status.newConv")
                      : selected.status === "closed"
                        ? t("chat.status.closed")
                        : t("chat.status.active")}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {selected.status !== "closed" ? (
                    <button
                      onClick={() => setStatus(selected.customerId, "closed")}
                      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--bg-soft)]"
                    >
                      ✓ {t("common.close")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(selected.customerId, "in_progress")}
                      className="rounded-full border border-blue-200 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50"
                    >
                      ↺ {t("common.reopen")}
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(selected.customerId)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg-soft)] p-4 sm:p-6">
                {selected.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.from === "reception" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${
                        m.from === "reception" ? "items-end" : "items-start"
                      }`}
                    >
                      <span
                        className={`inline-block break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          m.from === "reception"
                            ? "rounded-br-md bg-[var(--primary)] text-white"
                            : "rounded-bl-md border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                        }`}
                      >
                        {m.text}
                      </span>
                      <span className="mt-1 px-1 text-[10px] text-[var(--muted)]">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selected.status !== "closed" ? (
                <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--card)] p-3 sm:p-4">
                  <input
                    className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--ink)] transition focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 sm:px-5 sm:py-3"
                    placeholder={t("chat.reply.placeholder")}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                  />
                  <button
                    onClick={onSend}
                    className="shrink-0 rounded-full bg-[var(--primary)] px-5 text-sm font-medium text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-90 sm:px-7"
                  >
                    {t("common.send")}
                  </button>
                </div>
              ) : (
                <div className="border-t border-[var(--line)] bg-[var(--bg-soft)] p-4 text-center">
                  <p className="font-serif text-sm italic text-[var(--muted)]">
                    {t("chat.closedNotice")}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center sm:p-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <IconChat />
              </div>
              <p className="font-serif text-lg italic text-[var(--muted)]">{t("chat.selectPrompt")}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{t("chat.selectHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Reservations Section
═══════════════════════════════════════════════════════ */

function ReservationsSection({
  branchName,
  branchId,
  reservations,
}: {
  branchName: string;
  branchId: string;
  reservations: Reservation[];
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "seated" | "cancelled"
  >("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filteredReservations = useMemo(() => {
    let result = reservations;
    if (filter !== "all") result = result.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.date.toLowerCase().includes(q),
      );
    }
    return result;
  }, [reservations, filter, search]);

  const counts = useMemo(
    () => ({
      all: reservations.length,
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      seated: reservations.filter((r) => r.status === "seated").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    }),
    [reservations],
  );

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 2500);
  }

  function setStatus(id: string, status: Reservation["status"]) {
    getSocket().emit("reception:reservation-status", { branchId, id, status });
    const messages: Record<Reservation["status"], string> = {
      pending: t("res.toast.pending"),
      confirmed: t("res.toast.confirmed"),
      seated: t("res.toast.seated"),
      cancelled: t("res.toast.cancelled"),
    };
    showToast(messages[status]);
  }

  function deleteReservation(id: string) {
    if (!window.confirm(t("res.confirm.delete"))) return;
    getSocket().emit("reception:reservation-delete", { branchId, id });
    showToast(t("res.toast.deleted"));
  }

  const statusPill: Record<Reservation["status"], { text: string; className: string }> = {
    pending: { text: t("res.status.pending"), className: "bg-orange-500 text-white" },
    confirmed: { text: t("res.status.confirmed"), className: "bg-blue-500 text-white" },
    seated: { text: t("res.status.seated"), className: "bg-green-500 text-white" },
    cancelled: { text: t("res.status.cancelled"), className: "bg-neutral-400 text-white" },
  };

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    pending: t("res.status.pending"),
    confirmed: t("res.status.confirmed"),
    seated: t("res.status.seated"),
    cancelled: t("res.status.cancelled"),
  };

  return (
    <div className="relative space-y-6">
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
          {branchName} · {t("reception.section.bookings")}
        </p>
        <h2 className="mb-2 font-serif text-4xl font-bold text-[var(--ink)]">{t("res.title")}</h2>
        <p className="text-[var(--muted)]">{t("res.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-1 sm:rounded-full">
          {(["all", "pending", "confirmed", "seated", "cancelled"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                filter === item
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--ink)] hover:bg-[var(--bg-soft)]"
              }`}
            >
              {filterLabels[item]}
              <span className="ml-1.5 text-[10px] opacity-70">({counts[item]})</span>
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("res.search.placeholder")}
          className="min-w-[220px] max-w-sm flex-1 rounded-full border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2 text-sm text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredReservations.map((r) => (
          <div
            key={r._id}
            className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 transition hover:border-[var(--primary)]/50 hover:shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-serif text-lg font-bold text-[var(--ink)]">{r.name}</p>
                <a
                  href={`tel:${r.phone}`}
                  className="mt-0.5 block text-xs text-[var(--muted)] hover:text-[var(--primary)]"
                >
                  {r.phone}
                </a>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
                  statusPill[r.status].className
                }`}
              >
                {statusPill[r.status].text}
              </span>
            </div>

            <div className="mb-5 space-y-3 rounded-2xl bg-[var(--bg-soft)] p-4 text-sm">
              <div className="flex items-center gap-3 text-[var(--ink)]">
                <span>📅</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {t("res.date")}
                  </p>
                  <p className="font-medium">
                    {r.date} {t("common.at")} {r.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[var(--ink)]">
                <span>👥</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {t("res.party")}
                  </p>
                  <p className="font-medium">
                    {r.guests} {r.guests === 1 ? t("res.guest") : t("res.guests")}
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-4 text-[10px] text-[var(--muted)]">
              {t("common.received")} {new Date(r.createdAt).toLocaleString()}
            </p>

            <div className="flex flex-wrap gap-2">
              {r.status === "pending" && (
                <button
                  onClick={() => setStatus(r._id, "confirmed")}
                  className="min-w-[110px] flex-1 rounded-full bg-blue-500 py-2 text-xs font-medium text-white transition hover:bg-blue-600"
                >
                  ✓ {t("res.action.confirm")}
                </button>
              )}
              {r.status === "confirmed" && (
                <button
                  onClick={() => setStatus(r._id, "seated")}
                  className="min-w-[110px] flex-1 rounded-full bg-green-500 py-2 text-xs font-medium text-white transition hover:bg-green-600"
                >
                  🪑 {t("res.action.seat")}
                </button>
              )}
              {r.status === "cancelled" && (
                <button
                  onClick={() => setStatus(r._id, "pending")}
                  className="min-w-[100px] flex-1 rounded-full border border-blue-200 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  ↺ {t("common.reopen")}
                </button>
              )}
              {r.status !== "cancelled" && r.status !== "seated" && (
                <button
                  onClick={() => setStatus(r._id, "cancelled")}
                  className="min-w-[80px] flex-1 rounded-full border border-[var(--line)] py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--bg-soft)]"
                >
                  {t("common.cancel")}
                </button>
              )}
              <button
                onClick={() => deleteReservation(r._id)}
                className="rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                🗑
              </button>
            </div>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <div className="col-span-full rounded-3xl border border-[var(--line)] bg-[var(--card)] py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <IconCalendar />
            </div>
            <p className="mb-2 font-serif text-lg italic text-[var(--muted)]">
              {search ? t("res.empty.search") : t("res.empty.none")}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {search ? t("res.empty.searchHint") : t("res.empty.noneHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Orders Section
═══════════════════════════════════════════════════════ */

function OrdersSection({
  branchName,
  branchId,
  orders,
}: {
  branchName: string;
  branchId: string;
  orders: Order[];
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | Order["status"]>("awaiting_payment");
  const [toast, setToast] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      awaiting_payment: orders.filter((o) => o.status === "awaiting_payment").length,
      new: orders.filter((o) => o.status === "new").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      out_for_delivery: orders.filter((o) => o.status === "out_for_delivery").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders],
  );

  const customerConfirmedCount = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "awaiting_payment" && o.customerConfirmedAt,
      ).length,
    [orders],
  );

  const ORDER_STATUS_PILL: Record<Order["status"], { text: string; className: string }> = {
    awaiting_payment: {
      text: t("order.status.awaitingPayment"),
      className: "bg-yellow-500 text-white",
    },
    new: { text: t("order.status.new"), className: "bg-orange-500 text-white" },
    preparing: { text: t("order.status.preparing"), className: "bg-yellow-600 text-white" },
    ready: { text: t("order.status.ready"), className: "bg-blue-500 text-white" },
    out_for_delivery: {
      text: t("order.status.outForDelivery"),
      className: "bg-purple-500 text-white",
    },
    delivered: { text: t("order.status.delivered"), className: "bg-green-500 text-white" },
    cancelled: { text: t("order.status.cancelled"), className: "bg-neutral-400 text-white" },
  };

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    awaiting_payment: t("order.status.awaitingPayment"),
    new: t("order.status.new"),
    preparing: t("order.status.preparing"),
    ready: t("order.status.ready"),
    out_for_delivery: t("order.status.outForDelivery"),
    delivered: t("order.status.delivered"),
    cancelled: t("order.status.cancelled"),
  };

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 2500);
  }

  function advance(order: Order) {
    const next = ORDER_FLOW[order.status];
    if (!next) return;
    getSocket().emit("reception:order-status", {
      branchId,
      id: order._id,
      status: next,
    });
    showToast(`${order.orderCode} → ${next.replace(/_/g, " ")}`);
  }

  function cancel(order: Order) {
    if (!window.confirm(t("order.confirm.cancel", { code: order.orderCode }))) return;
    getSocket().emit("reception:order-status", {
      branchId,
      id: order._id,
      status: "cancelled",
    });
    showToast(t("order.toast.cancelled"));
  }

  function remove(order: Order) {
    if (!window.confirm(t("order.confirm.delete", { code: order.orderCode }))) return;
    getSocket().emit("reception:order-delete", { branchId, id: order._id });
    showToast(t("order.toast.deleted"));
  }

  function confirmPayment(order: Order) {
    getSocket().emit("reception:order-confirm-payment", {
      branchId,
      id: order._id,
    });
    showToast(`💰 Payment confirmed for ${order.orderCode}`);
  }

  function rejectPayment(order: Order) {
    if (
      !window.confirm(
        `Reject payment for ${order.orderCode}? This will cancel the order.`,
      )
    )
      return;
    getSocket().emit("reception:order-reject-payment", {
      branchId,
      id: order._id,
    });
    showToast(`❌ Payment rejected for ${order.orderCode}`);
  }

  return (
    <div className="relative space-y-6">
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
          {branchName} · {t("reception.section.kitchen")}
        </p>
        <h2 className="mb-2 font-serif text-4xl font-bold text-[var(--ink)]">
          {t("order.title")}
        </h2>
        <p className="text-[var(--muted)]">{t("order.subtitle")}</p>
      </div>

      {customerConfirmedCount > 0 && (
        <div className="rounded-2xl border-2 border-orange-500 bg-orange-50 p-4 shadow-lg dark:bg-orange-950/30">
          <div className="flex items-center gap-2">
            <span className="animate-pulse text-2xl">🔔</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                {customerConfirmedCount} customer{customerConfirmedCount > 1 ? "s say they've" : " says they've"} paid!
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Check your MTN SMS and click "Confirm Payment" on their order below.
              </p>
            </div>
          </div>
        </div>
      )}

      {counts.awaiting_payment > 0 && customerConfirmedCount === 0 && (
        <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-950/30">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
              {counts.awaiting_payment} MoMo payment{counts.awaiting_payment > 1 ? "s" : ""} waiting for customer to pay
            </p>
          </div>
        </div>
      )}

      <div className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--line)] bg-[var(--card)] p-0.5">
        {(
          [
            "all",
            "awaiting_payment",
            "new",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ] as const
        ).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              filter === item
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--ink)] hover:bg-[var(--bg-soft)]"
            }`}
          >
            {filterLabels[item]}
            <span className="ml-1 text-[9px] opacity-70">({counts[item]})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => {
          const next = ORDER_FLOW[order.status];
          const isAwaitingPayment = order.status === "awaiting_payment";
          const isMomo = order.paymentMethod === "momo";
          const customerSaidPaid = !!order.customerConfirmedAt;

          return (
            <div
              key={order._id}
              className={`rounded-3xl border-2 p-6 transition hover:shadow-sm ${
                isAwaitingPayment && customerSaidPaid
                  ? "border-orange-500 bg-orange-50/50 shadow-lg dark:bg-orange-950/30"
                  : isAwaitingPayment
                    ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/30"
                    : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--primary)]/50"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-lg font-bold text-[var(--ink)]">
                    {order.orderCode}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {order.type === "delivery"
                      ? `🛵 ${t("order.type.delivery")}`
                      : `🏃 ${t("order.type.pickup")}`}
                    <span className="ml-2">· {timeAgo(order.createdAt)}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    ORDER_STATUS_PILL[order.status].className
                  }`}
                >
                  {ORDER_STATUS_PILL[order.status].text}
                </span>
              </div>

              <div className="mb-4">
                <p className="font-serif text-sm font-medium text-[var(--ink)]">
                  {order.customerName}
                </p>
                <a
                  href={`tel:${order.phone}`}
                  className="text-xs text-[var(--muted)] hover:text-[var(--primary)]"
                >
                  📞 {order.phone}
                </a>
                {order.type === "delivery" && order.address && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    📍 {order.address}
                  </p>
                )}
              </div>

              <ul className="mb-4 space-y-1 rounded-2xl bg-[var(--bg-soft)] p-3 text-sm text-[var(--ink)]">
                {(Array.isArray(order.items) ? order.items : []).map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.qty}× {item.name}</span>
                    <span className="text-[var(--muted)]">
                      {formatRWF(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-2 text-xs text-orange-800 dark:border-orange-900 dark:bg-orange-950/40">
                  📝 {order.notes}
                </p>
              )}

              {isMomo && (
                <div
                  className={`mb-4 rounded-2xl border-2 p-3 ${
                    order.paymentStatus === "paid"
                      ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                      : order.paymentStatus === "failed"
                        ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                        : "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--ink)]">
                      📱 MTN Mobile Money
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        order.paymentStatus === "paid"
                          ? "bg-green-500 text-white"
                          : order.paymentStatus === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-white"
                      }`}
                    >
                      {order.paymentStatus === "paid"
                        ? "✓ Paid"
                        : order.paymentStatus === "failed"
                          ? "✕ Failed"
                          : "⏳ Pending"}
                    </span>
                  </div>

                  {isAwaitingPayment && (
                    <>
                      {customerSaidPaid && (
                        <div className="mb-2 flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-md">
                          <span className="animate-pulse text-base">🔔</span>
                          <div className="flex-1">
                            <p>Customer says they paid!</p>
                            <p className="text-[10px] font-normal opacity-90">
                              {timeAgo(order.customerConfirmedAt!)} — check your MTN SMS
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl bg-white p-3 text-xs dark:bg-[var(--card)]">
                        <p className="mb-1.5 font-semibold text-[var(--ink)]">
                          💡 Match your MTN SMS with:
                        </p>
                        <div className="space-y-1 font-mono">
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Amount:</span>
                            <span className="font-bold text-[var(--primary)]">
                              {formatRWF(order.total)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Phone:</span>
                            <span className="font-bold text-[var(--ink)]">
                              {order.phone}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted)]">Name:</span>
                            <span className="font-bold text-[var(--ink)]">
                              {order.customerName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {order.paymentStatus === "paid" && order.paidAt && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      ✓ Confirmed {timeAgo(order.paidAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="mb-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
                <span className="text-xs text-[var(--muted)]">{t("common.total")}</span>
                <span className="font-serif text-xl font-bold text-[var(--ink)]">
                  {formatRWF(order.total)}
                </span>
              </div>

              {isAwaitingPayment && isMomo ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmPayment(order)}
                    className={`flex-1 rounded-full py-2.5 text-xs font-semibold text-white transition ${
                      customerSaidPaid
                        ? "animate-pulse bg-green-500 hover:bg-green-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    ✓ Confirm Payment Received
                  </button>
                  <button
                    onClick={() => rejectPayment(order)}
                    className="rounded-full border border-red-300 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    ✕ Reject
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {next && (
                    <button
                      onClick={() => advance(order)}
                      className="min-w-[130px] flex-1 rounded-full bg-[var(--ink)] py-2 text-xs font-medium text-[var(--card)] transition hover:bg-[var(--primary)]"
                    >
                      {t("order.action.moveTo")} {next.replace(/_/g, " ")}
                    </button>
                  )}

                  {order.type === "delivery" && (
                    <button
                      onClick={() => printDeliveryTicket(order, branchName)}
                      className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-2 text-xs font-medium text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
                    >
                      🖨 Print
                    </button>
                  )}

                  {order.status !== "cancelled" && order.status !== "delivered" && (
                    <button
                      onClick={() => cancel(order)}
                      className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--bg-soft)]"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => remove(order)}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full rounded-3xl border border-[var(--line)] bg-[var(--card)] py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <IconBag />
            </div>
            <p className="mb-2 font-serif text-lg italic text-[var(--muted)]">
              {t("order.empty.none")}
            </p>
            <p className="text-sm text-[var(--muted)]">{t("order.empty.hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Deliveries Section
═══════════════════════════════════════════════════════ */

function DeliveriesSection({
  branchName,
  branchId,
  orders,
}: {
  branchName: string;
  branchId: string;
  orders: Order[];
}) {
  const { t } = useLanguage();
  const [toast, setToast] = useState<string | null>(null);
  const deliveries = orders.filter((o) => o.status === "out_for_delivery");

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 2500);
  }

  function markDelivered(order: Order) {
    getSocket().emit("reception:order-status", {
      branchId,
      id: order._id,
      status: "delivered",
    });
    showToast(`${order.orderCode} ${t("delivery.toast.delivered")}`);
  }

  return (
    <div className="relative space-y-6">
      {toast && (
        <div className="fixed right-6 top-24 z-50 rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--card)] shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
          {branchName} · {t("reception.section.dispatch")}
        </p>
        <h2 className="mb-2 font-serif text-4xl font-bold text-[var(--ink)]">
          {t("delivery.title")}
        </h2>
        <p className="text-[var(--muted)]">{t("delivery.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {deliveries.map((order) => (
          <div
            key={order._id}
            className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="font-serif text-xl font-bold text-[var(--ink)]">
                {order.orderCode}
              </span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {t("delivery.onTheWay")}
              </span>
            </div>

            <div className="mb-4">
              <p className="font-serif text-lg text-[var(--ink)]">{order.customerName}</p>
              <a
                href={`tel:${order.phone}`}
                className="text-xs text-[var(--muted)] hover:text-[var(--primary)]"
              >
                {order.phone}
              </a>
              {order.address && (
                <p className="mt-2 rounded-xl bg-[var(--bg-soft)] p-3 text-sm text-[var(--ink)]">
                  📍 {order.address}
                </p>
              )}
            </div>

            {order.paymentMethod === "momo" && (
              <div className="mb-3 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-xs dark:bg-green-950/20">
                <span className="text-green-800 dark:text-green-200">📱 Paid via MoMo</span>
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                  ✓ Paid
                </span>
              </div>
            )}

            <div className="mb-5 flex items-center justify-between border-t border-[var(--line)] pt-3">
              <span className="text-xs text-[var(--muted)]">{t("common.total")}</span>
              <span className="font-serif text-xl font-bold text-[var(--ink)]">
                {formatRWF(order.total)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => printDeliveryTicket(order, branchName)}
                className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-4 py-3 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
              >
                🖨 {t("order.action.print")}
              </button>
              <button
                onClick={() => markDelivered(order)}
                className="flex-1 rounded-full bg-green-500 py-3 text-sm font-medium text-white transition hover:bg-green-600"
              >
                ✓ {t("delivery.markDelivered")}
              </button>
            </div>
          </div>
        ))}

        {deliveries.length === 0 && (
          <div className="col-span-full rounded-3xl border border-[var(--line)] bg-[var(--card)] py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <IconTruck />
            </div>
            <p className="mb-2 font-serif text-lg italic text-[var(--muted)]">
              {t("delivery.empty.none")}
            </p>
            <p className="text-sm text-[var(--muted)]">{t("delivery.empty.hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Helpers & Icons
═══════════════════════════════════════════════════════ */

function getGreeting(date: Date, t: (k: string) => string) {
  const hour = date.getHours();
  if (hour < 12) return t("greeting.morning");
  if (hour < 18) return t("greeting.afternoon");
  return t("greeting.evening");
}

function sectionLabel(section: Section, t: (k: string) => string) {
  return {
    overview: t("reception.nav.overview"),
    chats: t("reception.section.messages"),
    reservations: t("reception.section.bookings"),
    orders: t("reception.section.kitchen"),
    deliveries: t("reception.section.dispatch"),
  }[section];
}

function NavItem({
  icon,
  label,
  badge,
  badgeUrgent,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeUrgent?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
        active
          ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/25"
          : "text-[var(--ink)] hover:bg-[var(--bg-soft)]"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`transition ${
            active
              ? "text-white"
              : "text-[var(--muted)] group-hover:text-[var(--primary)]"
          }`}
        >
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </span>

      {badge !== undefined && badge > 0 && (
        <span
          className={`min-w-[22px] rounded-full px-2 py-0.5 text-center text-[10px] font-bold ${
            active
              ? "bg-white text-[var(--primary)]"
              : badgeUrgent
                ? "animate-pulse bg-orange-500 text-white"
                : "bg-[var(--primary)] text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// Icons remain unchanged...
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}