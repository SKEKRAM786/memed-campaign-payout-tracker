export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Milestone {
  views: number;
  payout: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "brand" | "creator";
}

export interface Campaign {
  _id: string;
  name: string;
  platform: "Instagram" | "YouTube";
  totalBudget: number;
  spentBudget: number;
  milestones: Milestone[];
  brandId?: {
    _id: string;
    name: string;
  } | string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  campaignId: {
    _id: string;
    name: string;
    platform: "Instagram" | "YouTube";
    milestones: Milestone[];
  } | string;
  creatorId: string;
  postUrl: string;
  views: number;
  payout: number;
  createdAt: string;
  updatedAt: string;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getAuthUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}