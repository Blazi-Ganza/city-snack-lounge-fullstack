import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] transition-colors hover:bg-[var(--card-hover)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.25 }}
          className="text-base"
        >
          {isDark ? "☀️" : "🌙"}
        </motion.span>
      </AnimatePresence>
    </button>
  );
} 