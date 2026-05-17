import { AiProvider } from "@/features/ai-keys/types";
import { providerLabels } from "@/features/ai-keys/constants";

export function providerLabel(provider: AiProvider) {
  return providerLabels[provider] || provider;
}

export function maskedKey(lastFour?: string | null) {
  return lastFour ? `•••• ${lastFour}` : "••••";
}
