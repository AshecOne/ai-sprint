// Fixed-timestep driver for the simulation (issue #33).
//
// The engine (`tickSimulation`) is tuned against a specific dt, so the world is
// advanced in fixed FIXED_STEP_SECONDS chunks rather than once per animation
// frame. This makes the sim *deterministic* — the same elapsed time produces the
// same result regardless of the display's refresh rate — and decouples sim cost
// from frame rate.
//
// `advanceWorld` is the shared core: the live React loop (useSimulationLoop)
// threads its leftover `carry` frame to frame, and the offline catch-up (#34)
// will call it once with a large, capped elapsed time.

import { tickSimulation } from "./engine";
import type {
  Aquarium,
  Equipment,
  Fish,
  Plant,
  SimulationEvent,
} from "./types";

/** The single fixed simulation step, in seconds (100 ms = 10 Hz). */
export const FIXED_STEP_SECONDS = 0.1;

export interface WorldState {
  aquarium: Aquarium;
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
}

export interface AdvanceResult {
  state: WorldState;
  /** Events from every sub-step, in chronological order (oldest first). */
  events: SimulationEvent[];
  /** How many fixed steps were actually run. */
  steps: number;
  /** Unused time (< FIXED_STEP_SECONDS) to carry into the next call. */
  carry: number;
}

/**
 * Advance `state` by `elapsedSeconds` using fixed FIXED_STEP_SECONDS sub-steps.
 *
 * @param carry    leftover time from a previous call, added back so fractional
 *                 time is never lost across calls (the live loop threads this).
 * @param maxSteps cap on steps run in one call, to bound work — a spiral of
 *                 death on a slow frame, or a huge gap after the tab was hidden.
 *                 When the cap is hit the remaining time is dropped (carry = 0).
 */
export function advanceWorld(
  state: WorldState,
  elapsedSeconds: number,
  carry = 0,
  maxSteps = Number.POSITIVE_INFINITY
): AdvanceResult {
  let acc = carry + Math.max(0, elapsedSeconds);
  let current = state;
  const events: SimulationEvent[] = [];
  let steps = 0;

  while (acc >= FIXED_STEP_SECONDS && steps < maxSteps) {
    const r = tickSimulation({
      dtSeconds: FIXED_STEP_SECONDS,
      aquarium: current.aquarium,
      fish: current.fish,
      plants: current.plants,
      equipment: current.equipment,
    });
    current = {
      aquarium: r.aquarium,
      fish: r.fish,
      plants: r.plants,
      equipment: r.equipment,
    };
    if (r.events.length > 0) events.push(...r.events);
    acc -= FIXED_STEP_SECONDS;
    steps += 1;
  }

  // If we stopped because of the cap (not because we ran out of time), drop the
  // unprocessed remainder instead of letting it pile up forever.
  const carryOut = steps < maxSteps ? acc : 0;
  return { state: current, events, steps, carry: carryOut };
}
