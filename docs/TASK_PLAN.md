# Aquarium Simulator — Task Plan

A browser-based aquarium management game where the **core mechanic is ecosystem collapse**. Players balance a living ecosystem across one or more tanks, monitoring scientific parameters and deploying technology to prevent collapse — inspired by the city-builder genre (TheoTown, Cities: Skylines).

---

## Scientific Parameters to Simulate

> Note: "SO2" in the brief likely refers to **dissolved O₂** (oxygen). SO₂ is sulfur dioxide and not an aquarium metric.

| Parameter | Abbrev | Healthy Range (freshwater) | Key Interactions |
|---|---|---|---|
| Dissolved Oxygen | DO / O₂ | 6–9 mg/L | Plants produce it, fish consume it |
| pH | pH | 6.5–7.5 | Fish waste drops it; KH buffers it |
| Ammonia | NH₃ | 0–0.25 ppm | Fish waste source; toxic spike = collapse |
| Nitrite | NO₂⁻ | 0–0.5 ppm | Intermediate in nitrogen cycle |
| Nitrate | NO₃⁻ | 0–20 ppm | End product; removed by plants |
| CO₂ | CO₂ | 10–30 ppm | Plants consume it; excess acidifies water |
| Temperature | °C | species-dependent | Affects metabolism and O₂ solubility |
| Carbonate Hardness | KH | 4–8 dKH | Stabilizes pH (buffering capacity) |
| General Hardness | GH | 4–12 dGH | Ion balance for fish and plants |
| Turbidity | NTU | < 5 NTU | Rises with overstocking / poor filtration |

---

## Phase 1 — Project Foundation

### 1.1 Tech Stack Decision
- [ ] Choose rendering approach: **2D canvas** (Pixi.js / Konva) or DOM-based SVG for the front-facing tank view
- [ ] Choose simulation layer: pure TypeScript state machine (recommended) or a physics/ECS library
- [ ] Choose UI framework: React (dashboard + menus) + canvas (tank view) is the natural split
- [ ] Choose state management: Zustand or Redux for global game state
- [ ] Decide persistence: localStorage for single-player save, or a backend (Supabase / Firebase) for multi-save / cloud sync

### 1.2 Project Setup
- [ ] Scaffold project (Vite + React + TypeScript)
- [ ] Set up ESLint, Prettier, and path aliases
- [ ] Set up a game loop tick system (requestAnimationFrame + simulation tick at configurable speed)
- [ ] Define folder structure: `/simulation`, `/renderer`, `/ui`, `/data`, `/store`

### 1.3 Core Data Models
- [ ] `Aquarium` — dimensions, equipment slots, inhabitants list, current water parameters
- [ ] `Fish` — species, size, bioload, O₂ consumption rate, NH₃ production rate, temperature/pH tolerance range
- [ ] `Plant` — species, O₂ production rate, CO₂ consumption rate, NO₃ consumption rate, lighting requirement
- [ ] `Equipment` — type (filter, heater, CO₂ injector, UV sterilizer, skimmer, etc.), effect on parameters
- [ ] `WaterParameters` — snapshot of all tracked values at a given tick
- [ ] `Alert` — triggered when a parameter exits safe range, with severity level

---

## Phase 2 — Ecosystem Simulation Engine

### 2.1 Nitrogen Cycle
- [ ] Model ammonia production: each fish emits NH₃ proportional to its bioload and feeding rate
- [ ] Model nitrification: beneficial bacteria (established over time) convert NH₃ → NO₂⁻ → NO₃⁻
- [ ] Model bacterial colony growth: colony grows with surface area of filter media, dies if tank is nuked (bleached/reset)
- [ ] New tank warning: "cycling" period where ammonia spikes are expected and dangerous

### 2.2 Oxygen & CO₂ Balance
- [ ] Plants produce O₂ during light hours, consume O₂ at night (respiration)
- [ ] Fish consume O₂ at a rate scaled by temperature (higher temp = faster metabolism = more O₂ used)
- [ ] CO₂ injectors raise CO₂; excess CO₂ drops pH
- [ ] Surface agitation (powerheads, air stones) degasses CO₂ and raises DO

### 2.3 pH & Buffering
- [ ] pH drifts down as NH₃/CO₂ accumulates
- [ ] KH (carbonate hardness) resists pH swings — low KH = pH crash risk
- [ ] Certain substrates (crushed coral) raise KH over time

### 2.4 Temperature Dynamics
- [ ] Tank temperature drifts toward ambient room temperature each tick
- [ ] Heater maintains setpoint; heater failure = temperature drift
- [ ] Temperature affects O₂ solubility and fish metabolism

### 2.5 Collapse Triggers
- [ ] Define collapse cascade: NH₃ spike → fish stress → fish die → more NH₃ → full collapse
- [ ] Define soft warnings (yellow), danger zones (orange), and collapse threshold (red) per parameter
- [ ] Fish have individual stress meters that fill when parameters are out of tolerance
- [ ] Death events ripple: dead fish raise NH₃ and turbidity

### 2.6 Simulation Tick
- [ ] Run simulation at configurable speed (1×, 5×, 60× real time)
- [ ] Each tick: recalculate all parameters based on inhabitants + equipment + previous state
- [ ] Log parameter history for graphing (rolling window, e.g. last 30 in-game days)

---

## Phase 3 — Front-Facing Aquarium View

### 3.1 Tank Renderer
- [ ] Draw tank glass frame with configurable dimensions
- [ ] Render substrate layer (gravel, sand, bare bottom)
- [ ] Render background (solid color, gradient, or image)
- [ ] Water tint shifts with turbidity (clearer = more transparent; murky = brownish/green)

### 3.2 Plant Rendering
- [ ] Place plants at defined substrate positions
- [ ] Gentle sway animation (CSS or canvas keyframes)
- [ ] Plant health visually degrades (yellowing, melting leaves) when parameters are poor

### 3.3 Fish Rendering & Behavior
- [ ] Fish sprites swim along randomized paths within the tank bounds
- [ ] Fish speed scales with health/stress level (stressed fish: erratic or gasping at surface)
- [ ] Fish avoid glass edges and each other (basic separation steering)
- [ ] Dead fish float to surface with a visual indicator

### 3.4 Equipment Visuals
- [ ] Render placed equipment in tank: filter intake/output, heater, CO₂ diffuser, air stone, etc.
- [ ] Bubble particle effects for air stones and CO₂ diffusers
- [ ] Filter flow indicator

---

## Phase 4 — Monitoring Dashboard

### 4.1 Parameter Gauges
- [ ] Real-time gauge for each tracked parameter (radial or bar style)
- [ ] Color-coded zones: green (safe), yellow (warning), red (danger)
- [ ] Tooltip on each gauge explaining what the parameter means and how to fix it

### 4.2 Time-Series Graphs
- [ ] Line chart per parameter showing history over the last N in-game days
- [ ] Zoom/pan on graph
- [ ] Overlay events (fish added, equipment installed, water change) as markers on the timeline

### 4.3 Alert System
- [ ] Alert feed showing active warnings sorted by severity
- [ ] Each alert links to the affected parameter and suggests a corrective action
- [ ] Push notification / in-game popup for collapse-risk events

### 4.4 Inhabitant Summary
- [ ] List of all fish and plants with individual health bars and stress indicators
- [ ] Compatibility warnings (species that shouldn't coexist — pH mismatch, predator/prey, etc.)
- [ ] Bioload meter: total stocking level vs. tank capacity

---

## Phase 5 — Game Mechanics

### 5.1 Add Fish
- [ ] Fish catalog with species data (scientific name, care level, size, bioload, temp/pH range, diet, compatibility tags)
- [ ] Include at least: guppies, neon tetras, betta, goldfish, corydoras, angelfish, discus (different difficulty tiers)
- [ ] Purchase flow: select species → confirm parameters are compatible → fish appears in tank
- [ ] Quarantine mechanic option (advanced): new fish can introduce disease

### 5.2 Add Plants
- [ ] Plant catalog: java fern, anubias, amazon sword, java moss, vallisneria, carpeting plants
- [ ] Each plant has lighting and CO₂ requirements; mismatch = poor growth
- [ ] Plants improve water quality over time (NO₃ sink, O₂ source)
- [ ] Overgrown plants can block light to lower-level plants

### 5.3 Aquarium Equipment & Technology
- [ ] **Mechanical filtration** — removes particulates, lowers turbidity
- [ ] **Biological filtration** — filter media surface area drives nitrification; upgrades speed up cycling
- [ ] **Chemical filtration** — activated carbon removes toxins temporarily
- [ ] **Heater** — maintains temperature; wattage must match tank volume
- [ ] **CO₂ injector** — boosts plant growth; risk: overdose drops pH
- [ ] **Air stone / powerhead** — raises DO and degasses CO₂
- [ ] **UV sterilizer** — reduces algae and pathogens
- [ ] **Protein skimmer** — saltwater option; reduces organic load
- [ ] **Dosing pump** — automates fertilizer / KH buffer addition
- [ ] **Auto water changer** — slowly dilutes NO₃ build-up passively

### 5.4 Upgrade Aquarium
- [ ] Tank size upgrades (increase volume → more bioload capacity, more stable parameters)
- [ ] Equipment slot upgrades (larger tanks support higher-wattage / multi-unit setups)
- [ ] Substrate upgrades (inert gravel → nutrient-rich soil → plant-specific substrate)
- [ ] Lighting upgrades: standard bulb → LED → high-output LED (enables demanding plants)
- [ ] Lid / canopy upgrades (reduce evaporation, reduce temperature swings)

### 5.5 Create New Aquarium
- [ ] Players can manage multiple tanks simultaneously
- [ ] Each tank has independent parameters, inhabitants, and equipment
- [ ] Tank overview screen: thumbnail of each tank + key parameter status at a glance
- [ ] Resource cost to set up a new tank (currency / time gate)

### 5.6 Manual Interventions
- [ ] **Water change**: player-triggered, dilutes NH₃/NO₂/NO₃, resets turbidity partially
- [ ] **Feed fish**: affects NH₃ production; overfeeding = parameter spike
- [ ] **Dose chemicals**: pH up/down, KH buffer, ammonia detox (emergency use)
- [ ] **Scrape algae**: aesthetic + mild water quality improvement
- [ ] **Remove dead fish**: prevents further NH₃ spike

---

## Phase 6 — Progression & Game Loop

### 6.1 Currency & Resources
- [ ] Single in-game currency (e.g., "credits") earned by maintaining a healthy ecosystem over time
- [ ] Bonus credits for hitting ecosystem stability milestones
- [ ] All fish, plants, and equipment cost currency

### 6.2 Unlock / Progression System
- [ ] Start with a small beginner tank and hardy species (guppies, java fern)
- [ ] Unlock more demanding species as player demonstrates stability
- [ ] Unlock equipment tiers as player progresses
- [ ] Difficulty tiers: Freshwater Beginner → Freshwater Advanced → Brackish → Marine (reef)

### 6.3 Events & Random Challenges
- [ ] Random events: equipment failure, algae bloom, fish disease outbreak, sudden temperature spike
- [ ] Seasonal ambient temperature change (affects heater demand)
- [ ] Power outage event (filter stops → NH₃ climbs; aeration stops → O₂ drops)

### 6.4 Win / Loss Conditions
- [ ] No hard "game over" — instead, a collapsing tank loses inhabitants and costs currency to recover
- [ ] Achievement system for milestones: "stable reef for 30 days", "100 fish housed simultaneously", etc.
- [ ] Optional: "challenge mode" with a pre-broken tank the player must recover

---

## Phase 7 — Polish & Science Validation

- [ ] Review all simulation formulas against peer-reviewed aquarium chemistry sources
- [ ] Add in-game "info" tooltips explaining the science behind each mechanic
- [ ] Balance pass: tune decay rates and recovery rates so the game feels tense but not punishing
- [ ] Accessibility: colorblind-safe palette for gauge color coding
- [ ] Mobile-responsive layout (dashboard stacks below tank view on narrow screens)
- [ ] Save/load game state

---

## Milestone Summary

| Milestone | Deliverable |
|---|---|
| M1 | Project scaffolded; core data models defined; game loop running |
| M2 | Simulation engine: nitrogen cycle + O₂/CO₂ + collapse triggers |
| M3 | Front-facing tank renderer with fish and plant visuals |
| M4 | Monitoring dashboard with live gauges and alerts |
| M5 | Full feature set: add fish/plants, equipment, upgrades, multiple tanks |
| M6 | Progression system, events, and balance pass |
| M7 | Science review, polish, and save/load |
