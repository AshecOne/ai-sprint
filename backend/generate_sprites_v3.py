"""Generate sprites with a solid MAGENTA chroma-key background.

Magenta (#FF00FF) is reliably absent from natural subjects, making it easy
to remove cleanly with a colour-distance threshold in post.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
MODEL = "gemini-3-pro-image"

SPRITES_DIR = Path("/app/frontend/public/sprites")

BASE_PIXEL = (
    "16-bit pixel art sprite, NES/SNES style with crisp pixels and hard edges, "
    "no anti-aliasing, no text, no watermark, no border, no shadow under "
    "subject, no ground line. Bright magenta solid background #FF00FF filling "
    "the entire canvas behind the subject — DO NOT use transparent, "
    "checkerboard, white, or any other background color. Just solid magenta. "
    "Subject is centered and fills the canvas."
)

FISH = [
    ("fish_guppy",        "A small Guppy fish, male, body orange-yellow, large fan tail blue with red spots."),
    ("fish_neon_tetra",   "A Neon Tetra fish, electric blue iridescent stripe along top, red lower half from middle to tail."),
    ("fish_betta",        "A Betta Splendens fish, long flowing dramatic fins. Deep crimson red body, royal blue flowing fins."),
    ("fish_goldfish",     "A chubby round Goldfish, bright orange body, small white belly, flowing tail."),
    ("fish_corydoras",    "A Corydoras armored catfish, bronze-grey scaly body with brown speckles and whiskers."),
    ("fish_angelfish",    "An Angelfish, tall flat triangular body, long flowing dorsal/anal fins. Silver body, bold black vertical stripes."),
    ("fish_discus",       "A Discus fish, round flat disc-shaped body. Royal blue base with bright red horizontal patterns."),
]
PLANTS = [
    ("plant_java_fern",     "Aquarium Java Fern plant, long wavy dark green leaves from rhizome at bottom."),
    ("plant_anubias",       "Aquarium Anubias plant, thick rounded dark green broad leaves on short stems."),
    ("plant_amazon_sword",  "Aquarium Amazon Sword plant, bushy with large broad bright green leaves fanning out."),
    ("plant_java_moss",     "Clump of Java Moss, soft fluffy bright green moss with tiny leaves, irregular blob shape."),
    ("plant_vallisneria",   "Vallisneria aquarium plant, tall thin ribbon-like light green grass blades growing upward."),
]
EQUIPMENT = [
    ("equipment_filter",   "Hang-on-back aquarium filter, grey plastic rectangular box with black intake tube. Side view."),
    ("equipment_heater",   "Submersible aquarium heater, vertical glass tube, red rubber suction cups, glowing orange light at top."),
    ("equipment_airstone", "Aquarium air stone, small white porous cylindrical rock with air tube. Side view."),
    ("equipment_co2",      "Aquarium CO2 diffuser, small white circular ceramic disc inside clear acrylic. Side view."),
    ("equipment_light",    "Long horizontal aquarium LED light bar, sleek black housing. Side view from below."),
]
OTHER = [
    ("substrate_gravel", "Horizontal strip of aquarium gravel, top-down, tileable, mix of brown tan and grey rounded pebbles packed."),
    ("bubble",           "Single round water bubble, light blue translucent circle with white highlight dot upper left."),
    ("rock_decor_1",     "Aquarium decoration: large smooth river rock, rounded oval, grey with brown speckles."),
    ("rock_decor_2",     "Aquarium decoration: small piece of driftwood, horizontal log, dark brown bark light brown highlights."),
]


def aspect_for(name: str) -> str:
    if name.startswith("fish_"):
        return ("Output a horizontal sprite sheet aspect 4:1 with 4 frames of "
                "swim animation arranged side by side, each frame the SAME fish "
                "with tail/fins in slightly different positions. Fish faces RIGHT.")
    if name.startswith("plant_"):
        return "Output vertical 2:3 aspect, single plant clump centered, bottom-rooted."
    if name in ("equipment_airstone", "equipment_co2"):
        return "Output square 1:1 aspect, equipment centered."
    if name in ("equipment_light", "substrate_gravel"):
        return "Output wide horizontal 4:1 aspect."
    if name == "bubble":
        return "Output square 1:1 aspect, single bubble centered."
    if name == "rock_decor_1":
        return "Output square 1:1 aspect, single rock."
    if name == "rock_decor_2":
        return "Output horizontal 2:1 aspect, horizontal log."
    return "Output vertical 1:2 aspect, equipment centered."


def generate_one(name: str, desc: str) -> bool:
    target = SPRITES_DIR / f"{name}.png"
    prompt = f"{desc} {BASE_PIXEL} {aspect_for(name)}"
    try:
        resp = client.models.generate_content(model=MODEL, contents=prompt)
        for part in resp.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                target.write_bytes(part.inline_data.data)
                print(f"  saved {target.name} ({target.stat().st_size} B)")
                return True
    except Exception as exc:
        print(f"  ERROR {name}: {str(exc)[:200]}")
    return False


def main():
    items = FISH + PLANTS + EQUIPMENT + OTHER
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, desc in items:
        if only and name not in only:
            continue
        print(f"{name}: generating…")
        generate_one(name, desc)
        time.sleep(1.0)


if __name__ == "__main__":
    main()
