import { create } from 'zustand';
import type { Aquarium, Fish, Plant, Equipment, WaterParameters } from '@/simulation/types';

interface AquariumStoreState {
  aquariums: Aquarium[];
}

interface AquariumStoreActions {
  addAquarium: (aquarium: Aquarium) => void;
  removeAquarium: (id: string) => void;
  updateParameters: (aquariumId: string, params: Partial<WaterParameters>) => void;
  addFish: (aquariumId: string, fish: Fish) => void;
  removeFish: (aquariumId: string, fishId: string) => void;
  updateFish: (aquariumId: string, fishId: string, updates: Partial<Fish>) => void;
  addPlant: (aquariumId: string, plant: Plant) => void;
  removePlant: (aquariumId: string, plantId: string) => void;
  updatePlant: (aquariumId: string, plantId: string, updates: Partial<Plant>) => void;
  addEquipment: (aquariumId: string, equipment: Equipment) => void;
  removeEquipment: (aquariumId: string, equipmentId: string) => void;
  toggleEquipment: (aquariumId: string, equipmentId: string) => void;
  updateBacteria: (aquariumId: string, level: number) => void;
  recordParameterHistory: (aquariumId: string, tick: number) => void;
}

export const useAquariumStore = create<AquariumStoreState & AquariumStoreActions>((set) => ({
  aquariums: [],

  addAquarium: (aquarium) =>
    set((s) => ({ aquariums: [...s.aquariums, aquarium] })),

  removeAquarium: (id) =>
    set((s) => ({ aquariums: s.aquariums.filter((a) => a.id !== id) })),

  updateParameters: (aquariumId, params) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId ? { ...a, parameters: { ...a.parameters, ...params } } : a
      ),
    })),

  addFish: (aquariumId, fish) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId ? { ...a, fish: [...a.fish, fish] } : a
      ),
    })),

  removeFish: (aquariumId, fishId) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId ? { ...a, fish: a.fish.filter((f) => f.id !== fishId) } : a
      ),
    })),

  updateFish: (aquariumId, fishId, updates) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId
          ? { ...a, fish: a.fish.map((f) => (f.id === fishId ? { ...f, ...updates } : f)) }
          : a
      ),
    })),

  addPlant: (aquariumId, plant) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId ? { ...a, plants: [...a.plants, plant] } : a
      ),
    })),

  removePlant: (aquariumId, plantId) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId
          ? { ...a, plants: a.plants.filter((p) => p.id !== plantId) }
          : a
      ),
    })),

  updatePlant: (aquariumId, plantId, updates) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId
          ? { ...a, plants: a.plants.map((p) => (p.id === plantId ? { ...p, ...updates } : p)) }
          : a
      ),
    })),

  addEquipment: (aquariumId, equipment) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId ? { ...a, equipment: [...a.equipment, equipment] } : a
      ),
    })),

  removeEquipment: (aquariumId, equipmentId) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId
          ? { ...a, equipment: a.equipment.filter((e) => e.id !== equipmentId) }
          : a
      ),
    })),

  toggleEquipment: (aquariumId, equipmentId) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId
          ? {
              ...a,
              equipment: a.equipment.map((e) =>
                e.id === equipmentId ? { ...e, active: !e.active } : e
              ),
            }
          : a
      ),
    })),

  updateBacteria: (aquariumId, level) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) =>
        a.id === aquariumId
          ? { ...a, bacteriaLevel: Math.max(0, Math.min(100, level)), cycled: level >= 80 }
          : a
      ),
    })),

  recordParameterHistory: (aquariumId, tick) =>
    set((s) => ({
      aquariums: s.aquariums.map((a) => {
        if (a.id !== aquariumId) return a;
        const history = [...a.parameterHistory, { tick, params: { ...a.parameters } }];
        return { ...a, parameterHistory: history.slice(-720) };
      }),
    })),
}));
