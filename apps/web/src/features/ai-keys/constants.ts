import { AiProvider } from "@/features/ai-keys/types";

export const aiProviders: AiProvider[] = ["OPENAI", "GEMINI", "ANTHROPIC", "OPENROUTER", "OTHER"];

export const providerLabels: Record<AiProvider, string> = {
  OPENAI: "OpenAI",
  GEMINI: "Google Gemini / AI Studio",
  ANTHROPIC: "Anthropic",
  OPENROUTER: "OpenRouter",
  OTHER: "Otros proveedores LiteLLM",
};

export const providerHints: Record<AiProvider, string> = {
  OPENAI: "gpt-4o",
  ANTHROPIC: "claude-3-5-sonnet-20240620",
  GEMINI: "gemini-1.5-pro",
  OPENROUTER: "meta-llama/llama-3.1-8b-instruct",
  OTHER: "groq/llama-3.1-8b-instant",
};

export const providerModels: Record<AiProvider, { id: string; name: string }[]> = {
  OPENAI: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ],
  ANTHROPIC: [
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  ],
  GEMINI: [
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  ],
  OPENROUTER: [],
  OTHER: [],
};
