"use client";

/**
 * Shared pixel-art creatures used by the lobby background and the in-game
 * loading screen, so both stay visually identical. Uses the actual AI-generated
 * game sprites from /public/sprites/ instead of hand-coded SVG shapes.
 */

export type FishSpecies =
  | "guppy"
  | "betta"
  | "neon_tetra"
  | "goldfish"
  | "angelfish"
  | "discus"
  | "corydoras";

export type PlantSpecies =
  | "amazon_sword"
  | "anubias"
  | "java_fern"
  | "java_moss"
  | "vallisneria";

/** Pixel-art fish — renders the actual game sprite at 3× upscale. */
export function PixelFish({
  className,
  species = "guppy",
}: {
  className?: string;
  species?: FishSpecies;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`pixelated ${className ?? ""}`}
      src={`/sprites/fish_${species}.png`}
      alt=""
      aria-hidden="true"
      width={192}
      height={48}
      style={{ display: "block" }}
    />
  );
}

/** Pixel-art plant — renders the actual game sprite at 2.5× upscale. */
export function PixelPlant({
  className,
  species = "vallisneria",
}: {
  className?: string;
  species?: PlantSpecies;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`pixelated ${className ?? ""}`}
      src={`/sprites/plant_${species}.png`}
      alt=""
      aria-hidden="true"
      style={{ height: 130, width: "auto", display: "block" }}
    />
  );
}
