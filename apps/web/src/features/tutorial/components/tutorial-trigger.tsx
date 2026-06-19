"use client";

import { useEffect, useRef } from "react";
import { useTutorialStore, TutorialModule } from "../store";
import { startTour } from "../config";
import { useCurrentUser } from "@/features/auth/use-auth";

interface TutorialTriggerProps {
  modules: TutorialModule[];
  delayMs?: number;
}

export function TutorialTrigger({ modules, delayMs = 800 }: TutorialTriggerProps) {
  const { state, isLoaded, markAsSeen } = useTutorialStore();
  const currentlyPlaying = useRef<TutorialModule | null>(null);
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    // Solo disparar automáticamente si el usuario es nuevo (< 24 horas)
    const userAgeMs = Date.now() - new Date(user.created_at).getTime();
    const isNewUser = userAgeMs < 1000 * 60 * 60 * 24;

    if (!isNewUser) {
      // Si no es nuevo, marcamos silenciosamente todo como visto para no molestarlo
      modules.forEach((m) => {
        if (!state.hasSeen[m]) markAsSeen(m);
      });
      return;
    }
    
    // Find the first module the user hasn't seen
    const nextModule = modules.find((m) => !state.hasSeen[m]);
    
    if (nextModule && currentlyPlaying.current !== nextModule) {
      currentlyPlaying.current = nextModule;
      
      const timer = setTimeout(() => {
        startTour(nextModule, () => {
          markAsSeen(nextModule);
          currentlyPlaying.current = null;
        });
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [modules, state.hasSeen, isLoaded, markAsSeen, delayMs]);

  return null;
}
