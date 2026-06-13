"""Generate aquarium sprite assets using Google GenAI (Gemini Nano Banana) directly.

Uses the user's Google API key. Saves PNGs to /app/frontend/public/sprites/.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    print("GOOGLE_API_KEY missing in /app/backend/.env")
    sys.exit(1)

client = genai.Client(api_key=API_KEY)
MODEL = "gemini-3-pro-image"  # Nano Banana Pro — highest quality

SPRITES_DIR = Path("/app/frontend/public/sprites")
SPRITES_DIR.mkdir(parents=True, exist_ok=True)

BASE_PIXEL = (
    "16-bit retro pixel art, transparent background, no checkerboard pattern, "
    "no background at all (just transparent), no text, no watermark, "
    "no shadow under subject, no ground line, crisp pixels with hard edges, "
    "limited NES/SNES color palette, dark 1px outlines, vibrant saturated colors."
)

FISH = [
    ("fish_guppy",        "A small Guppy fish, male, with a large flowing fan-shaped tail. Body orange-yellow, tail blue with red spots."),
    ("fish_neon_tetra",   "A Neon Tetra fish with electric blue iridescent stripe along top half, red lower half from middle to tail."),
    ("fish_betta",        "A Betta Splendens fish with long flowing dramatic fins and tail. Deep crimson red body with royal blue fins."),
    ("fish_goldfish",     "A chubby round Goldfish, bright orange body, small white belly, flowing tail."),
    ("fish_corydoras",    "A Corydoras armored catfish, bottom-feeder, bronze-grey scaly body with brown speckles and whiskers."),
    ("fish_angelfish",    "An Angelfish with tall flat triangular body and long flowing dorsal/anal fins. Silver body with bold black vertical stripes."),
    ("fish_discus",       "A Discus fish, round flat disc-shaped body. Royal blue base with bright red horizontal patterns."),
]

PLANTS = [
    ("plant_java_fern",     "A clump of aquatic Java Fern plant with long wavy dark green leaves growing from a rhizome at bottom."),
    ("plant_anubias",       "An Anubias aquarium plant with thick rounded dark green broad leaves on short stems."),
    ("plant_amazon_sword",  "An Amazon Sword aquarium plant, bushy with large broad bright green leaves fanning out."),
    ("plant_java_moss",     "A clump of Java Moss, soft fluffy bright green moss with tiny leaves, irregular blob shape."),
    ("plant_vallisneria",   "Vallisneria aquarium plant, tall thin ribbon-like light green grass blades growing upward."),
]

EQUIPMENT = [
    ("equipment_filter",   "A hang-on-back aquarium filter, grey plastic rectangular box with black water intake tube hanging down. Side view."),
    ("equipment_heater",   "A submersible aquarium heater, vertical glass tube with grey caps, red rubber suction cups, glowing orange indicator light at top. Side view."),
    ("equipment_airstone", "An aquarium air stone, small white porous cylindrical rock with bubbles, attached air tube at top. Side view."),
    ("equipment_co2",      "An aquarium CO2 diffuser, small circular white ceramic disc inside clear acrylic housing. Side view."),
    ("equipment_light",    "A long horizontal aquarium LED light bar, black housing with bright white LEDs underneath glowing. Side view from below."),
]

OTHER = [
    ("substrate_gravel", "A horizontal strip of aquarium gravel, top-down view, seamless tileable, mix of brown, tan and grey rounded pebbles densely packed."),
    ("bubble",           "A single round water bubble, light blue translucent circle with a small white highlight dot in upper left."),
]


def aspect_for(name: str) -> str:
    if name.startswith("fish_"):
        return "Output a wide horizontal sprite sheet aspect 4:1 with 4 frames of swim animation side by side, each frame the same fish with tail/fins slightly different position. Fish faces RIGHT."
    if name.startswith("plant_"):
        return "Output as a vertical 2:3 aspect image, single plant clump centered, bottom-rooted."
    if name in ("equipment_airstone", "equipment_co2"):
        return "Output as a square 1:1 aspect image, equipment centered."
    if name in ("equipment_light", "substrate_gravel"):
        return "Output as a wide horizontal 4:1 aspect image."
    if name == "bubble":
        return "Output as a square 1:1 aspect image, bubble centered, tiny."
    return "Output as a vertical 1:2 aspect image, equipment centered."


def generate_one(name: str, desc: str) -> bool:
    target = SPRITES_DIR / f"{name}.png"
    prompt = f"{desc} {BASE_PIXEL} {aspect_for(name)}"
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                target.write_bytes(part.inline_data.data)
                print(f"  saved {target.name} ({target.stat().st_size} B)")
                return True
        print(f"  no image data returned for {name}")
        return False
    except Exception as exc:
        print(f"  ERROR {name}: {str(exc)[:200]}")
        return False


def main():
    items = []
    for n, d in FISH:
        items.append((n, d))
    for n, d in PLANTS:
        items.append((n, d))
    for n, d in EQUIPMENT:
        items.append((n, d))
    for n, d in OTHER:
        items.append((n, d))

    overwrite = "--overwrite" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]

    for name, desc in items:
        if only and name not in only:
            continue
        target = SPRITES_DIR / f"{name}.png"
        if target.exists() and not overwrite:
            print(f"{name}: skip (exists)")
            continue
        print(f"{name}: generating…")
        generate_one(name, desc)
        time.sleep(1.0)


if __name__ == "__main__":
    main()
