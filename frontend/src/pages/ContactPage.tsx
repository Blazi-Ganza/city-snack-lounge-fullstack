import { Button } from "../components/ui/Button";
import { useActiveBranchData } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";

export function ContactPage() {
  const branch = useActiveBranchData();
  const { t } = useLanguage();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
        {t("contact.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t("contact.subtitle", { branch: branch.name })}
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* ─── Info card ─── */}
        <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {t("contact.phone")}:
            </span>{" "}
            {branch.phone}
          </p>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {t("contact.email")}:
            </span>{" "}
            {branch.email}
          </p>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {t("contact.address")}:
            </span>{" "}
            {branch.address}
          </p>
          <a
            href={`https://wa.me/${branch.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button className="mt-2 w-full">{t("contact.whatsapp")}</Button>
          </a>
        </div>

        {/* ─── Map card ─── */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
          <iframe
            title="Restaurant location"
            src={branch.mapEmbedUrl}
            loading="lazy"
            className="h-[320px] w-full dark:opacity-90 dark:contrast-125"
          />
        </div>
      </div>
    </section>
  );
}