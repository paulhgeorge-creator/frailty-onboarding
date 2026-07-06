# Frailty Onboarding — Pawl Physiological Age Questionnaire

A 4-part, owner-input frailty questionnaire that estimates a pet's *physiological age* (how old their body is behaving) versus chronological age. No hardware, no vet visit required to start. Single self-contained HTML file — open `index.html` in a browser, no build step.

Deficit-accumulation model adapted from Banzato et al. 2019 (33-item canine Frailty Index) and the Loyal Canine Frailty Index. Wellness instrument, not a diagnostic one — no lifespan or prognosis claims.

## How it works

Two numbers drive everything:

1. **Chronological age** — from date of birth, or guessed from life-stage if unknown.
2. **Observed FI** (Frailty Index) — Σ(scores of answered deficits) ÷ (items answered). Each deficit is scored 0 (absent), 0.5 (mild), or 1 (severe/present).

Observed FI is compared against the **expected FI for that age** — a continuous curve anchored at young ≈ 0.08, middle-aged ≈ 0.16, senior ≈ 0.24, interpolated by age-as-a-fraction-of-life-stage (no discontinuity at bracket edges). A brachycephalic-breed modifier raises the expected-FI baseline for breeds with breed-typical breathing/skin-fold traits (bulldogs, pugs, etc.), so those findings don't inflate the score the way a new deficit would elsewhere. Size-adjusted aging (giant breeds age on a compressed timeline) falls out of the same size-based senior-onset cutoffs already used for life-stage bucketing.

```
physiological_age = chronological_age + β × (observed_FI − expected_FI_for_age)
```

clamped so no estimate can swing more than a defined max years below/above chronological age, and floored at a small positive number. This additive form replaced an earlier multiplicative formula that could send a healthy senior's estimate collapsing toward a very young age. `β`, the clamp, and the breed modifier all live as named placeholder constants in `frailty-model.js`'s `FRAILTY_MODEL_CONFIG` — flagged with a `ponytail:` comment as interim, pending real calibration (see Sources note below).

The result is always shown as a **range**, and the band narrows as more items get answered — more data means a tighter estimate (standard error scales roughly ~1/√n). The four parts exist to feed progressively more deficits into that same formula, recomputing the range each time. Skipped items simply don't count toward the denominator — no penalty for stopping early. Every result also shows a life-stage label (based on chronological age), a plain-language explanation line, and a qualitative "aging slower/typical/faster" comparison to chronological age — no bare point-value age is ever shown.

FI zones (wellness-framed, never clinical): **Thriving** (FI < 0.12) · **Steady** (0.12–0.24) · **Needs attention** (0.25–0.4) · **Talk to your vet** (> 0.4, always routes to a vet prompt, never a prognosis).

Species: dog and cat share one shell. Species-specific items (e.g. stairs vs. jumping to a perch) are swapped automatically. Cat outputs carry a wider uncertainty band (feline aging science lags dogs) and use the Cambridge 2017 formula for a human-year equivalent.

## The four sections

### Part 1 — Core (8 items) → initial estimate
Mobility, activity/energy, exhaustion, stiffness/gait, appetite change, coat/grooming, overall vitality (owner gestalt), and body condition score. Activity is asked as a countable daily-minutes figure (system judges adequacy against species/breed/size thresholds, not the owner's own sense of "normal") and stiffness is asked as an objective yes/no-ish observation ("needs a moment to get up after resting") — both replace earlier "...than usual" comparative wording that let owners under- or over-report based on their own baseline assumptions. Other comparative items (exhaustion, coat, later social withdrawal, temperature sensitivity) were left as-is — no good countable substitute exists without disproportionate added friction.

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

- The interim scoring model (`estimatePhysiologicalAge`, `expectedFIContinuous`, `FRAILTY_MODEL_CONFIG` in `frailty-model.js` — `BETA`, `MAX_DELTA_YEARS`, `BRACHY_BREED_FI_MODIFIER`, `ACTIVITY_MINUTES_TABLE`) is illustrative, not yet fit to size/breed-stratified life tables. Flagged inline with `ponytail:` comments — swap in real curves once calibration data exists; the model is isolated in one function/config block for exactly this reason.
- **Citation note:** this README (and the original code comments) cited "Teng et al. 2024" for the calibration source; a later product-review pass referenced "McMillan et al. 2024" for the same claim. Unresolved whether these are the same work under a different lead author or genuinely different sources — flagged here rather than silently picking one.
- Reproductive status detail (intact + age, a life-table modifier per the spec) isn't broken out as its own field yet; sex/neuter status is captured at baseline.
- Cat conversion and wider uncertainty bands are implemented but not validated against feline-specific studies — labeled as estimates in the UI.
- The brachycephalic-breed list and activity-minutes thresholds are substring/lookup-matched against free-text breed input and illustrative size-class thresholds — not a structured breed database.

## Testing

Pure scoring logic lives in `frailty-model.js` (no DOM dependency), tested with a zero-dependency Node script:

```
node test/frailty-model.test.js
```

Covers named fixtures: a bulldog with breed-typical findings (should not read prematurely old), a dachshund whose low activity is objectively surfaced by the minutes question, a genuinely-declining great dane (proves the fix isn't one-directional), healthy senior dogs/cat (should not collapse toward a young estimate), a young unhealthy dog (exercises the delta clamp), and an unknown-DOB pet (confirms the age-guess fallback still works).

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
