import Phaser from "phaser";
import { SPRITE_REGISTRY, type SpriteEntry } from "../assets";

const LOBBY_FISH = [
  "fish_guppy",
  "fish_neon_tetra",
  "fish_betta",
  "fish_goldfish",
  "fish_angelfish",
] as const;

const FISH_Y_RATIOS  = [0.20, 0.35, 0.50, 0.65, 0.42];
const FISH_SPEEDS    = [55,   75,   45,   90,   62];
const FISH_SCALES    = [3,    4,    3.5,  3,    4];

interface LobbyFish {
  sprite: Phaser.GameObjects.Sprite;
  speed: number;
}

export class LobbyScene extends Phaser.Scene {
  private lobbyFish: LobbyFish[] = [];

  constructor() {
    super({ key: "LobbyScene" });
  }

  preload() {
    const entries = SPRITE_REGISTRY.filter((e) =>
      (LOBBY_FISH as readonly string[]).includes(e.key)
    );
    for (const entry of entries) {
      this.createFallbackTexture(entry);
    }
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("[LobbyScene] sprite missing, using fallback:", file.key);
    });
    for (const entry of entries) {
      this.load.spritesheet(`${entry.key}__real`, `/sprites/${entry.file}`, {
        frameWidth: entry.frameWidth!,
        frameHeight: entry.frameHeight!,
      });
    }
  }

  create() {
    const { width, height } = this.scale;

    for (const key of LOBBY_FISH) {
      const texKey = this.getTextureKey(key);
      const tex = this.textures.get(texKey);
      const frameCount = Math.max(1, tex.frameTotal - 1);
      const frames = Array.from({ length: frameCount }, (_, i) => ({
        key: texKey,
        frame: i,
      }));
      if (this.anims.exists(`${key}_swim`)) this.anims.remove(`${key}_swim`);
      this.anims.create({
        key: `${key}_swim`,
        frames: frameCount > 1 ? frames : [{ key: texKey, frame: 0 }],
        frameRate: 6,
        repeat: -1,
      });
    }

    for (let i = 0; i < LOBBY_FISH.length; i++) {
      const key = LOBBY_FISH[i];
      const texKey = this.getTextureKey(key);
      const x = -50 - i * 140;
      const y = FISH_Y_RATIOS[i] * height;
      const sprite = this.add.sprite(x, y, texKey, 0);
      sprite.setScale(FISH_SCALES[i]);
      sprite.play(`${key}_swim`);
      this.lobbyFish.push({ sprite, speed: FISH_SPEEDS[i] });
    }
  }

  update(_time: number, delta: number) {
    const { width, height } = this.scale;
    const dt = delta / 1000;

    for (const f of this.lobbyFish) {
      f.sprite.x += f.speed * dt;
      if (f.sprite.x > width + 60) {
        f.sprite.x = -60;
        f.sprite.y = (0.15 + Math.random() * 0.65) * height;
      }
    }
  }

  private getTextureKey(baseKey: string): string {
    const realKey = `${baseKey}__real`;
    return this.textures.exists(realKey) ? realKey : baseKey;
  }

  private createFallbackTexture(entry: SpriteEntry) {
    const fw = entry.frameWidth!;
    const fh = entry.frameHeight!;
    const g = this.add.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    const color = Phaser.Display.Color.HexStringToColor(entry.fallback).color;
    for (let i = 0; i < 4; i++) {
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
    g.generateTexture(entry.key, fw * 4, fh);
    g.destroy();
    const tex = this.textures.get(entry.key);
    tex.add(0, 0, 0,      0, fw, fh);
    tex.add(1, 0, fw,     0, fw, fh);
    tex.add(2, 0, fw * 2, 0, fw, fh);
    tex.add(3, 0, fw * 3, 0, fw, fh);
  }
}
