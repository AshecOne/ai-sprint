// ── Water Parameters ────────────────────────────────────────────────────────

export interface WaterParameters {
  /** Dissolved oxygen, mg/L — healthy: 6–9 */
  dissolvedOxygen: number;
  /** Potential of hydrogen — healthy: 6.5–7.5 */
  ph: number;
  /** Ammonia, ppm — healthy: 0–0.25 */
  ammonia: number;
  /** Nitrite, ppm — healthy: 0–0.5 */
  nitrite: number;
  /** Nitrate, ppm — healthy: 0–20 */
  nitrate: number;
  /** Carbon dioxide, ppm — healthy: 10–30 */
  co2: number;
  /** Temperature, °C — species-dependent */
  temperature: number;
  /** Carbonate hardness, dKH — healthy: 4–8 */
  kh: number;
  /** General hardness, dGH — healthy: 4–12 */
  gh: number;
  /** Water clarity, NTU — healthy: < 5 */
  turbidity: number;
}

export const DEFAULT_PARAMETERS: WaterParameters = {
  dissolvedOxygen: 7.5,
  ph: 7.0,
  ammonia: 0,
  nitrite: 0,
  nitrate: 5,
  co2: 15,
  temperature: 25,
  kh: 6,
  gh: 8,
  turbidity: 1,
};

/** Min/max absolute limits + optimal range for a parameter. */
export interface ParameterTolerance {
  min: number;
  max: number;
  optimal: [number, number];
}

// ── Fish ─────────────────────────────────────────────────────────────────────

export type FishSize = 'nano' | 'small' | 'medium' | 'large';
export type CareLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** A single fish instance living in a tank. */
export interface Fish {
  id: string;
  speciesId: string;
  commonName: string;
  scientificName: string;
  size: FishSize;
  careLevel: CareLevel;
  /** Relative stocking unit — scales NH₃ production and filtration demand. */
  bioload: number;
  /** mg/L of O₂ consumed per simulation tick. */
  o2ConsumptionRate: number;
  /** ppm of NH₃ produced per simulation tick. */
  nh3ProductionRate: number;
  temperatureTolerance: ParameterTolerance;
  phTolerance: ParameterTolerance;
  o2Tolerance: ParameterTolerance;
  /** 0–100; fills when parameters are outside tolerance, triggers death at 100. */
  stress: number;
  alive: boolean;
  position: { x: number; y: number };
}

// ── Plants ───────────────────────────────────────────────────────────────────

export type PlantSize = 'small' | 'medium' | 'large' | 'floating';
export type LightingRequirement = 'low' | 'medium' | 'high';

/** A single plant instance in a tank. */
export interface Plant {
  id: string;
  speciesId: string;
  commonName: string;
  scientificName: string;
  size: PlantSize;
  lightingRequirement: LightingRequirement;
  co2Requirement: 'none' | 'low' | 'high';
  /** mg/L of O₂ produced per tick during light hours. */
  o2ProductionRate: number;
  /** ppm of CO₂ consumed per tick during light hours. */
  co2ConsumptionRate: number;
  /** ppm of NO₃ consumed per tick. */
  no3ConsumptionRate: number;
  /** 0–100; drops when lighting or CO₂ requirements are unmet. */
  health: number;
  position: { x: number; y: number };
}

// ── Equipment ────────────────────────────────────────────────────────────────

export type EquipmentType =
  | 'mechanical_filter'
  | 'biological_filter'
  | 'chemical_filter'
  | 'heater'
  | 'co2_injector'
  | 'air_stone'
  | 'powerhead'
  | 'uv_sterilizer'
  | 'protein_skimmer'
  | 'dosing_pump'
  | 'auto_water_changer';

export interface EquipmentEffect {
  parameter: keyof WaterParameters;
  /** Change applied to the parameter each active tick. Positive = increase. */
  ratePerTick: number;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  name: string;
  powerWatts: number;
  active: boolean;
  effects: EquipmentEffect[];
  /** Maximum tank volume this unit can handle effectively. */
  maxTankVolumeLiters: number;
}

// ── Aquarium ─────────────────────────────────────────────────────────────────

export interface AquariumDimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  volumeLiters: number;
}

export interface Aquarium {
  id: string;
  name: string;
  dimensions: AquariumDimensions;
  equipment: Equipment[];
  fish: Fish[];
  plants: Plant[];
  parameters: WaterParameters;
  /** Rolling history — last 720 ticks (~30 in-game days at 24 ticks/day). */
  parameterHistory: Array<{ tick: number; params: WaterParameters }>;
  /** Whether beneficial bacteria colony is established (nitrogen cycle complete). */
  cycled: boolean;
  /** 0–100; drives nitrification efficiency. Grows over time, reset by nuking. */
  bacteriaLevel: number;
  lightHoursPerDay: number;
  /** Room temperature the tank slowly drifts toward without a heater. */
  ambientTemperature: number;
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export type AlertSeverity = 'warning' | 'danger' | 'collapse';

export type AlertParameter =
  | keyof WaterParameters
  | 'fish_death'
  | 'equipment_failure'
  | 'bioload'
  | 'bacteria';

export interface Alert {
  id: string;
  aquariumId: string;
  parameter: AlertParameter;
  severity: AlertSeverity;
  message: string;
  /** Actionable suggestion shown in the alert feed. */
  suggestion: string;
  triggeredAt: number;
  resolved: boolean;
}

// ── Game meta ────────────────────────────────────────────────────────────────

/** Real-time simulation multipliers: 1× = real time, 60× = 1 min per second. */
export type GameSpeed = 1 | 5 | 60;
