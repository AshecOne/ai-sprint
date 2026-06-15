// Ecosystem invariant tests — the regression net for water-chemistry balancing.
//
// Each balancing pass (#6, #14) tweaks constants that ripple through the whole
// nitrogen cycle. These long-run simulations assert the *shape* of a healthy or
// neglected tank (safe ranges + directional trends) rather than brittle exact
// values, so they catch silent regressions without breaking on a deliberate
// re-tune.
//
// Math.random is pinned so spawns are deterministic and the rare random "ammonia
// spike" log event never confounds a run.

import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { createStarterTank, spawnFish } from "./engine";
import {
  runMinutes,
  aliveCount,
  type SimState,
} from "./sim-test-utils";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const starterState = (): SimState => createStarterTank();

describe("healthy, well-tended tank", () => {
  test("filtered + fed tank keeps toxins (NH3/NO2) in the safe band", () => {
    // Health only starts dropping from ammonia above 0.5 mg/L and the fish
    // stress threshold is 0.25 — a running filter plus feeding should hold
    // ammonia and nitrite well under those for the whole run.
    const { peakAmmonia, peakNitrite } = runMinutes(starterState(), 10, {
      feedWhenHungry: true,
    });
    expect(peakAmmonia).toBeLessThan(0.5);
    expect(peakNitrite).toBeLessThan(0.5);
  });

  test("oxygen stays comfortably above the danger line", () => {
    // Fish take O2 stress below 5 mg/L; airstone + plants should keep it high.
    const { minOxygen } = runMinutes(starterState(), 10, { feedWhenHungry: true });
    expect(minOxygen).toBeGreaterThan(5);
  });

  test("nitrate creeps up over time but stays in a healthy band", () => {
    // NO3 is the parameter the player watches: it should climb from the starting
    // 5 mg/L (giving a visible reason to clean) yet never reach the unhealthy
    // zone (>40) in a tended tank. Empirically lands around 15–18 over 10 min.
    const start = starterState().aquarium.water.nitrate;
    const { state } = runMinutes(starterState(), 10, { feedWhenHungry: true });
    const end = state.aquarium.water.nitrate;
    expect(start).toBeCloseTo(5, 1);
    expect(end).toBeGreaterThan(start + 3); // visibly crept up
    expect(end).toBeLessThan(40); // still healthy
  });

  test("a properly-schooled, fed tank keeps every fish alive and healthy", () => {
    // Six guppies (schooling minimum 1, hardy) in a filtered, fed tank is the
    // textbook "good care" case — nobody should die and health should stay high.
    const base = starterState();
    const sixGuppies = Array.from({ length: 6 }, () => spawnFish("guppy"));
    const state: SimState = { ...base, fish: sixGuppies };

    const { state: end } = runMinutes(state, 10, { feedWhenHungry: true });
    expect(aliveCount(end.fish)).toBe(6);
    expect(Math.min(...end.fish.map((f) => f.health))).toBeGreaterThan(60);
  });
});

describe("neglected tank", () => {
  test("unfed, unfiltered fish all die within a bounded time", () => {
    const base = starterState();
    const noFilter = base.equipment.filter((e) => e.type !== "filter");
    const state: SimState = { ...base, equipment: noFilter };

    expect(aliveCount(state.fish)).toBe(6); // sanity: start alive

    const { allDeadSec } = runMinutes(state, 30); // no feeding
    expect(allDeadSec).toBeGreaterThan(0); // they did eventually all die
    expect(allDeadSec).toBeLessThan(15 * 60); // and well within 15 min
  });

  test("even with the filter running, never feeding starves the fish to death", () => {
    const { allDeadSec, firstDeathSec } = runMinutes(starterState(), 30);
    expect(firstDeathSec).toBeGreaterThan(0);
    expect(allDeadSec).toBeGreaterThan(0);
    expect(allDeadSec).toBeLessThan(15 * 60);
  });
});
