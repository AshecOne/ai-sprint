import type { EquipmentType, EquipmentEffect } from '@/simulation/types';

export interface EquipmentSpec {
  specId: string;
  type: EquipmentType;
  name: string;
  description: string;
  powerWatts: number;
  maxTankVolumeLiters: number;
  effects: EquipmentEffect[];
  priceCredits: number;
}

export const EQUIPMENT_CATALOG: EquipmentSpec[] = [
  // ── Filters ─────────────────────────────────────────────────────────────────
  {
    specId: 'hob_filter_s',
    type: 'mechanical_filter',
    name: 'Hang-On-Back Filter (Small)',
    description: 'Entry-level hang-on-back filter. Mechanical + light biological filtration for tanks up to 60 L.',
    powerWatts: 5,
    maxTankVolumeLiters: 60,
    effects: [
      { parameter: 'turbidity', ratePerTick: -0.05 },
      { parameter: 'ammonia', ratePerTick: -0.002 },
    ],
    priceCredits: 40,
  },
  {
    specId: 'canister_filter_m',
    type: 'biological_filter',
    name: 'Canister Filter (Medium)',
    description: 'High-capacity canister with biological media. Significantly boosts nitrification in tanks up to 200 L.',
    powerWatts: 15,
    maxTankVolumeLiters: 200,
    effects: [
      { parameter: 'turbidity', ratePerTick: -0.08 },
      { parameter: 'ammonia', ratePerTick: -0.006 },
      { parameter: 'nitrite', ratePerTick: -0.004 },
    ],
    priceCredits: 120,
  },
  {
    specId: 'activated_carbon_filter',
    type: 'chemical_filter',
    name: 'Activated Carbon Insert',
    description: 'Removes dissolved organics and toxins. Must be replaced every 4 in-game weeks.',
    powerWatts: 0,
    maxTankVolumeLiters: 200,
    effects: [
      { parameter: 'ammonia', ratePerTick: -0.003 },
      { parameter: 'turbidity', ratePerTick: -0.02 },
    ],
    priceCredits: 20,
  },

  // ── Heaters ──────────────────────────────────────────────────────────────────
  {
    specId: 'heater_100w',
    type: 'heater',
    name: 'Submersible Heater 100W',
    description: 'Maintains setpoint temperature in tanks up to 100 L. Drift resistance depends on wattage-to-volume ratio.',
    powerWatts: 100,
    maxTankVolumeLiters: 100,
    effects: [
      { parameter: 'temperature', ratePerTick: 0.1 },
    ],
    priceCredits: 35,
  },
  {
    specId: 'heater_200w',
    type: 'heater',
    name: 'Submersible Heater 200W',
    description: 'Higher-wattage heater for large tanks up to 200 L.',
    powerWatts: 200,
    maxTankVolumeLiters: 200,
    effects: [
      { parameter: 'temperature', ratePerTick: 0.1 },
    ],
    priceCredits: 55,
  },

  // ── Aeration ─────────────────────────────────────────────────────────────────
  {
    specId: 'air_stone',
    type: 'air_stone',
    name: 'Air Stone',
    description: 'Produces fine bubbles that raise dissolved O₂ and degas excess CO₂ via surface agitation.',
    powerWatts: 3,
    maxTankVolumeLiters: 100,
    effects: [
      { parameter: 'dissolvedOxygen', ratePerTick: 0.05 },
      { parameter: 'co2', ratePerTick: -0.02 },
    ],
    priceCredits: 10,
  },
  {
    specId: 'powerhead',
    type: 'powerhead',
    name: 'Powerhead Circulation Pump',
    description: 'High-flow circulation. Strong surface agitation raises DO and degasses CO₂ efficiently.',
    powerWatts: 8,
    maxTankVolumeLiters: 200,
    effects: [
      { parameter: 'dissolvedOxygen', ratePerTick: 0.08 },
      { parameter: 'co2', ratePerTick: -0.04 },
    ],
    priceCredits: 30,
  },

  // ── CO₂ ──────────────────────────────────────────────────────────────────────
  {
    specId: 'co2_injector',
    type: 'co2_injector',
    name: 'CO₂ Injector Kit',
    description: 'Boosts CO₂ for demanding plants. Risk: overdose below 30 ppm will begin dropping pH.',
    powerWatts: 0,
    maxTankVolumeLiters: 150,
    effects: [
      { parameter: 'co2', ratePerTick: 0.08 },
    ],
    priceCredits: 75,
  },

  // ── UV Sterilizer ─────────────────────────────────────────────────────────────
  {
    specId: 'uv_sterilizer',
    type: 'uv_sterilizer',
    name: 'UV Sterilizer',
    description: 'Reduces free-floating algae and pathogens. Gradually lowers turbidity.',
    powerWatts: 9,
    maxTankVolumeLiters: 200,
    effects: [
      { parameter: 'turbidity', ratePerTick: -0.03 },
    ],
    priceCredits: 60,
  },

  // ── Auto Water Changer ────────────────────────────────────────────────────────
  {
    specId: 'auto_water_changer',
    type: 'auto_water_changer',
    name: 'Automatic Water Changer',
    description: 'Slowly dilutes nitrate and other accumulated compounds via continuous micro-water-changes.',
    powerWatts: 5,
    maxTankVolumeLiters: 300,
    effects: [
      { parameter: 'nitrate', ratePerTick: -0.03 },
      { parameter: 'nitrite', ratePerTick: -0.01 },
      { parameter: 'ammonia', ratePerTick: -0.002 },
    ],
    priceCredits: 90,
  },
];

export function getEquipmentSpec(specId: string): EquipmentSpec | undefined {
  return EQUIPMENT_CATALOG.find((e) => e.specId === specId);
}
