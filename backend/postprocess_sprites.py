"""Chroma-key post-processor.

The AI generates sprites with a solid magenta (#FF00FF) background. We:
  1. Convert any pixel that is "close enough" to magenta to fully transparent.
  2. Trim to subject bbox.
  3. Resize with nearest-neighbour to the final pixel-art dimensions.
  4. A second pass cleans any magenta fringe along edges.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image

SPRITES_DIR = Path("/app/frontend/public/sprites")
RAW_DIR = SPRITES_DIR / "_raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

TARGETS: dict[str, tuple[int, int]] = {
    "fish_guppy.png":           (64, 16),
    "fish_neon_tetra.png":      (64, 16),
    "fish_betta.png":           (64, 16),
    "fish_goldfish.png":        (64, 16),
    "fish_corydoras.png":       (64, 16),
    "fish_angelfish.png":       (64, 16),
    "fish_discus.png":          (64, 16),
    "plant_java_fern.png":      (48, 64),
    "plant_anubias.png":        (48, 64),
    "plant_amazon_sword.png":   (48, 64),
    "plant_java_moss.png":      (48, 48),
    "plant_vallisneria.png":    (48, 80),
    "equipment_filter.png":     (24, 40),
    "equipment_heater.png":     (16, 48),
    "equipment_airstone.png":   (24, 24),
    "equipment_co2.png":        (24, 24),
    "equipment_light.png":      (96, 12),
    "substrate_gravel.png":     (64, 16),
    "bubble.png":               (12, 12),
    "rock_decor_1.png":         (48, 32),
    "rock_decor_2.png":         (64, 24),
}


def is_magenta(r: int, g: int, b: int, tol: int = 80) -> bool:
    """True if the pixel is close to chroma-key magenta #FF00FF.

    Catches both the pure background colour and any darker tint that
    nearest-neighbour resize can leave on edge pixels.
    """
    # Magenta-ish: red+blue dominate, green is the minimum
    if g < r and g < b:
        magenta_score = (r + b) / 2 - g
        # If green is much lower than red+blue average, it's magenta-toned.
        if magenta_score > 35 and (r > 80 or b > 80):
            return True
    return False


def chroma_key(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_magenta(r, g, b):
                px[x, y] = (0, 0, 0, 0)
                continue
            # Some pinkish fringe might survive on pure white pixels too.
            if r > 245 and g > 245 and b > 245:
                px[x, y] = (0, 0, 0, 0)
    return img


def edge_clean(img: Image.Image) -> Image.Image:
    """Drop any remaining magenta-adjacent fringe after resize."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for _ in range(3):
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                # Pinkish / magenta-tinted pixel
                if (r > 150 and b > 130 and g < 170 and (r - g) > 15 and (b - g) > 5):
                    transparent_neighbours = sum(
                        1
                        for nx, ny in (
                            (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)
                        )
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0
                    )
                    if transparent_neighbours >= 1:
                        px[x, y] = (0, 0, 0, 0)
    return img


def process(name: str, target: tuple[int, int]) -> None:
    src = SPRITES_DIR / name
    if not src.exists():
        return
    raw = RAW_DIR / name
    if not raw.exists():
        Image.open(src).convert("RGBA").save(raw, "PNG")

    img = Image.open(raw).convert("RGBA")
    img = chroma_key(img)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img = img.resize(target, Image.NEAREST)
    # Run chroma key AGAIN after resize: nearest-neighbour can leave
    # residual magenta pixels from sample points sitting on the boundary.
    img = chroma_key(img)
    img = edge_clean(img)
    img.save(src, "PNG")
    print(f"{name:28s} -> {target}")


def main() -> None:
    for name, target in TARGETS.items():
        process(name, target)


if __name__ == "__main__":
    main()
