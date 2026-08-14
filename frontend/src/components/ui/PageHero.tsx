import { motion } from "framer-motion";
import { LogoWatermark } from "./LogoWatermark";
import { cn } from "../../utils/cn";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  accentWord?: string;
  accentPosition?: "before" | "after";
  subtitle?: string;
  showWatermark?: boolean;
  watermarkOpacity?: number;
  className?: string;
}

export function PageHero({
  eyebrow,
  title,
  accentWord,
  accentPosition = "after",
  subtitle,
  showWatermark = true,
  watermarkOpacity = 0.05,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        // ✅ FIXED: theme-aware gradient (no more white band)
        "relative overflow-hidden bg-gradient-to-b from-[var(--bg-soft)] via-[var(--card)] to-[var(--bg-soft)] px-4 py-20 sm:py-28",
        className,
      )}
    >
      {/* Giant logo watermark */}
      {showWatermark && (
        <LogoWatermark variant="hero" opacity={watermarkOpacity} />
      )}

      <div className="relative mx-auto max-w-4xl text-center">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--primary)]"
          >
            {eyebrow}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl font-semibold leading-[1.1] text-[var(--ink)] sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {accentPosition === "before" && accentWord && (
            <>
              <span className="italic text-[var(--primary)]">{accentWord}</span>{" "}
            </>
          )}
          {title}
          {accentPosition === "after" && accentWord && (
            <>
              {" "}
              <span className="italic text-[var(--primary)]">{accentWord}</span>
            </>
          )}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}