"use client";

import { useQuery } from "@tanstack/react-query";
import { AiKey } from "@/features/ai-keys/types";
import { listAiKeyModels } from "@/features/ai-keys/api";
import { getPublicConfig } from "@/features/admin/api";
import { useCurrentUser } from "@/features/auth/use-auth";
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
    <div className="relative font-mono" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-[6px] bg-card/60 backdrop-blur-md border border-border hover:border-primary/50 transition-all text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-[2px_2px_0_rgba(0,0,0,0.15)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
          "max-w-[100px] sm:max-w-[200px]"
        )}
      >
        <Icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0", isOpen ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate flex-1 text-left">
          {isLoading ? "CARGANDO..." : selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180 text-primary")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full mt-2 w-[240px] max-h-[300px] overflow-y-auto bg-card/95 backdrop-blur-xl border-2 border-border/60 shadow-[4px_4px_0_rgba(0,0,0,0.3)] rounded-[8px] z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 py-1.5 flex flex-col gap-0.5 custom-scrollbar",
          alignRight ? "right-0" : "left-0"
        )}>
          {options.map((opt) => (
            <button
              key={opt.value}
              disabled={(opt as any).disabled}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "group flex items-center justify-between w-full px-3 py-2 text-left text-[11px] font-black uppercase tracking-widest transition-colors relative outline-none",
                value === opt.value ? "bg-primary/20 text-primary" : "hover:bg-muted/80 text-foreground/80",
                (opt as any).disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <div className="flex flex-col min-w-0 pr-4">
                <span className={cn("truncate w-full")}>
                  {opt.label}
                </span>
                {opt.desc && <span className="text-[9px] text-muted-foreground truncate w-full mt-0.5">{opt.desc}</span>}
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
  const { data: currentUser } = useCurrentUser();
  const configQuery = useQuery({ queryKey: ["public-config"], queryFn: getPublicConfig });
  
  const systemCreditsEnabled = configQuery.data?.system_credits_enabled ?? true;
  const hasCredits = (currentUser?.ai_credits ?? 0) > 0;

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
    ...(hasCredits ? [{
      label: systemCreditsEnabled ? `USAR CRÉDITOS (${currentUser?.ai_credits ?? 0})` : "CRÉDITOS DESACTIVADOS",
      value: "CREDITS",
      desc: systemCreditsEnabled ? "BALANCE INTERNO DE SISTEMA" : "TEMPORALMENTE DESACTIVADO",
      disabled: !systemCreditsEnabled,
    }] : []),
    ...activeKeys.map((key) => ({
      label: providerLabels[key.provider],
      value: key.id,
      desc: `KEY: ***${maskedKey(key.key_last_four)}`,
    }))
  ];

  // Si seleccionaste una clave desactivada o "CREDITS" y está desactivado, cámbiala a la primera disponible.
  useEffect(() => {
    if (selectedKeyId === "CREDITS" && !systemCreditsEnabled && activeKeys.length > 0) {
      setSelectedKeyId(activeKeys[0].id);
    }
  }, [selectedKeyId, systemCreditsEnabled, activeKeys, setSelectedKeyId]);

  const modelOptions = [
    { label: "AUTO-DETECTAR", value: "" },
    ...(availableModels?.map((m) => ({
      label: m.name,
      value: m.id,
    })) || [])
  ];

  return (
    <div className="flex items-center gap-2 md:gap-3 relative z-50">
      <CustomDropdown
        value={selectedKeyId}
        onChange={(val) => {
          setSelectedKeyId(val);
          setSelectedModel("");
        }}
        options={keyOptions}
        icon={Zap}
        placeholder="PROVEEDOR"
        alignRight={selectedKeyId === "CREDITS"}
      />

      {selectedKeyId !== "CREDITS" && (
        <>
          <div className="w-px h-6 bg-border/60 mx-0.5"></div>
          <CustomDropdown
            value={selectedModel}
            onChange={setSelectedModel}
            options={modelOptions}
            icon={Cpu}
            placeholder="SELECCIONAR MODELO"
            isLoading={dynamicModelsQuery.isLoading}
            alignRight={true}
          />
        </>
      )}
    </div>
  );
}
