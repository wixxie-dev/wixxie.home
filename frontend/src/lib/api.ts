import type { Service, Settings, User } from "../types";

const API_BASE = "/api";
const TOKEN_KEY = "wixxie_home_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init.headers && !Array.isArray(init.headers) && !(init.headers instanceof Headers)) {
    Object.assign(headers, init.headers);
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { username: string; displayName: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { username: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/me"),
  listServices: () => request<Service[]>("/services"),
  createService: (payload: Record<string, unknown>) =>
    request<Service>("/services", { method: "POST", body: JSON.stringify(payload) }),
  updateService: (id: number, payload: Record<string, unknown>) =>
    request<Service>(`/services/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteService: (id: number) => request<void>(`/services/${id}`, { method: "DELETE" }),
  reorderServices: (payload: { pinned: number[]; regular: number[] }) =>
    request<{ ok: boolean }>("/services/reorder/all", { method: "PUT", body: JSON.stringify(payload) }),
  refreshService: (id: number) => request<{ stats: Record<string, string | number> | null }>(`/services/${id}/refresh`, { method: "POST" }),
  testConnection: (payload: { appType: string; baseUrl: string; apiConfig: Record<string, string> }) =>
    request<{ ok: boolean; stats: Record<string, string | number> }>("/services/test-connection", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTags: () => request<Array<{ id: number; name: string }>>("/tags"),
  getSettings: () => request<Settings>("/settings"),
  updateSettings: (payload: Partial<Settings>) =>
    request<{ ok: boolean }>("/settings", { method: "PUT", body: JSON.stringify(payload) }),
  uploadFavicon: async (file: File): Promise<{ faviconPath: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("favicon", file);
    const response = await fetch(`${API_BASE}/settings/favicon`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to upload favicon");
    }
    return response.json();
  },
};
