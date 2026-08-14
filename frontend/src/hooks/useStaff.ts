import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "../context/PortalAuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type StaffRole = "admin" | "receptionist";

export interface Staff {
  _id: string;
  name: string;
  email?: string;
  role: StaffRole;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function useStaff() {
  const { session } = usePortalAuth();
  const token = session?.token;

  const [items, setItems] = useState<Staff[]>([]);
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
      const res = await authFetch<{ ok: boolean; items: Staff[] }>(`/api/staff`);
      setItems(res.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(data: {
    name: string;
    role: StaffRole;
    branchId?: string;
    email?: string;
    passcode?: string;
  }): Promise<{ staff: Staff; passcode: string }> {
    const res = await authFetch<{ ok: boolean; staff: Staff; passcode: string }>(
      `/api/staff`,
      { method: "POST", body: JSON.stringify(data) }
    );
    await load();
    return { staff: res.staff, passcode: res.passcode };
  }

  async function update(id: string, data: Partial<Staff>): Promise<Staff> {
    const res = await authFetch<{ ok: boolean; staff: Staff }>(`/api/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    await load();
    return res.staff;
  }

  async function resetPasscode(
    id: string,
    customPasscode?: string
  ): Promise<{ staff: Staff; passcode: string }> {
    const res = await authFetch<{ ok: boolean; staff: Staff; passcode: string }>(
      `/api/staff/${id}/reset`,
      {
        method: "POST",
        body: JSON.stringify(customPasscode ? { passcode: customPasscode } : {}),
      }
    );
    await load();
    return { staff: res.staff, passcode: res.passcode };
  }

  async function remove(id: string): Promise<void> {
    await authFetch<{ ok: boolean }>(`/api/staff/${id}`, { method: "DELETE" });
    await load();
  }

  return { items, loading, error, create, update, resetPasscode, remove, reload: load };
}