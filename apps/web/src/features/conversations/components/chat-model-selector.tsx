"use client";

import { useQuery } from "@tanstack/react-query";
import { AiKey } from "@/features/ai-keys/types";
import { listAiKeyModels } from "@/features/ai-keys/api";
import { providerLabels, providerModels } from "@/features/ai-keys/constants";
import { maskedKey } from "@/features/ai-keys/utils";
import { Cpu, Zap } from "lucide-react";

export function ChatModelSelector({
  activeKeys,
  selectedKeyId,
  setSelectedKeyId,
  selectedModel,
  setSelectedModel,
}: {
  activeKeys: AiKey[];
  selectedKeyId: string;
  setSelectedKeyId: (val: string) => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
}) {
  const selectedKey = activeKeys.find((k) => k.id === selectedKeyId);

  const dynamicModelsQuery = useQuery({
    queryKey: ["ai-key-models", selectedKeyId],
    queryFn: () => listAiKeyModels(selectedKeyId),
    enabled: !!selectedKeyId && selectedKeyId !== "CREDITS" && selectedKey?.provider !== "ANTHROPIC",
    staleTime: 1000 * 60 * 5,
  });

  const availableModels = selectedKeyId !== "CREDITS" && selectedKey 
    ? (dynamicModelsQuery.data?.items?.length ? dynamicModelsQuery.data.items : providerModels[selectedKey.provider])
    : [];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select 
          className="appearance-none bg-transparent hover:bg-muted/50 transition-colors h-9 pl-9 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 ring-primary/20 cursor-pointer"
          value={selectedKeyId}
          onChange={(e) => {
            setSelectedKeyId(e.target.value);
            setSelectedModel(""); // reset model when key changes
          }}
        >
          <option value="CREDITS">⚡ Usar Créditos</option>
          {activeKeys.map((key) => (
            <option key={key.id} value={key.id}>
              {providerLabels[key.provider]} ({maskedKey(key.key_last_four)})
            </option>
          ))}
        </select>
        <Zap className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
      </div>

      {selectedKeyId !== "CREDITS" && (
        <>
          <div className="w-px h-4 bg-border/60 mx-1"></div>
          <div className="relative">
            <select
              className="appearance-none bg-transparent hover:bg-muted/50 transition-colors h-9 pl-9 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 ring-primary/20 cursor-pointer max-w-[200px] truncate"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={dynamicModelsQuery.isLoading}
            >
              <option value="">Auto-detectar modelo</option>
              {availableModels?.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <Cpu className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
          </div>
        </>
      )}
    </div>
  );
}
