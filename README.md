# Frailty Onboarding — Pawl Physiological Age Questionnaire

A 4-part, owner-input frailty questionnaire that estimates a pet's *physiological age* (how old their body is behaving) versus chronological age. No hardware, no vet visit required to start. Single self-contained HTML file — open `index.html` in a browser, no build step.

Deficit-accumulation model adapted from Banzato et al. 2019 (33-item canine Frailty Index) and the Loyal Canine Frailty Index. Wellness instrument, not a diagnostic one — no lifespan or prognosis claims.

## How it works

Two numbers drive everything:

1. **Chronological age** — from date of birth, or guessed from life-stage if unknown.
2. **Observed FI** (Frailty Index) — Σ(scores of answered deficits) ÷ (items answered). Each deficit is scored 0 (absent), 0.5 (mild), or 1 (severe/present).

Observed FI is compared against the **expected FI for that age** (young ≈ 0.08, middle-aged ≈ 0.16, senior ≈ 0.24). A ratio above 1 means aging faster than typical for that life stage; below 1 means slower.

```
physiological_age ≈ chronological_age × (observed_FI ÷ expected_FI_for_age)
```

The result is always shown as a **range**, and the band narrows as more items get answered — more data means a tighter estimate (standard error scales roughly ~1/√n). The four parts exist to feed progressively more deficits into that same formula, recomputing the range each time. Skipped items simply don't count toward the denominator — no penalty for stopping early.

FI zones (wellness-framed, never clinical): **Thriving** (FI < 0.12) · **Steady** (0.12–0.24) · **Needs attention** (0.25–0.4) · **Talk to your vet** (> 0.4, always routes to a vet prompt, never a prognosis).

Species: dog and cat share one shell. Species-specific items (e.g. stairs vs. jumping to a perch) are swapped automatically. Cat outputs carry a wider uncertainty band (feline aging science lags dogs) and use the Cambridge 2017 formula for a human-year equivalent.

## The four sections

### Part 1 — Core (8 items) → initial estimate
Mobility, activity/energy, exhaustion, stiffness/gait, appetite change, coat/grooming, overall vitality (owner gestalt), and body condition score.

**Reveals:** a same-day, cross-system snapshot — deliberately not just "easy" mobility questions, so the early number isn't skewed toward one body system.
**Adds value:** a 90-second payoff — a shareable estimate card that hooks the return-visit loop. Band: ± ~3 years.

### Part 2 — Senses, mind & surface (8 items) → first refinement
Vision, hearing, disorientation/cognition, sleep changes, social withdrawal or clinginess, oral/dental signs, skin lumps, weight trend.

**Reveals:** age-linked deficits that are slower to notice — things owners see day-to-day but don't usually connect to aging (especially early cognitive decline).
**Adds value:** tightens the band to ± ~2 years.

### Part 3 — Internal & systemic signals (9 items) → second refinement
Water intake, urination, continence, digestion, breathing, exercise tolerance, muscle condition, temperature sensitivity, pain signals.

**Reveals:** organ-system aging (kidney, heart, GI, musculoskeletal) — signs owners observe but rarely link to a single underlying cause.
**Adds value:** band tightens to ± ~1.2 years; highest medical relevance, most likely section to surface a "needs attention" flag.

### Part 4 — History & clinical context (8 items) → final refinement
Chronic diagnoses, current medications, recent vet visits, dental history, surgical/injury history, and optional vet-supplied bloodwork/organ findings, plus a free-text owner concern. All clinical items are opt-in — never required, never inferred.

**Reveals:** cumulative deficit burden that owner-observation alone misses — things already caught by a vet.
**Adds value:** final band ± ~0.8 years on the full 33-item FI — most accurate number, but slowest, which is why it's gated behind three rounds of buy-in.

## Status / known simplifications

- `expectedFI()` / `lifeStage()` cutoffs in `index.html` are illustrative, not yet fit to size-stratified life tables (Montoya 2023, Teng 2024). Flagged inline with a `ponytail:` comment — swap in real curves once calibration data exists.
- Reproductive status detail (intact + age, a life-table modifier per the spec) isn't broken out as its own field yet; sex/neuter status is captured at baseline.
- Cat conversion and wider uncertainty bands are implemented but not validated against feline-specific studies — labeled as estimates in the UI.

## Run it

No build step. Either:

```
open index.html
```

or serve locally:

```
python -m http.server 8420
```

then visit `http://localhost:8420/index.html`.

## Sources

Banzato et al. 2019 (*Sci. Rep.*); Loyal Canine Frailty Index; Montoya et al. 2023; Teng et al. 2024; Cambridge 2017; AAHA/AAFP Life-Stage Guidelines.
