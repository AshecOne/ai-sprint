import type {
  Aquarium,
  Equipment,
  Fish,
  FishSpeciesId,
  Plant,
  PlantSpeciesId,
  SimulationEvent,
  WaterParameters,
} from "./types";
import { FISH_SPECIES, PLANT_SPECIES } from "./species";

let idCounter = 0;
export const uid = (prefix = "id") => {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const createDefaultWater = (): WaterParameters => ({
  temperature: 25,
  ph: 7.2,
  ammonia: 0.0,
  nitrite: 0.0,
  nitrate: 5,
  oxygen: 8.0,
  hardness: 8,
  turbidity: 1.5,
  cleanliness: 96,
  co2: 18,
});

export const createStarterTank = (): {
  aquarium: Aquarium;
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
} => {
  const aquarium: Aquarium = {
    id: uid("aqua"),
    name: "Starter Tank",
    volume: 60,
    width: 60,
    height: 40,
    depth: 30,
    createdAt: new Date().toISOString(),
    water: createDefaultWater(),
    lightLevel: 0.7,
    autoFeed: true,
  };

  const fish: Fish[] = [
    spawnFish("guppy", 0.25, 0.35),
    spawnFish("guppy", 0.4, 0.4),
    spawnFish("guppy", 0.55, 0.45),
    spawnFish("neon_tetra", 0.3, 0.5),
    spawnFish("neon_tetra", 0.5, 0.55),
    spawnFish("neon_tetra", 0.7, 0.48),
    spawnFish("corydoras", 0.6, 0.8),
  ];

  const plants: Plant[] = [
    spawnPlant("amazon_sword", 0.12, 0.86),
    spawnPlant("java_fern", 0.32, 0.86),
    spawnPlant("vallisneria", 0.55, 0.86),
    spawnPlant("anubias", 0.75, 0.86),
    spawnPlant("java_moss", 0.9, 0.86),
  ];

  const equipment: Equipment[] = [
    { id: uid("eq"), type: "filter", x: 0.93, y: 0.02, active: true, power: 70 },
    { id: uid("eq"), type: "heater", x: 0.05, y: 0.55, active: true, power: 55 },
    { id: uid("eq"), type: "airstone", x: 0.2, y: 0.9, active: true, power: 60 },
    { id: uid("eq"), type: "light", x: 0.5, y: 0.005, active: true, power: 80 },
  ];

  return { aquarium, fish, plants, equipment };
};

export const spawnFish = (
  species: FishSpeciesId,
  x = Math.random() * 0.8 + 0.1,
  y = Math.random() * 0.6 + 0.2,
  name?: string
): Fish => {
  const spec = FISH_SPECIES[species];
  return {
    id: uid(`fish_${species}`),
    species,
    name: name ?? `${spec.label} #${Math.floor(Math.random() * 999)}`,
    size: spec.adultSize * (0.6 + Math.random() * 0.4),
    health: 95,
    stress: 5,
    hunger: 30,
    age: 0,
    alive: true,
    x,
    y,
    targetX: Math.random(),
    targetY: 0.2 + Math.random() * 0.6,
    facing: Math.random() > 0.5 ? 1 : -1,
    speed: spec.baseSpeed,
  };
};

export const spawnPlant = (
  species: PlantSpeciesId,
  x = Math.random() * 0.8 + 0.1,
  y = 0.78 + Math.random() * 0.1
): Plant => ({
  id: uid(`plant_${species}`),
  species,
  x,
  y,
  health: 100,
  scale: 0.9 + Math.random() * 0.5,
});

export interface TickContext {
  dtSeconds: number;
  aquarium: Aquarium;
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
}

export interface TickResult {
  aquarium: Aquarium;
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
  events: SimulationEvent[];
}

/**
 * Single simulation tick. Updates water chemistry, fish vitals, plant health,
 * and emits events on threshold crossings.
 */
export const tickSimulation = (ctx: TickContext): TickResult => {
  const dt = ctx.dtSeconds;
  const water = { ...ctx.aquarium.water };

  // Equipment effects
  const filter = ctx.equipment.find((e) => e.type === "filter" && e.active);
  const heater = ctx.equipment.find((e) => e.type === "heater" && e.active);
  const air = ctx.equipment.find((e) => e.type === "airstone" && e.active);
  const co2 = ctx.equipment.find((e) => e.type === "co2_diffuser" && e.active);
  const light = ctx.equipment.find((e) => e.type === "light" && e.active);

  // Temperature trends toward setpoint based on heater power
  if (heater) {
    const target = 24 + (heater.power / 100) * 6; // 24..30
    water.temperature += (target - water.temperature) * 0.02 * dt;
  } else {
    water.temperature += (21 - water.temperature) * 0.01 * dt;
  }

  // Filter reduces ammonia and turbidity
  if (filter) {
    const eff = (filter.power / 100) * dt;
    water.ammonia = Math.max(0, water.ammonia - 0.012 * eff);
    water.nitrite = Math.max(0, water.nitrite - 0.008 * eff);
    water.turbidity = Math.max(0, water.turbidity - 0.3 * eff);
    water.cleanliness = clamp(water.cleanliness + 0.4 * eff, 0, 100);
  } else {
    water.turbidity += 0.04 * dt;
    water.cleanliness -= 0.05 * dt;
  }

  // Air stone raises O2
  const o2Target = air ? 8.5 + (air.power / 100) * 1.5 : 6.5;
  water.oxygen += (o2Target - water.oxygen) * 0.06 * dt;

  // CO2 diffuser
  if (co2) {
    water.co2 += 0.5 * dt * (co2.power / 100);
    water.ph -= 0.002 * dt * (co2.power / 100);
  } else {
    water.co2 -= 0.2 * dt;
  }
  water.co2 = clamp(water.co2, 0, 100);

  // Plants effect: produce O2, absorb nitrate when light is on
  const lit = (light?.power ?? 0) / 100;
  const aliveFish = ctx.fish.filter((f) => f.alive);
  let totalOxygenFromPlants = 0;
  let totalNitrateAbsorbed = 0;
  const plants = ctx.plants.map((p) => {
    const spec = PLANT_SPECIES[p.species];
    const photo = lit > 0.1 ? 1 : 0.2;
    totalOxygenFromPlants += spec.oxygenRate * photo * p.scale * dt;
    totalNitrateAbsorbed += spec.nitrateRate * photo * p.scale * dt;
    let health = p.health;
    if (water.nitrate < 1) health -= 0.05 * dt; // starved
    if (lit < 0.05) health -= 0.02 * dt;
    if (water.co2 > 10 && lit > 0.3) health += 0.05 * dt;
    return { ...p, health: clamp(health, 0, 100) };
  });
  water.oxygen = clamp(water.oxygen + totalOxygenFromPlants, 0, 14);
  water.nitrate = Math.max(0, water.nitrate - totalNitrateAbsorbed);

  // Fish biological load
  const bioload =
    aliveFish.reduce((acc, f) => acc + (f.size / 5) * (1 + f.hunger / 200), 0) *
    dt;
  water.ammonia += bioload * 0.0028;
  water.nitrite += water.ammonia * 0.04 * dt;
  water.nitrate += water.nitrite * 0.03 * dt;
  water.oxygen -= aliveFish.length * 0.008 * dt;
  water.turbidity += aliveFish.length * 0.005 * dt;

  // Cleanliness drift
  water.cleanliness = clamp(water.cleanliness - aliveFish.length * 0.01 * dt, 0, 100);

  // Clamp
  water.temperature = clamp(water.temperature, 5, 40);
  water.ph = clamp(water.ph, 4, 10);
  water.ammonia = clamp(water.ammonia, 0, 8);
  water.nitrite = clamp(water.nitrite, 0, 8);
  water.nitrate = clamp(water.nitrate, 0, 200);
  water.oxygen = clamp(water.oxygen, 0, 14);
  water.turbidity = clamp(water.turbidity, 0, 100);

  // Fish vitals
  const events: SimulationEvent[] = [];
  const fish = ctx.fish.map((f): Fish => {
    if (!f.alive) {
      // Dead fish floats up
      const y = Math.max(0.04, f.y - 0.02 * dt);
      return { ...f, y, targetY: 0.04 };
    }
    const spec = FISH_SPECIES[f.species];
    // Stress factors
    let stressDelta = 0;
    if (water.temperature < spec.prefs.tempMin - 1 || water.temperature > spec.prefs.tempMax + 1) {
      stressDelta += 0.8;
    }
    if (water.ph < spec.prefs.phMin - 0.3 || water.ph > spec.prefs.phMax + 0.3) {
      stressDelta += 0.4;
    }
    if (water.ammonia > 0.25) stressDelta += water.ammonia * 4;
    if (water.nitrite > 0.5) stressDelta += water.nitrite * 2;
    if (water.oxygen < 5) stressDelta += (5 - water.oxygen) * 2;
    if (water.turbidity > 30) stressDelta += 0.4;
    if (water.cleanliness < 40) stressDelta += (40 - water.cleanliness) * 0.02;

    // Schooling: reduce stress if companions present
    const companions = aliveFish.filter((c) => c.species === f.species).length;
    if (companions < spec.schooling) stressDelta += 0.3;

    let stress = clamp(f.stress + (stressDelta - 0.6) * dt, 0, 100);

    // Hunger
    let hunger = clamp(f.hunger + 0.7 * dt, 0, 100);

    // Health
    let healthDelta = 0;
    if (stress > 65) healthDelta -= 0.6;
    if (hunger > 80) healthDelta -= 0.4;
    if (water.ammonia > 0.5) healthDelta -= water.ammonia * 1.5;
    if (water.oxygen < 4) healthDelta -= (4 - water.oxygen);
    if (stress < 25 && hunger < 60) healthDelta += 0.15;

    let health = clamp(f.health + healthDelta * dt, 0, 100);
    let alive: boolean = f.alive;

    if (health <= 0) {
      alive = false;
      events.push({
        id: uid("evt"),
        ts: Date.now(),
        severity: "danger",
        message: `${f.name} (${spec.label}) has died`,
      });
    }

    return { ...f, stress, hunger, health, alive, age: f.age + dt };
  });

  // Cleanliness / turbidity thresholds
  if (water.ammonia > 0.5 && water.ammonia - ctx.aquarium.water.ammonia > 0) {
    if (Math.random() < 0.02 * dt) {
      events.push({
        id: uid("evt"),
        ts: Date.now(),
        severity: "warn",
        message: `Ammonia spike detected: ${water.ammonia.toFixed(2)} mg/L`,
      });
    }
  }
  if (water.oxygen < 4 && ctx.aquarium.water.oxygen >= 4) {
    events.push({
      id: uid("evt"),
      ts: Date.now(),
      severity: "warn",
      message: `Oxygen dangerously low (${water.oxygen.toFixed(1)} mg/L)`,
    });
  }

  return {
    aquarium: { ...ctx.aquarium, water },
    fish,
    plants,
    equipment: ctx.equipment,
    events,
  };
};

export interface FeedResult {
  fish: Fish[];
  /** 0..1 fraction of dropped food left uneaten (leftover rots → extra dirt) */
  waste: number;
}

/**
 * Feed all living fish. Each fish eats up to its hunger; food beyond that is
 * wasted and reported as `waste` (0 = everything eaten, 1 = nothing eaten).
 */
export const feedAll = (fish: Fish[], strength = 35): FeedResult => {
  const alive = fish.filter((f) => f.alive);
  if (alive.length === 0) return { fish, waste: 1 };
  const supplyPerFish = strength;
  const demandPerFish = alive.map((f) => Math.min(f.hunger, supplyPerFish));
  const totalSupply = supplyPerFish * alive.length;
  const totalDemand = demandPerFish.reduce((acc, d) => acc + d, 0);
  const waste = totalSupply > 0 ? clamp(1 - totalDemand / totalSupply, 0, 1) : 1;
  const fed = fish.map((f) =>
    f.alive ? { ...f, hunger: clamp(f.hunger - strength, 0, 100) } : f
  );
  return { fish: fed, waste };
};

/**
 * Apply the dirtying effect of a feed to the water: lower cleanliness, raise
 * turbidity, and add a little ammonia from rotting leftovers.
 */
export const applyFeedLoad = (
  water: WaterParameters,
  strength: number,
  waste: number
): WaterParameters => ({
  ...water,
  cleanliness: clamp(water.cleanliness - strength * 0.08 * (1 + waste), 0, 100),
  turbidity: clamp(water.turbidity + strength * 0.05 * (1 + waste), 0, 100),
  ammonia: clamp(water.ammonia + strength * 0.004 * (1 + waste * 2), 0, 8),
});

/** Abstract 0..100 "how dirty" index combining cleanliness + turbidity. */
export const dirtIndex = (water: WaterParameters): number =>
  clamp((100 - water.cleanliness) * 0.7 + water.turbidity * 0.3, 0, 100);

/**
 * Cash earned for cleaning, proportional to how dirty the water is.
 * Returns 0 when the tank is already clean (anti-farming).
 */
export const cleanReward = (water: WaterParameters): number => {
  const d = dirtIndex(water);
  if (d <= 5) return 0;
  return Math.round(d * 0.8);
};

/**
 * Clean the tank — the single maintenance action. Scrubs detritus (cleanliness
 * up, turbidity down) AND dilutes the water chemistry (ammonia/nitrite/nitrate/
 * CO₂ down, plus a freshening nudge to oxygen/pH/temperature), like a partial
 * water change rolled in.
 */
export const cleanTankWater = (water: WaterParameters): WaterParameters => {
  const p = 0.3; // chemistry dilution, ~30% water change equivalent
  const fresh = createDefaultWater();
  return {
    ...water,
    temperature: water.temperature * (1 - p) + fresh.temperature * p,
    ph: water.ph * (1 - p) + fresh.ph * p,
    ammonia: water.ammonia * (1 - p),
    nitrite: water.nitrite * (1 - p),
    nitrate: water.nitrate * (1 - p),
    oxygen: water.oxygen * (1 - p) + fresh.oxygen * p,
    co2: water.co2 * (1 - p),
    cleanliness: clamp(water.cleanliness + 40, 0, 100),
    turbidity: clamp(water.turbidity * 0.4, 0, 100),
  };
};
