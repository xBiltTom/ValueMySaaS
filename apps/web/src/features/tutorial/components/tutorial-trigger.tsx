"use client";

import { useEffect, useRef } from "react";
import { useTutorialStore, TutorialModule } from "../store";
import { startTour } from "../config";

interface TutorialTriggerProps {
  modules: TutorialModule[];
  delayMs?: number;
}

export function TutorialTrigger({ modules, delayMs = 800 }: TutorialTriggerProps) {
  const { state, isLoaded, markAsSeen } = useTutorialStore();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasTriggered.current) return;
    
    // Find the first module the user hasn't seen
    const nextModule = modules.find((m) => !state.hasSeen[m]);
    
    if (nextModule) {
      hasTriggered.current = true;
      
      const timer = setTimeout(() => {
        startTour(nextModule, () => markAsSeen(nextModule));
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [modules, state.hasSeen, isLoaded, markAsSeen, delayMs]);

  return null;
}
