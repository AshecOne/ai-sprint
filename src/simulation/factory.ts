import type { Fish, Plant, Equipment, Aquarium } from './types';
import { DEFAULT_PARAMETERS } from './types';
import { FISH_CATALOG } from '@/data/fishCatalog';
import { PLANT_CATALOG } from '@/data/plantCatalog';
import { EQUIPMENT_CATALOG } from '@/data/equipmentCatalog';

function uid(): string {
  return crypto.randomUUID();
}

export function createFish(speciesId: string, position: { x: number; y: number }): Fish {
  const spec = FISH_CATALOG.find(s => s.speciesId === speciesId);
  if (!spec) throw new Error(`Unknown fish species: ${speciesId}`);
  return {
    id: uid(),
    speciesId: spec.speciesId,
    commonName: spec.commonName,
    scientificName: spec.scientificName,
    size: spec.size,
    careLevel: spec.careLevel,
    bioload: spec.bioload,
    o2ConsumptionRate: spec.o2ConsumptionRate,
    nh3ProductionRate: spec.nh3ProductionRate,
    temperatureTolerance: spec.temperatureTolerance,
    phTolerance: spec.phTolerance,
    o2Tolerance: spec.o2Tolerance,
    stress: 0,
    alive: true,
    position,
  };
}

export function createPlant(speciesId: string, position: { x: number; y: number }): Plant {
  const spec = PLANT_CATALOG.find(s => s.speciesId === speciesId);
  if (!spec) throw new Error(`Unknown plant species: ${speciesId}`);
  return {
    id: uid(),
    speciesId: spec.speciesId,
    commonName: spec.commonName,
    scientificName: spec.scientificName,
    size: spec.size,
    lightingRequirement: spec.lightingRequirement,
    co2Requirement: spec.co2Requirement,
    o2ProductionRate: spec.o2ProductionRate,
    co2ConsumptionRate: spec.co2ConsumptionRate,
    no3ConsumptionRate: spec.no3ConsumptionRate,
    health: 100,
    position,
  };
}

export function createEquipment(specId: string): Equipment {
  const spec = EQUIPMENT_CATALOG.find(e => e.specId === specId);
  if (!spec) throw new Error(`Unknown equipment spec: ${specId}`);
  return {
    id: uid(),
    type: spec.type,
    name: spec.name,
    powerWatts: spec.powerWatts,
    active: true,
    effects: spec.effects,
    maxTankVolumeLiters: spec.maxTankVolumeLiters,
  };
}

export function createAquarium(
  name: string,
  widthCm: number,
  heightCm: number,
  depthCm: number,
): Aquarium {
  const volumeLiters = (widthCm * heightCm * depthCm) / 1000;
  return {
    id: uid(),
    name,
    dimensions: { widthCm, heightCm, depthCm, volumeLiters },
    equipment: [],
    fish: [],
    plants: [],
    parameters: { ...DEFAULT_PARAMETERS },
    parameterHistory: [],
    cycled: false,
    bacteriaLevel: 0,
    lightHoursPerDay: 10,
    ambientTemperature: 24,
  };
}
