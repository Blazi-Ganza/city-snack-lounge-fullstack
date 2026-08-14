import { useEffect, useState, useCallback } from "react";
import { usePortalAuth } from "../context/PortalAuthContext";
import { getSocket } from "../lib/socket";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type MenuCategory = "Meals" | "Drinks" | "Desserts";

export interface MenuItem {
  _id: string;
  branchId: string;
  name: string;
  category: MenuCategory;
  subcategory: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  prepTime: string;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export function useMenu(branchId: string) {
  const { session } = usePortalAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMenu = useCallback(async () => {
    if (!session?.token || !branchId) return;
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/menu/${branchId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? "Failed to load menu");
      setItems(json.items || []);
    } catch (err) {
      console.error("❌ Menu fetch failed:", err);
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [branchId, session?.token]);

  useEffect(() => {
    setLoading(true);
    fetchMenu();
  }, [fetchMenu]);

  // 📡 Live sync via socket
  useEffect(() => {
    if (!branchId) return;
    const socket = getSocket();
    socket.emit("menu:subscribe", { branchId });

    const handler = (payload: { branchId: string; action: string; item?: MenuItem }) => {
      if (payload.branchId !== branchId) return;
      console.log("🔄 Live update:", payload.action, payload.item?.name);

      if (payload.action === "updated" && payload.item) {
        setItems((prev) => prev.map((i) => (i._id === payload.item!._id ? payload.item! : i)));
      } else if (payload.action === "deleted" && payload.item?._id) {
        setItems((prev) => prev.filter((i) => i._id !== payload.item!._id));
      } else if (payload.action === "created" && payload.item) {
        setItems((prev) => {
          if (prev.some((i) => i._id === payload.item!._id)) return prev;
          return [...prev, payload.item!];
        });
      } else {
        // Bulk operations (clear all, copy branch) → refetch
        fetchMenu();
      }
    };

    socket.on("menu:updated", handler);
    return () => {
      socket.emit("menu:unsubscribe", { branchId });
      socket.off("menu:updated", handler);
    };
  }, [branchId, fetchMenu]);

  const create = async (data: Omit<MenuItem, "_id" | "branchId" | "displayOrder" | "createdAt">) => {
    const res = await fetch(`${API_URL}/api/menu/${branchId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session!.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.message);
    // Optimistic add — socket will confirm/reconcile
    setItems((prev) => {
      if (prev.some((i) => i._id === json.item._id)) return prev;
      return [...prev, json.item];
    });
    return json.item;
  };

  const update = async (id: string, data: Partial<MenuItem>) => {
    const res = await fetch(`${API_URL}/api/menu/${branchId}/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session!.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.message);
    setItems((prev) => prev.map((i) => (i._id === id ? json.item : i)));
    return json.item;
  };

  const toggleAvailable = async (id: string) => {
    // Optimistic: flip immediately
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, isAvailable: !i.isAvailable } : i)));

    const res = await fetch(`${API_URL}/api/menu/${branchId}/${id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session!.token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      // Revert on failure
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, isAvailable: !i.isAvailable } : i)));
      throw new Error(json.message);
    }
    setItems((prev) => prev.map((i) => (i._id === id ? json.item : i)));
  };

  const toggleFeatured = async (id: string) => {
    // Optimistic: flip immediately
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, featured: !i.featured } : i)));

    const res = await fetch(`${API_URL}/api/menu/${branchId}/${id}/featured`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session!.token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      // Revert on failure
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, featured: !i.featured } : i)));
      throw new Error(json.message);
    }
    setItems((prev) => prev.map((i) => (i._id === id ? json.item : i)));
  };

  const remove = async (id: string) => {
    // Optimistic: remove immediately
    const backup = items;
    setItems((prev) => prev.filter((i) => i._id !== id));

    const res = await fetch(`${API_URL}/api/menu/${branchId}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session!.token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      // Revert on failure
      setItems(backup);
      throw new Error(json.message);
    }
  };

  return { items, loading, error, refresh: fetchMenu, create, update, toggleAvailable, toggleFeatured, remove };
}