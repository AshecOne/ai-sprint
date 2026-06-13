import type { Aquarium, WaterParameters } from './types';

export interface FishUpdate {
  fishId: string;
  newStress: number;
  alive: boolean;
}

export interface PlantUpdate {
  plantId: string;
  newHealth: number;
}

export interface TickResult {
  parameters: Partial<WaterParameters>;
  fishUpdates: FishUpdate[];
  plantUpdates: PlantUpdate[];
  newBacteriaLevel: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isLightPhase(tick: number, lightHoursPerDay: number): boolean {
  return (tick % 24) < lightHoursPerDay;
}

export function tickAquarium(aquarium: Aquarium, tick: number): TickResult {
  const p = aquarium.parameters;
  const { fish, plants, equipment, bacteriaLevel, dimensions, ambientTemperature, lightHoursPerDay } = aquarium;

  const isLight = isLightPhase(tick, lightHoursPerDay);
  const hasBioFilter = equipment.some(
    e => (e.type === 'biological_filter' || e.type === 'mechanical_filter') && e.active,
  );
  const hasHeater = equipment.some(e => e.type === 'heater' && e.active);

  // ── Nitrogen cycle ────────────────────────────────────────────────────────
  let dNH3 = 0;
  let dNO2 = 0;
  let dNO3 = 0;

  for (const f of fish) {
    const tempScale = 1 + Math.max(0, p.temperature - 25) * 0.02;
    dNH3 += f.alive ? f.nh3ProductionRate * tempScale : f.nh3ProductionRate * 0.5;
  }

  const nh3ToNo2 = p.ammonia * bacteriaLevel * 0.0008;
  const no2ToNo3 = p.nitrite * bacteriaLevel * 0.0006;
  dNH3 -= nh3ToNo2;
  dNO2 += nh3ToNo2 - no2ToNo3;
  dNO3 += no2ToNo3;

  // ── O₂ / CO₂ balance ─────────────────────────────────────────────────────
  let dO2 = 0;
  let dCO2 = 0;

  for (const f of fish) {
    if (!f.alive) continue;
    const tempScale = 1 + Math.max(0, p.temperature - 25) * 0.03;
    dO2 -= f.o2ConsumptionRate * tempScale;
  }

  for (const plant of plants) {
    if (isLight) {
      dO2 += plant.o2ProductionRate;
      dCO2 -= plant.co2ConsumptionRate;
    } else {
      dO2 -= plant.o2ProductionRate * 0.3;
    }
    dNO3 -= plant.no3ConsumptionRate;
  }

  // ── Equipment effects ─────────────────────────────────────────────────────
  let dTurbidity = 0;

  for (const eq of equipment) {
    if (!eq.active) continue;
    const scale = Math.min(1, eq.maxTankVolumeLiters / dimensions.volumeLiters);

    for (const effect of eq.effects) {
      const scaled = effect.ratePerTick * scale;
      switch (effect.parameter) {
        case 'dissolvedOxygen': dO2        += scaled; break;
        case 'ammonia':         dNH3       += scaled; break;
        case 'nitrite':         dNO2       += scaled; break;
        case 'nitrate':         dNO3       += scaled; break;
        case 'co2':             dCO2       += scaled; break;
        case 'turbidity':       dTurbidity += scaled; break;
      }
    }
  }

  // Dead fish: extra turbidity (NH₃ already counted at 50% above)
  for (const f of fish) {
    if (!f.alive) dTurbidity += 0.05;
  }

  // ── pH & buffering ────────────────────────────────────────────────────────
  const khBuffer = Math.max(0, 1 - p.kh / 20);
  let phDelta = 0;

  if (p.ammonia > 0) {
    phDelta -= p.ammonia * 0.005 * khBuffer;
  }
  if (p.co2 > 30) {
    phDelta -= ((p.co2 - 30) / 5) * 0.005 * khBuffer;
  }
  if (p.ammonia <= 0.25 && p.co2 <= 30) {
    phDelta += 0.002;
  }

  // ── Temperature dynamics ──────────────────────────────────────────────────
  let dTemp = (ambientTemperature - p.temperature) * 0.005;
  if (hasHeater && p.temperature < 26) {
    dTemp += 0.1;
  }

  // ── Bacteria growth ───────────────────────────────────────────────────────
  let newBacteria = bacteriaLevel;
  if (p.ammonia > 0) newBacteria += 0.1;
  if (hasBioFilter) newBacteria += 0.05;
  newBacteria = Math.min(100, newBacteria);

  // ── New absolute parameter values ─────────────────────────────────────────
  const parameters: Partial<WaterParameters> = {
    ammonia:         clamp(p.ammonia + dNH3, 0, 20),
    nitrite:         clamp(p.nitrite + dNO2, 0, 20),
    nitrate:         clamp(p.nitrate + dNO3, 0, 100),
    dissolvedOxygen: clamp(p.dissolvedOxygen + dO2, 0, 15),
    co2:             clamp(p.co2 + dCO2, 0, 100),
    ph:              clamp(p.ph + phDelta, 4, 10),
    temperature:     clamp(p.temperature + dTemp, 10, 40),
    turbidity:       clamp(p.turbidity + dTurbidity, 0, 100),
    kh: p.kh,
    gh: p.gh,
  };

  // ── Fish stress ───────────────────────────────────────────────────────────
  const fishUpdates: FishUpdate[] = [];
  for (const f of fish) {
    if (!f.alive) continue;

    let outOfRange = 0;
    if (p.temperature < f.temperatureTolerance.min || p.temperature > f.temperatureTolerance.max) outOfRange++;
    if (p.ph < f.phTolerance.min || p.ph > f.phTolerance.max) outOfRange++;
    if (p.dissolvedOxygen < f.o2Tolerance.min) outOfRange++;

    const stressDelta = outOfRange > 0 ? outOfRange * 2 : -1;
    const newStress = clamp(f.stress + stressDelta, 0, 100);
    fishUpdates.push({ fishId: f.id, newStress, alive: newStress < 100 });
  }

  // ── Plant health (NO₃ starvation) ────────────────────────────────────────
  const plantUpdates: PlantUpdate[] = [];
  for (const plant of plants) {
    const starving = p.nitrate < 2;
    const healthDelta = starving ? -0.5 : 0.1;
    const newHealth = clamp(plant.health + healthDelta, 0, 100);
    if (newHealth !== plant.health) {
      plantUpdates.push({ plantId: plant.id, newHealth });
    }
  }

  return { parameters, fishUpdates, plantUpdates, newBacteriaLevel: newBacteria };
}
