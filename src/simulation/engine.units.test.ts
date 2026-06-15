// Unit tests for the discrete action helpers (feed / clean / reward) and the
// determinism guarantee the fixed-timestep loop (#33) and offline catch-up (#34)
// will rely on.

import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import {
  createDefaultWater,
  createStarterTank,
  feedAll,
  cleanReward,
  cleanTankWater,
  dirtIndex,
  spawnFish,
} from "./engine";
import { runMinutes, type SimState } from "./sim-test-utils";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("feedAll", () => {
  test("hungry fish eat fully — no waste", () => {
    const fish = [spawnFish("guppy"), spawnFish("guppy")].map((f) => ({
      ...f,
      hunger: 90,
    }));
    const { fish: fed, waste } = feedAll(fish, 35);
    expect(waste).toBe(0); // demand (35 each) >= supply, nothing wasted
    expect(fed[0].hunger).toBe(55); // 90 - 35
  });

  test("nearly-full fish waste most of the food", () => {
    const fish = [{ ...spawnFish("guppy"), hunger: 5 }];
    const { waste } = feedAll(fish, 35);
    expect(waste).toBeGreaterThan(0.8); // only 5 of 35 eaten
  });

  test("feeding a tank with no living fish wastes everything", () => {
    const fish = [{ ...spawnFish("guppy"), alive: false }];
    const { waste } = feedAll(fish, 35);
    expect(waste).toBe(1);
  });
});

describe("cleanReward — anti-farming", () => {
  test("clean water pays nothing", () => {
    const water = createDefaultWater(); // cleanliness 96, turbidity 1.5 → clean
    expect(cleanReward(water, 6)).toBe(0);
  });

  test("dirty water with living fish pays out", () => {
    const water = { ...createDefaultWater(), cleanliness: 30, turbidity: 60 };
    expect(dirtIndex(water)).toBeGreaterThan(5);
    expect(cleanReward(water, 6)).toBeGreaterThan(0);
  });

  test("a dirty tank with no living fish still pays nothing (can't farm an empty tank)", () => {
    const water = { ...createDefaultWater(), cleanliness: 30, turbidity: 60 };
    expect(cleanReward(water, 0)).toBe(0);
  });
});

describe("cleanTankWater", () => {
  test("dilutes toxins and restores cleanliness", () => {
    const dirty = {
      ...createDefaultWater(),
      ammonia: 1,
      nitrite: 1,
      nitrate: 80,
      cleanliness: 20,
      turbidity: 50,
    };
    const cleaned = cleanTankWater(dirty);
    // ~55% water change → toxins drop, but are not zeroed.
    expect(cleaned.ammonia).toBeLessThan(dirty.ammonia);
    expect(cleaned.nitrate).toBeLessThan(dirty.nitrate);
    expect(cleaned.nitrate).toBeGreaterThan(0);
    expect(cleaned.cleanliness).toBeGreaterThan(dirty.cleanliness);
    expect(cleaned.turbidity).toBeLessThan(dirty.turbidity);
  });
});

describe("determinism", () => {
  test("same inputs + pinned RNG ⇒ identical long-run output", () => {
    const make = (): SimState => createStarterTank();
    const a = runMinutes(make(), 5, { feedWhenHungry: true });
    const b = runMinutes(make(), 5, { feedWhenHungry: true });
    // Identical water chemistry and fish vitals — the property the fixed-step
    // loop (#33) and offline fast-forward (#34) depend on.
    expect(a.state.aquarium.water).toEqual(b.state.aquarium.water);
    expect(a.state.fish.map((f) => f.health)).toEqual(
      b.state.fish.map((f) => f.health)
    );
    expect(a.peakAmmonia).toBe(b.peakAmmonia);
  });
});
