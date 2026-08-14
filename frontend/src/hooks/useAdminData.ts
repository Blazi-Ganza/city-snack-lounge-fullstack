import { useEffect, useState } from "react";
import { usePortalAuth } from "../context/PortalAuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/* ═══════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════ */

export interface BranchSnapshot {
  id: string;
  name: string;
  chats: number;
  newChats: number;
  orders: number;
  awaitingPayment: number;
  deliveries: number;
  revenueToday: number;
  ordersToday: number;
}

export interface AdminOverview {
  totals: {
    branches: number;
    chats: number;
    newChats: number;
    orders: number;
    ordersToday: number;
    revenueToday: number;
    revenueThisWeek: number;
    deliveries: number;
    awaitingPayment: number;
    reservations: number;
  };
  branches: BranchSnapshot[];
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
}

export interface AdminChat {
  _id: string;
  branchId: string;
  customerId: string;
  customerName: string;
  status: "new" | "in_progress" | "closed";
  messages: Array<{ from: string; text: string; createdAt: string }>;
  updatedAt: string;
  createdAt: string;
}

export interface AdminOrder {
  _id: string;
  branchId: string;
  orderCode: string;
  customerName: string;
  phone: string;
  type: "pickup" | "delivery";
  address?: string;
  items: Array<{ id: number; name: string; price: number; qty: number }>;
  total: number;
  status:
    | "awaiting_payment"
    | "new"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  paymentMethod?: "cash" | "momo";
  paymentStatus?: "pending" | "paid" | "failed";
  createdAt: string;
  isArchived?: boolean;
  archivedAt?: string;
}

/* ═══════════════════════════════════════════════════════
   Fallback data (so dashboard always renders)
═══════════════════════════════════════════════════════ */

const FALLBACK_OVERVIEW: AdminOverview = {
  totals: {
    branches: 2,
    chats: 0,
    newChats: 0,
    orders: 0,
    ordersToday: 0,
    revenueToday: 0,
    revenueThisWeek: 0,
    deliveries: 0,
    awaitingPayment: 0,
    reservations: 0,
  },
  branches: [
    { id: "huye", name: "Huye Branch", chats: 0, newChats: 0, orders: 0, awaitingPayment: 0, deliveries: 0, revenueToday: 0, ordersToday: 0 },
    { id: "musanze", name: "Musanze Branch", chats: 0, newChats: 0, orders: 0, awaitingPayment: 0, deliveries: 0, revenueToday: 0, ordersToday: 0 },
  ],
  topItems: [],
  revenueByDay: [],
};

/* ═══════════════════════════════════════════════════════
   Generic auth fetch hook — with better error handling
═══════════════════════════════════════════════════════ */

function useAuthFetch<T>(endpoint: string, refreshKey = 0) {
  const { session } = usePortalAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // If no token, stop loading (don't hang forever)
    if (!session?.token) {
      console.warn(`[useAuthFetch] No token for ${endpoint}`);
      setLoading(false);
      setError("Not authenticated");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const url = `${API_URL}${endpoint}`;
        console.log(`[useAuthFetch] Fetching: ${url}`);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
        });

        const text = await res.text();
        console.log(`[useAuthFetch] ${endpoint} → ${res.status}`, text.substring(0, 200));

        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(`Invalid JSON from ${endpoint}: ${text.substring(0, 100)}`);
        }

        if (!res.ok) {
          throw new Error(json.message ?? `HTTP ${res.status}`);
        }

        // Handle both { ok: true, ... } and direct data format
        if (json.ok === false) {
          throw new Error(json.message ?? "Request failed");
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        console.error(`[useAuthFetch] ${endpoint} error:`, err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.token, endpoint, refreshKey]);

  return { data, loading, error };
}

/* ═══════════════════════════════════════════════════════
   Public hooks — with fallbacks
═══════════════════════════════════════════════════════ */

export function useAdminOverview(refreshKey = 0) {
  const { data, loading, error } = useAuthFetch<{ ok: boolean; overview: AdminOverview }>(
    "/api/admin/overview",
    refreshKey
  );

  // Use API data if available, otherwise fallback
  const overview = data?.overview ?? (loading ? null : FALLBACK_OVERVIEW);

  return { data: overview, loading, error };
}

export function useAdminChats(refreshKey = 0) {
  const { data, loading, error } = useAuthFetch<{ ok: boolean; chats: AdminChat[] }>(
    "/api/admin/chats",
    refreshKey
  );
  return { data: data?.chats ?? [], loading, error };
}

export function useAdminOrders(refreshKey = 0, includeArchived = false) {
  const { data, loading, error } = useAuthFetch<{ ok: boolean; orders: AdminOrder[] }>(
    `/api/admin/orders?includeArchived=${includeArchived}`,
    refreshKey
  );
  return { data: data?.orders ?? [], loading, error };
}