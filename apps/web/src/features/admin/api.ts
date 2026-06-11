import { apiClient } from "@/lib/api-client";

export interface AdminStats {
  total_users: number;
  total_projects: number;
  total_credits_consumed: number;
  tokens_input_today: number;
  tokens_output_today: number;
  system_keys_count: number;
}

export interface UserAdminSchema {
  id: string;
  email: string;
  role: string;
  ai_credits: number;
  created_at: string;
}

export interface SystemAiKey {
  id: string;
  provider: string;
  priority: number;
  is_active: boolean;
  total_uses: number;
  last_used_at: string | null;
  created_at: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/api/v1/admin/stats");
  return data;
}

export async function getAdminUsers(): Promise<{ items: UserAdminSchema[] }> {
  const { data } = await apiClient.get<{ items: UserAdminSchema[] }>("/api/v1/admin/users?limit=50");
  return data;
}

export async function grantCredits(userId: string, amount: number, description: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/users/${userId}/credits`, { amount, description });
}

export async function getSystemKeys(): Promise<{ items: SystemAiKey[] }> {
  const { data } = await apiClient.get<{ items: SystemAiKey[] }>("/api/v1/admin/system-keys");
  return data;
}

export async function createSystemKey(provider: string, apiKey: string, priority: number): Promise<SystemAiKey> {
  const { data } = await apiClient.post<SystemAiKey>("/api/v1/admin/system-keys", {
    provider,
    api_key: apiKey,
    priority,
  });
  return data;
}

export async function deleteSystemKey(keyId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/system-keys/${keyId}`);
}
