import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { usePortalAuth } from "../context/PortalAuthContext";

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}

export type BranchHours = Record<DayKey, DayHours>;

export const DAY_KEYS: DayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

export const DAY_LABELS: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DEFAULT_HOURS: BranchHours = {
  monday:    { closed: false, open: "10:00", close: "23:00" },
  tuesday:   { closed: false, open: "10:00", close: "23:00" },
  wednesday: { closed: false, open: "10:00", close: "23:00" },
  thursday:  { closed: false, open: "10:00", close: "23:00" },
  friday:    { closed: false, open: "10:00", close: "02:00" },
  saturday:  { closed: false, open: "10:00", close: "02:00" },
  sunday:    { closed: false, open: "10:00", close: "23:00" },
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface Branch {
  id: string;
  name: string;
  subtitle: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  isActive: boolean;
  hours?: BranchHours;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchUsage {
  orders: number;
  menu: number;
  events: number;
  promos: number;
  chats: number;
  deliveries: number;
  total: number;
}

export function useBranches() {
  const { session } = usePortalAuth();
  const token = session?.token;

  const [items, setItems] = useState<Branch[]>([]);
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
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch<{ ok: boolean; branches: Branch[] }>(
        `/api/branches/admin/all`
      );
      setItems(res.branches || []);
    } catch (err: any) {
      setError(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time updates
  useEffect(() => {
    const socket: Socket = io(API_URL, { transports: ["websocket"] });
    socket.on("branches:updated", () => {
      load();
    });
    return () => {
      socket.disconnect();
    };
  }, [load]);

  async function create(data: Partial<Branch>) {
    const res = await authFetch<{ ok: boolean; branch: Branch }>(`/api/branches`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    await load();
    return res.branch;
  }

  async function update(id: string, data: Partial<Branch>) {
    const res = await authFetch<{ ok: boolean; branch: Branch }>(
      `/api/branches/${id}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
    await load();
    return res.branch;
  }

  async function toggleActive(id: string) {
    const res = await authFetch<{ ok: boolean; branch: Branch }>(
      `/api/branches/${id}/toggle`,
      { method: "POST" }
    );
    await load();
    return res.branch;
  }

  async function remove(id: string) {
    await authFetch<{ ok: boolean }>(`/api/branches/${id}`, { method: "DELETE" });
    await load();
  }

  async function getUsage(id: string): Promise<BranchUsage> {
    const res = await authFetch<{ ok: boolean; usage: BranchUsage }>(
      `/api/branches/admin/${id}`
    );
    return res.usage;
  }

  async function updateHours(id: string, hours: BranchHours): Promise<Branch> {
    const res = await authFetch<{ ok: boolean; branch: Branch }>(
      `/api/branches/${id}/hours`,
      { method: "PATCH", body: JSON.stringify({ hours }) }
    );
    await load();
    return res.branch;
  }

  return {
    items,
    loading,
    error,
    create,
    update,
    toggleActive,
    remove,
    getUsage,
    updateHours,
    reload: load,
  };
}