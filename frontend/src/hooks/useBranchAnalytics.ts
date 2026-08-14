import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { usePortalAuth } from "../context/PortalAuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type RangeKey = "7d" | "30d" | "90d";

export interface BranchAnalytics {
  range: RangeKey;
  kpis: {
    revenue: { value: number; change: number };
    orders: { value: number; change: number };
    avgOrderValue: { value: number; change: number };
    completionRate: { value: number; change: number };
  };
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  peakHours: Array<{ hour: number; orders: number }>;
  peakDays: Array<{ dayOfWeek: number; label: string; orders: number; revenue: number }>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  categoryBreakdown: Array<{ category: string; qty: number; revenue: number }>;
  menuHealth: {
    total: number;
    available: number;
    unavailable: number;
    featured: number;
  };
  eventsStats: { upcoming: number; thisMonth: number; totalSpotsLeft: number };
  promosStats: { active: number; featured: number; expiringSoon: number };
  operations: {
    pendingOrders: number;
    activeDeliveries: number;
    openChats: number;
    avgFulfillmentMinutes: number | null;
  };
}

export function useBranchAnalytics(branchId: string, range: RangeKey) {
  const { session } = usePortalAuth();
  const token = session?.token;

  const [data, setData] = useState<BranchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
        ...init,
      });

      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
      }

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      return json as T;
    },
    [token]
  );

  const load = useCallback(async () => {
    if (!branchId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch<{ ok: boolean; analytics: BranchAnalytics }>(
        `/api/analytics/${branchId}?range=${range}`
      );
      setData(res.analytics);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [branchId, token, range, authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates via socket
  useEffect(() => {
    if (!branchId) return;
    const socket: Socket = io(API_URL, { transports: ["websocket"] });
    socket.emit("join", `menu:${branchId}`);
    socket.emit("join", `events:${branchId}`);
    socket.emit("join", `promos:${branchId}`);
    socket.emit("join", `orders:${branchId}`);

    const refetch = () => load();
    socket.on("menu:updated", refetch);
    socket.on("events:updated", refetch);
    socket.on("promos:updated", refetch);
    socket.on("orders:updated", refetch);
    socket.on("order:created", refetch);
    socket.on("order:status", refetch);

    return () => {
      socket.disconnect();
    };
  }, [branchId, load]);

  return { data, loading, error, reload: load };
}