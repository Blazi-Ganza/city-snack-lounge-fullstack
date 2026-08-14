import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { branches } from "../data";
import { type Language, useLanguage } from "../context/LanguageContext";

export function BranchSelectionPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <section className="flex min-h-screen items-center bg-[var(--bg-soft)] px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 flex justify-end">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-sm text-[var(--ink)]"
            >
              <option value="en">{t("lang.english")}</option>
              <option value="fr">{t("lang.french")}</option>
              <option value="rw">{t("lang.kinyarwanda")}</option>
            </select>
          </div> 
             <img
  src="/images/city-snack-logo.png"
  alt="City Snack Lounge"
  data-no-dim
  className="logo-light mx-auto h-24 w-auto object-contain"
/>
<img
  src="/images/city-snack-logo-white.png"
  alt="City Snack Lounge"
  data-no-dim
  className="logo-dark mx-auto h-24 w-auto object-contain"
/>
          
          <h1 className="font-display mt-5 text-center text-3xl font-bold text-[var(--ink)] sm:text-4xl">{t("branch.choose")}</h1>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-[var(--muted)] sm:text-base">
            {t("branch.sub")}
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-[var(--brand-1)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--brand-2)]">{t("branch.label")}</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[var(--ink)]">{branch.city}</h2>
              <p className="mt-3 text-sm text-[var(--muted)]">{t(`branch.${branch.id}.subtitle`)}</p>
              <Link
                to={`/${branch.id}`}
                className="mt-5 inline-flex rounded-xl bg-[var(--brand-1)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-2)]"
              >
                {t("branch.continue", { city: branch.city })}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}