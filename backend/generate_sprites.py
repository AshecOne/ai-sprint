"""Generate aquarium sprite assets via the backend Nano Banana endpoint.

Run once after the backend is up. Skips sprites that already exist on disk.
"""
from __future__ import annotations

import asyncio
import os
import sys
import httpx

API_BASE = os.environ.get("API_BASE", "http://localhost:8001")

BASE_PROMPT_PIXEL = (
    "Pixel art sprite, PNG with TRANSPARENT background, no text, no watermark, "
    "no border, no shadow ground, NES/SNES era pixel art aesthetic, crisp "
    "pixels, no anti-aliasing, limited palette 6-10 colors, dark outlines, "
    "centered subject filling the canvas."
)

FISH = [
    ("fish_guppy",        "Guppy fish, male, colorful tail fan, orange body with blue tail and yellow accents"),
    ("fish_neon_tetra",   "Neon Tetra fish, electric blue horizontal stripe on top half, red lower body"),
    ("fish_betta",        "Betta Splendens fish, long flowing flame-like fins, deep crimson red and royal blue"),
    ("fish_goldfish",     "Goldfish, round chubby body, bright orange with white belly"),
    ("fish_corydoras",    "Corydoras catfish, armored bottom feeder, grey-bronze with brown speckles"),
    ("fish_angelfish",    "Angelfish, tall flat body with long fins, silver with black vertical stripes"),
    ("fish_discus",       "Discus fish, round flat disc body, royal blue with red horizontal pattern"),
]

PLANTS = [
    ("plant_java_fern",     "Aquarium plant Java Fern, dark green wavy leaves growing in clump"),
    ("plant_anubias",       "Aquarium plant Anubias, thick rounded dark green leaves on short stems"),
    ("plant_amazon_sword",  "Aquarium plant Amazon Sword, broad large green leaves bushy"),
    ("plant_java_moss",     "Aquarium plant Java Moss, soft fluffy bright green moss clump"),
    ("plant_vallisneria",   "Aquarium plant Vallisneria, tall thin ribbon-like light green grass blades"),
]

EQUIPMENT = [
    ("equipment_filter",   "Hang-on-back aquarium filter, grey plastic box with black intake tube hanging down, side view"),
    ("equipment_heater",   "Submersible aquarium heater, vertical glass tube with red suction cups, orange indicator light at top"),
    ("equipment_airstone", "Air stone for aquarium, small white porous rock cylinder with tiny bubbles rising"),
    ("equipment_co2",      "CO2 diffuser, small circular ceramic disc with clear acrylic housing, side view"),
    ("equipment_light",    "Aquarium LED light bar, wide horizontal black bar with white LEDs underneath glowing"),
]

OTHER = [
    ("substrate_gravel", "Aquarium gravel tile strip, seamlessly tileable horizontal, mix of brown and grey rounded pebbles, top-down view"),
    ("bubble",           "Single water bubble, white circle outline with light blue translucent fill, small white highlight dot in upper left"),
]


def build_prompts():
    items = []
    for name, desc in FISH:
        items.append({
            "name": name,
            "prompt": (
                f"{desc}. {BASE_PROMPT_PIXEL} "
                "Output a horizontal SPRITE SHEET of 4 frames side-by-side, "
                "each frame 16x16 pixels (final canvas 64x16). Show a swim/walk "
                "cycle: tail/fin slightly different position in each frame. "
                "Fish faces right. Same fish in every frame."
            ),
        })
    for name, desc in PLANTS:
        items.append({
            "name": name,
            "prompt": (
                f"{desc}. {BASE_PROMPT_PIXEL} "
                "Single plant clump, side view, transparent background, "
                "canvas 32x48 pixels (vertical), bottom-rooted."
            ),
        })
    for name, desc in EQUIPMENT:
        items.append({
            "name": name,
            "prompt": (
                f"{desc}. {BASE_PROMPT_PIXEL} "
                "Aquarium equipment placed against glass, side view, "
                "canvas 16x32 pixels (vertical)."
            ),
        })
    for name, desc in OTHER:
        items.append({
            "name": name,
            "prompt": (
                f"{desc}. {BASE_PROMPT_PIXEL} "
                + ("Canvas 32x8 pixels (tileable strip)." if name == "substrate_gravel" else "Canvas 8x8 pixels (single bubble).")
            ),
        })
    return items


async def main():
    items = build_prompts()
    overwrite = "--overwrite" in sys.argv
    async with httpx.AsyncClient(timeout=900) as client:
        for it in items:
            r = await client.post(
                f"{API_BASE}/api/sprites/generate",
                json={"sprites": [it], "overwrite": overwrite},
            )
            try:
                data = r.json()
            except Exception:
                data = {"raw": r.text[:200]}
            print(f"{it['name']:30s} -> {data}")


if __name__ == "__main__":
    asyncio.run(main())
