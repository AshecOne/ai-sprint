// Offline / away progression (issue #34).
//
// When the tab is closed the rAF loop stops, so sim time freezes. On the next
// load we compute how long the player was away (from the save's `savedAt`) and
// fast-forward the world by that much — reusing the deterministic fixed-step
// engine from loop.ts — then surface a "While you were away…" summary.
//
// Caveat worth knowing: nothing auto-feeds (feeding is player-only), so a long
// absence WILL starve the fish — reporting those deaths is the point of the
// summary, not a bug.

import { advanceWorld, type WorldState } from "./loop";
import type { SimulationEvent } from "./types";

/** Hard cap on simulated away-time so a months-long gap can't explode the run. */
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60; // 8 hours
/** Below this, the gap isn't worth fast-forwarding or interrupting the player. */
export const OFFLINE_MIN_SECONDS = 60;
/**
 * Seconds of sim time processed per async chunk. ~6000 steps ≈ a few ms of work,
 * so the catch-up never blocks the main thread (the loader keeps animating) even
 * for a full 8 h gap.
 */
export const OFFLINE_CHUNK_SECONDS = 600;

export interface AwaySummary {
  /** Real wall-clock time away (uncapped), for display. */
  awaySeconds: number;
  /** Time actually simulated (capped at OFFLINE_CAP_SECONDS). */
  simulatedSeconds: number;
  /** True when the absence exceeded the cap (we only simulated the cap). */
  capped: boolean;
  steps: number;
  aliveBefore: number;
  aliveAfter: number;
  deaths: number;
  avgHungerBefore: number;
  avgHungerAfter: number;
  nitrateBefore: number;
  nitrateAfter: number;
  ammoniaBefore: number;
  ammoniaAfter: number;
  cleanlinessBefore: number;
  cleanlinessAfter: number;
}

export interface FastForwardResult {
  state: WorldState;
  /** All events emitted during the catch-up, chronological. */
  events: SimulationEvent[];
  summary: AwaySummary;
}

const aliveCount = (fish: WorldState["fish"]) =>
  fish.filter((f) => f.alive).length;
const avgHunger = (fish: WorldState["fish"]) =>
  fish.length ? fish.reduce((a, f) => a + f.hunger, 0) / fish.length : 0;

/**
 * Should we bother running (and showing) offline progression for this gap?
 * Guards against tiny gaps and missing/forward-clock timestamps.
 */
export function shouldFastForward(elapsedSeconds: number): boolean {
  return Number.isFinite(elapsedSeconds) && elapsedSeconds >= OFFLINE_MIN_SECONDS;
}

function buildSummary(
  before: WorldState,
  after: WorldState,
  meta: { steps: number; simulatedSeconds: number; capped: boolean; awaySeconds: number }
): AwaySummary {
  return {
    awaySeconds: meta.awaySeconds,
    simulatedSeconds: meta.simulatedSeconds,
    capped: meta.capped,
    steps: meta.steps,
    aliveBefore: aliveCount(before.fish),
    aliveAfter: aliveCount(after.fish),
    deaths: aliveCount(before.fish) - aliveCount(after.fish),
    avgHungerBefore: avgHunger(before.fish),
    avgHungerAfter: avgHunger(after.fish),
    nitrateBefore: before.aquarium.water.nitrate,
    nitrateAfter: after.aquarium.water.nitrate,
    ammoniaBefore: before.aquarium.water.ammonia,
    ammoniaAfter: after.aquarium.water.ammonia,
    cleanlinessBefore: before.aquarium.water.cleanliness,
    cleanlinessAfter: after.aquarium.water.cleanliness,
  };
}

/**
 * Advance `state` by `elapsedSeconds` of away-time (capped) and build the
 * before/after summary. Synchronous and pure — the deterministic core used by
 * tests. For large gaps the UI should prefer {@link fastForwardAwayChunked} so
 * the work doesn't block a frame.
 */
export function fastForwardAway(
  state: WorldState,
  elapsedSeconds: number
): FastForwardResult {
  const simulatedSeconds = Math.min(
    Math.max(0, elapsedSeconds),
    OFFLINE_CAP_SECONDS
  );
  const capped = elapsedSeconds > OFFLINE_CAP_SECONDS;
  const { state: after, events, steps } = advanceWorld(state, simulatedSeconds);
  return {
    state: after,
    events,
    summary: buildSummary(state, after, {
      steps,
      simulatedSeconds,
      capped,
      awaySeconds: Math.max(0, elapsedSeconds),
    }),
  };
}

/** Yield to the event loop so a long catch-up never blocks the main thread. */
const defaultYield = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Same result as {@link fastForwardAway} but processed in chunks, awaiting
 * between them so the page (loader animation) stays responsive during a big
 * fast-forward. Carry is threaded across chunks, so the outcome matches the
 * synchronous version.
 */
export async function fastForwardAwayChunked(
  state: WorldState,
  elapsedSeconds: number,
  opts: {
    chunkSeconds?: number;
    onProgress?: (fraction: number) => void;
    yieldToEventLoop?: () => Promise<void>;
  } = {}
): Promise<FastForwardResult> {
  const simulatedSeconds = Math.min(
    Math.max(0, elapsedSeconds),
    OFFLINE_CAP_SECONDS
  );
  const capped = elapsedSeconds > OFFLINE_CAP_SECONDS;
  const chunk = opts.chunkSeconds ?? OFFLINE_CHUNK_SECONDS;
  const yieldFn = opts.yieldToEventLoop ?? defaultYield;

  const before = state;
  let current = state;
  let carry = 0;
  let steps = 0;
  const events: SimulationEvent[] = [];
  let remaining = simulatedSeconds;

  while (remaining > 1e-9) {
    const slice = Math.min(chunk, remaining);
    const r = advanceWorld(current, slice, carry);
    current = r.state;
    carry = r.carry;
    steps += r.steps;
    if (r.events.length > 0) events.push(...r.events);
    remaining -= slice;
    opts.onProgress?.(1 - remaining / simulatedSeconds);
    if (remaining > 1e-9) await yieldFn();
  }

  return {
    state: current,
    events,
    summary: buildSummary(before, current, {
      steps,
      simulatedSeconds,
      capped,
      awaySeconds: Math.max(0, elapsedSeconds),
    }),
  };
}
