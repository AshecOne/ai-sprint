"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Aquarium, Equipment, Fish, Plant, SimulationEvent } from "@/simulation/types";
import {
  applyFeedLoad,
  cleanReward,
  cleanTankWater,
  createStarterTank,
  feedAll,
  spawnFish,
  spawnPlant,
  uid,
} from "@/simulation/engine";
import type { FishSpeciesId, PlantSpeciesId, EquipmentType } from "@/simulation/types";
import { EQUIPMENT_SPECS, FISH_SPECIES, PLANT_SPECIES } from "@/simulation/species";

/** Cooldown between paid Clean actions, so it can't be spammed. */
export const CLEAN_COOLDOWN_MS = 60_000;

const mkEvent = (
  severity: SimulationEvent["severity"],
  message: string
): SimulationEvent => ({
  id: uid("evt"),
  ts: Date.now(),
  severity,
  message,
});

interface AquariumState {
  aquariums: Aquarium[];
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
  events: SimulationEvent[];
  cash: number;
  /** Increments on every clean action — a transient signal the renderer
   *  watches to spawn a "sparkle" burst. */
  cleanFx: number;
  /** Timestamp (ms) when the Clean action becomes available again. */
  cleanReadyAt: number;

  /** Replace internal state from engine tick result */
  applyTick: (data: {
    aquarium: Aquarium;
    fish: Fish[];
    plants: Plant[];
    equipment: Equipment[];
    events: SimulationEvent[];
  }) => void;

  setAquariumName: (id: string, name: string) => void;

  feedFish: (strength?: number) => void;
  cleanTank: () => void;

  buyFish: (species: FishSpeciesId) => void;
  removeFishById: (id: string) => void;
  removeDeadFish: () => void;

  buyPlant: (species: PlantSpeciesId) => void;
  removePlantById: (id: string) => void;

  toggleEquipment: (id: string) => void;
  setEquipmentPower: (id: string, power: number) => void;
  buyEquipment: (type: EquipmentType) => void;
  removeEquipment: (id: string) => void;

  pushEvent: (evt: Omit<SimulationEvent, "id" | "ts">) => void;
  clearEvents: () => void;
  resetTank: () => void;
}

const starter = createStarterTank();

export const useAquariumStore = create<AquariumState>()(
  persist(
    (set, get) => ({
      aquariums: [starter.aquarium],
      fish: starter.fish,
      plants: starter.plants,
      equipment: starter.equipment,
      events: [
        {
          id: uid("evt"),
          ts: Date.now(),
          severity: "success",
          message: "Welcome to AquaSim. Your starter tank is online.",
        },
      ],
      cash: 250,
      cleanFx: 0,
      cleanReadyAt: 0,

      applyTick: ({ aquarium, fish, plants, equipment, events }) =>
        set((s) => ({
          aquariums: s.aquariums.map((a) => (a.id === aquarium.id ? aquarium : a)),
          fish,
          plants,
          equipment,
          events:
            events.length > 0
              ? [...events.reverse(), ...s.events].slice(0, 80)
              : s.events,
        })),

      setAquariumName: (id, name) =>
        set((s) => ({
          aquariums: s.aquariums.map((a) => (a.id === id ? { ...a, name } : a)),
        })),

      feedFish: (strength = 35) =>
        set((s) => {
          const { fish, waste } = feedAll(s.fish, strength);
          const aq = s.aquariums[0];
          const aquariums = aq
            ? s.aquariums.map((a) =>
                a.id === aq.id
                  ? { ...a, water: applyFeedLoad(a.water, strength, waste) }
                  : a
              )
            : s.aquariums;
          const fedCount = s.fish.filter((f) => f.alive).length;
          return {
            fish,
            aquariums,
            events: [
              mkEvent(
                "info",
                waste > 0.4
                  ? `Fed ${fedCount} fish — leftover food is fouling the water`
                  : `Fed ${fedCount} fish`
              ),
              ...s.events,
            ].slice(0, 80),
          };
        }),

      cleanTank: () =>
        set((s) => {
          const aq = s.aquariums[0];
          if (!aq) return s;
          // Cooldown gate — ignore clicks while still recharging.
          if (Date.now() < s.cleanReadyAt) return s;
          const reward = cleanReward(aq.water);
          const newWater = cleanTankWater(aq.water);
          return {
            cash: s.cash + reward,
            cleanFx: s.cleanFx + 1,
            cleanReadyAt: Date.now() + CLEAN_COOLDOWN_MS,
            aquariums: s.aquariums.map((a) =>
              a.id === aq.id ? { ...a, water: newWater } : a
            ),
            events: [
              reward > 0
                ? mkEvent("success", `Tank scrubbed — sold $${reward} of detritus`)
                : mkEvent("info", "Tank scrubbed (already clean — no payout)"),
              ...s.events,
            ].slice(0, 80),
          };
        }),

      buyFish: (species) =>
        set((s) => {
          const spec = FISH_SPECIES[species];
          if (s.cash < spec.price) {
            return {
              events: [
                mkEvent("warn", `Not enough cash for ${spec.label} ($${spec.price})`),
                ...s.events,
              ].slice(0, 80),
            };
          }
          return {
            cash: s.cash - spec.price,
            fish: [...s.fish, spawnFish(species)],
            events: [
              mkEvent("success", `Added a ${spec.label} to the tank`),
              ...s.events,
            ].slice(0, 80),
          };
        }),

      removeFishById: (id) =>
        set((s) => ({ fish: s.fish.filter((f) => f.id !== id) })),

      removeDeadFish: () =>
        set((s) => {
          const dead = s.fish.filter((f) => !f.alive).length;
          return {
            fish: s.fish.filter((f) => f.alive),
            events:
              dead > 0
                ? [
                    mkEvent("info", `Removed ${dead} deceased fish`),
                    ...s.events,
                  ].slice(0, 80)
                : s.events,
          };
        }),

      buyPlant: (species) =>
        set((s) => {
          const spec = PLANT_SPECIES[species];
          if (s.cash < spec.price) {
            return {
              events: [
                mkEvent("warn", `Not enough cash for ${spec.label}`),
                ...s.events,
              ].slice(0, 80),
            };
          }
          return {
            cash: s.cash - spec.price,
            plants: [...s.plants, spawnPlant(species)],
            events: [
              mkEvent("success", `Planted ${spec.label}`),
              ...s.events,
            ].slice(0, 80),
          };
        }),

      removePlantById: (id) =>
        set((s) => ({ plants: s.plants.filter((p) => p.id !== id) })),

      toggleEquipment: (id) =>
        set((s) => ({
          equipment: s.equipment.map((e) =>
            e.id === id ? { ...e, active: !e.active } : e
          ),
        })),

      setEquipmentPower: (id, power) =>
        set((s) => ({
          equipment: s.equipment.map((e) =>
            e.id === id ? { ...e, power } : e
          ),
        })),

      buyEquipment: (type) =>
        set((s) => {
          const spec = EQUIPMENT_SPECS[type];
          if (s.cash < spec.price) {
            return {
              events: [
                mkEvent("warn", `Not enough cash for ${spec.label}`),
                ...s.events,
              ].slice(0, 80),
            };
          }
          // place at random slot on glass
          const x = 0.1 + Math.random() * 0.8;
          const y = type === "filter" ? 0.15 : type === "light" ? 0.04 : 0.5;
          return {
            cash: s.cash - spec.price,
            equipment: [
              ...s.equipment,
              { id: uid("eq"), type, x, y, active: true, power: 60 },
            ],
            events: [
              mkEvent("success", `Installed ${spec.label}`),
              ...s.events,
            ].slice(0, 80),
          };
        }),

      removeEquipment: (id) =>
        set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) })),

      pushEvent: (evt) =>
        set((s) => ({
          events: [
            { id: uid("evt"), ts: Date.now(), ...evt } as SimulationEvent,
            ...s.events,
          ].slice(0, 80),
        })),

      clearEvents: () => set({ events: [] }),

      resetTank: () => {
        const fresh = createStarterTank();
        set({
          aquariums: [fresh.aquarium],
          fish: fresh.fish,
          plants: fresh.plants,
          equipment: fresh.equipment,
          cash: 250,
          cleanFx: 0,
          cleanReadyAt: 0,
          events: [mkEvent("success", "Tank reset to factory defaults")],
        });
      },
    }),
    {
      name: "aquasim-aquarium",
      version: 1,
    }
  )
);
