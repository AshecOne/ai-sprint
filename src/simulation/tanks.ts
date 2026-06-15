// Tank upgrade tiers. Buying an upgrade bumps the aquarium one tier up: more
// water (volume) → chemistry is diluted/more stable (see engine.ts) AND a
// higher fish capacity (enforced in buyFish). `tier` is stored on the Aquarium
// as the source of truth; numbers here are the tunable design knobs.

export interface TankTier {
  /** 0-based tier index, matches Aquarium.tier */
  tier: number;
  name: string;
  /** Litres — drives the toxin-dilution factor in the engine. */
  volume: number;
  /** Real-world dimensions, cm. */
  width: number;
  height: number;
  depth: number;
  /** Max number of *living* fish allowed at this tier. */
  maxFish: number;
  /** Cash cost to upgrade INTO this tier (tier 0 is the free starter). */
  upgradePrice: number;
}

export const TANK_TIERS: TankTier[] = [
  { tier: 0, name: "Nano Tank",     volume: 60,  width: 60,  height: 40, depth: 30, maxFish: 6,  upgradePrice: 0 },
  { tier: 1, name: "Standard Tank", volume: 120, width: 80,  height: 45, depth: 35, maxFish: 12, upgradePrice: 400 },
  { tier: 2, name: "Large Tank",    volume: 240, width: 120, height: 50, depth: 45, maxFish: 24, upgradePrice: 1200 },
  { tier: 3, name: "Show Tank",     volume: 400, width: 150, height: 60, depth: 50, maxFish: 40, upgradePrice: 3000 },
];

export const MAX_TANK_TIER = TANK_TIERS.length - 1;

/** Baseline volume (tier 0) — toxin accumulation is scaled relative to this. */
export const BASE_TANK_VOLUME = TANK_TIERS[0].volume;

/** Clamp + look up a tier definition by index. */
export function tierSpec(tier: number): TankTier {
  const i = Math.max(0, Math.min(MAX_TANK_TIER, Math.floor(tier || 0)));
  return TANK_TIERS[i];
}

/**
 * Resolve an aquarium's tier index. New tanks carry an explicit `tier`; older
 * saved tanks (pre-upgrade feature) don't, so we infer it from volume and
 * fall back to 0. Used to normalise legacy saves on load.
 */
export function resolveTier(input: { tier?: number; volume?: number }): number {
  if (typeof input.tier === "number") {
    return Math.max(0, Math.min(MAX_TANK_TIER, Math.floor(input.tier)));
  }
  if (typeof input.volume === "number") {
    const byVolume = TANK_TIERS.find((t) => t.volume === input.volume);
    if (byVolume) return byVolume.tier;
  }
  return 0;
}
