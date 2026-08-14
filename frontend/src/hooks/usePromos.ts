import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { usePortalAuth } from "../context/PortalAuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type DiscountType = "percentage" | "fixed";

export interface Promo {
  _id: string;
  branchId: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  itemIds: string[];
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function usePromos(branchId: string) {
  const { session } = usePortalAuth();
  const token = session?.token;

  const [items, setItems] = useState<Promo[]>([]);
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
      let data: any;
      try { data = JSON.parse(text); }
      catch { throw new Error(`Invalid response: ${text.substring(0, 100)}`); }
      if (!res.ok || data?.ok === false) throw new Error(data?.message || `HTTP ${res.status}`);
      return data as T;
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
      const res = await authFetch<{ ok: boolean; items: Promo[] }>(`/api/promos/${branchId}`);
      setItems(res.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load promos");
    } finally {
      setLoading(false);
    }
  }, [branchId, token, authFetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!branchId) return;
    const socket: Socket = io(API_URL, { transports: ["websocket"] });
    socket.emit("join", `promos:${branchId}`);
    socket.on("promos:updated", () => load());
    return () => { socket.disconnect(); };
  }, [branchId, load]);

  async function create(data: Partial<Promo>) {
    const res = await authFetch<{ ok: boolean; promo: Promo }>(
      `/api/promos/${branchId}`,
      { method: "POST", body: JSON.stringify(data) }
    );
    await load();
    return res.promo;
  }

  async function update(id: string, data: Partial<Promo>) {
    const res = await authFetch<{ ok: boolean; promo: Promo }>(
      `/api/promos/${branchId}/${id}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
    await load();
    return res.promo;
  }

  async function toggleActive(id: string) {
    await authFetch(`/api/promos/${branchId}/${id}/toggle`, { method: "POST" });
    await load();
  }

  async function toggleFeatured(id: string) {
    await authFetch(`/api/promos/${branchId}/${id}/featured`, { method: "POST" });
    await load();
  }

  async function remove(id: string) {
    await authFetch(`/api/promos/${branchId}/${id}`, { method: "DELETE" });
    await load();
  }

  return { items, loading, error, create, update, toggleActive, toggleFeatured, remove, reload: load };
}