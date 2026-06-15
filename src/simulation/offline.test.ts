// Tests for offline / away progression (issue #34).

import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { createStarterTank } from "./engine";
import {
  shouldFastForward,
  fastForwardAway,
  fastForwardAwayChunked,
  OFFLINE_CAP_SECONDS,
  OFFLINE_MIN_SECONDS,
  type FastForwardResult,
} from "./offline";
import type { WorldState } from "./loop";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const world = (): WorldState => createStarterTank();

describe("shouldFastForward", () => {
  test("ignores short, missing, or nonsensical gaps", () => {
    expect(shouldFastForward(0)).toBe(false);
    expect(shouldFastForward(OFFLINE_MIN_SECONDS - 1)).toBe(false);
    expect(shouldFastForward(Number.NaN)).toBe(false);
    expect(shouldFastForward(Number.POSITIVE_INFINITY)).toBe(false);
  });
  test("triggers once the gap reaches the minimum", () => {
    expect(shouldFastForward(OFFLINE_MIN_SECONDS)).toBe(true);
    expect(shouldFastForward(3600)).toBe(true);
  });
});

describe("fastForwardAway", () => {
  test("advances time and reports the change", () => {
    const { summary, state } = fastForwardAway(world(), 10 * 60); // 10 min
    expect(summary.simulatedSeconds).toBe(10 * 60);
    expect(summary.capped).toBe(false);
    expect(summary.steps).toBeGreaterThan(0);
    // Unfed for 10 min → fish get hungrier (nothing auto-feeds).
    expect(summary.avgHungerAfter).toBeGreaterThan(summary.avgHungerBefore);
    expect(state.aquarium.water).not.toEqual(world().aquarium.water);
  });

  test("a long absence starves the fish, and the summary counts the deaths", () => {
    const { summary } = fastForwardAway(world(), 2 * 3600); // 2 h
    expect(summary.aliveBefore).toBe(6);
    expect(summary.deaths).toBeGreaterThan(0);
    expect(summary.aliveAfter).toBe(summary.aliveBefore - summary.deaths);
  });

  test("caps the simulated time at 8 hours", () => {
    const { summary } = fastForwardAway(world(), 50 * 3600); // 50 h away
    expect(summary.capped).toBe(true);
    expect(summary.simulatedSeconds).toBe(OFFLINE_CAP_SECONDS);
    expect(summary.awaySeconds).toBe(50 * 3600); // real time away is preserved
  });
});

describe("fastForwardAwayChunked", () => {
  const immediateYield = () => Promise.resolve();

  test("matches the synchronous result regardless of chunk size", async () => {
    const sync = fastForwardAway(world(), 20 * 60);
    const chunked: FastForwardResult = await fastForwardAwayChunked(world(), 20 * 60, {
      chunkSeconds: 60, // many small chunks
      yieldToEventLoop: immediateYield,
    });
    expect(chunked.summary.steps).toBe(sync.summary.steps);
    expect(chunked.state.aquarium.water).toEqual(sync.state.aquarium.water);
    expect(chunked.state.fish.map((f) => f.health)).toEqual(
      sync.state.fish.map((f) => f.health)
    );
    expect(chunked.summary.deaths).toBe(sync.summary.deaths);
  });

  test("reports progress from 0 toward 1", async () => {
    const fractions: number[] = [];
    await fastForwardAwayChunked(world(), 30 * 60, {
      chunkSeconds: 5 * 60,
      yieldToEventLoop: immediateYield,
      onProgress: (f) => fractions.push(f),
    });
    expect(fractions.length).toBeGreaterThan(1);
    expect(fractions[fractions.length - 1]).toBeCloseTo(1, 5);
    // monotonic non-decreasing
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeGreaterThanOrEqual(fractions[i - 1]);
    }
  });
});
