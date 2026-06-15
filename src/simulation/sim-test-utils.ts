// Shared helpers for the simulation invariant tests.
//
// The engine is a pure function of (state, dt), so a test just drives it with a
// fixed timestep and inspects the result. We use a 100 ms step — the same fixed
// timestep the runtime loop is moving to (issue #33) — so these tests stay
// representative of real play and become a regression net for that refactor.

import type { Aquarium, Equipment, Fish, Plant } from "./types";
import { tickSimulation, feedAll, applyFeedLoad } from "./engine";
import { FIXED_STEP_SECONDS } from "./loop";

/** Fixed simulation step, in seconds (100 ms) — shared with the live loop. */
export const FIXED_STEP = FIXED_STEP_SECONDS;

export interface SimState {
  aquarium: Aquarium;
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
}

/** Advance the world by one fixed step. */
export function stepOnce(state: SimState): SimState {
  const r = tickSimulation({ dtSeconds: FIXED_STEP, ...state });
  return { aquarium: r.aquarium, fish: r.fish, plants: r.plants, equipment: r.equipment };
}

/** Feed all fish and apply the resulting dirt/ammonia load to the water. */
export function feedTank(state: SimState, strength = 35): SimState {
  const { fish, waste } = feedAll(state.fish, strength);
  return {
    ...state,
    fish,
    aquarium: {
      ...state.aquarium,
      water: applyFeedLoad(state.aquarium.water, strength, waste, state.aquarium.volume),
    },
  };
}

export const aliveCount = (fish: Fish[]) => fish.filter((f) => f.alive).length;
export const avgHunger = (fish: Fish[]) =>
  fish.reduce((a, f) => a + f.hunger, 0) / fish.length;

export interface RunResult {
  state: SimState;
  /** Highest ammonia seen at any step (mg/L). */
  peakAmmonia: number;
  /** Highest nitrite seen at any step (mg/L). */
  peakNitrite: number;
  /** Lowest dissolved oxygen seen at any step (mg/L). */
  minOxygen: number;
  /** Simulated seconds until the first fish died, or -1 if none died. */
  firstDeathSec: number;
  /** Simulated seconds until every fish was dead, or -1 if some survived. */
  allDeadSec: number;
}

export interface RunOptions {
  /**
   * Model an attentive caretaker: feed the tank whenever average hunger climbs
   * past 50, at most once every 30 simulated seconds. When false, the fish are
   * never fed (neglect).
   */
  feedWhenHungry?: boolean;
}

/** Run the simulation for `minutes` simulated minutes, tracking key extremes. */
export function runMinutes(
  initial: SimState,
  minutes: number,
  opts: RunOptions = {}
): RunResult {
  let state = initial;
  let peakAmmonia = state.aquarium.water.ammonia;
  let peakNitrite = state.aquarium.water.nitrite;
  let minOxygen = state.aquarium.water.oxygen;
  let firstDeathSec = -1;
  let allDeadSec = -1;
  let sinceFeed = 0;

  const totalSteps = Math.round((minutes * 60) / FIXED_STEP);
  for (let i = 0; i < totalSteps; i++) {
    const sec = i * FIXED_STEP;
    sinceFeed += FIXED_STEP;
    if (opts.feedWhenHungry && sinceFeed >= 30 && avgHunger(state.fish) > 50) {
      state = feedTank(state);
      sinceFeed = 0;
    }
    state = stepOnce(state);

    const w = state.aquarium.water;
    if (w.ammonia > peakAmmonia) peakAmmonia = w.ammonia;
    if (w.nitrite > peakNitrite) peakNitrite = w.nitrite;
    if (w.oxygen < minOxygen) minOxygen = w.oxygen;

    const alive = aliveCount(state.fish);
    if (firstDeathSec < 0 && alive < state.fish.length) firstDeathSec = sec;
    if (allDeadSec < 0 && alive === 0) {
      allDeadSec = sec;
      break;
    }
  }

  return { state, peakAmmonia, peakNitrite, minOxygen, firstDeathSec, allDeadSec };
}
