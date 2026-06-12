"use client";

import { apiClient } from "@/lib/api-client";
import {
  AiKey,
  AiKeyListResponse,
  CreateAiKeyPayload,
  UpdateAiKeyPayload,
  VerifyAiKeyPayload,
  VerifyAiKeyResponse,
} from "@/features/ai-keys/types";

export async function listAiKeys() {
  const { data } = await apiClient.get<AiKeyListResponse>("/ai/keys");
  return data;
}

export async function createAiKey(payload: CreateAiKeyPayload) {
  const { data } = await apiClient.post<AiKey>("/ai/keys", payload);
  return data;
}

export async function getAiKey(keyId: string) {
  const { data } = await apiClient.get<AiKey>(`/ai/keys/${keyId}`);
  return data;
}

export async function verifyAiKey(keyId: string, payload: VerifyAiKeyPayload) {
  const { data } = await apiClient.post<VerifyAiKeyResponse>(`/ai/keys/${keyId}/verify`, payload);
  return data;
}

export async function updateAiKey(keyId: string, payload: UpdateAiKeyPayload) {
  const { data } = await apiClient.patch<AiKey>(`/ai/keys/${keyId}`, payload);
  return data;
}

export async function deleteAiKey(keyId: string) {
  await apiClient.delete(`/ai/keys/${keyId}`);
}

export async function listAiKeyModels(keyId: string) {
  const { data } = await apiClient.get<{ items: { id: string; name: string }[]; provider: string }>(`/ai/keys/${keyId}/models`);
  return data;
}
