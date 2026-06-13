import { create } from 'zustand';
import type { GameSpeed } from '@/simulation/types';

interface GameStoreState {
  tick: number;
  speed: GameSpeed;
  paused: boolean;
  currency: number;
  activeAquariumId: string | null;
}

interface GameStoreActions {
  setTick: (tick: number) => void;
  setSpeed: (speed: GameSpeed) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  setActiveAquarium: (id: string | null) => void;
}

export const useGameStore = create<GameStoreState & GameStoreActions>((set, get) => ({
  tick: 0,
  speed: 1,
  paused: true,
  currency: 500,
  activeAquariumId: null,

  setTick: (tick) => set({ tick }),
  setSpeed: (speed) => set({ speed }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (paused) => set({ paused }),
  addCurrency: (amount) => set((s) => ({ currency: s.currency + amount })),
  spendCurrency: (amount) => {
    if (get().currency < amount) return false;
    set((s) => ({ currency: s.currency - amount }));
    return true;
  },
  setActiveAquarium: (id) => set({ activeAquariumId: id }),
}));
