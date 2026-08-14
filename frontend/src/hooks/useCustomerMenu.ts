import { useEffect, useState, useCallback } from "react";
import { getSocket } from "../lib/socket";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type MenuCategory = "Meals" | "Drinks" | "Desserts";

export interface CustomerMenuItem {
  _id: string;
  id: string;
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
}

export function useCustomerMenu(branchId: string) {
  const [items, setItems] = useState<CustomerMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMenu = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`${API_URL}/api/menu/public/${branchId}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? "Failed to load menu");

      const mapped = (json.items || []).map((item: any) => ({
        ...item,
        id: item._id,
      }));

      setItems(mapped);
      setError("");
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // Initial load
  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    fetchMenu();
  }, [branchId, fetchMenu]);

  // 📡 Real-time updates
  useEffect(() => {
    if (!branchId) return;

    const socket = getSocket();

    // Subscribe to menu updates for this branch
    socket.emit("menu:subscribe", { branchId });

    const handleMenuUpdate = (payload: { branchId: string; action: string; item?: any }) => {
      if (payload.branchId !== branchId) return;
      console.log(`🔄 Live menu ${payload.action}:`, payload.item?.name ?? "");
      // Just refetch — simplest and safest
      fetchMenu();
    };

    socket.on("menu:updated", handleMenuUpdate);

    return () => {
      socket.emit("menu:unsubscribe", { branchId });
      socket.off("menu:updated", handleMenuUpdate);
    };
  }, [branchId, fetchMenu]);

  return { items, loading, error, refresh: fetchMenu, lastUpdate };
}