"use client";

import { useQuery } from "@tanstack/react-query";
import { AiKey } from "@/features/ai-keys/types";
import { listAiKeyModels } from "@/features/ai-keys/api";
import { providerLabels, providerModels } from "@/features/ai-keys/constants";
import { maskedKey } from "@/features/ai-keys/utils";
import { Cpu, Zap, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

function CustomDropdown({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder,
  isLoading,
  alignRight = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; desc?: string }[];
  icon: any;
  placeholder: string;
  isLoading?: boolean;
  alignRight?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 h-8 px-3 rounded-full bg-card/50 hover:bg-muted/80 border border-border/50 hover:border-border transition-all text-[12px] sm:text-[13px] font-medium text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "max-w-[130px] sm:max-w-[180px] shadow-sm active:scale-95"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate flex-1 text-left">
          {isLoading ? "Cargando..." : selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full mt-2 w-[220px] max-h-[300px] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] rounded-[18px] z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 py-1.5 flex flex-col gap-0.5",
          alignRight ? "right-0" : "left-0"
        )}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "group flex items-center justify-between w-full px-3 py-2 text-left text-[13px] transition-colors relative outline-none",
                value === opt.value ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
              )}
            >
              <div className="flex flex-col min-w-0 pr-4">
                <span className={cn("truncate w-full", value === opt.value ? "font-bold" : "font-medium")}>
                  {opt.label}
                </span>
                {opt.desc && <span className="text-[11px] text-muted-foreground/70 truncate w-full group-hover:text-muted-foreground transition-colors">{opt.desc}</span>}
              </div>
              {value === opt.value && (
                <Check className="h-3.5 w-3.5 shrink-0 absolute right-3 text-primary animate-in zoom-in" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

  const keyOptions = [
    { label: "Usar Créditos", value: "CREDITS", desc: "Balance interno de ValueMySaaS" },
    ...activeKeys.map((key) => ({
      label: providerLabels[key.provider],
      value: key.id,
      desc: `Termina en ${maskedKey(key.key_last_four)}`,
    }))
  ];

  const modelOptions = [
    { label: "Auto-detectar modelo", value: "" },
    ...(availableModels?.map((m) => ({
      label: m.name,
      value: m.id,
    })) || [])
  ];

  return (
    <div className="flex items-center gap-1.5 md:gap-2 relative z-50">
      <CustomDropdown
        value={selectedKeyId}
        onChange={(val) => {
          setSelectedKeyId(val);
          setSelectedModel("");
        }}
        options={keyOptions}
        icon={Zap}
        placeholder="Proveedor"
        alignRight={selectedKeyId === "CREDITS"} // Si no hay modelo al lado, se alinea a la derecha. Si hay modelo, este se alinea a la derecha.
      />

      {selectedKeyId !== "CREDITS" && (
        <>
          <div className="w-px h-4 bg-border/60 mx-0.5"></div>
          <CustomDropdown
            value={selectedModel}
            onChange={setSelectedModel}
            options={modelOptions}
            icon={Cpu}
            placeholder="Seleccionar modelo"
            isLoading={dynamicModelsQuery.isLoading}
            alignRight={true} // El último siempre se alinea a la derecha para no romper la pantalla móvil
          />
        </>
      )}
    </div>
  );
}
