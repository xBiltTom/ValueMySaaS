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
  OPENAI: "gpt-4o-mini",
  GEMINI: "gemini-1.5-flash",
  ANTHROPIC: "claude-3-5-haiku-latest",
  OPENROUTER: "meta-llama/llama-3.1-8b-instruct",
  OTHER: "groq/llama-3.1-8b-instant",
};
