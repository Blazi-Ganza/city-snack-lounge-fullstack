import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const STORAGE_KEY = "city-snack-portal-session";

let socket: Socket | null = null;

function getToken(): string | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw)?.token;
  } catch {
    return undefined;
  }
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: { token: getToken() },
    });

    socket.on("connect", () => console.log("✅ Socket connected:", socket?.id));
    socket.on("disconnect", (reason) => console.log("❌ Socket disconnected:", reason));
    socket.on("connect_error", (err) => console.error("⚠️ Socket connect_error:", err.message));
  }
  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
