import Phaser from "phaser";
import { useAquariumStore } from "@/store/aquariumStore";
import { FISH_SPECIES, PLANT_SPECIES } from "@/simulation/species";
import { dirtIndex } from "@/simulation/engine";
import type { Fish, Plant, Equipment } from "@/simulation/types";
import { SPRITE_REGISTRY, FISH_SPRITE_KEYS, type SpriteEntry } from "../assets";

interface FishVisual {
  sprite: Phaser.GameObjects.Sprite;
}

interface PlantVisual {
  sprite: Phaser.GameObjects.Image;
  baseY: number;
  swayPhase: number;
  swayFreq: number;
}

interface EquipmentVisual {
  sprite: Phaser.GameObjects.Image;
  emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
}

/** Logical height (in normalised tank space) occupied by the substrate.
 *  Plants must be rooted at the top edge of the substrate. */
const SUBSTRATE_RATIO = 0.13;
const SUBSTRATE_TOP_Y = 1 - SUBSTRATE_RATIO; // ~0.87

export class MainScene extends Phaser.Scene {
  private aquariumId: string | null = null;
  private fishVisuals = new Map<string, FishVisual>();
  private plantVisuals = new Map<string, PlantVisual>();
  private equipmentVisuals = new Map<string, EquipmentVisual>();

  private backgroundImage?: Phaser.GameObjects.Image;
  private bgFallbackGfx?: Phaser.GameObjects.Graphics;
  private substrateTiled?: Phaser.GameObjects.TileSprite;
  private waterOverlay!: Phaser.GameObjects.Rectangle;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private vignette!: Phaser.GameObjects.Graphics;
  private surfaceShimmer!: Phaser.GameObjects.Graphics;
  private lightRays!: Phaser.GameObjects.Graphics;
  private glassFrame!: Phaser.GameObjects.Graphics;
  private rocks: Phaser.GameObjects.Image[] = [];
  private debris?: Phaser.GameObjects.Particles.ParticleEmitter;
  private lastCleanFx = 0;
  private elapsed = 0;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: { aquariumId?: string }) {
    this.aquariumId = data.aquariumId ?? null;
  }

  preload() {
    for (const entry of SPRITE_REGISTRY) {
      this.createFallbackTexture(entry);
    }
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("[MainScene] sprite missing, using fallback:", file.key);
    });
    for (const entry of SPRITE_REGISTRY) {
      const url = `/sprites/${entry.file}`;
      if (entry.frameWidth && entry.frameHeight) {
        this.load.spritesheet(`${entry.key}__real`, url, {
          frameWidth: entry.frameWidth,
          frameHeight: entry.frameHeight,
        });
      } else {
        this.load.image(`${entry.key}__real`, url);
      }
    }
  }

  create() {
    const { width, height } = this.scale;

    // 1. Background image (deep water + caustics) or procedural fallback
    if (this.textures.exists("tank_background__real")) {
      this.backgroundImage = this.add.image(width / 2, height / 2, "tank_background__real");
      this.backgroundImage.setDisplaySize(width, height);
      this.backgroundImage.setDepth(0);
      this.backgroundImage.setAlpha(0.95);
    } else {
      this.bgFallbackGfx = this.add.graphics();
      this.drawGradientBackground(width, height);
      this.bgFallbackGfx.setDepth(0);
    }

    // 2. Water tint overlay (above background)
    this.waterOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0aa9c8, 0.0);
    this.waterOverlay.setDepth(5);

    // 3. Vignette darkening at edges
    this.vignette = this.add.graphics();
    this.vignette.setDepth(6);
    this.drawVignette(width, height);

    // 4. Light rays (animated)
    this.lightRays = this.add.graphics();
    this.lightRays.setDepth(8);

    // 5. Substrate tile at bottom
    const substrateHeight = Math.max(40, Math.round(height * SUBSTRATE_RATIO));
    const substKey = this.getTextureKey("substrate_gravel");
    this.substrateTiled = this.add
      .tileSprite(0, height - substrateHeight, width, substrateHeight, substKey)
      .setOrigin(0, 0)
      .setDepth(20)
      .setTileScale(2, 2);

    // 6. Decorative rocks scattered along the substrate
    this.placeRocks(width, height, substrateHeight);

    // 7. Surface shimmer (top water line)
    this.surfaceShimmer = this.add.graphics();
    this.surfaceShimmer.setDepth(40);

    // 8. Night/light overlay
    this.nightOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000020, 0.0);
    this.nightOverlay.setDepth(95);

    // 9. Glass frame (highest visual layer)
    this.glassFrame = this.add.graphics();
    this.glassFrame.setDepth(96);
    this.drawGlassFrame(width, height);

    // 10. Animations
    for (const key of FISH_SPRITE_KEYS) {
      const sourceKey = this.getTextureKey(key);
      const tex = this.textures.get(sourceKey);
      const frameCount = Math.max(1, tex.frameTotal - 1);
      const frames = Array.from({ length: frameCount }, (_, i) => ({
        key: sourceKey,
        frame: i,
      }));
      if (this.anims.exists(`${key}_swim`)) this.anims.remove(`${key}_swim`);
      this.anims.create({
        key: `${key}_swim`,
        frames: frameCount > 1 ? frames : [{ key: sourceKey, frame: 0 }],
        frameRate: 6,
        repeat: -1,
      });
    }

    // 11. Suspended detritus (visible only when the water is dirty)
    this.createDebris(width, height);

    this.lastCleanFx = this.getStore().cleanFx;

    this.syncWithStore();
    this.scale.on("resize", this.handleResize, this);
  }

  /** Floating particulate that drifts in the water; emission rate is driven
   *  by how dirty the water is (see update()). */
  private createDebris(width: number, height: number) {
    this.debris?.destroy();
    const bubbleKey = this.getTextureKey("bubble");
    this.debris = this.add.particles(0, 0, bubbleKey, {
      x: { min: 0, max: width },
      y: { min: height * 0.05, max: height * 0.88 },
      speedX: { min: -4, max: 4 },
      speedY: { min: -3, max: 6 },
      lifespan: 6000,
      scale: { min: 0.35, max: 1.0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0x7a6244, 0x6b5a3a, 0x55492f],
      frequency: 99999, // off until update() decides otherwise
      quantity: 1,
    });
    this.debris.setDepth(34);
    this.debris.emitting = false;
  }

  /** One-shot sparkle/bubble burst across the tank when the player cleans. */
  private spawnCleanBurst() {
    const { width, height } = this.scale;
    const bubbleKey = this.getTextureKey("bubble");
    const burst = this.add.particles(0, 0, bubbleKey, {
      x: { min: 0, max: width },
      y: { min: height * 0.15, max: height * 0.92 },
      speed: { min: 20, max: 90 },
      angle: { min: 200, max: 340 },
      lifespan: { min: 700, max: 1300 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.95, end: 0 },
      tint: [0xa5f3fc, 0xffffff, 0xbfeefb],
      emitting: false,
    });
    burst.setDepth(60);
    burst.explode(46);
    this.time.delayedCall(1500, () => burst.destroy());
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    this.cameras.main.setSize(width, height);

    if (this.backgroundImage) {
      this.backgroundImage.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    } else {
      this.drawGradientBackground(width, height);
    }

    this.waterOverlay.setPosition(width / 2, height / 2).setSize(width, height);
    this.nightOverlay.setPosition(width / 2, height / 2).setSize(width, height);
    this.drawVignette(width, height);
    this.drawGlassFrame(width, height);

    const subH = Math.max(40, Math.round(height * SUBSTRATE_RATIO));
    this.substrateTiled?.setPosition(0, height - subH).setSize(width, subH);

    // Reposition rocks on new substrate
    this.rocks.forEach((r, i) => {
      r.setPosition((width / (this.rocks.length + 1)) * (i + 1), height - subH + 2);
    });

    // Reposition plants
    for (const [, v] of this.plantVisuals) {
      v.baseY = height - subH + 2;
      v.sprite.y = v.baseY;
    }

    // Rebuild debris emit zone for the new dimensions
    this.createDebris(width, height);
  }

  // ──────────────── Drawing helpers ─────────────────

  private drawGradientBackground(w: number, h: number) {
    if (!this.bgFallbackGfx) return;
    this.bgFallbackGfx.clear();
    const steps = 28;
    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      const c1 = Phaser.Display.Color.IntegerToColor(0x0d4860);
      const c2 = Phaser.Display.Color.IntegerToColor(0x01101a);
      const r = Phaser.Math.Linear(c1.red, c2.red, t);
      const g = Phaser.Math.Linear(c1.green, c2.green, t);
      const b = Phaser.Math.Linear(c1.blue, c2.blue, t);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      this.bgFallbackGfx.fillStyle(color, 1);
      this.bgFallbackGfx.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }
  }

  private drawVignette(w: number, h: number) {
    this.vignette.clear();
    // Subtle darken corners with concentric outer rectangles
    for (let i = 0; i < 24; i += 1) {
      this.vignette.fillStyle(0x000000, 0.014);
      this.vignette.fillRect(i, i, w - i * 2, h - i * 2);
    }
  }

  private drawGlassFrame(w: number, h: number) {
    this.glassFrame.clear();
    // Outer glass border
    this.glassFrame.lineStyle(3, 0x22d3ee, 0.4);
    this.glassFrame.strokeRect(2, 2, w - 4, h - 4);
    this.glassFrame.lineStyle(1, 0x6dd6e8, 0.55);
    this.glassFrame.strokeRect(5, 5, w - 10, h - 10);
    // Top highlight reflection
    this.glassFrame.fillStyle(0xffffff, 0.05);
    this.glassFrame.fillRect(8, 8, w - 16, 8);
    // Soft corner glow
    this.glassFrame.fillStyle(0x22d3ee, 0.06);
    this.glassFrame.fillRect(8, 8, 20, h - 16);
    this.glassFrame.fillRect(w - 28, 8, 20, h - 16);
  }

  private placeRocks(w: number, h: number, subH: number) {
    for (const r of this.rocks) r.destroy();
    this.rocks = [];

    const rockKeys = ["rock_decor_1", "rock_decor_2"];
    const positions = [
      { kx: 0.15, scale: 1.0 },
      { kx: 0.72, scale: 1.2 },
      { kx: 0.45, scale: 0.85 },
    ];
    positions.forEach((p, idx) => {
      const key = this.getTextureKey(rockKeys[idx % rockKeys.length]);
      const x = p.kx * w;
      const y = h - subH + 4;
      const rock = this.add.image(x, y, key);
      rock.setOrigin(0.5, 1);
      rock.setScale(p.scale * 2.2);
      rock.setDepth(22);
      this.rocks.push(rock);
    });
  }

  private createFallbackTexture(entry: SpriteEntry) {
    const [w, h] = entry.fallbackSize;
    const g = this.add.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    g.clear();
    if (entry.key.startsWith("fish_") && entry.frameWidth && entry.frameHeight) {
      const fw = entry.frameWidth;
      const fh = entry.frameHeight;
      const frames = 4;
      const color = Phaser.Display.Color.HexStringToColor(entry.fallback).color;
      for (let i = 0; i < frames; i += 1) {
        g.fillStyle(color, 1);
        g.fillRoundedRect(i * fw + 2, fh / 2 - 3, fw - 6, 6, 3);
        g.fillTriangle(
          i * fw + fw - 4, fh / 2 - 3,
          i * fw + fw - 4, fh / 2 + 3,
          i * fw + fw - 1 - (i % 2), fh / 2
        );
        g.fillStyle(0x000000, 1);
        g.fillRect(i * fw + 3, fh / 2 - 2, 1, 1);
      }
      g.generateTexture(entry.key, fw * frames, fh);
      g.destroy();
      const tex = this.textures.get(entry.key);
      tex.add(0, 0, 0,       0, fw, fh);
      tex.add(1, 0, fw,      0, fw, fh);
      tex.add(2, 0, fw * 2,  0, fw, fh);
      tex.add(3, 0, fw * 3,  0, fw, fh);
      return;
    }
    if (entry.key.startsWith("plant_")) {
      const color = Phaser.Display.Color.HexStringToColor(entry.fallback).color;
      g.fillStyle(color, 1);
      g.fillRect(w / 2 - 1, h * 0.3, 2, h * 0.7);
      for (let i = 0; i < 6; i += 1) {
        const lx = (i % 2 === 0 ? -1 : 1) * (5 + i * 2);
        const ly = h * 0.3 + i * 4;
        g.fillEllipse(w / 2 + lx, ly, 12, 5);
      }
      g.generateTexture(entry.key, w, h);
      g.destroy();
      return;
    }
    if (entry.key.startsWith("equipment_")) {
      const color = Phaser.Display.Color.HexStringToColor(entry.fallback).color;
      g.fillStyle(0x2a4d6e, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle(color, 1);
      g.fillRect(1, 1, w - 2, h - 2);
      g.generateTexture(entry.key, w, h);
      g.destroy();
      return;
    }
    if (entry.key === "substrate_gravel") {
      g.fillStyle(0x4a3a2c, 1);
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i += 1) {
        g.fillStyle(0x6b4f3a, 1);
        g.fillCircle(2 + i * 4, h / 2, 2);
        g.fillStyle(0x8a6c4f, 1);
        g.fillCircle(4 + i * 4, h / 2 + 2, 1.5);
      }
      g.generateTexture(entry.key, w, h);
      g.destroy();
      return;
    }
    if (entry.key === "bubble") {
      g.lineStyle(1, 0xbfeefb, 1);
      g.strokeCircle(w / 2, h / 2, w / 2 - 1);
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(w / 2 - 2, h / 2 - 2, 1.5);
      g.generateTexture(entry.key, w, h);
      g.destroy();
      return;
    }
    if (entry.key.startsWith("rock_")) {
      const color = Phaser.Display.Color.HexStringToColor(entry.fallback).color;
      g.fillStyle(color, 1);
      g.fillEllipse(w / 2, h - 4, w - 4, h - 4);
      g.generateTexture(entry.key, w, h);
      g.destroy();
      return;
    }
    if (entry.key === "tank_background") {
      g.fillStyle(0x061a2a, 1);
      g.fillRect(0, 0, w, h);
      g.generateTexture(entry.key, w, h);
      g.destroy();
      return;
    }
    g.fillStyle(Phaser.Display.Color.HexStringToColor(entry.fallback).color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(entry.key, w, h);
    g.destroy();
  }

  private getTextureKey(baseKey: string): string {
    const realKey = `${baseKey}__real`;
    return this.textures.exists(realKey) ? realKey : baseKey;
  }

  private getStore() {
    return useAquariumStore.getState();
  }

  private currentAquarium() {
    const state = this.getStore();
    if (this.aquariumId) {
      return state.aquariums.find((a) => a.id === this.aquariumId) ?? state.aquariums[0];
    }
    return state.aquariums[0];
  }

  private syncWithStore() {
    const state = this.getStore();
    this.syncFish(state.fish);
    this.syncPlants(state.plants);
    this.syncEquipment(state.equipment);
  }

  private syncFish(fishList: Fish[]) {
    const present = new Set<string>();
    const { width, height } = this.scale;
    for (const fish of fishList) {
      present.add(fish.id);
      let visual = this.fishVisuals.get(fish.id);
      if (!visual) {
        const spec = FISH_SPECIES[fish.species];
        const texKey = this.getTextureKey(spec.spriteKey);
        const sprite = this.add.sprite(fish.x * width, fish.y * height, texKey, 0);
        sprite.setDepth(30 + spec.layer); // top layer ones above bottom layer
        // Scale: target on-screen size based on species adult size (cm → px-ish)
        const baseScale = 3.2 + spec.adultSize / 6;
        sprite.setScale(baseScale);
        if (this.anims.exists(`${spec.spriteKey}_swim`)) {
          sprite.play(`${spec.spriteKey}_swim`);
        }
        visual = { sprite };
        this.fishVisuals.set(fish.id, visual);
      }
    }
    for (const [id, visual] of this.fishVisuals.entries()) {
      if (!present.has(id)) {
        visual.sprite.destroy();
        this.fishVisuals.delete(id);
      }
    }
  }

  private syncPlants(plants: Plant[]) {
    const present = new Set<string>();
    const { width, height } = this.scale;
    const subH = Math.max(40, Math.round(height * SUBSTRATE_RATIO));
    const substrateTop = height - subH + 4; // 4px overlap so plant roots into gravel
    for (const plant of plants) {
      present.add(plant.id);
      let visual = this.plantVisuals.get(plant.id);
      if (!visual) {
        const spec = PLANT_SPECIES[plant.species];
        const texKey = this.getTextureKey(spec.spriteKey);
        const px = plant.x * width;
        const sprite = this.add.image(px, substrateTop, texKey);
        sprite.setOrigin(0.5, 1); // anchor at bottom-center
        sprite.setScale(plant.scale * 1.6);
        sprite.setDepth(24);
        visual = {
          sprite,
          baseY: substrateTop,
          swayPhase: Math.random() * Math.PI * 2,
          swayFreq: 0.5 + Math.random() * 0.7,
        };
        this.plantVisuals.set(plant.id, visual);
      } else {
        // Keep plants pinned to substrate even if simulation x changed
        visual.sprite.x = plant.x * width;
        visual.baseY = substrateTop;
      }
    }
    for (const [id, visual] of this.plantVisuals.entries()) {
      if (!present.has(id)) {
        visual.sprite.destroy();
        this.plantVisuals.delete(id);
      }
    }
  }

  private syncEquipment(equipment: Equipment[]) {
    const present = new Set<string>();
    const { width, height } = this.scale;
    for (const eq of equipment) {
      present.add(eq.id);
      let visual = this.equipmentVisuals.get(eq.id);
      if (!visual) {
        const baseKey = `equipment_${eq.type === "co2_diffuser" ? "co2" : eq.type}`;
        const texKey = this.getTextureKey(baseKey);
        const sprite = this.add.image(eq.x * width, eq.y * height, texKey);
        sprite.setDepth(15);
        if (eq.type === "light") {
          sprite.setOrigin(0.5, 0);
          // Span the tank width, but scale height independently so widening
          // the fixture doesn't also stretch it into a thick chunky bar.
          const thinHeight = Math.min(20, Math.max(10, Math.round(height * 0.045)));
          sprite.setScale(
            (width / sprite.width) * 0.95,
            thinHeight / sprite.height
          );
        } else if (eq.type === "filter") {
          sprite.setOrigin(0.5, 0);
          sprite.setScale(2.2);
        } else if (eq.type === "heater") {
          sprite.setOrigin(0.5, 0.5);
          sprite.setScale(2.2);
        } else {
          sprite.setOrigin(0.5, 1);
          sprite.setScale(2);
          // Air stone / CO2 sit on substrate
          const subH = Math.max(40, Math.round(height * SUBSTRATE_RATIO));
          sprite.y = height - subH + 4;
        }
        visual = { sprite };
        this.equipmentVisuals.set(eq.id, visual);
      }
      visual.sprite.setAlpha(eq.active ? 1 : 0.4);

      if ((eq.type === "airstone" || eq.type === "co2_diffuser") && eq.active) {
        if (!visual.emitter) {
          const bubbleKey = this.getTextureKey("bubble");
          const emitter = this.add.particles(
            visual.sprite.x,
            visual.sprite.y - 8,
            bubbleKey,
            {
              speed: { min: 18, max: 36 },
              angle: { min: 250, max: 290 },
              lifespan: { min: 2400, max: 3800 },
              gravityY: -8,
              scale: { start: 0.7, end: 1.6 },
              alpha: { start: 0.9, end: 0 },
              quantity: 1,
              frequency: eq.type === "co2_diffuser" ? 700 : 220,
              x: { min: -3, max: 3 },
            }
          );
          emitter.setDepth(35);
          visual.emitter = emitter;
        }
      } else if (visual.emitter) {
        visual.emitter.destroy();
        visual.emitter = undefined;
      }
    }
    for (const [id, visual] of this.equipmentVisuals.entries()) {
      if (!present.has(id)) {
        visual.sprite.destroy();
        visual.emitter?.destroy();
        this.equipmentVisuals.delete(id);
      }
    }
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.elapsed += dt;
    const state = this.getStore();
    const aquarium = this.currentAquarium();
    if (!aquarium) return;

    this.syncFish(state.fish);
    this.syncPlants(state.plants);
    this.syncEquipment(state.equipment);

    const { width, height } = this.scale;

    // Water tint based on overall dirtiness (turbidity + low cleanliness)
    const dirt = dirtIndex(aquarium.water);
    let tintColor = 0x0aa9c8;
    let tintAlpha = 0;
    if (dirt < 8) {
      tintAlpha = 0;
    } else if (dirt < 30) {
      tintColor = 0x6db66b; // greenish tinge
      tintAlpha = Phaser.Math.Linear(0.03, 0.2, (dirt - 8) / 22);
    } else {
      tintColor = 0x6b5a3a; // murky brown
      tintAlpha = Phaser.Math.Linear(0.2, 0.5, Math.min(1, (dirt - 30) / 50));
    }
    this.waterOverlay.setFillStyle(tintColor, tintAlpha);

    // Suspended detritus: more (and faster-emitted) the dirtier the water
    if (this.debris) {
      if (dirt > 6) {
        this.debris.emitting = true;
        this.debris.frequency = Phaser.Math.Linear(1400, 150, Math.min(1, dirt / 100));
      } else {
        this.debris.emitting = false;
      }
    }

    // Clean action fired → sparkle burst
    if (state.cleanFx !== this.lastCleanFx) {
      this.lastCleanFx = state.cleanFx;
      this.spawnCleanBurst();
    }

    // Night overlay
    const lightEq = state.equipment.find((e) => e.type === "light" && e.active);
    const lightLevel = lightEq ? lightEq.power / 100 : 0.15;
    this.nightOverlay.setFillStyle(0x000020, Math.max(0, (1 - lightLevel) * 0.5));

    // Animated light rays from above
    this.lightRays.clear();
    if (lightLevel > 0.2) {
      this.lightRays.fillStyle(0xa5f3fc, 0.04 * lightLevel);
      for (let i = 0; i < 6; i += 1) {
        const x = (i / 6) * width + Math.sin(this.elapsed * 0.4 + i) * 30 + 60;
        this.lightRays.fillTriangle(
          x, 0,
          x + 40, 0,
          x + 80, height * 0.7
        );
      }
    }

    // Surface shimmer
    this.surfaceShimmer.clear();
    const shimmerY = 10;
    this.surfaceShimmer.lineStyle(1, 0xbfeefb, 0.3);
    for (let i = 0; i < width; i += 4) {
      const wave = Math.sin((i + this.elapsed * 60) / 12) * 1.6;
      this.surfaceShimmer.lineBetween(i, shimmerY + wave, i + 3, shimmerY + wave);
    }
    this.surfaceShimmer.lineStyle(1, 0xffffff, 0.08);
    for (let i = 0; i < width; i += 7) {
      const wave = Math.sin((i + this.elapsed * 40) / 18) * 2;
      this.surfaceShimmer.lineBetween(i, shimmerY + 3 + wave, i + 5, shimmerY + 3 + wave);
    }

    // Fish behaviour
    const aliveFish = state.fish.filter((f) => f.alive);
    for (const fish of state.fish) {
      const visual = this.fishVisuals.get(fish.id);
      if (!visual) continue;
      const spec = FISH_SPECIES[fish.species];

      if (!fish.alive) {
        visual.sprite.setRotation(Math.PI / 2);
        visual.sprite.y = Math.max(20, visual.sprite.y - 12 * dt);
        visual.sprite.setAlpha(0.65);
        visual.sprite.anims.stop();
        continue;
      }

      const tx = fish.targetX * width;
      const ty = fish.targetY * height;
      const dx = tx - visual.sprite.x;
      const dy = ty - visual.sprite.y;
      const dist = Math.hypot(dx, dy);
      const stressFactor = 1 + (fish.stress / 100) * 0.6;
      const speed = spec.baseSpeed * width * stressFactor * (fish.stress > 60 ? 1.5 : 1);

      if (dist < 8) {
        const layer = spec.layer;
        const minY = layer === 0 ? 0.12 : layer === 1 ? 0.28 : SUBSTRATE_TOP_Y - 0.1;
        const maxY = layer === 0 ? 0.3  : layer === 1 ? SUBSTRATE_TOP_Y - 0.05 : SUBSTRATE_TOP_Y - 0.02;
        fish.targetX = Phaser.Math.FloatBetween(0.06, 0.94);
        fish.targetY = Phaser.Math.FloatBetween(minY, maxY);
      } else {
        const vx = (dx / dist) * speed * dt;
        const vy = (dy / dist) * speed * dt;
        visual.sprite.x += vx;
        visual.sprite.y += vy;
        if (fish.stress > 60 && Math.random() < 0.2) {
          visual.sprite.x += (Math.random() - 0.5) * 4;
          visual.sprite.y += (Math.random() - 0.5) * 4;
        }
        fish.x = visual.sprite.x / width;
        fish.y = visual.sprite.y / height;
        if (Math.abs(vx) > 0.05) {
          const dir = vx > 0 ? 1 : -1;
          if (visual.sprite.flipX !== (dir === -1)) {
            visual.sprite.setFlipX(dir === -1);
          }
        }
      }

      if (fish.health < 30) visual.sprite.setTint(0xb8a48a);
      else visual.sprite.clearTint();
      visual.sprite.setAlpha(1);

      // shoaling pull
      if (spec.schooling > 1 && Math.random() < 0.02) {
        const companions = aliveFish.filter(
          (c) => c.species === fish.species && c.id !== fish.id
        );
        if (companions.length > 0) {
          const target = companions[Math.floor(Math.random() * companions.length)];
          fish.targetX = target.x + (Math.random() - 0.5) * 0.1;
          fish.targetY = target.y + (Math.random() - 0.5) * 0.1;
        }
      }
    }

    // Plant sway
    for (const [, visual] of this.plantVisuals) {
      const offset =
        Math.sin(this.elapsed * visual.swayFreq + visual.swayPhase) * 1.5;
      // Sway only the top; since origin is bottom, we tilt slightly instead.
      visual.sprite.rotation =
        Math.sin(this.elapsed * visual.swayFreq + visual.swayPhase) * 0.05;
      // Subtle vertical bob
      visual.sprite.y = visual.baseY + offset * 0.3;
    }
  }

  shutdown() {
    this.scale.off("resize", this.handleResize, this);
    this.debris?.destroy();
    this.debris = undefined;
    this.fishVisuals.clear();
    this.plantVisuals.clear();
    this.equipmentVisuals.clear();
    this.rocks = [];
  }
}
