import { useLanguage } from "../context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg-soft)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/images/city-snack-logo.png" alt="City Snack Lounge" className="h-8 w-auto" loading="lazy" />
          <p>{t("footer.copy")}</p>
        </div>
        <p>{t("footer.hours")}</p>
      </div>
    </footer>
  );
}
