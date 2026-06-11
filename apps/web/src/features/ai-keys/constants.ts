import { AiProvider } from "@/features/ai-keys/types";

export const aiProviders: AiProvider[] = ["GEMINI", "GROQ", "OPENAI", "ANTHROPIC", "NVIDIA", "OPENROUTER", "OTHER"];

export const providerLabels: Record<AiProvider, string> = {
  OPENAI: "OpenAI",
  GEMINI: "Google Gemini / AI Studio",
  ANTHROPIC: "Anthropic",
  OPENROUTER: "OpenRouter",
  GROQ: "Groq",
  NVIDIA: "NVIDIA NIM",
  OTHER: "Otros proveedores LiteLLM",
};

export const providerHints: Record<AiProvider, string> = {
  OPENAI: "gpt-4o-mini",
  ANTHROPIC: "claude-3-5-haiku-20241022",
  GEMINI: "gemini/gemini-1.5-flash",
  OPENROUTER: "openrouter/meta-llama/llama-3.1-8b-instruct",
  GROQ: "groq/llama-3-70b-versatile",
  NVIDIA: "nvidia_nim/meta/llama-3.1-70b-instruct",
  OTHER: "together_ai/mistralai/Mistral-7B-Instruct-v0.1",
};

export const providerModels: Record<AiProvider, { id: string; name: string }[]> = {
  OPENAI: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  ],
  ANTHROPIC: [
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
  ],
  GEMINI: [
    { id: "gemini/gemini-1.5-flash", name: "Gemini 1.5 Flash (recomendado)" },
    { id: "gemini/gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ],
  GROQ: [
    { id: "groq/llama-3-70b-versatile", name: "Llama 3 70B (recomendado)" },
    { id: "groq/llama-3-8b-instant", name: "Llama 3 8B (rápido)" },
    { id: "groq/mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  ],
  NVIDIA: [
    { id: "nvidia_nim/meta/llama-3.1-70b-instruct", name: "Llama 3.1 70B Instruct" },
    { id: "nvidia_nim/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct" },
  ],
  OPENROUTER: [],
  OTHER: [],
};
