"use client";

import { useEffect, useRef } from "react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { advanceWorld } from "@/simulation/loop";

/**
 * Drives the simulation forward with a FIXED timestep (see simulation/loop.ts),
 * scaled by game speed. Each animation frame we measure real elapsed time,
 * accumulate it (carrying the sub-step remainder between frames), and drain it
 * in fixed FIXED_STEP_SECONDS chunks — so behaviour is identical across refresh
 * rates instead of varying with the per-frame dt.
 */

// Cap on fixed steps processed in a single frame. Bounds the work after a slow
// frame or a long tab-hidden gap so the loop can't freeze the UI catching up.
// (Real away-time fast-forward is issue #34's job, done deliberately on load.)
const MAX_STEPS_PER_FRAME = 50; // 5 simulated seconds at 100 ms/step

export function useSimulationLoop() {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());
  const carryRef = useRef<number>(0);

  useEffect(() => {
    const step = (now: number) => {
      const frameDt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      const { paused, speed, bumpTick, setLastTickMs } = useGameStore.getState();
      if (!paused && frameDt > 0) {
        const { aquariums, fish, plants, equipment, applyTick } =
          useAquariumStore.getState();
        const aquarium = aquariums[0];
        if (aquarium) {
          const { state, events, steps, carry } = advanceWorld(
            { aquarium, fish, plants, equipment },
            frameDt * speed,
            carryRef.current,
            MAX_STEPS_PER_FRAME
          );
          carryRef.current = carry;
          if (steps > 0) {
            applyTick({ ...state, events });
            bumpTick();
            setLastTickMs(Date.now());
          }
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
