"use client";

import { useEffect, useRef } from "react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { tickSimulation } from "@/simulation/engine";

/**
 * Drives the simulation forward at ~10Hz, multiplied by game speed.
 * Pulls latest state from Zustand each tick, computes a new state, and
 * dispatches it via `applyTick`.
 */
export function useSimulationLoop() {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());

  useEffect(() => {
    const step = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      const { paused, speed, bumpTick, setLastTickMs } = useGameStore.getState();
      if (!paused && dt > 0 && dt < 1) {
        const { aquariums, fish, plants, equipment, applyTick } =
          useAquariumStore.getState();
        const aquarium = aquariums[0];
        if (aquarium) {
          const result = tickSimulation({
            dtSeconds: dt * speed,
            aquarium,
            fish,
            plants,
            equipment,
          });
          applyTick(result);
          bumpTick();
          setLastTickMs(Date.now());
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
