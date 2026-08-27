import { useState } from "react";
import { useBranch } from "../context/BranchContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { postApi } from "../services/api";
import { formatRWF } from "../utils/currency";

/* ═══════════════════════════════════════════════════════
   MoMo Config — CHANGE THESE TO YOUR REAL CODES
═══════════════════════════════════════════════════════ */
const MOMO_CONFIG: Record<
  string,
  { code: string; ussd: string; merchantName: string }
> = {
  huye: {
    code: "123456", // 👈 replace with real Huye MoMo merchant code
    ussd: "*182*8*1*123456#",
    merchantName: "CITY SNACK LOUNGE HUYE",
  },
  musanze: {
    code: "654321",
    ussd: "*182*8*1*654321#",
    merchantName: "CITY SNACK LOUNGE MUSANZE",
  },
};

interface OrderResponse {
  ok: boolean;
  order: { orderCode: string; _id: string };
}

type PaymentMethod = "cash" | "momo";

export function CartDrawer() {
  const { selectedBranch } = useBranch();
  const { t } = useLanguage();
  const {
    items,
    isOpen,
    count,
    total,
    openCart,
    closeCart,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<string | null>(null);
  const [placedMethod, setPlacedMethod] = useState<PaymentMethod>("cash");
  const [placedTotal, setPlacedTotal] = useState(0);
  const [placedName, setPlacedName] = useState("");
  const [placedPhone, setPlacedPhone] = useState("");

  // 🆕 Payment confirmation state
  const [confirming, setConfirming] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);

  const showFloatingButton = count > 0 || isOpen || placed !== null;

  const momo = MOMO_CONFIG[selectedBranch] ?? MOMO_CONFIG.huye;

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await postApi<OrderResponse>("/api/customer/orders", {
        branchId: selectedBranch,
        customerName: name.trim(),
        phone: phone.trim(),
        type,
        address: type === "delivery" ? address.trim() : undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
        total,
        paymentMethod,
      });

      setPlaced(data.order.orderCode);
      setPlacedMethod(paymentMethod);
      setPlacedTotal(total);
      setPlacedName(name.trim());
      setPlacedPhone(phone.trim());
      setPaymentSent(false);
      setConfirming(false);
      clear();
      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("cart.failedOrder");
      console.error("🔴 ORDER FAILED - Full error:", err);
      console.error("🔴 Raw message:", raw);
      const friendly =
        raw.startsWith("[") || raw.includes('"code"')
          ? t("cart.validationError")
          : raw;
      setError(friendly);
    }
  } 

  // 🆕 Notify reception that customer has paid
  async function notifyPaymentSent() {
    if (!placed) return;
    setConfirming(true);
    try {
      await postApi(`/api/customer/orders/${placed}/confirm-payment`, {});
      setPaymentSent(true);
    } catch (err) {
      console.error("Failed to notify reception:", err);
      // Still show success — the order is safe in the database
      setPaymentSent(true);
    } finally {
      setConfirming(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text);
  }

  function closeSuccess() {
    setPlaced(null);
    setPaymentSent(false);
    setConfirming(false);
    closeCart();
  }

  return (
    <>
      {/* Floating cart button */}
      {showFloatingButton && (
        <button
          onClick={openCart}
          className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-3 rounded-full bg-[var(--primary)] px-5 text-white shadow-lg shadow-orange-500/30 transition hover:bg-[var(--primary-hover)]"
        >
          <span className="text-xl">🛒</span>
          <span className="text-sm font-semibold">
            {count > 0
              ? t(count === 1 ? "cart.item" : "cart.items", {
                  count: String(count),
                })
              : t("cart.button")}
          </span>
          {count > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
              {formatRWF(total)}
            </span>
          )}
        </button>
      )}

      {/* Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={closeCart}
        >
          <div
            className="flex h-full w-full max-w-md flex-col bg-[var(--card)] text-[var(--ink)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
              <h2 className="font-display text-xl font-bold text-[var(--ink)]">
                {t("cart.title")}
              </h2>
              <button
                onClick={closeCart}
                className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--ink)]"
                aria-label={t("cart.close")}
              >
                ✕
              </button>
            </div>

            {placed ? (
              /* ═══════════════ SUCCESS SCREEN ═══════════════ */
              placedMethod === "momo" ? (
                paymentSent ? (
                  /* 🎉 AFTER "I HAVE PAID" — success confirmation */
                  <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl dark:bg-green-950/40">
                      🎉
                    </div>

                    <div>
                      <h3 className="font-display text-2xl font-bold text-[var(--ink)]">
                        Payment sent to reception!
                      </h3>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        We're verifying your MoMo SMS. Your order will start
                        being prepared shortly.
                      </p>
                    </div>

                    <div className="w-full rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Your Order Code
                      </p>
                      <p className="mt-1 font-mono text-3xl font-bold text-[var(--primary)]">
                        {placed}
                      </p>
                      <p className="mt-2 text-[11px] text-[var(--muted)]">
                        Save this for pickup
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-xs text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                      <span>Reception is verifying...</span>
                    </div>

                    <button
                      onClick={closeSuccess}
                      className="w-full rounded-full bg-[var(--ink)] py-3 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
                    >
                      {t("cart.close")}
                    </button>
                  </div>
                ) : (
                  /* 📱 MoMo payment instructions — REAL MTN Rwanda flow */
                  <div className="flex flex-1 flex-col overflow-y-auto p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl dark:bg-yellow-950/40">
                        📱
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                          {t("cart.momo.title")}
                        </h3>
                        <p className="text-xs text-[var(--muted)]">
                          {t("cart.momo.subtitle")}
                        </p>
                      </div>
                    </div>

                    {/* Order Code — BIG at top for pickup */}
                    <div className="mb-5 rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        {t("cart.momo.yourOrderCode")}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <p className="font-mono text-3xl font-bold text-[var(--primary)]">
                          {placed}
                        </p>
                        <button
                          onClick={() => copyToClipboard(placed)}
                          className="rounded-lg bg-[var(--primary)]/10 p-2 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/20"
                        >
                          📋
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--muted)]">
                        {t("cart.momo.saveThisCode")}
                      </p>
                    </div>

                    {/* STEP 1 — Tap to dial */}
                    <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
                          1
                        </span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                          {t("cart.momo.step1")}
                        </p>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-[var(--card)] px-3 py-2 font-mono text-sm font-bold text-[var(--ink)]">
                          {momo.ussd}
                        </code>
                        <button
                          onClick={() => copyToClipboard(momo.ussd)}
                          className="rounded-lg bg-[var(--primary)]/10 px-3 py-2 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/20"
                        >
                          📋
                        </button>
                      </div>
                      <a
                        href={`tel:${momo.ussd.replace(/#/g, "%23")}`}
                        className="block rounded-lg bg-[var(--primary)] py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        📞 {t("cart.momo.tapToDial")}
                      </a>
                    </div>

                    {/* STEP 2 — Enter amount */}
                    <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
                          2
                        </span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                          {t("cart.momo.step2")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-[var(--card)] px-3 py-2 font-mono text-2xl font-bold text-[var(--primary)]">
                          {placedTotal.toLocaleString()}
                        </code>
                        <button
                          onClick={() => copyToClipboard(String(placedTotal))}
                          className="rounded-lg bg-[var(--primary)]/10 px-3 py-2 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/20"
                        >
                          📋
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-[var(--muted)]">
                        {t("cart.momo.amountHint", {
                          amount: formatRWF(placedTotal),
                        })}
                      </p>
                    </div>

                    {/* STEP 3 — Verify merchant NAME */}
                    <div className="mb-3 rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-[11px] font-bold text-white">
                          3
                        </span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-yellow-800 dark:text-yellow-200">
                          {t("cart.momo.step3")}
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-dashed border-yellow-400 bg-white p-3 text-center dark:bg-[var(--card)]">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                          {t("cart.momo.shouldShow")}
                        </p>
                        <p className="mt-1 font-mono text-base font-bold text-[var(--ink)]">
                          {momo.merchantName}
                        </p>
                      </div>
                      <p className="mt-2 flex items-start gap-1 text-[11px] text-yellow-800 dark:text-yellow-200">
                        <span>⚠️</span>
                        <span>{t("cart.momo.verifyNameHelp")}</span>
                      </p>
                    </div>

                    {/* STEP 4 — Enter PIN */}
                    <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
                          4
                        </span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                          {t("cart.momo.step4")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--card)] p-3 text-center">
                        <p className="text-2xl">🔐</p>
                        <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                          {t("cart.momo.enterPin")}
                        </p>
                      </div>
                    </div>

                    {/* Waiting indicator */}
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
                      <span className="mt-0.5 h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-yellow-500" />
                      <p>{t("cart.momo.waiting")}</p>
                    </div>

                    {/* 🆕 I HAVE PAID button — calls backend */}
                    <button
                      onClick={notifyPaymentSent}
                      disabled={confirming}
                      className="w-full rounded-full bg-[var(--primary)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {confirming
                        ? "⏳ Notifying reception..."
                        : `✓ ${t("cart.momo.iHavePaid")}`}
                    </button>

                    <p className="mt-3 text-center text-[10px] text-[var(--muted)]">
                      {t("cart.momo.receptionWillConfirm", {
                        name: placedName,
                        phone: placedPhone,
                      })}
                    </p>
                  </div>
                )
              ) : (
                /* 💵 Cash success */
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[var(--ink)]">
                      {t("cart.orderPlaced")}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {t("cart.orderCode")}
                    </p>
                    <p className="mt-2 font-mono text-lg font-bold text-[var(--primary)]">
                      {placed}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {t("cart.orderSaved")}
                  </p>
                  <button
                    onClick={closeSuccess}
                    className="mt-4 rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
                  >
                    {t("cart.close")}
                  </button>
                </div>
              )
            ) : items.length === 0 ? (
              /* Empty */
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[var(--muted)]">
                <p className="font-display text-lg italic">{t("cart.empty")}</p>
                <p className="mt-1 text-sm">{t("cart.emptyHint")}</p>
              </div>
            ) : (
              <>
                {/* Items + form */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--ink)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {formatRWF(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="h-7 w-7 rounded-full bg-[var(--bg-soft)] text-sm text-[var(--ink)] transition hover:bg-[var(--card-hover)]"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-medium text-[var(--ink)]">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="h-7 w-7 rounded-full bg-[var(--bg-soft)] text-sm text-[var(--ink)] transition hover:bg-[var(--card-hover)]"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                    {/* Pickup / Delivery */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setType("pickup")}
                        className={`rounded-full py-2 text-sm font-medium transition ${
                          type === "pickup"
                            ? "bg-[var(--primary)] text-white"
                            : "border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {t("cart.pickup")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("delivery")}
                        className={`rounded-full py-2 text-sm font-medium transition ${
                          type === "delivery"
                            ? "bg-[var(--primary)] text-white"
                            : "border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {t("cart.delivery")}
                      </button>
                    </div>

                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("cart.name")}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
                    />
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("cart.phone")}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
                    />
                    {type === "delivery" && (
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t("cart.address")}
                        className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
                      />
                    )}
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("cart.notes")}
                      rows={2}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
                    />

                    {/* Payment Method Selector */}
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        {t("cart.payment.title")}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cash")}
                          className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition ${
                            paymentMethod === "cash"
                              ? "border-[var(--primary)] bg-[var(--primary)]/5"
                              : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--muted)]"
                          }`}
                        >
                          <span className="text-2xl">💵</span>
                          <span className="text-xs font-semibold text-[var(--ink)]">
                            {t("cart.payment.cash")}
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">
                            {t("cart.payment.cashHint")}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("momo")}
                          className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition ${
                            paymentMethod === "momo"
                              ? "border-[var(--primary)] bg-[var(--primary)]/5"
                              : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--muted)]"
                          }`}
                        >
                          <span className="text-2xl">📱</span>
                          <span className="text-xs font-semibold text-[var(--ink)]">
                            {t("cart.payment.momo")}
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">
                            {t("cart.payment.momoHint")}
                          </span>
                        </button>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </form>
                </div>

                {/* Footer */}
                <div className="border-t border-[var(--line)] bg-[var(--bg-soft)] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">
                      {t("cart.total")}
                    </span>
                    <span className="font-display text-2xl font-bold text-[var(--ink)]">
                      {formatRWF(total)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="w-full rounded-full bg-[var(--primary)] py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                  >
                    {loading
                      ? t("cart.placing")
                      : paymentMethod === "momo"
                        ? `📱 ${t("cart.placeOrderMomo")}`
                        : t("cart.placeOrder")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}