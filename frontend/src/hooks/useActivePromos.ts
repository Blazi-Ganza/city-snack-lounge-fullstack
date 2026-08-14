import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApi } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface ActivePromo {
  _id: string;
  branchId: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  itemIds: string[];
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export function useActivePromos(branchId: string) {
  const [promos, setPromos] = useState<ActivePromo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getApi<{ promos: ActivePromo[] }>(`/api/customer/${branchId}/promos`);
        if (!cancelled) setPromos(data.promos || []);
      } catch {
        if (!cancelled) setPromos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const socket: Socket = io(API_URL, { transports: ["websocket"] });
    socket.emit("join", `promos:${branchId}`);
    socket.on("promos:updated", load);

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [branchId]);

  /**
   * Get the best discount for a specific menu item.
   * Returns the discounted price + the applied promo, or null if no promo.
   */
  function getItemDiscount(itemId: string, originalPrice: number) {
    const applicable = promos.filter((p) => p.itemIds.includes(itemId));
    if (applicable.length === 0) return null;

    let bestPrice = originalPrice;
    let bestPromo: ActivePromo | null = null;

    for (const p of applicable) {
      const discountedPrice =
        p.discountType === "percentage"
          ? Math.max(0, originalPrice * (1 - p.discountValue / 100))
          : Math.max(0, originalPrice - p.discountValue);

      if (discountedPrice < bestPrice) {
        bestPrice = discountedPrice;
        bestPromo = p;
      }
    }

    if (!bestPromo) return null;

    return {
      originalPrice,
      discountedPrice: Math.round(bestPrice),
      savings: Math.round(originalPrice - bestPrice),
      promo: bestPromo,
      label:
        bestPromo.discountType === "percentage"
          ? `${bestPromo.discountValue}% OFF`
          : `${bestPromo.discountValue.toLocaleString()} RWF OFF`,
    };
  }

  const featuredPromos = promos.filter((p) => p.isFeatured);

  return { promos, featuredPromos, loading, getItemDiscount };
}