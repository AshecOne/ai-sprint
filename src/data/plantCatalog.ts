import type { PlantSize, LightingRequirement } from '@/simulation/types';

export interface PlantSpecies {
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
  description: string;
  priceCredits: number;
}

export const PLANT_CATALOG: PlantSpecies[] = [
  {
    speciesId: 'java_fern',
    commonName: 'Java Fern',
    scientificName: 'Microsorum pteropus',
    size: 'medium',
    lightingRequirement: 'low',
    co2Requirement: 'none',
    o2ProductionRate: 0.05,
    co2ConsumptionRate: 0.03,
    no3ConsumptionRate: 0.02,
    description: 'Indestructible low-tech plant. Attach to wood or rock — do not bury the rhizome.',
    priceCredits: 15,
  },
  {
    speciesId: 'anubias',
    commonName: 'Anubias',
    scientificName: 'Anubias barteri',
    size: 'small',
    lightingRequirement: 'low',
    co2Requirement: 'none',
    o2ProductionRate: 0.04,
    co2ConsumptionRate: 0.02,
    no3ConsumptionRate: 0.015,
    description: 'Extremely hardy; grows very slowly but virtually impossible to kill. Great for beginners.',
    priceCredits: 12,
  },
  {
    speciesId: 'amazon_sword',
    commonName: 'Amazon Sword',
    scientificName: 'Echinodorus grisebachii',
    size: 'large',
    lightingRequirement: 'medium',
    co2Requirement: 'low',
    o2ProductionRate: 0.12,
    co2ConsumptionRate: 0.08,
    no3ConsumptionRate: 0.06,
    description: 'Bold centerpiece plant; heavy root feeder. Benefits from root tabs in substrate.',
    priceCredits: 20,
  },
  {
    speciesId: 'java_moss',
    commonName: 'Java Moss',
    scientificName: 'Taxiphyllum barbieri',
    size: 'floating',
    lightingRequirement: 'low',
    co2Requirement: 'none',
    o2ProductionRate: 0.06,
    co2ConsumptionRate: 0.04,
    no3ConsumptionRate: 0.03,
    description: 'Versatile moss; excellent for fry refuges and biological filtration surface area.',
    priceCredits: 10,
  },
  {
    speciesId: 'vallisneria',
    commonName: 'Vallisneria',
    scientificName: 'Vallisneria spiralis',
    size: 'large',
    lightingRequirement: 'medium',
    co2Requirement: 'none',
    o2ProductionRate: 0.09,
    co2ConsumptionRate: 0.05,
    no3ConsumptionRate: 0.05,
    description: 'Fast-growing background plant; excellent NO₃ consumer and O₂ producer.',
    priceCredits: 8,
  },
  {
    speciesId: 'dwarf_hairgrass',
    commonName: 'Dwarf Hairgrass',
    scientificName: 'Eleocharis parvula',
    size: 'small',
    lightingRequirement: 'high',
    co2Requirement: 'high',
    o2ProductionRate: 0.07,
    co2ConsumptionRate: 0.09,
    no3ConsumptionRate: 0.04,
    description: 'Popular carpeting plant. Demands high light and CO₂ injection to thrive.',
    priceCredits: 18,
  },
];

export function getPlantSpecies(speciesId: string): PlantSpecies | undefined {
  return PLANT_CATALOG.find((s) => s.speciesId === speciesId);
}
