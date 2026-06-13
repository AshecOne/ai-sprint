# Aquarium Simulator — Referenced Simulation Equations

All equations listed here are intended for direct implementation in the simulation engine. Each section maps to a parameter from `TASK_PLAN.md`.

---

## 1. Nitrogen Cycle

### 1.1 Nitrification Reactions (stoichiometric)

**Step 1 — Ammonia oxidation** (genus *Nitrosomonas*):

```
NH₄⁺ + 1.5 O₂  →  NO₂⁻ + 2H⁺ + H₂O
```

**Step 2 — Nitrite oxidation** (genus *Nitrobacter* / *Nitrospira*):

```
NO₂⁻ + 0.5 O₂  →  NO₃⁻
```

**Combined net reaction:**

```
NH₄⁺ + 2 O₂  →  NO₃⁻ + 2H⁺ + H₂O
```

> Reference: Hagopian, D.S. & Riley, J.G. (1998). A closer look at the bacteriology of nitrification. *Aquacultural Engineering*, 18(4), 223–244.

---

### 1.2 Ammonia Production per Fish (per tick)

```
NH₃_produced = Σᵢ (Bᵢ × Fᵢ × Q10ᵢ)
```

| Symbol | Meaning |
|---|---|
| `Bᵢ` | Bioload coefficient of fish species *i* (mg NH₃ / g body mass / day) |
| `Fᵢ` | Feeding rate multiplier (1.0 = normal, 0 = starving, >1 = overfeeding) |
| `Q10ᵢ` | Temperature correction (see §5.1) |

> Reference: Timmons, M.B. & Ebeling, J.M. (2010). *Recirculating Aquaculture*, 2nd ed. Cayuga Aqua Ventures. Chapter 4.

---

### 1.3 Bacterial Nitrification Rate — Monod Kinetics

The rate at which the bacterial colony converts NH₄⁺ is substrate-limited:

```
μ = μmax × [S] / (Ks + [S])
```

```
r_nitrification = μ × X_bacteria
```

| Symbol | Meaning | Typical Value |
|---|---|---|
| `μmax` | Maximum specific growth rate | 0.76 day⁻¹ (*Nitrosomonas*) |
| `[S]` | Substrate concentration (NH₄⁺ or NO₂⁻), mg/L | — |
| `Ks` | Half-saturation constant | 0.6–1.0 mg/L for NH₄⁺ |
| `X_bacteria` | Active bacterial biomass (scales with filter media surface area) | — |

> Reference: Monod, J. (1949). The growth of bacterial cultures. *Annual Review of Microbiology*, 3, 371–394.
> Reference: Wheaton, F.W. et al. (1994). Nitrification filter design methods. *Aquacultural Engineering*, 13(3), 187–214.

---

### 1.4 Toxic Free Ammonia Fraction

Only un-ionized NH₃ is toxic; the NH₃/NH₄⁺ ratio depends on pH and temperature:

```
f(NH₃) = 1 / (1 + 10^(pKa − pH))
```

Temperature-dependent pKa (T in Kelvin):

```
pKa(T) = 0.09018 + 2729.92 / T
```

**Example:** at pH 7.0 and 25 °C → pKa ≈ 9.25 → f(NH₃) ≈ 0.56 % of total ammonia is toxic.

> Reference: Emerson, K. et al. (1975). Aqueous ammonia equilibrium calculations: effect of pH and temperature. *Journal of the Fisheries Research Board of Canada*, 32(12), 2379–2383.

---

## 2. Dissolved Oxygen (DO)

### 2.1 Oxygen Saturation vs. Temperature

Approximate DO saturation at 1 atm (freshwater):

```
DO_sat = 468 / (31.6 + T_°C)         [mg/L, rough approximation]
```

More precise empirical formula (Benson–Krause):

```
ln(DO_sat) = −139.34411
             + 1.575701×10⁵ / T
             − 6.642308×10⁷ / T²
             + 1.2438×10¹⁰ / T³
             − 8.621949×10¹¹ / T⁴
```

where T is in Kelvin.

> Reference: Benson, B.B. & Krause, D. (1984). The concentration and isotopic fractionation of oxygen dissolved in freshwater and seawater in equilibrium with the atmosphere. *Limnology and Oceanography*, 29(3), 620–632.

---

### 2.2 Surface Gas Transfer (reaeration)

```
dDO/dt = KLa × (DO_sat − DO_current) − OUR
```

| Symbol | Meaning |
|---|---|
| `KLa` | Overall volumetric mass transfer coefficient (hr⁻¹); increases with surface agitation from powerheads/air stones |
| `DO_sat` | Saturation value from §2.1 |
| `OUR` | Oxygen uptake rate (total consumption by fish + bacteria), mg/L/hr |

> Reference: Metcalf & Eddy (2003). *Wastewater Engineering: Treatment and Resource Recovery*, 4th ed. McGraw-Hill. Chapter 5.

---

### 2.3 Fish Oxygen Consumption — Allometric Scaling

```
VO₂ᵢ = a × Mᵢ^b × Q10ᵢ      [mgO₂ / hr per fish]
```

| Symbol | Meaning | Typical Value |
|---|---|---|
| `Mᵢ` | Body mass of fish *i* in grams | — |
| `a` | Species intercept coefficient | ~0.2–0.5 |
| `b` | Allometric exponent | 0.7–0.8 (less than 1: larger fish are more efficient per gram) |
| `Q10ᵢ` | Temperature correction (§5.1) | — |

> Reference: Clarke, A. & Johnston, N.M. (1999). Scaling of metabolic rate with body mass and temperature in teleost fish. *Journal of Animal Ecology*, 68(5), 893–905.

---

## 3. pH and CO₂ / Carbonate System

### 3.1 Carbonate Equilibrium

```
CO₂(g) ⇌ CO₂(aq)
CO₂(aq) + H₂O ⇌ H₂CO₃  (pKa₀ ≈ 1.5)
H₂CO₃ ⇌ H⁺ + HCO₃⁻    (pKa₁ = 6.35 at 25 °C)
HCO₃⁻ ⇌ H⁺ + CO₃²⁻    (pKa₂ = 10.33 at 25 °C)
```

> Reference: Stumm, W. & Morgan, J.J. (1996). *Aquatic Chemistry*, 3rd ed. Wiley-Interscience. Chapter 4.

---

### 3.2 pH from KH and CO₂ — Aquarium Approximation

The practical aquarium formula (valid at pH 6–8, ignoring carbonate):

```
pH = log( (KH_dKH × 17.86) / CO₂_ppm )
```

Equivalently, to find CO₂ from measured pH and KH:

```
CO₂_ppm = 3.0 × KH_dKH × 10^(7 − pH)
```

> Reference: Walstad, D. (1999). *Ecology of the Planted Aquarium*. Echinodorus Publishing. Appendix.
> Derived from Henderson–Hasselbalch with pKa₁ = 6.35 and unit conversion for dKH.

---

### 3.3 Henderson–Hasselbalch (general)

```
pH = pKa₁ + log( [HCO₃⁻] / [CO₂(aq)] )
```

pKa₁ temperature correction:

```
pKa₁(T) = 6.352 − 0.00328 × (T_°C − 25)
```

> Reference: Plummer, L.N. & Busenberg, E. (1982). The solubilities of calcite, aragonite, and vaterite in CO₂–H₂O solutions between 0 and 90°C. *Geochimica et Cosmochimica Acta*, 46(6), 1011–1040.

---

### 3.4 KH as pH Buffer (Alkalinity)

The buffering capacity (β) resists pH change per unit of acid/base added:

```
β = 2.303 × ( Kw/[H⁺] + [H⁺] + Ka₁×[CO₂]×[H⁺] / (Ka₁ + [H⁺])² )
```

Simplified game rule: **higher KH → slower pH drift per tick**. Use a linear approximation:

```
ΔpH_per_tick = ΔAcid_load / (β_base × KH_dKH)
```

> Reference: Stumm & Morgan (1996), ibid., §3.6.

---

## 4. Plant Photosynthesis and Respiration

### 4.1 Gross Photosynthesis (Steele's Model — light saturation)

```
P(I) = Pmax × (I / Iopt) × exp(1 − I / Iopt)
```

| Symbol | Meaning |
|---|---|
| `P(I)` | O₂ production rate at light intensity I (mg O₂ / g plant / hr) |
| `Pmax` | Maximum photosynthetic rate |
| `I` | Current light intensity (µmol photons / m² / s, PAR) |
| `Iopt` | Optimal light intensity for the species |

> Reference: Steele, J.H. (1962). Environmental control of photosynthesis in the sea. *Limnology and Oceanography*, 7(2), 137–150.

---

### 4.2 Net O₂ Balance of Plants

```
NetO₂ = P(I) − R_dark
```

| Symbol | Meaning |
|---|---|
| `P(I)` | Gross photosynthesis (§4.1); 0 when lights are off |
| `R_dark` | Dark respiration rate ≈ 0.1–0.2 × Pmax (continuous) |

---

### 4.3 CO₂ and NO₃ Consumption by Plants

From photosynthesis stoichiometry:

```
6 CO₂ + 6 H₂O  →  C₆H₁₂O₆ + 6 O₂
```

For every 1 mg O₂ produced: ~1.375 mg CO₂ consumed (mass ratio: 44/32).

Nitrogen uptake proportional to biomass growth:

```
NO₃_consumed_per_tick = growth_rate × N_content_fraction
```

where `N_content_fraction` ≈ 2–3 % of dry plant mass.

> Reference: Redfield, A.C. (1958). The biological control of chemical factors in the environment. *American Scientist*, 46(3), 205–221.

---

## 5. Temperature Effects

### 5.1 Q10 Temperature Coefficient

Metabolic rates roughly double per 10 °C rise:

```
R(T₂) = R(T₁) × Q10^((T₂ − T₁) / 10)
```

| Organism | Q10 |
|---|---|
| Tropical fish (resting) | 2.0–2.5 |
| Goldfish | 2.3 |
| Nitrifying bacteria | 2.0–3.0 |
| Plant respiration | 2.0 |

> Reference: Schmidt-Nielsen, K. (1997). *Animal Physiology: Adaptation and Environment*, 5th ed. Cambridge University Press. Chapter 12.

---

### 5.2 Heater Power Required

```
P_watts = ΔT × V_liters × 0.163
```

where ΔT = T_target − T_ambient (°C) and 0.163 is an empirical constant for average heat loss in a glass aquarium.

> Reference: Riehl, R. & Baensch, H.A. (1996). *Aquarium Atlas*, Vol. 1. Mergus. p. 1160.

---

## 6. Turbidity

### 6.1 TSS → NTU Approximation

```
NTU ≈ k × TSS_mg_L
```

k ≈ 2–3 for typical aquarium particulates (feces, uneaten food, detritus).

TSS accumulation per tick:

```
ΔTSS = Σ(waste_production_per_fish) − (filter_removal_rate × TSS_current)
```

> Reference: APHA, AWWA, WEF (2017). *Standard Methods for the Examination of Water and Wastewater*, 23rd ed. Method 2130B (turbidity) and 2540D (TSS).

---

## 7. Stocking Density / Bioload

### 7.1 Tank Bioload Capacity

A common scientific guideline for maximum stocking:

```
Max_biomass_g = (DO_production_rate_mg_per_hr) / (specific_O₂_demand_mg_per_g_per_hr)
```

Practical approximation:

```
Bioload_total = Σᵢ (Massᵢ_g × bioload_coeffᵢ)  ≤  V_liters × capacity_factor
```

where `capacity_factor` scales with filtration tier (no filter ≈ 0.1; canister filter ≈ 0.5–1.0 g/L).

> Reference: Timmons & Ebeling (2010), ibid., Chapter 6.

---

## 8. Fish Stress Model

### 8.1 Cumulative Stress Accumulation

Each fish accumulates stress when any parameter falls outside its tolerance range:

```
dStress/dt = Σₚ wₚ × max(0, |Pₚ − P_optimal_p| − tolerance_p) / tolerance_p
```

| Symbol | Meaning |
|---|---|
| `Pₚ` | Current value of parameter *p* (pH, T, DO, NH₃, …) |
| `P_optimal_p` | Species optimum for parameter *p* |
| `tolerance_p` | Half-width of the safe range |
| `wₚ` | Severity weight of parameter *p* (NH₃ and DO have highest weights) |

When `Stress ≥ 1.0` (normalized), the fish enters dying state. Death occurs after a configurable delay.

> Reference: Barton, B.A. (2002). Stress in fishes: a diversity of responses with particular reference to changes in circulating corticosteroids. *Integrative and Comparative Biology*, 42(3), 517–525.

---

## 9. Nitrogen Cycle Bacterial Colony Dynamics

### 9.1 Bacterial Biomass Growth

```
dX/dt = μ(S) × X − b × X
```

| Symbol | Meaning | Typical Value |
|---|---|---|
| `X` | Bacterial biomass (proportional to colony size) | — |
| `μ(S)` | Monod growth rate (§1.3) | — |
| `b` | Endogenous decay rate | 0.05–0.15 day⁻¹ |

Colony grows on filter media surface area; `X_max` scales with filter tier.

> Reference: Rittmann, B.E. & McCarty, P.L. (2001). *Environmental Biotechnology: Principles and Applications*. McGraw-Hill. Chapter 3.

---

## Summary Table — Equations by Parameter

| Parameter | Key Equation | Section |
|---|---|---|
| NH₃ production | `NH₃ = Σ Bᵢ × Fᵢ × Q10` | §1.2 |
| Nitrification rate | Monod kinetics `μ = μmax × [S] / (Ks + [S])` | §1.3 |
| Toxic NH₃ fraction | `f = 1 / (1 + 10^(pKa − pH))` | §1.4 |
| DO saturation | Benson–Krause empirical | §2.1 |
| DO dynamics | `dDO/dt = KLa(DO_sat − DO) − OUR` | §2.2 |
| Fish O₂ demand | `VO₂ = a × M^b × Q10` | §2.3 |
| pH from KH & CO₂ | `CO₂ = 3 × KH × 10^(7 − pH)` | §3.2 |
| pH buffering | Henderson–Hasselbalch + β | §3.3–3.4 |
| Plant O₂ output | Steele photosynthesis model | §4.1 |
| Temperature scaling | Q10 rule | §5.1 |
| Turbidity | `NTU ≈ k × TSS` | §6.1 |
| Bioload limit | Volume × capacity factor | §7.1 |
| Fish stress | Weighted parameter deviation | §8.1 |
| Bacterial colony | Monod + decay ODE | §9.1 |
