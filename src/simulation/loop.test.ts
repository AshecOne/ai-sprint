// Tests for the fixed-timestep driver (issue #33). The headline guarantee is
// refresh-rate independence: the same elapsed time yields the same result no
// matter how it's chopped into frames.

import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { createStarterTank } from "./engine";
import { advanceWorld, FIXED_STEP_SECONDS, type WorldState } from "./loop";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const world = (): WorldState => createStarterTank();

describe("advanceWorld — fixed timestep", () => {
  test("each sub-step is exactly FIXED_STEP_SECONDS long", () => {
    const { steps, carry } = advanceWorld(world(), 1); // 1 s
    expect(steps).toBe(Math.round(1 / FIXED_STEP_SECONDS)); // 10 steps
    expect(carry).toBeCloseTo(0, 6);
  });

  test("leftover time under one step is carried, not lost", () => {
    const half = FIXED_STEP_SECONDS / 2;
    const a = advanceWorld(world(), half); // not enough for a step
    expect(a.steps).toBe(0);
    expect(a.carry).toBeCloseTo(half, 6);

    // Feeding the carry back in completes exactly one step.
    const b = advanceWorld(world(), half, a.carry);
    expect(b.steps).toBe(1);
  });

  test("refresh-rate independence: identical result however time is sliced", () => {
    // The world after advancing is a pure function of the *number* of fixed
    // steps applied — the per-frame slicing only changes when a step fires, not
    // its content. So we drive several cadences to the SAME step count and
    // assert identical state. (Comparing by wall-clock total instead would be
    // off-by-one at the boundary purely from 0.1 s not being exact in binary —
    // a float artefact, not a behaviour difference.)
    const big = advanceWorld(world(), 30); // one laggy frame
    const target = big.steps;

    const driveInSlices = (dt: number): WorldState => {
      let state = world();
      let carry = 0;
      let steps = 0;
      // dt < FIXED_STEP_SECONDS ⇒ each call adds at most one step, so we can
      // land exactly on `target` rather than overshooting.
      while (steps < target) {
        const r = advanceWorld(state, dt, carry);
        state = r.state;
        carry = r.carry;
        steps += r.steps;
      }
      expect(steps).toBe(target);
      return state;
    };

    const at60Hz = driveInSlices(1 / 60); // ~16.7 ms frames
    const at144Hz = driveInSlices(1 / 144); // ~6.9 ms frames

    for (const sliced of [at60Hz, at144Hz]) {
      expect(sliced.aquarium.water).toEqual(big.state.aquarium.water);
      expect(sliced.fish.map((f) => f.health)).toEqual(
        big.state.fish.map((f) => f.health)
      );
      expect(sliced.fish.map((f) => f.hunger)).toEqual(
        big.state.fish.map((f) => f.hunger)
      );
    }
  });

  test("game-speed multiplier just scales elapsed time (×2 = twice the steps)", () => {
    const oneX = advanceWorld(world(), 5); // 5 s at speed 1
    const twoX = advanceWorld(world(), 5 * 2); // 5 s of real time at speed 2
    expect(twoX.steps).toBe(oneX.steps * 2);
  });

  test("maxSteps caps the work and drops the unprocessed remainder", () => {
    // A 1-hour gap would be 36 000 steps; the cap must bound it.
    const r = advanceWorld(world(), 3600, 0, 50);
    expect(r.steps).toBe(50);
    expect(r.carry).toBe(0); // remainder dropped, doesn't pile up
  });

  test("events from every sub-step are collected in chronological order", () => {
    // Drive a neglected tank long enough to kill fish, then check the death
    // events come back ordered oldest-first (what applyTick expects).
    const base = world();
    const noFilter = base.equipment.filter((e) => e.type !== "filter");
    const r = advanceWorld({ ...base, equipment: noFilter }, 20 * 60); // 20 min
    const deaths = r.events.filter((e) => e.message.includes("has died"));
    expect(deaths.length).toBeGreaterThan(0);
    for (let i = 1; i < deaths.length; i++) {
      expect(deaths[i].ts).toBeGreaterThanOrEqual(deaths[i - 1].ts);
    }
  });
});
