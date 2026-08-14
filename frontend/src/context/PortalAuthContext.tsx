import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

export type PortalRole = "receptionist" | "admin";

export interface PortalSession {
  role: PortalRole;
  branchId?: string;
  name?: string;
  staffId?: string;
  token: string;
}

interface PortalAuthContextValue {
  session: PortalSession | null;
  signIn: (params: {
    role: PortalRole;
    branchId?: string;
    passcode: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  signOut: (reason?: "manual" | "expired" | "inactive") => void;
  validateSession: () => Promise<boolean>;
}

const STORAGE_KEY = "city-snack-portal-session";
const LAST_ACTIVITY_KEY = "city-snack-last-activity";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Auto-logout after 30 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
// Check activity every 60 seconds
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(undefined);

export function PortalAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<PortalSession | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached) as PortalSession;
      if (parsed?.role && parsed?.token) {
        // Check if session already expired due to inactivity
        const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
        const inactive = Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS;
        if (inactive && lastActivity > 0) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          return null;
        }
        return parsed;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  });

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  /* ═══════════════════════════════════════════════════════
     Activity tracking — every click/keypress bumps activity
  ═══════════════════════════════════════════════════════ */
  const bumpActivity = useCallback(() => {
    if (sessionRef.current) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    // Set initial activity timestamp
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, bumpActivity, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, bumpActivity));
    };
  }, [session, bumpActivity]);

  /* ═══════════════════════════════════════════════════════
     Inactivity checker — runs every minute
  ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now());
      const idleMs = Date.now() - lastActivity;
      if (idleMs > INACTIVITY_TIMEOUT_MS) {
        signOutInternal("inactive");
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  /* ═══════════════════════════════════════════════════════
     Cross-tab logout — if another tab logs out, this tab does too
  ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue === null && sessionRef.current) {
        setSession(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ═══════════════════════════════════════════════════════
     Sign in / out / validate
  ═══════════════════════════════════════════════════════ */
  function signOutInternal(reason: "manual" | "expired" | "inactive" = "manual") {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    // Show a friendly message on the login page
    if (reason === "inactive") {
      sessionStorage.setItem("logout_reason", "You were signed out due to inactivity.");
    } else if (reason === "expired") {
      sessionStorage.setItem("logout_reason", "Your session expired. Please sign in again.");
    }

    // Replace history so browser back button can't return
    // Redirect will happen naturally as ProtectedPortalRoute catches the missing session
  }

  const validateSession = useCallback(async (): Promise<boolean> => {
    const s = sessionRef.current;
    if (!s?.token) return false;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${s.token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        signOutInternal("expired");
        return false;
      }
      const data = await res.json();
      if (!data?.ok) {
        signOutInternal("expired");
        return false;
      }
      return true;
    } catch {
      // Network error — don't logout, just report invalid
      return false;
    }
  }, []);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      session,
      signIn: async ({ role, branchId, passcode }) => {
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, branchId, passcode }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return { ok: false, message: data.message ?? "Login failed" };
          }
          const next: PortalSession = {
            role: data.session.role,
            branchId: data.session.branchId,
            name: data.session.name,
            staffId: data.session.staffId,
            token: data.token,
          };
          setSession(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          sessionStorage.removeItem("logout_reason");
          return { ok: true };
        } catch {
          return { ok: false, message: "Network error" };
        }
      },
      signOut: (reason = "manual") => signOutInternal(reason),
      validateSession,
    }),
    [session, validateSession]
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used inside PortalAuthProvider");
  return ctx;
}