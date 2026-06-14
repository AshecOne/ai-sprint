// Asset registry for the Phaser renderer. Maps sprite keys → URL.
// Sprites are generated via the backend (Gemini Nano Banana Pro) and stored
// under /public/sprites. If a file is missing, the scene falls back to a
// procedurally generated coloured shape so the game never crashes.

export interface SpriteEntry {
  key: string;
  file: string;
  /** Frame dimensions when sliced as a spritesheet (optional). */
  frameWidth?: number;
  frameHeight?: number;
  /** Fallback colour if file is missing (CSS hex). */
  fallback: string;
  /** Fallback canvas size px. */
  fallbackSize: [number, number];
  /** Logical render size at 1× scale (pixels in scene). */
  renderHeight?: number;
}

export const SPRITE_REGISTRY: SpriteEntry[] = [
  // Fish — 64x16 sheet, 4 frames of 16x16
  { key: "fish_guppy",        file: "fish_guppy.png",        frameWidth: 16, frameHeight: 16, fallback: "#f59e0b", fallbackSize: [16, 16] },
  { key: "fish_neon_tetra",   file: "fish_neon_tetra.png",   frameWidth: 16, frameHeight: 16, fallback: "#22d3ee", fallbackSize: [16, 16] },
  { key: "fish_betta",        file: "fish_betta.png",        frameWidth: 16, frameHeight: 16, fallback: "#ef4444", fallbackSize: [16, 16] },
  { key: "fish_goldfish",     file: "fish_goldfish.png",     frameWidth: 16, frameHeight: 16, fallback: "#fb923c", fallbackSize: [16, 16] },
  { key: "fish_corydoras",    file: "fish_corydoras.png",    frameWidth: 16, frameHeight: 16, fallback: "#94a3b8", fallbackSize: [16, 16] },
  { key: "fish_angelfish",    file: "fish_angelfish.png",    frameWidth: 16, frameHeight: 16, fallback: "#e2e8f0", fallbackSize: [16, 16] },
  { key: "fish_discus",       file: "fish_discus.png",       frameWidth: 16, frameHeight: 16, fallback: "#a78bfa", fallbackSize: [16, 16] },

  // Plants — varying heights, rooted to substrate
  { key: "plant_java_fern",     file: "plant_java_fern.png",     fallback: "#15803d", fallbackSize: [48, 64], renderHeight: 64 },
  { key: "plant_anubias",       file: "plant_anubias.png",       fallback: "#166534", fallbackSize: [48, 64], renderHeight: 64 },
  { key: "plant_amazon_sword",  file: "plant_amazon_sword.png",  fallback: "#22c55e", fallbackSize: [48, 64], renderHeight: 64 },
  { key: "plant_java_moss",     file: "plant_java_moss.png",     fallback: "#84cc16", fallbackSize: [48, 48], renderHeight: 48 },
  { key: "plant_vallisneria",   file: "plant_vallisneria.png",   fallback: "#16a34a", fallbackSize: [48, 80], renderHeight: 80 },

  // Equipment
  { key: "equipment_filter",   file: "equipment_filter.png",   fallback: "#94a3b8", fallbackSize: [24, 40] },
  { key: "equipment_heater",   file: "equipment_heater.png",   fallback: "#fb7185", fallbackSize: [16, 48] },
  { key: "equipment_airstone", file: "equipment_airstone.png", fallback: "#f1f5f9", fallbackSize: [24, 24] },
  { key: "equipment_co2",      file: "equipment_co2.png",      fallback: "#a5f3fc", fallbackSize: [24, 24] },
  { key: "equipment_light",    file: "equipment_light.png",    fallback: "#fde68a", fallbackSize: [64, 12] },

  // Substrate strip 64x16 (tileable)
  { key: "substrate_gravel",   file: "substrate_gravel.png",   fallback: "#78716c", fallbackSize: [64, 16] },

  // Bubble
  { key: "bubble",             file: "bubble.png",             fallback: "#ffffff", fallbackSize: [12, 12] },

  // Background + decor (no fallback for background — we draw a gradient)
  { key: "tank_background",    file: "tank_background.png",    fallback: "#061a2a", fallbackSize: [16, 16] },
  { key: "rock_decor_1",       file: "rock_decor_1.png",       fallback: "#6b6258", fallbackSize: [48, 32] },
  { key: "rock_decor_2",       file: "rock_decor_2.png",       fallback: "#7a5b3b", fallbackSize: [64, 24] },
];

export const FISH_SPRITE_KEYS: ReadonlyArray<string> = SPRITE_REGISTRY.filter((s) =>
  s.key.startsWith("fish_")
).map((s) => s.key);
