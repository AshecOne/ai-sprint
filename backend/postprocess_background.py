"""Post-process background + decor assets.

- tank_background.png: keep as 1280x720 (downscale slightly for speed), no alpha
- rock_decor_*.png: remove white/grey background, resize for pixel art
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image

SPR = Path("/app/frontend/public/sprites")


def remove_bg(img: Image.Image, white_thr: int = 235) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > white_thr and g > white_thr and b > white_thr:
                px[x, y] = (0, 0, 0, 0)
            elif 200 < r < 230 and 200 < g < 230 and 200 < b < 230 and abs(r - g) < 12 and abs(g - b) < 12:
                px[x, y] = (0, 0, 0, 0)
    return img


def main() -> None:
    # Background: keep full size, no alpha
    bg = Image.open(SPR / "tank_background.png").convert("RGB")
    bg = bg.resize((1280, 720), Image.NEAREST)
    bg.save(SPR / "tank_background.png", "PNG", optimize=True)
    print("tank_background.png: 1280x720")

    for name, size in [("rock_decor_1.png", (48, 32)), ("rock_decor_2.png", (64, 24))]:
        im = Image.open(SPR / name)
        im = remove_bg(im)
        bbox = im.getbbox()
        if bbox:
            im = im.crop(bbox)
        im = im.resize(size, Image.NEAREST)
        im.save(SPR / name, "PNG")
        print(f"{name}: {size}")


if __name__ == "__main__":
    main()
