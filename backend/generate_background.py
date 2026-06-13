"""Generate the aquarium tank background scene (single image)."""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
MODEL = "gemini-3-pro-image"

SPRITES_DIR = Path("/app/frontend/public/sprites")

PROMPTS = {
    "tank_background.png": (
        "16-bit pixel art aquarium tank background scene. Wide horizontal "
        "landscape image, aspect ratio 16:9. Deep blue underwater scene fading "
        "from medium aqua-blue at top to dark navy at bottom. Subtle light "
        "rays from above cutting through water. A few scattered large smooth "
        "rocks and driftwood in midground. No fish, no plants, no equipment, "
        "no text, no border. Empty atmospheric tank backdrop. "
        "NES/SNES style, crisp pixels, no anti-aliasing, hard pixel edges, "
        "limited 16-color palette of blues and warm rock browns."
    ),
    "rock_decor_1.png": (
        "16-bit pixel art aquarium decoration: large smooth river rock, "
        "rounded oval shape, grey with brown speckles. Side view, transparent "
        "background, no shadow, no text. NES/SNES pixel art, square 1:1 aspect."
    ),
    "rock_decor_2.png": (
        "16-bit pixel art aquarium decoration: small piece of driftwood, "
        "horizontal log shape, dark brown bark with light brown highlights. "
        "Side view, transparent background, no shadow, no text. NES/SNES "
        "pixel art, wide horizontal 2:1 aspect."
    ),
}


def main():
    for name, prompt in PROMPTS.items():
        target = SPRITES_DIR / name
        if target.exists():
            print(f"{name}: exists, overwriting")
        print(f"{name}: generating…")
        resp = client.models.generate_content(model=MODEL, contents=prompt)
        for part in resp.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                target.write_bytes(part.inline_data.data)
                print(f"  saved {target} ({target.stat().st_size} B)")
                break


if __name__ == "__main__":
    main()
