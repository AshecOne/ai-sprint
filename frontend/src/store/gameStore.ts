"use client";

import { create } from "zustand";

interface GameState {
  activeAquariumId: string | null;
  setActiveAquariumId: (id: string | null) => void;
  tick: number;
  bumpTick: () => void;
  paused: boolean;
  setPaused: (p: boolean) => void;
  speed: 1 | 2 | 4;
  setSpeed: (s: 1 | 2 | 4) => void;
  /** UI panel state */
  rightPanel: "stats" | "shop" | "log";
  setRightPanel: (p: "stats" | "shop" | "log") => void;
  /** Last tick time (ms) */
  lastTickMs: number;
  setLastTickMs: (ms: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeAquariumId: null,
  setActiveAquariumId: (id) => set({ activeAquariumId: id }),
  tick: 0,
  bumpTick: () => set((s) => ({ tick: s.tick + 1 })),
  paused: false,
  setPaused: (paused) => set({ paused }),
  speed: 1,
  setSpeed: (speed) => set({ speed }),
  rightPanel: "stats",
  setRightPanel: (rightPanel) => set({ rightPanel }),
  lastTickMs: Date.now(),
  setLastTickMs: (lastTickMs) => set({ lastTickMs }),
}));
