"use client";

import { apiClient } from "@/lib/api-client";
import {
  Conversation,
  ConversationListResponse,
  ConversationMessageListResponse,
  CreateConversationPayload,
  SendConversationMessagePayload,
  SendConversationMessageResponse,
  UpdateConversationPayload,
} from "@/features/conversations/types";

export async function createConversation(projectId: string, payload: CreateConversationPayload) {
  const { data } = await apiClient.post<Conversation>(`/saas-projects/${projectId}/conversations`, payload);
  return data;
}

export async function listConversations(projectId: string) {
  const { data } = await apiClient.get<ConversationListResponse>(`/saas-projects/${projectId}/conversations`);
  return data;
}

export async function getConversation(projectId: string, conversationId: string) {
  const { data } = await apiClient.get<Conversation>(
    `/saas-projects/${projectId}/conversations/${conversationId}`,
  );
  return data;
}

export async function updateConversation(projectId: string, conversationId: string, payload: UpdateConversationPayload) {
  const { data } = await apiClient.patch<Conversation>(
    `/saas-projects/${projectId}/conversations/${conversationId}`,
    payload,
  );
  return data;
}

export async function deleteConversation(projectId: string, conversationId: string) {
  await apiClient.delete(`/saas-projects/${projectId}/conversations/${conversationId}`);
}

export async function listConversationMessages(projectId: string, conversationId: string) {
  const { data } = await apiClient.get<ConversationMessageListResponse>(
    `/saas-projects/${projectId}/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function sendConversationMessage(
  projectId: string,
  conversationId: string,
  payload: SendConversationMessagePayload,
) {
  const { data } = await apiClient.post<SendConversationMessageResponse>(
    `/saas-projects/${projectId}/conversations/${conversationId}/messages`,
    payload,
  );
  return data;
}
