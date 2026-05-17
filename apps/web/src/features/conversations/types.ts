import {
  Conversation,
  ConversationListResponse,
  ConversationMessage,
  ConversationMessageListResponse,
  SendConversationMessageResponse,
} from "@/types/api";

export type CreateConversationPayload = {
  title?: string | null;
};

export type UpdateConversationPayload = {
  title?: string | null;
  status?: "ACTIVE" | "ARCHIVED" | "DELETED";
};

export type SendConversationMessagePayload = {
  ai_key_id: string;
  model_name?: string | null;
  message: string;
};

export type {
  Conversation,
  ConversationListResponse,
  ConversationMessage,
  ConversationMessageListResponse,
  SendConversationMessageResponse,
};
