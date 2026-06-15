# AquaSim — Pixel Aquarium Simulator

## Original Problem Statement
Build an Aquarium Simulator (Next.js 16 + TypeScript + Tailwind v4 + Phaser 4 + Zustand v5). Phase 3 — Phaser 4 canvas renderer with simulation engine, dashboard, fish behaviour, water chemistry, plants, and equipment. AI-generated pixel art sprites via Gemini Nano Banana Pro. User wants realistic plants rooted on substrate, beautiful tank background, and deploy.

## Architecture
- **Frontend** (`/app/frontend`): Next.js 16 (Turbopack) + React 19 + Tailwind v4 + Zustand v5 + Phaser 4.1
  - `src/app/page.tsx` — landing
  - `src/app/game/page.tsx` — main tank + dashboard
  - `src/renderer/PhaserGame.tsx` — Phaser canvas wrapper (dynamic import, ResizeObserver)
  - `src/renderer/scenes/MainScene.ts` — full pixel-art scene with fish/plant/equipment/bubble particle systems, light rays, vignette, glass frame, sway, swimming AI
  - `src/simulation/engine.ts` — water chemistry tick, fish vitals (stress/hunger/health), plant photosynthesis, equipment effects
  - `src/store/aquariumStore.ts` — Zustand persisted store (aquariums/fish/plants/equipment/cash/events)
  - `src/store/gameStore.ts` — UI state (paused, speed, tab, tick)
- **Backend** (`/app/backend`): FastAPI minimal
  - `/api/health` — service liveness
  - `/api/sprites` — list generated assets
  - `/api/sprites/generate` — generate via emergentintegrations
  - Generator scripts `generate_sprites_v3.py` (Google GenAI direct, Nano Banana Pro) + `postprocess_sprites.py` (chroma-key + nearest-neighbour downscale)

## Core Requirements (static)
- Real-time aquarium simulation, tick-driven, 60 FPS Phaser canvas
- 7 fish species, 5 plant species, 5 equipment types
- Water chemistry params: temperature, pH, NH3, NO2, NO3, O2, CO2, hardness, turbidity, cleanliness
- Fish behaviour: stress/hunger/health, swimming AI with layered patrols, schooling, death
- Plants: rooted to substrate, sway animation, photosynthesis (O2 production, NO3 absorption)
- Equipment: filter/heater/airstone/CO2/LED light — power slider + toggle
- Shop economy: cash, buy fish/plants/equipment
- Persisted game state via zustand/persist
- Pixel-art aesthetic with AI-generated 16×16 to 64×16 sprites

## User Personas
- Casual aquarium enthusiast — explore, buy fish/plants
- Sim hobbyist — tune water chemistry, manage bioload
- Pixel-art lover — appreciate the retro aesthetic

## What's been implemented (2026-01-13)
- ✅ Complete Phase 1 + 2 + 3 from scratch (codebase was empty)
- ✅ Next.js 16 + Tailwind v4 + Zustand v5 + Phaser 4.1.0 stack
- ✅ Simulation engine with tickSimulation, water chemistry, fish AI, plant photosynthesis
- ✅ Dashboard: TopBar KPIs, Stats panel (water + livestock + equipment), Shop panel, Event Log, Control Bar
- ✅ Phaser MainScene: tank background image, substrate, rocks/driftwood decor, light rays, vignette, glass frame, surface shimmer, plant sway, fish swimming with flipping, dead fish float, bubble particle emitters
- ✅ 22 AI-generated sprites via Gemini Nano Banana Pro (gemini-3-pro-image) with chroma-key magenta backgrounds
- ✅ Persisted store, reset tank, buy/feed/water-change actions
- ✅ Lobby landing page with retro pixel font
- ✅ Backend health + sprite generation endpoints
- ✅ Testing agent: 5/5 backend, 12/12 frontend pass
- ✅ Deployment readiness: PASS

## Backlog / Future
- **P1** Save multi-tank support (currently 1 tank per session)
- **P1** Click on a fish to inspect its name, stats, and history
- **P1** Disease/parasite events (Ich, fin rot) with treatment items
- **P2** Day/night cycle auto-progression
- **P2** Breeding mechanics (livebearer babies for guppies)
- **P2** Decoration shop (more rocks, ornaments, backgrounds)
- **P2** Audio: bubble loop, water ambient, soft chime on events
- **P2** Compete-with-friends shareable tank snapshots (PNG export)
- **P3** Mobile responsive — dashboard collapses to bottom drawer
- **P3** Achievements (first-fish, perfect-water-for-1-hour, etc.)
