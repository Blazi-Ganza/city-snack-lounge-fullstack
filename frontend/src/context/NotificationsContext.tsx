import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { io, type Socket } from "socket.io-client";
import { usePortalAuth } from "./PortalAuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const MUTE_KEY = "city-snack-notifications-muted";
const MAX_NOTIFICATIONS = 20;

export type NotificationType = "order" | "chat" | "reservation" | "stale_payment";

export interface AppNotification {
  id: string;
  type: NotificationType;
  branchId?: string;
  title: string;
  message: string;
  orderCode?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsContextValue {
  items: AppNotification[];
  unreadCount: number;
  muted: boolean;
  toggleMuted: () => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

/* Web Audio beep — no mp3 needed */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore
  }
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session } = usePortalAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [muted, setMuted] = useState<boolean>(() => {
    return localStorage.getItem(MUTE_KEY) === "true";
  });
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
    localStorage.setItem(MUTE_KEY, String(muted));
  }, [muted]);

  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!isAdmin || !session?.token) return;

    // Uses the DEFAULT Socket.IO path (same as chat) — shared server
    const socket: Socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("🔔 Notifications socket connected");
      // Subscribe with token AFTER we're connected
      socket.emit("notifications:subscribe", { token: session.token });
    });

    socket.on("notifications:subscribed", (res: { ok: boolean }) => {
      console.log("🔔 Notifications subscribed:", res.ok);
    });

    socket.on("connect_error", (err) => {
      console.warn("Notif socket error:", err.message);
    });

    socket.on(
      "admin:notification",
      (payload: Omit<AppNotification, "id" | "read">) => {
        const notif: AppNotification = {
          id: `${payload.type}-${payload.createdAt}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          ...payload,
          read: false,
        };
        setItems((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
        if (!mutedRef.current) playBeep();
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [isAdmin, session?.token]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount: items.filter((n) => !n.read).length,
      muted,
      toggleMuted: () => setMuted((v) => !v),
      markAllRead: () =>
        setItems((prev) => prev.map((n) => ({ ...n, read: true }))),
      clearAll: () => setItems([]),
    }),
    [items, muted]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}