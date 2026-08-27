import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean; // Tells you if user is currently relying on OS automatic theme
  resetToSystem: () => void; // Optional: Reset override back to OS auto
};

const STORAGE_KEY = "city-snack-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  // Track if user explicitly picked a theme
  const [hasUserOverride, setHasUserOverride] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached === "dark" || cached === "light";
  });

  // Active theme state
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached === "dark" || cached === "light") {
      return cached;
    }
    return getSystemTheme();
  });

  // Apply theme class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // ONLY write to localStorage if user explicitly overrides OS preference
    if (hasUserOverride) {
      localStorage.setItem(STORAGE_KEY, theme);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [theme, hasUserOverride]);

  // Real-time listener for OS system theme changes (macOS / Windows / iOS / Android)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Only auto-update if the user hasn't manually overridden the theme
      if (!hasUserOverride) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [hasUserOverride]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isSystemTheme: !hasUserOverride,
      setTheme: (newTheme: Theme) => {
        setHasUserOverride(true);
        setThemeState(newTheme);
      },
      toggleTheme: () => {
        setHasUserOverride(true);
        setThemeState((prev) => (prev === "light" ? "dark" : "light"));
      },
      resetToSystem: () => {
        localStorage.removeItem(STORAGE_KEY);
        setHasUserOverride(false);
        setThemeState(getSystemTheme());
      },
    }),
    [theme, hasUserOverride]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}