// Core domain types for the Aquarium Simulator.

export type FishSpeciesId =
  | "guppy"
  | "neon_tetra"
  | "betta"
  | "goldfish"
  | "corydoras"
  | "angelfish"
  | "discus";

export type PlantSpeciesId =
  | "java_fern"
  | "anubias"
  | "amazon_sword"
  | "java_moss"
  | "vallisneria";

export type EquipmentType =
  | "filter"
  | "heater"
  | "airstone"
  | "co2_diffuser"
  | "light";

export interface WaterParameters {
  /** Celsius */
  temperature: number;
  /** 0 - 14 */
  ph: number;
  /** Ammonia, mg/L */
  ammonia: number;
  /** Nitrite, mg/L */
  nitrite: number;
  /** Nitrate, mg/L */
  nitrate: number;
  /** Dissolved oxygen, mg/L */
  oxygen: number;
  /** General hardness (dGH) */
  hardness: number;
  /** 0 - 100 (NTU-ish abstract scale) */
  turbidity: number;
  /** 0 - 100 */
  cleanliness: number;
  /** 0 - 100, % */
  co2: number;
}

export interface Fish {
  id: string;
  species: FishSpeciesId;
  name: string;
  /** Centimeters (visual + bioload) */
  size: number;
  /** 0 - 100 */
  health: number;
  /** 0 - 100, higher = bad */
  stress: number;
  /** 0 - 100, hunger */
  hunger: number;
  /** Seconds alive (in-sim) */
  age: number;
  alive: boolean;
  /** Position inside the tank (normalised 0..1) */
  x: number;
  y: number;
  /** Movement target (normalised 0..1) */
  targetX: number;
  targetY: number;
  /** facing: -1 = left, 1 = right */
  facing: 1 | -1;
  /** Base speed multiplier */
  speed: number;
}

export interface Plant {
  id: string;
  species: PlantSpeciesId;
  /** Position inside the tank (normalised 0..1) */
  x: number;
  y: number;
  /** 0 - 100 */
  health: number;
  /** scale factor 0.6..1.4 */
  scale: number;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  /** Position inside the tank (normalised 0..1) */
  x: number;
  y: number;
  active: boolean;
  /** 0 - 100 */
  power: number;
}

export interface Aquarium {
  id: string;
  name: string;
  /** Litres */
  volume: number;
  /** Real-world dimensions, cm — used for visual layout aspect ratio */
  width: number;
  height: number;
  depth: number;
  createdAt: string;
  water: WaterParameters;
  /** Lighting cycle 0..1 (0 = night, 1 = full day) */
  lightLevel: number;
  /** Auto feed schedule enabled */
  autoFeed: boolean;
}

export interface SimulationEvent {
  id: string;
  ts: number;
  severity: "info" | "warn" | "danger" | "success";
  message: string;
}

export interface FishSpeciesSpec {
  id: FishSpeciesId;
  label: string;
  description: string;
  /** Centimeters at adult size */
  adultSize: number;
  /** preferred water params */
  prefs: {
    tempMin: number;
    tempMax: number;
    phMin: number;
    phMax: number;
  };
  /** schooling minimum */
  schooling: number;
  /** swim layer: 0=top, 1=mid, 2=bottom */
  layer: 0 | 1 | 2;
  /** spriteKey in Phaser */
  spriteKey: string;
  /** unit price (sim cash) */
  price: number;
  baseSpeed: number;
}

export interface PlantSpeciesSpec {
  id: PlantSpeciesId;
  label: string;
  description: string;
  spriteKey: string;
  price: number;
  /** oxygen production per tick */
  oxygenRate: number;
  /** nitrate absorption per tick */
  nitrateRate: number;
}

export interface EquipmentSpec {
  type: EquipmentType;
  label: string;
  description: string;
  spriteKey: string;
  price: number;
}
