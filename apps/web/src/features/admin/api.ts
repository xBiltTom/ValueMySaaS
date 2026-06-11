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
  username: string | null;
  role: string;
  ai_credits: number;
  last_login_at: string | null;
  project_count: number;
  last_ai_activity_at: string | null;
  created_at: string;
}

export interface SystemAiKey {
  id: string;
  provider: string;
  label: string;
  key_last_four: string | null;
  default_model: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/api/v1/admin/stats");
  return data;
}

export async function getAdminUsers(): Promise<{ items: UserAdminSchema[] }> {
  const { data } = await apiClient.get<{ items: UserAdminSchema[] }>("/api/v1/admin/users?limit=50");
  return data;
}

export async function grantCredits(userId: string, delta: number, description: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/users/${userId}/credits`, { delta, description });
}

export async function getSystemKeys(): Promise<{ items: SystemAiKey[] }> {
  const { data } = await apiClient.get<{ items: SystemAiKey[] }>("/api/v1/admin/system-keys");
  return data;
}

export async function createSystemKey(
  provider: string,
  apiKey: string,
  priority: number,
  label: string,
  defaultModel: string | null,
): Promise<SystemAiKey> {
  const { data } = await apiClient.post<SystemAiKey>("/api/v1/admin/system-keys", {
    provider,
    api_key: apiKey,
    priority,
    label: label || provider,
    default_model: defaultModel || null,
  });
  return data;
}

export async function deleteSystemKey(keyId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/system-keys/${keyId}`);
}
