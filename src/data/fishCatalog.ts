import type { ParameterTolerance, FishSize, CareLevel } from '@/simulation/types';

export interface FishSpecies {
  speciesId: string;
  commonName: string;
  scientificName: string;
  size: FishSize;
  careLevel: CareLevel;
  /** Relative stocking unit used in bioload calculations. */
  bioload: number;
  /** mg/L of O₂ consumed per tick. */
  o2ConsumptionRate: number;
  /** ppm of NH₃ produced per tick. */
  nh3ProductionRate: number;
  temperatureTolerance: ParameterTolerance;
  phTolerance: ParameterTolerance;
  o2Tolerance: ParameterTolerance;
  description: string;
  compatibilityTags: string[];
  priceCredits: number;
}

export const FISH_CATALOG: FishSpecies[] = [
  {
    speciesId: 'guppy',
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    size: 'nano',
    careLevel: 'beginner',
    bioload: 1,
    o2ConsumptionRate: 0.02,
    nh3ProductionRate: 0.004,
    temperatureTolerance: { min: 18, max: 28, optimal: [22, 26] },
    phTolerance: { min: 6.5, max: 8.5, optimal: [7.0, 7.5] },
    o2Tolerance: { min: 4, max: 12, optimal: [6, 9] },
    description: 'Hardy and colorful; ideal for beginners. Highly adaptable to a wide range of conditions.',
    compatibilityTags: ['peaceful', 'community', 'livebearer'],
    priceCredits: 10,
  },
  {
    speciesId: 'neon_tetra',
    commonName: 'Neon Tetra',
    scientificName: 'Paracheirodon innesi',
    size: 'nano',
    careLevel: 'beginner',
    bioload: 1,
    o2ConsumptionRate: 0.015,
    nh3ProductionRate: 0.003,
    temperatureTolerance: { min: 20, max: 26, optimal: [22, 25] },
    phTolerance: { min: 6.0, max: 7.5, optimal: [6.5, 7.0] },
    o2Tolerance: { min: 5, max: 12, optimal: [6, 9] },
    description: 'Iconic schooling fish with vivid neon stripe. Prefers soft, slightly acidic water.',
    compatibilityTags: ['peaceful', 'community', 'schooling'],
    priceCredits: 12,
  },
  {
    speciesId: 'betta',
    commonName: 'Betta',
    scientificName: 'Betta splendens',
    size: 'small',
    careLevel: 'beginner',
    bioload: 2,
    o2ConsumptionRate: 0.03,
    nh3ProductionRate: 0.007,
    temperatureTolerance: { min: 24, max: 30, optimal: [26, 28] },
    phTolerance: { min: 6.5, max: 7.5, optimal: [6.8, 7.2] },
    o2Tolerance: { min: 3, max: 12, optimal: [6, 9] },
    description: 'Labyrinth fish that can breathe atmospheric air. Males are highly aggressive toward each other.',
    compatibilityTags: ['semi-aggressive', 'labyrinth', 'no_male_conspecific'],
    priceCredits: 25,
  },
  {
    speciesId: 'goldfish',
    commonName: 'Goldfish',
    scientificName: 'Carassius auratus',
    size: 'medium',
    careLevel: 'intermediate',
    bioload: 5,
    o2ConsumptionRate: 0.08,
    nh3ProductionRate: 0.02,
    temperatureTolerance: { min: 10, max: 24, optimal: [18, 22] },
    phTolerance: { min: 6.5, max: 8.0, optimal: [7.0, 7.5] },
    o2Tolerance: { min: 6, max: 12, optimal: [7, 9] },
    description: 'High-bioload coldwater fish. Produces significant ammonia — robust filtration is essential.',
    compatibilityTags: ['peaceful', 'coldwater', 'high_bioload'],
    priceCredits: 15,
  },
  {
    speciesId: 'corydoras',
    commonName: 'Corydoras Catfish',
    scientificName: 'Corydoras paleatus',
    size: 'small',
    careLevel: 'beginner',
    bioload: 1,
    o2ConsumptionRate: 0.025,
    nh3ProductionRate: 0.005,
    temperatureTolerance: { min: 20, max: 26, optimal: [22, 25] },
    phTolerance: { min: 6.0, max: 8.0, optimal: [7.0, 7.5] },
    o2Tolerance: { min: 5, max: 12, optimal: [6, 9] },
    description: 'Bottom-dwelling scavenger. Peaceful and hardy; helps keep substrate clean.',
    compatibilityTags: ['peaceful', 'community', 'bottom_dweller', 'schooling'],
    priceCredits: 14,
  },
  {
    speciesId: 'angelfish',
    commonName: 'Angelfish',
    scientificName: 'Pterophyllum scalare',
    size: 'medium',
    careLevel: 'intermediate',
    bioload: 4,
    o2ConsumptionRate: 0.06,
    nh3ProductionRate: 0.015,
    temperatureTolerance: { min: 24, max: 30, optimal: [26, 28] },
    phTolerance: { min: 6.0, max: 7.5, optimal: [6.5, 7.0] },
    o2Tolerance: { min: 5, max: 12, optimal: [6, 9] },
    description: 'Elegant cichlid with tall fins. May predate on very small fish like neon tetras.',
    compatibilityTags: ['semi-aggressive', 'cichlid', 'predatory_small_fish'],
    priceCredits: 30,
  },
  {
    speciesId: 'discus',
    commonName: 'Discus',
    scientificName: 'Symphysodon aequifasciatus',
    size: 'large',
    careLevel: 'expert',
    bioload: 6,
    o2ConsumptionRate: 0.1,
    nh3ProductionRate: 0.025,
    temperatureTolerance: { min: 28, max: 32, optimal: [29, 31] },
    phTolerance: { min: 5.5, max: 7.0, optimal: [6.0, 6.5] },
    o2Tolerance: { min: 6, max: 12, optimal: [7, 9] },
    description: 'The "king of the aquarium" — stunning but extremely sensitive to water quality.',
    compatibilityTags: ['peaceful', 'cichlid', 'sensitive', 'high_temp'],
    priceCredits: 80,
  },
];

export function getFishSpecies(speciesId: string): FishSpecies | undefined {
  return FISH_CATALOG.find((s) => s.speciesId === speciesId);
}
