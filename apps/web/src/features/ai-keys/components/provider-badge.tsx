import { Badge } from "@/components/ui/badge";
import { providerLabel } from "@/features/ai-keys/utils";
import { AiProvider } from "@/features/ai-keys/types";

export function ProviderBadge({ provider }: { provider: AiProvider }) {
  return <Badge className="bg-primary/10 text-primary">{providerLabel(provider)}</Badge>;
}
