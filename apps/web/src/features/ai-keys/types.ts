import { AiKey, AiKeyListResponse, AiProvider, VerifyAiKeyResponse } from "@/types/api";

export type CreateAiKeyPayload = {
  provider: AiProvider;
  label?: string | null;
  api_key: string;
};

export type UpdateAiKeyPayload = {
  label?: string | null;
  is_active?: boolean;
};

export type VerifyAiKeyPayload = {
  model_name?: string;
};

export type { AiKey, AiKeyListResponse, AiProvider, VerifyAiKeyResponse };
