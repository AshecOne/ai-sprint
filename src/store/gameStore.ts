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
  /** UI panel state (desktop sidebar tabs) */
  rightPanel: "stats" | "shop" | "log";
  setRightPanel: (p: "stats" | "shop" | "log") => void;
  /** Mobile single-focus view: the tank, or one full-screen panel */
  mobileView: "tank" | "stats" | "shop" | "log";
  setMobileView: (v: "tank" | "stats" | "shop" | "log") => void;
  /** Decor edit mode — when on, plants & equipment become draggable/selectable */
  editMode: boolean;
  setEditMode: (b: boolean) => void;
  /** Id of the plant/equipment currently selected in edit mode */
  selectedDecorId: string | null;
  setSelectedDecorId: (id: string | null) => void;
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
  mobileView: "tank",
  setMobileView: (mobileView) => set({ mobileView }),
  editMode: false,
  setEditMode: (editMode) => set({ editMode, ...(editMode ? {} : { selectedDecorId: null }) }),
  selectedDecorId: null,
  setSelectedDecorId: (selectedDecorId) => set({ selectedDecorId }),
  lastTickMs: Date.now(),
  setLastTickMs: (lastTickMs) => set({ lastTickMs }),
}));
