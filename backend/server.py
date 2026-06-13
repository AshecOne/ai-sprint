"""Minimal FastAPI backend for the Aquarium Simulator.

This backend mainly exists to:
1. Host the sprite generation endpoint (Gemini Nano Banana)
2. Provide health check used by deployment

The simulation itself runs entirely client-side via Next.js + Zustand + Phaser.
"""
from __future__ import annotations

import asyncio
import base64
import logging
import os
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquarium-backend")

app = FastAPI(title="Aquarium Simulator Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SPRITES_DIR = Path("/app/frontend/public/sprites")
SPRITES_DIR.mkdir(parents=True, exist_ok=True)


class SpritePrompt(BaseModel):
    name: str
    prompt: str


class GenerateSpritesRequest(BaseModel):
    sprites: List[SpritePrompt]
    overwrite: bool = False


@app.get("/api/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "aquarium-simulator-backend"}


@app.get("/api/sprites")
async def list_sprites() -> Dict[str, List[str]]:
    files = sorted([p.name for p in SPRITES_DIR.glob("*.png")])
    return {"sprites": files}


@app.post("/api/sprites/generate")
async def generate_sprites(req: GenerateSpritesRequest) -> Dict[str, List[str]]:
    """Generate pixel-art sprites using Gemini Nano Banana.

    Saves images to /app/frontend/public/sprites/<name>.png.
    """
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY missing")

    # Import here so the route still loads even if the library is briefly
    # unavailable during deployment health checks.
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    generated: List[str] = []
    skipped: List[str] = []
    failed: List[Dict[str, str]] = []

    for sprite in req.sprites:
        target = SPRITES_DIR / f"{sprite.name}.png"
        if target.exists() and not req.overwrite:
            skipped.append(sprite.name)
            continue
        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"sprite-{sprite.name}",
                system_message="You are an expert pixel art artist creating game sprites.",
            )
            chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
                modalities=["image", "text"]
            )
            msg = UserMessage(text=sprite.prompt)
            _text, images = await chat.send_message_multimodal_response(msg)
            if not images:
                failed.append({"name": sprite.name, "error": "no_images_returned"})
                continue
            image_bytes = base64.b64decode(images[0]["data"])
            target.write_bytes(image_bytes)
            generated.append(sprite.name)
            logger.info("Generated sprite %s (%d bytes)", sprite.name, len(image_bytes))
        except Exception as exc:  # noqa: BLE001
            logger.exception("Sprite generation failed for %s", sprite.name)
            failed.append({"name": sprite.name, "error": str(exc)[:200]})
        await asyncio.sleep(0.5)

    return {
        "generated": generated,
        "skipped": skipped,
        "failed": [f["name"] for f in failed],
    }
