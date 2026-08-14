import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { branches } from "../data";
import { useBranch } from "../context/BranchContext";
import { type Language, useLanguage } from "../context/LanguageContext";
import { ThemeToggle } from "./ui/ThemeToggle";
import { cn } from "../utils/cn";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { selectedBranch, basePath } = useBranch();
  const { language, setLanguage, t } = useLanguage();

  const links = [
    { name: t("nav.home"), href: `${basePath}`, end: true },
    { name: t("nav.menu"), href: `${basePath}/menu` },
    { name: t("nav.reserve"), href: `${basePath}/reservation` },
    { name: t("nav.reviews"), href: `${basePath}/reviews` },
    { name: t("nav.contact"), href: `${basePath}/contact` },
    { name: t("nav.chat"), href: `${basePath}/chat` },
  ];

  const activeBranchLabel =
    branches.find((branch) => branch.id === selectedBranch)?.name ??
    "Selected Branch";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur transition-colors">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* ─── Logo ─── */}
        <Link
          to={basePath}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--ink)]"
        >
          {/* Both logos stacked — CSS shows the right one based on theme.
    Wrapper handles the smooth fade between them. */}
<span className="relative inline-block h-10 w-auto">
  <img
    src="/images/city-snack-logo.png"
    alt="City Snack Lounge"
    className="h-10 w-auto opacity-100 dark:opacity-0"
    loading="lazy"
    data-no-dim
  />
  <img
    src="/images/city-snack-logo-white.png"
    alt=""
    aria-hidden="true"
    className="absolute inset-0 h-10 w-auto opacity-0 dark:opacity-100"
    loading="lazy"
    data-no-dim
  />
</span>
          <span className="font-display hidden text-xl font-bold tracking-tight text-[var(--ink)] sm:inline">
            City Snack Lounge
          </span>
        </Link>

        {/* ─── Mobile actions (theme + menu button) ─── */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="h-10 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--bg-soft)]"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation menu"
          >
            {open ? "Close" : t("nav.menu")}
          </button>
        </div>

        {/* ─── Desktop nav ─── */}
        <div className="hidden items-center gap-1.5 md:flex">
          <span className="rounded-lg bg-[var(--bg-soft)] px-3 py-1.5 text-xs text-[var(--muted)]">
            {t("nav.branch", { branch: activeBranchLabel })}
          </span>

          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)]"
                )
              }
            >
              {link.name}
            </NavLink>
          ))}

          {/* Language selector */}
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2 text-sm text-[var(--ink)] transition-colors focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="en">{t("lang.english")}</option>
            <option value="fr">{t("lang.french")}</option>
            <option value="rw">{t("lang.kinyarwanda")}</option>
          </select>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </nav>

      {/* ─── Mobile menu drawer ─── */}
      {open ? (
        <div className="border-t border-[var(--line)] bg-[var(--paper)] px-4 py-3 md:hidden">
          <p className="mb-2 text-xs text-[var(--muted)]">
            {t("nav.branch", { branch: activeBranchLabel })}
          </p>

          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="mb-3 h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2 text-sm text-[var(--ink)] transition-colors focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="en">{t("lang.english")}</option>
            <option value="fr">{t("lang.french")}</option>
            <option value="rw">{t("lang.kinyarwanda")}</option>
          </select>

          <div className="flex flex-wrap gap-2 pb-2">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--panel)] text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)]"
                  )
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}