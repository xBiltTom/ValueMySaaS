import { apiClient } from "@/lib/api-client";

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_analyses: number;
  credits_consumed_today: number;
  total_system_keys: number;
  active_system_keys: number;
}

export interface UserAdminSchema {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  ai_credits: number;
  last_login_at: string | null;
  project_count: number;
  last_ai_activity_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface SystemConfigEntry {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface AnnouncementResponse {
  announcement: string;
  has_announcement: boolean;
}

export interface PublicConfigResponse {
  system_credits_enabled: boolean;
}

// ---- Stats ----
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/admin/stats");
  return data;
}

export async function getPublicConfig(): Promise<PublicConfigResponse> {
  const { data } = await apiClient.get<PublicConfigResponse>(
    "/admin/public/config",
  );
  return data;
}

// ---- Users ----
export async function getAdminUsers(
  search?: string,
): Promise<{ items: UserAdminSchema[]; total: number }> {
  const params = new URLSearchParams({ limit: "100", offset: "0" });
  if (search) params.set("search", search);
  const { data } = await apiClient.get<{
    items: UserAdminSchema[];
    total: number;
  }>(`/admin/users?${params}`);
  return data;
}

export async function grantCredits(
  userId: string,
  delta: number,
  description: string,
): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/credits`, {
    delta,
    description,
  });
}

export async function bulkGrantCredits(
  delta: number,
  description: string,
): Promise<{ affected_users: number; credits_per_user: number }> {
  const { data } = await apiClient.post<{
    affected_users: number;
    credits_per_user: number;
  }>("/admin/credits/bulk-grant", { delta, description });
  return data;
}

export async function toggleUserActive(
  userId: string,
  is_active: boolean,
): Promise<void> {
  await apiClient.patch(`/admin/users/${userId}/active`, { is_active });
}

// ---- System Keys ----
export async function getSystemKeys(): Promise<{ items: SystemAiKey[] }> {
  const { data } = await apiClient.get<{ items: SystemAiKey[] }>(
    "/admin/system-keys",
  );
  return data;
}

export async function createSystemKey(
  provider: string,
  apiKey: string,
  priority: number,
  label: string,
  defaultModel: string | null,
): Promise<SystemAiKey> {
  const { data } = await apiClient.post<SystemAiKey>("/admin/system-keys", {
    provider,
    api_key: apiKey,
    priority,
    label: label || provider,
    default_model: defaultModel || null,
  });
  return data;
}

export async function updateSystemKey(
  keyId: string,
  updates: Partial<{
    label: string;
    default_model: string | null;
    priority: number;
    is_active: boolean;
  }>,
): Promise<SystemAiKey> {
  const { data } = await apiClient.put<SystemAiKey>(
    `/admin/system-keys/${keyId}`,
    updates,
  );
  return data;
}

export async function deleteSystemKey(keyId: string): Promise<void> {
  await apiClient.delete(`/admin/system-keys/${keyId}`);
}

export async function verifySystemKey(
  keyId: string,
): Promise<{ ok: boolean; message: string; model_name: string | null }> {
  const { data } = await apiClient.post<{
    ok: boolean;
    message: string;
    model_name: string | null;
  }>(`/admin/system-keys/${keyId}/verify`);
  return data;
}

// ---- System Config ----
export async function getSystemConfig(): Promise<SystemConfigEntry[]> {
  const { data } = await apiClient.get<SystemConfigEntry[]>("/admin/config");
  return data;
}

export async function updateSystemConfig(
  key: string,
  value: string,
): Promise<SystemConfigEntry> {
  const { data } = await apiClient.put<SystemConfigEntry>(
    `/admin/config/${key}`,
    { value },
  );
  return data;
}

// ---- ChatGPT Web Accounts ----
export interface ChatGptWebAccount {
  id: string;
  email: string;
  has_password: boolean;
  has_session_token: boolean;
  session_expires_at: string | null;
  user_agent: string | null;
  session_token_part0: string | null;
  session_token_part1: string | null;
  cf_clearance: string | null;
  is_active: boolean;
  priority: number;
  error_count: number;
  is_locked: boolean;
  last_used_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function getChatGptWebAccounts(): Promise<{
  items: ChatGptWebAccount[];
  total: number;
}> {
  const { data } = await apiClient.get<{
    items: ChatGptWebAccount[];
    total: number;
  }>("/admin/chatgpt-web-accounts");
  return data;
}

export async function createChatGptWebAccount(
  email: string,
  priority: number,
  userAgent: string | null,
): Promise<ChatGptWebAccount> {
  const { data } = await apiClient.post<ChatGptWebAccount>(
    "/admin/chatgpt-web-accounts",
    { email, priority, user_agent: userAgent },
  );
  return data;
}

export async function updateChatGptWebAccount(
  accountId: string,
  updates: Partial<{
    email: string;
    user_agent: string;
    priority: number;
    is_active: boolean;
    is_locked: boolean;
  }>,
): Promise<ChatGptWebAccount> {
  const { data } = await apiClient.put<ChatGptWebAccount>(
    `/admin/chatgpt-web-accounts/${accountId}`,
    updates,
  );
  return data;
}

export async function deleteChatGptWebAccount(
  accountId: string,
): Promise<void> {
  await apiClient.delete(`/admin/chatgpt-web-accounts/${accountId}`);
}

export async function verifyChatGptWebAccount(
  accountId: string,
): Promise<{ ok: boolean; message: string }> {
  const { data } = await apiClient.post<{ ok: boolean; message: string }>(
    `/admin/chatgpt-web-accounts/${accountId}/verify`,
  );
  return data;
}

export async function injectChatGptWebToken(
  accountId: string,
  sessionTokenPart0: string,
  sessionTokenPart1: string,
  cfClearance: string,
  userAgent: string | null,
  expiresAt?: string | null,
): Promise<ChatGptWebAccount> {
  const { data } = await apiClient.post<ChatGptWebAccount>(
    `/admin/chatgpt-web-accounts/${accountId}/inject-token`,
    {
      session_token_part0: sessionTokenPart0,
      session_token_part1: sessionTokenPart1,
      cf_clearance: cfClearance,
      user_agent: userAgent,
      expires_at: expiresAt ?? null,
    },
  );
  return data;
}

// ---- Public Announcement ----
export async function getAnnouncement(): Promise<AnnouncementResponse> {
  const { data } = await apiClient.get<AnnouncementResponse>(
    "/admin/public/announcement",
  );
  return data;
}
