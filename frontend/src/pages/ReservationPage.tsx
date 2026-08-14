import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { PageHero } from "../components/ui/PageHero";
import { useActiveBranchData } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";
import { postApi } from "../services/api";

export function ReservationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const branch = useActiveBranchData();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[var(--bg-soft)]">
      {/* ═══════════════════════════════════════════════
          HERO — no watermark
      ═══════════════════════════════════════════════ */}
      <PageHero
  eyebrow={t("reservation.eyebrow")}
  title={t("reservation.title")}
  accentWord={branch.name}
  accentPosition="after"
  subtitle={t("reservation.subtitle", { branch: branch.name })}
  showWatermark={false}
/>

      {/* ═══════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════ */}
      <div className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-stretch"
        >
          {/* ─── LEFT: Info / Trust Panel ─── */}
          <aside className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--primary)]/5 via-[var(--card)] to-[var(--primary)]/10 p-8 shadow-sm sm:p-10">
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
                {branch.name}
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
                A seat is waiting for you.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                Whether it's a quiet dinner or a lively gathering, we'll have
                everything ready before you arrive.
              </p>

              {/* Info list */}
              <ul className="mt-8 space-y-4">
                <InfoRow
                  icon="🕒"
                  label="Open Daily"
                  value="10:00 AM – 11:00 PM"
                />
                <InfoRow
                  icon="📞"
                  label="Need help?"
                  value="Call us for large parties (10+)"
                />
                <InfoRow
                  icon="✅"
                  label="Confirmation"
                  value="You'll receive a confirmation shortly"
                />
              </ul>

              {/* Branch tag */}
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)]/70 px-4 py-2 text-xs font-medium text-[var(--ink)] backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                Booking for {branch.name}
              </div>
            </div>
          </aside>

          {/* ─── RIGHT: Form Card ─── */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm sm:p-10">
            <div className="relative">
              <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                Your details
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                All fields required
              </p>

              <form
                ref={formRef}
                className="mt-6 space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const formData = new FormData(form);

                  setLoading(true);
                  setError("");
                  setSubmitted(false);

                  try {
                    await postApi<{ ok: boolean; message: string }>(
                      "/api/customer/reservations",
                      {
                        branchId: branch.id,
                        name: String(formData.get("name") || ""),
                        phone: String(formData.get("phone") || ""),
                        date: String(formData.get("date") || ""),
                        time: String(formData.get("time") || ""),
                        guests: Number(formData.get("guests") || 1),
                      }
                    );

                    setSubmitted(true);
                    formRef.current?.reset();
                  } catch (requestError: unknown) {
                    setError(
                      requestError instanceof Error
                        ? requestError.message
                        : "Failed to submit reservation"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Field label={t("reservation.name") || "Full name"}>
                  <input
                    required
                    name="name"
                    placeholder="e.g. Sarah Uwimana"
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  />
                </Field>

                <Field label={t("reservation.phone") || "Phone number"}>
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+250 7XX XXX XXX"
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Date">
                    <input
                      required
                      name="date"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    />
                  </Field>
                  <Field label="Time">
                    <input
                      required
                      name="time"
                      type="time"
                      className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    />
                  </Field>
                </div>

                <Field label={t("reservation.guests") || "Number of guests"}>
                  <input
                    required
                    name="guests"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={2}
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  />
                </Field>

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading
                    ? "Submitting..."
                    : t("reservation.submit") || "Confirm Reservation"}
                </Button>

                <p className="text-center text-xs text-[var(--muted)]">
                  By booking, you agree to our reservation policy.
                </p>
              </form>

              {/* Feedback — theme-aware */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
                >
                  {error}
                </motion.div>
              )}

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-3 text-sm font-medium text-[var(--success)]"
                >
                  <span className="text-lg">✓</span>
                  {t("reservation.success", { branch: branch.name })}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

/* ─── Small helpers ───────────────────────────────────── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--card)] text-base shadow-sm">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-[var(--ink)]">{value}</p>
      </div>
    </li>
  );
}