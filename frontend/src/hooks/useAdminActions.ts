import { useCallback } from "react";
import { usePortalAuth } from "../context/PortalAuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function useAdminActions() {
  const { session } = usePortalAuth();
  const token = session?.token;

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

  async function deleteChat(chatId: string): Promise<void> {
    await authFetch(`/api/admin/chats/${chatId}`, { method: "DELETE" });
  }

  async function archiveOrder(orderId: string): Promise<void> {
    await authFetch(`/api/admin/orders/${orderId}/archive`, { method: "POST" });
  }

  async function unarchiveOrder(orderId: string): Promise<void> {
    await authFetch(`/api/admin/orders/${orderId}/unarchive`, { method: "POST" });
  }

  return { deleteChat, archiveOrder, unarchiveOrder };
}