"use client";

import { useState, useEffect } from "react";

export type TutorialModule = "global" | "dashboard" | "newProject" | "aiKeys" | "projectsList";

interface TutorialState {
  hasSeen: Record<TutorialModule, boolean>;
}

const STORAGE_KEY = "vms_tutorial_state";

const DEFAULT_STATE: TutorialState = {
  hasSeen: {
    global: false,
    dashboard: false,
    newProject: false,
    aiKeys: false,
    projectsList: false,
  },
};

export function useTutorialStore() {
  const [state, setState] = useState<TutorialState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load tutorial state", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const markAsSeen = (module: TutorialModule) => {
    setState((prev) => {
      const newState = {
        ...prev,
        hasSeen: { ...prev.hasSeen, [module]: true },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const resetModule = (module: TutorialModule) => {
    setState((prev) => {
      const newState = {
        ...prev,
        hasSeen: { ...prev.hasSeen, [module]: false },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  return { state, markAsSeen, resetModule, isLoaded };
}
