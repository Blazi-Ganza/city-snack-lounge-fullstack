const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? data.message
        : "Request failed";
    throw new Error(message || "Request failed");
  }

  return data;
}

export function getApi<T>(path: string) {
  return request<T>(path);
}

export function postApi<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchApi<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}