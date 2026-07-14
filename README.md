# Frailty Onboarding - Pawl Physiological Age Questionnaire

A 4-part, owner-input frailty questionnaire that estimates a pet's *physiological age* (how old their body is behaving) versus chronological age. No hardware, no vet visit required to start. Single self-contained HTML file - open `index.html` in a browser, no build step. A separate optional Flask service (`age-service/`) backs photo-based age estimation - see below; the questionnaire works fully without it.

Deficit-accumulation model adapted from Banzato et al. 2019 (33-item canine Frailty Index) and the Loyal Canine Frailty Index. Wellness instrument, not a diagnostic one - no lifespan or prognosis claims.

## How it works

Two numbers drive everything:

1. **Chronological age** - a single fused value, never a life-stage category. See "Onboarding flow & age fusion" below.
2. **Observed FI** (Frailty Index) - Σ(scores of answered deficits) ÷ (items answered). Each deficit is scored 0 (absent), 0.5 (mild), or 1 (severe/present).

Observed FI is compared against the **expected FI for that age** - a continuous curve anchored at young ≈ 0.08, middle-aged ≈ 0.11, senior ≈ 0.23 (Banzato et al. 2019's actual reported mean FI by age band - young 2-6y, middle 7-10y, old 10+y - not placeholder guesses), interpolated by age-as-a-fraction-of-life-stage (no discontinuity at bracket edges). Banzato also reports an approximately linear FI-vs-age relationship across their sample, which is why piecewise-linear interpolation between anchors is a literature-consistent shape rather than an invented curve.

A brachycephalic-breed modifier raises the expected-FI baseline for breeds with breed-typical breathing/skin-fold traits (bulldogs, pugs, etc.), and a separate chondrodystrophic-breed modifier does the same for breeds with FGF4-driven early spinal-disc degeneration (dachshunds, corgis, basset hounds), so those findings don't inflate the score the way a new deficit would elsewhere. Breeds in both lists (Shih Tzu, Pekingese) take the larger of the two modifiers, not the sum. Size-adjusted aging (giant breeds age on a compressed timeline) falls out of the same size-based senior-onset cutoffs already used for life-stage bucketing - now set to real benchmarks (small 11 / medium 9 / large 7.5 / giant 5.5 yr, midpoints of small 10-12 / medium 8-10 / large 7-8 / giant 5-6). The direction of that size ordering is also backed by the fact that larger dogs lose roughly one month of lifespan per 2kg of body mass - cited as qualitative support only, since that's a lifespan-shortening rate, not a senior-onset-age rate, and turning it into a formula would be false precision. The same size-based lookup (`seniorGuessAge`) now also drives the "looks senior, DOB unknown" age guess, replacing an earlier flat 8-year guess that ignored size/species entirely.

Cats get no independently-calibrated FI-age curve - no quantitative feline FI-by-age literature exists yet (current feline frailty research is phenotype/qualitative, not a numeric index). Rather than assume the dog-derived anchors transfer 1:1, cat deltas are dampened toward "typical" (`CAT_DELTA_DAMPENING`) as an honest lower-confidence stand-in for real feline calibration data.

```
physiological_age = chronological_age + β × (observed_FI − expected_FI_for_age)
```

clamped so no estimate can swing more than a defined max years below/above chronological age, and floored at a small positive number. This additive form replaced an earlier multiplicative formula that could send a healthy senior's estimate collapsing toward a very young age. `β`, the clamp, both breed modifiers, and the cat dampening factor all live as named placeholder constants in `frailty-model.js`'s `FRAILTY_MODEL_CONFIG` - flagged with a `ponytail:` comment as interim, pending real calibration data (see Sources note below); the FI anchors and senior-onset ages are the parts of this pass with an actual literature source behind the numbers.

The headline result is a **single figure, no range shown** (a later product-direction change from an earlier range-plus-headline display - the underlying `low`/`high` band is still computed internally and narrows as more items get answered, just not displayed). The four parts exist to feed progressively more deficits into that same formula, recomputing the estimate each time. Skipped items simply don't count toward the denominator - no penalty for stopping early. The aging-pace comparison ("aging slower/typical/faster") is expressed as a **percentage of chronological age** (`deltaPercentOfAge` - e.g. "aging about 15% faster than typical"), shown as a caption on the Health Score card (see "Result page" below), not as a separate competing metric.

FI zones (wellness-framed, never clinical): **Thriving** (FI < 0.12) · **Steady** (0.12–0.24) · **Needs attention** (0.25–0.4) · **Talk to your vet** (> 0.4, always routes to a vet prompt, never a prognosis).

Species: dog and cat share one shell. Species-specific items (e.g. stairs vs. jumping to a perch) are swapped automatically. Cat outputs carry a wider uncertainty band (feline aging science lags dogs) and use the Cambridge 2017 formula (`human_years ≈ 4.14 × cat_age + 15`) for a human-year equivalent; dogs now get the same treatment via the Wang et al. 2020 formula (`human_years ≈ 16 × ln(dog_age) + 31`) - previously only cats had a human-year figure.

## Onboarding flow & age fusion

Baseline is now a provided embeddable widget ("Pet Vitals Survey", `PV_WIDGET_HTML`/`initPetVitalsWidget()` in `index.html`), kept intact byte-for-byte (2 approved text-only fixes: em dash and curly quotes, to match the project's house style) - its own scoped `.pv-root` CSS, its own SVG illustrations, its own toy "vitality score" ring all work exactly as given. `wirePetVitalsToState()` is a fully separate, additive layer of listeners on the same elements that feeds the *real* app state (species/name/breed/weight/age) alongside the widget's own untouched handlers - it never reads from or modifies the widget's internal variables.

**Capability trade-offs from this swap** (the widget doesn't have equivalent inputs, so these no longer have a UI path from baseline - flagging per your own "tell me and we'll find a workaround" instruction, not silently dropped):
- **Photo-based age estimation** - `age-estimator.js`/`age-service/` still exist and still work (tested, running), just currently unreachable from any UI. No photo upload field in the widget.
- **Exact date of birth** - the widget's single "Age (yrs)" field is wired as the same low-confidence years-only signal the old "I don't know the exact date" path used (`b.dobKnown = false; b.yearsOnlyAge = ...`), not a real DOB. Age confidence for every pet is now capped at 0.5 instead of ever reaching 1.0 from baseline.
- **Weight units** - both lbs and kg, via a small toggle added under the weight field (defaults to lbs). `setWeightUnit()` (`index.html`) converts the currently-typed number too when the toggle is clicked, not just the label, so switching units updates what's displayed instead of silently relabeling a now-wrong figure. `weightKg()` converts via the same `KG_PER_LB` constant either way for every downstream size/BCS/activity calculation - this toggle is a genuinely new interactive element in the baseline widget block, not a text-only tweak (see the byte-identical note above), added because it was explicitly requested.
- **Sex/neuter status** - no field for it in the widget; was informational-only before (not part of the FI denominator), so this is a data-capture loss, not a scoring one.
- **New**: daily activity level (low/moderate/high) prefills Part 1's activity-minutes question so it isn't asked twice. Its segmented buttons carry a hover `title` explaining what that level looks like - species-specific, not both species in one tooltip: each button holds a `data-title-dog`/`data-title-cat` pair, and `wirePetVitalsToState()` swaps the live `title` to match whichever species is selected (defaults to dog until the owner picks Cat). The three buttons are forced onto one row (`flex-wrap:nowrap`, tighter per-button padding, the field spanning the full grid width) instead of wrapping to a second line once the paw-print icons were added. Sleep hours are captured (`state.baseline.sleepHours`) but not yet used by any scoring or personalization logic - no existing FI item covers sleep *duration* (Part 2's `p2_sleep` is about sleep *changes*, a different axis). Health goals (`state.baseline.healthGoals`) are now used by Round 2's `sensesBestMatch()` personalization (see "Result page") and the completion page's food recommendation (see below) - but not by any scoring logic.
- **Age field** is capped at 20 years (`max="20"` plus a JS clamp on input, since the HTML attribute alone doesn't stop free typing) - pets essentially never exceed this, so it guards against a stray typo producing a nonsensical age.
- **Header illustrations** dropped the car SVG between the dog and cat - `headerIllos.innerHTML` now concatenates just `DOG_SVG + CAT_SVG`. The unused `CAR_SVG` variable itself is left defined (removing it would be a bigger structural edit to the "kept intact" widget block than this request asked for); this is now a 3rd approved deviation alongside the em-dash/curly-quote text fixes and the weight-unit toggle above.

Everything below this point (age fusion, photo estimation, BCS, activity thresholds, percentile ranking) is unchanged - only how baseline collects the raw inputs changed, not how they flow through the model.

**`computeFinalAge()`** (in `index.html`) fuses whatever signals are available via `fuseAge()` (in `frailty-model.js`), a confidence-weighted average - never a single model or category deciding alone:

| Signal | Confidence |
|---|---|
| Exact DOB | 1.0 |
| Owner's years-only guess (DOB unknown) | 0.5 |
| Photo-based estimate | the model's own reported confidence (`0` today - see below) |
| Size-based population prior | 0.1 (last-resort floor so fusion is never empty) |

A signal with confidence 0 contributes nothing to the weighted average - this is how "don't rely on image-based estimation alone" is enforced in code, not just in copy.

### Photo-based age estimation

`age-estimator.js` exposes the one pluggable seam, `estimateAgeFromPhoto(file, {species})`, which POSTs to a local Flask service (`age-service/`, default `http://localhost:5001`) and resolves to `{years, confidence, status}` - network errors, timeouts, or the service not running all resolve to `confidence: 0`, never throw, and never block the rest of onboarding.

**The service has no trained model behind it yet, on purpose, not by oversight.** `szmazurek/Age_recognition_Cyfrovet` (the referenced repo) was inspected: it's a TensorFlow *training pipeline*, not a packaged model - no shipped weights, no LICENSE file (real legal risk to copy its code into this project without contacting the author), a 3-bucket age classification (not continuous years), dog-only (no cats), and the author's own README says results are "still not satisfying." A labeled image dataset matching that repo's Young/Adult/Senior folder structure was located separately (Google Drive, ~2022) but its licensing/provenance is unconfirmed (looks Petfinder-scraped) - still a blocker, not yet a green light to train on it. `age-service/README.md` has the full breakdown and the real path to wiring in a trained model later. Until then the service honestly returns `confidence: 0` / `status: "untrained"`, which `fuseAge()` treats as no signal. If a photo is provided, the body-condition chart step is skipped entirely (assumption: a photo could visually substitute for a self-reported BCS; body condition then defaults to "ideal" (5) and doesn't count toward the FI, same as any other skipped item).

### Body condition chart

`BCS_CHART` in `frailty-model.js` is a real 9-point WSAVA/Purina-style body-condition scale (both dog and cat, ideal band at 4–5) with a short description per point. Its own onboarding step (between baseline and Part 1, skipped if a photo was provided) shows the description live as the owner drags a 1–9 slider, alongside a real reference chart image per species (`assets/bcs-chart-dog.png` - Daily Paws/WSAVA; `assets/bcs-chart-cat.webp` - APOP/Bjornvad & Laflamme) with a "View full-size chart" button/click-to-open. The per-BCS-point `imageHook` keys (e.g. `bcs-dog-5`) still exist on each `BCS_CHART` entry as a hook for per-point photos later, but the step currently shows one whole-chart reference image per species rather than nine individual crops.

### Weight-based percentile ranking

`overweightPercentile(species, bcs)` returns a "Top N%" figure anchored on real cited prevalence stats: BCS 8 → 22% (dogs) / 33% (cats) obese; BCS 6 → 59% (dogs) / 61% (cats) overweight-or-obese. BCS 7 and 9 are linearly interpolated/extrapolated between those anchors - flagged in code, not independently sourced. BCS ≤ 5 (ideal or underweight) returns `null`. Surfaced as personalized copy in the result page's "What helps" card (see below) rather than a standalone pill, to avoid a second competing metric next to Health Score.

### Extensible activity-minutes thresholds

`getActivityMinutesThreshold(species, weightKg, breed)` checks a breed-override table (`ACTIVITY_BREED_OVERRIDES`, sourced from general breed-energy-level characterizations) before falling back to the existing size-class default. Adding a real per-breed number later is a one-line addition to that object - no logic changes needed. Still flagged as illustrative (see Status below) - no public source gives real size/breed-stratified activity minutes.

`scoreActivityMinutes()` now flags a high end too, not just a low one: `ACTIVITY_UPPER_RATIO_CAUTION` (2x the target) reads as "more than usual" (0.5), `ACTIVITY_UPPER_RATIO_MAX` (3x) reads as likely overexertion (1) - same illustrative-placeholder tier as the rest of this table, since no public source gives a size/breed-stratified overexertion threshold either. `activityGuidance(species, weightKg, breed)` exposes the same `{target, safeMax}` numbers the score uses internally, so the UI (`activityGuidanceText()` in `index.html`, used on both the Round 1 minutes question and the completion page's exercise field) can show a real target and safe-maximum figure live as the owner types, with a caution color once minutes clear `safeMax` - the copy and the scoring agree on what counts as "too much" because they read the same numbers.

## Design system

Every page (BCS, Part 1-4, results, completion) uses the same `.pv-` design language as the baseline widget (Cormorant/Inter fonts, cream/blue/ash palette, pill buttons and segmented controls, SVG ring progress indicator) via a shared `pvShell(wordmark, step, bodyHtml, footerHtml)` helper in `index.html` - each page supplies its own content, the shell supplies the consistent header/ring/footer chrome. `PV_STEP_ORDER` + `pvStepPct()` drive the ring's percentage across the whole flow (baseline has its own separate 6-field-completion ring, since that widget block is verbatim/unmodified - see below). The global CSS duplicates the widget's own scoped rules (harmless, idempotent) rather than editing `PV_WIDGET_HTML`, so that block stays byte-identical.

Cormorant and Inter were already named in `--pv-font-display`/`--pv-font-body` - the Pawl app's own declared fonts - but nothing ever loaded them, so every page silently rendered in the system serif/sans-serif fallback instead. `<head>` now links the real Google Fonts families (weights 300/400/500, matching what the CSS actually uses) so the intended typography renders throughout, rather than swapping in a different, unverified font choice.

**Visuals**: a per-category emoji glyph (`CATEGORY_ICON`) was added next to round headlines and card titles in an earlier pass, then removed again per a later explicit request - round headlines, category-score cards, watch-out/recommendations/did-you-know titles, and the next-round button are plain text again. The one visual glyph that stayed is the baseline widget's Daily activity level buttons, which carry an increasing paw-print count (🐾/🐾🐾/🐾🐾🐾) so the icon itself reads as "more activity," not just the text label - same lightweight emoji convention `STAGE_ICON` already used for life stages, not a new icon library or asset pipeline.

## Result page

The Part 1–4 result screens show, in order: a stage headline ("{name} is in the {stage} stage"), two large primary stats (**Pet Age** - the physiological estimate, `r.center` - and **Human Age**, the Wang 2020 / Cambridge 2017 equivalent, captioned as "what a human would be at the same biological stage" so it can't be mistaken for the pet's real age), and a WHOOP-style circular **Health Score** (0–100, `healthScore()` in `frailty-model.js`, reusing `fiZone`'s own FI breakpoints rather than inventing a second scale, with the aging-pace percentage as its caption).

Below that, rounds 1-3 each show a card for **that round's own category** instead of a generic one: a 0-100 category score (`categoryScore()`/`categoryFI()` - the same `healthScore()` curve, scoped to just that round's answered ids), a **Watch out for** list, a **Recommendations** list, and a **Did you know?** fact. Round 4 keeps the original **Watch out for**/**What helps** pair instead, built from `STAGE_CONTENT` (species × stage authored care guidance) - it's the synthesized overall takeaway once all 4 categories have been answered, not a single-category one.

Both the round 1-3 "Watch out for" list and the "Recommendations" list are **dynamic per round**, not a fixed script:
- **Watch out for** (`flaggedWatchFor()`) shows whichever of that round's own answers actually scored `>= 0.5`, using the short label from `SYMPTOM_INFO` (a per-symptom map shared with the completion page's deep version below) - only falling back to `CATEGORY_CONTENT[key].watchFor`'s generic list when nothing's been flagged yet, so an unanswered round doesn't look broken.
- **Recommendations** leads with a "best match for this pet" line from a small per-category function (`mobilityBestMatch`/`sensesBestMatch`/`bodyBestMatch`/`historyBestMatch`, dispatched via `CATEGORY_BEST_MATCH`) built from baseline/answer data the owner already gave - activity minutes vs. `getActivityMinutesThreshold()` for their species/size/breed (mobility), stated health goals or life stage (senses), BCS (body), diagnosis/vet-visit answers (history) - framed as the fit for *this* pet ("a better match for their size") rather than a pass/fail judgment, then falls through to `CATEGORY_CONTENT[key].recommendations`'s generic tail.
- `personalizedCategoryInsights()` still applies the vet-flag/overweight-percentile bump on top of the above, same technique as `personalizedInsights()` below, scoped per-category.
- A **Did you know?** fact is usually a plain string in `CATEGORY_CONTENT[key].didYouKnow`, but where the fact genuinely differs by species (mobility's size-based senior-onset gap only applies to dogs - cats get a same-age-onset explanation instead) it's a `{dog, cat}` object, resolved to the right one in `personalizedCategoryInsights()`. This is a real correctness fix, not just tidying: the dog-only fact used to show unconditionally to cat owners too.
- Each round's question page (`renderPart()`) now opens with a `WHY_ROUND_MATTERS[key]` line explaining why that category is worth answering before showing the questions themselves, and the category-score card on the result page adds one line on why a per-category score is shown at all (surfaces where to focus next, not just a bigger number) - value framing up front rather than left implicit.

The "next round" button names the upcoming category ("Let's look into your pet's Senses, Mind & Behavior to tighten your score") instead of a generic "sharpen this estimate" - `PART_META[...].title` drives the copy.

Life-stage display uses a **4th "Puppy"/"Kitten" bucket** (`lifeStageDisplay()`, <1yr) layered on top of the existing 3-bucket `lifeStage()` - purely a display label; it does not touch the expected-FI curve math, which still runs on the original 3-bucket function. Ages under 1 year display in months ("2 mo"), not "0 yrs" - whole-year rounding reads as broken for very young pets. Age uncertainty is reflected in tone ("Estimated - sharpens as you answer more"), never a raw confidence percentage, per the product rule that the copy shouldn't expose internal scoring mechanics.

## Completion page

Reached either by finishing round 4 or by clicking "I'm happy with this estimate" on any earlier round (that button was previously a no-op - clicking it did nothing; it now correctly ends the flow). Calls `computeResult(4)` unconditionally, which is safe regardless of how far the owner actually got - unanswered questions from skipped rounds simply don't count, same rule as everywhere else.

**Health Multiplier** (`healthMultiplier()` in `frailty-model.js`) is `observedFI / expectedFI-for-age`, clamped to [0.4, 2] for display sanity - 1.0x is the neutral "exactly typical for age" baseline, not a score to maximize. This is a deliberately different metric from page 2's Health Score (0-100) and aging-pace percentage - same underlying FI/eFI numbers, expressed as a ratio instead, for a different moment in the flow. It does not reverse the earlier "percentage over multiplier" product decision for the page-2 delta badge, which is unchanged.

`observedFI` itself (in `computeResult()`, `index.html`) is now the **average of each answered category's own FI** (`categoryFI()` per round), not a flat mean across every individual item. This is how "each category score feeds the health multiplier" actually happens: a category with 12 answered items and one with 5 each contribute one equal vote to the multiplier, instead of the bigger category dominating a pooled average. An unanswered category is skipped entirely (not counted as 0), same "skipped just doesn't count" rule as the rest of this model. `frailty-model.js` itself is unchanged - this is purely how `index.html` aggregates answers before handing `observedFI` to the existing calibrated functions.

**Body condition** reuses `BCS_CHART` and `overweightPercentile()` already built for onboarding, with the percentile reframed as a comparison rather than a ranking (`percentileSoftCopy()` - "fuller-bodied than roughly N% of {species}s their size" instead of "Top N% most overweight") so it doesn't read as judgmental.

**Watch out for** (`watchOutSectionHtml()`/`deepWatchList()`) appears at the very end of the completion page - every symptom flagged (`>= 0.5`) across *all* categories answered so far, each with the full `SYMPTOM_INFO` detail (what it usually means, and what it can lead to if left unaddressed) rather than the round pages' short label. This is the "more items, deeper detail" version of the per-round list; if nothing's been flagged anywhere, it shows a short reassuring note instead of dumping the full unflagged symptom list. Each item now renders as its own labeled block (symptom name, then a bolded **Means:** line, then a bolded **If ignored:** line) instead of one run-on sentence - the same information, broken up so each part is scannable on its own rather than blending together.

**Wearable connection** is an honest placeholder, not fake functionality - clicking "Connect a wearable" shows a plain "isn't live yet" message rather than pretending a connection succeeded. No wearable API exists to integrate; building a real one needs a native companion app or a specific device SDK, out of scope for a static HTML file.

**Manual activity/food input** (`state.followup`) seeds exercise minutes from the onboarding activity answer instead of asking twice, and adds food-type, portion-size, treats-frequency, and meals-per-day fields. **Food & Activity Balance** (`foodActivityBalance()` in `frailty-model.js`) only ever takes `{activityDeficit, portionScore, treatsScore}` - meals-per-day is *not* one of its inputs and never has been; it's captured for the owner's own reference (feeding pattern context) but deliberately excluded from the calculation, since meal frequency alone doesn't indicate over- or under-feeding without portion size. The field is now positioned and labeled to make that explicit ("For your own reference only... not counted in the balance below") instead of sitting in the same row as the exercise-minutes field, which had made it read as part of the same calculation even though it never was one. `foodActivityBalance()` averages whichever of its three real inputs are actually filled in (0 = ideal, 1 = concerning, the same convention used everywhere else in this model) into a 0-100 percentage with soft, non-alarming copy at every tier - never a hard "you're over the limit" framing.

The food-type dropdown is now `FOOD_TYPE_OPTIONS[species]` - a separate list per species (dry kibble/wet-canned/raw/homemade/mixed for both, so the same categories exist either way) rather than one merged list, paired with a `FOOD_TYPE_HINT[species]` line specific to that species (cats: wet food's hydration/urinary-tract value, given their low natural thirst drive; dogs: formula/life-stage matters more than the wet-vs-dry split alone) - a cat owner never sees dog framing in that hint or vice versa. The "Portion size vs. what's recommended" question has an explicit hint clarifying that "recommended" means the pet's own food-label guideline for their current weight, phrased for that one pet's species rather than a cross-species comparison sentence - since `scoreActivityMinutes()`'s activity threshold was already species/size/breed-aware, this closes the same gap for the portion/treats side of the balance without mixing both species into the same sentence.

**Food equation** re-expresses that same balance score two more ways: `foodEquationMultiplier()` maps it onto a 0.75x-1.75x range (1.0x = middle, no hard cutoff either end - a distinct number from the page's Health Multiplier, same non-alarming intent), and `foodBalancePercentile()` reframes it as "better-balanced than about N% of {species}s" for a comparable feel. Both are explicitly derived from the same single balance number, not an independently sourced population distribution - there's no real dataset for this synthetic combined score to compare against.

**What to look for in their food** (`foodRecommendationHtml()`/`foodRecommendationTags()`) is a rule-based synthesis across nearly every signal collected in the whole flow - species, breed (chondrodystrophic/brachycephalic lists reused from `frailty-model.js`), size class, life stage, BCS, activity minutes vs. threshold, flagged symptoms (mobility, dental, GI, urinary), stated health goals, and diagnosis/medication history - into a deduplicated, ordered list of food *attributes to look for* (e.g. "senior formula," "joint-support ingredients," "urinary-support formula"), never a specific brand or product. The intro line names the actual factors used (species, breed, weight, life stage) so the "this is personalized" claim is checkable, not just asserted. A high-diagnosis/medication count always surfaces a line pointing back to the vet for a possible therapeutic diet, since that's a clinical call this rule-based list can't make.

## Validation notes

- The `fiZone` Steady/Needs-attention boundary (FI 0.24) lines up closely with a cited FI > 0.25 "elevated mortality risk" threshold - the boundary is validated by that number, not derived from it.
- Frailty-phenotype survival-time data (frail dogs ≈ 10.5mo, pre-frail ≈ 35.4mo, non-frail ≈ 42.5mo median survival) supports why the "Talk to your vet" zone exists at all, but those survival numbers are never surfaced in UI copy - the original spec's guardrail against lifespan/prognosis claims stands.
- `bcsToDeficit`'s thresholds are validated after the fact by the Purina lifetime calorie-restriction study: the control group's BCS (6.7, a 2.2-point deviation from ideal) already scores as "severe" under the existing thresholds, and the calorie-restricted group's BCS (4.6, 0.1 off ideal) scores as "ideal" - no threshold change needed.

## The four categories

Each round is now a single tightly-themed category instead of a loose grouping - every question in a round actually matches that round's title. Several near-duplicate questions were consolidated into a **gate question** (always shown) with **conditional deep-dive questions** that only render once the gate answer is `>= 0.5` (`dependsOn` on the question object, filtered live in `renderPart()`'s `visibleItems()`). A few gates also carry a **detail question** (`detailOnly:true`) - an informational "which one, mainly?" or "daily or occasional?" follow-up stored in `state.details`, never `state.answers`, so it never enters the FI denominator or double-counts the same symptom. The one exception is `p2_cognition_detail`, which *refines* its gate's own score (`refines:"p2_cognition"` - answering "Daily" bumps the existing 0.5 up to 1) rather than adding a second item.

### Round 1 - Mobility & Energy (initial estimate)
`mob_gate` (stairs/jumping or stiff-and-slow-to-rise - merges the old separate mobility and stiffness questions) and activity minutes are always asked; flagging the gate reveals exhaustion/recovery, exercise tolerance, and visible muscle loss (the last two moved in from the old Part 3, since they're mobility signals, not "internal systemic" ones).

**Reveals:** a same-day mobility/energy snapshot - deliberately gated so the deeper questions only show up when relevant, instead of asking everyone all 5 items.
**Adds value:** a 90-second payoff - a shareable estimate card that hooks the return-visit loop. Band: ± ~3 years.

### Round 2 - Senses, Mind & Behavior (first refinement)
Vision, hearing, sleep changes, social withdrawal/clinginess, overall vitality (moved in from the old Part 1 - it's a behavioral gestalt, not a "core basics" item), and cognition/disorientation. Flagging cognition reveals a daily-vs-occasional follow-up that refines its own severity.

**Reveals:** age-linked deficits that are slower to notice - things owners see day-to-day but don't usually connect to aging (especially early cognitive decline).
**Adds value:** tightens the band to ± ~2 years.

### Round 3 - Body & Internal Health (second refinement)
Six gates instead of the old 12 discrete items: appetite/weight change, coat/dental/skin change, water/urination/continence change, digestion, breathing, and discomfort (temperature sensitivity or pain) - each of the three merged gates reveals a "which one, mainly?" detail chip once flagged. Body condition score's FI-attribution also moved here from Round 1 (it's a body signal, not mobility), though the BCS slider step keeps its existing position in the flow, before Round 1.

**Reveals:** organ-system aging (kidney, heart, GI, musculoskeletal) plus appearance/appetite signals - things owners observe but rarely link to a single underlying cause.
**Adds value:** band tightens to ± ~1.2 years; highest medical relevance, most likely section to surface a "needs attention" flag.

### Round 4 - Medical & Vet History (final refinement)
Unchanged: chronic diagnoses, current medications, recent vet visits, dental history, surgical/injury history, optional vet-supplied bloodwork/organ findings, plus a free-text owner concern. Already gate-free - these are opt-in clinical items, not owner-observed symptoms with a natural "is this relevant" branch point.

**Reveals:** cumulative deficit burden that owner-observation alone misses - things already caught by a vet.
**Adds value:** final band ± ~0.8 years on the full 33-item FI - most accurate number, but slowest, which is why it's gated behind three rounds of buy-in.

## Status / known simplifications

- `state.baseline.sleepHours` (owner-reported sleep hours/day, captured on the baseline step) is deliberately unscored/display-only, not an oversight - checked real literature (CADES, SNoRE 3.0, Canine Frailty Index/Phenotype, a feline frailty pilot) and none of them score absolute sleep duration as a deficit; they all score sleep *changes*/*restlessness* instead (already captured separately by `p2_sleep`), and the feline pilot specifically tested an absolute-sleep item and dropped it as non-discriminative. Same "don't invent a threshold with no source" rule as `ACTIVITY_MINUTES_TABLE` etc.
- Photo-based age estimation now has a UI path: an optional file upload on the baseline step calls `estimateAgeFromPhoto()` on continue, skips the BCS chart step (defaults body condition to ideal per the existing documented assumption), and feeds the result into `fuseAge()` - still honestly returns `confidence: 0` until a trained model exists (see "Photo-based age estimation" above).
- Sex/neuter status is now captured on the baseline step (`state.baseline.sexNeuter`, select input) - informational-only, same as before the widget swap; not wired into FI scoring since no spec/data gives a life-table modifier magnitude (see reproductive-status note further down).
- Per-BCS-point reference photos remain unbuilt - blocked on not having real per-point source images (only one whole-chart image per species exists in `assets/`); fabricating veterinary reference photos isn't appropriate for a health-scoring app, same licensing-risk category as the age-recognition training-set issue above. Needs real licensed source images before this can ship.
- The Round 3 gate/detail consolidation reduces that round's FI item count from 12 discrete ids to 6 gates by default (appetite+weight, coat+dental+skin, and water+urination+continence each collapsed into one scored gate with an informational-only detail chip). This means fewer things land in that round's denominator unless a gate is flagged - consistent with the existing "skipped/unanswered items just don't count" rule, not a scoring penalty change.
- `observedFI` changed from a flat mean across every answered item to an average of each category's own mean (`categoryFI()` per round) - a deliberate per-category-equal-weighting choice, not independently validated against the flat-mean approach it replaced. Categories' own 0-100 display scores (`categoryScore()`) reuse `healthScore()`'s existing curve unchanged.
- The round-page "Recommendations"/"Watch out for" personalization (`CATEGORY_BEST_MATCH` functions, `flaggedWatchFor()`) and the completion page's deep `SYMPTOM_INFO` detail are all authored copy for this pass - same wellness-informed-but-not-vet-reviewed framing as `STAGE_CONTENT`, not independently validated clinical guidance.
- `ACTIVITY_UPPER_RATIO_CAUTION`/`ACTIVITY_UPPER_RATIO_MAX` (the overexertion caution/flag multipliers) are illustrative placeholders, same tier as `ACTIVITY_MINUTES_TABLE` itself - no public source gives a real size/breed-stratified "how much exercise is too much" threshold. The Daily activity level hover text is a plain HTML `title` attribute (species-swapped live by `wirePetVitalsToState()`), not a custom tooltip component - no JS framework, no new dependency.
- The baseline weight field changed from kg to lbs-only this pass (no unit toggle either way) - a labeling/default change, not a new capability; `weightKg()`'s kg branch still exists and is still exercised by the test suite, just unreachable from this widget's UI.
- `FOOD_TYPE_HINT`'s cat hydration/urinary-tract claim and dog formula/life-stage claim are general, widely-cited veterinary framing for this pass, not independently sourced with a specific citation - same tier as `STAGE_CONTENT`'s care guidance elsewhere in this file.
- The Google Fonts `<link>` tags are this file's first external network dependency - previously "no build step" also meant "no network needed" (BCS chart images are local assets, everything else was inline). If `index.html` needs to keep working fully offline, swap the `<link>` for self-hosted `.woff2` files under `assets/` instead; the font-family names/weights stay the same either way.
- Dog/cat question-text pairs were reviewed for phrasing parity this pass (e.g. `p3_exercise_tolerance`'s cat wording tightened to match the comma-separated cadence used elsewhere) - a light pass, not an exhaustive rewrite of every pair.
- `FOOD_TAG_COPY`'s food-attribute guidance (senior formula, joint-support ingredients, dental formula, GI-sensitive formula, urinary-support formula, large-breed formula, brachycephalic-breed feeding tips) is general, widely-cited veterinary framing authored for this pass - same tier as `STAGE_CONTENT`/`SYMPTOM_INFO` elsewhere in this file, not a nutritionist-reviewed protocol and never a specific brand/product recommendation.
- `EXPECTED_FI_ANCHORS` (young/middle/senior) and `DOG_SENIOR_ONSET` (size-based senior ages) are now literature-backed (Banzato et al. 2019; real senior-onset benchmarks) - no longer placeholders.
- `BETA`, `MAX_DELTA_YEARS`, `BRACHY_BREED_FI_MODIFIER`, `CHONDRO_BREED_FI_MODIFIER`, `CAT_DELTA_DAMPENING`, and `ACTIVITY_MINUTES_TABLE` remain illustrative placeholders - checked against public literature for this pass and confirmed that no source gives a numeric FI-delta-to-years coefficient, breed-modifier magnitude, size-stratified activity-minutes standard, or feline FI-age curve. Flagged inline with `ponytail:` comments; the model is isolated in one function/config block so these can be swapped in cleanly once real calibration data exists.
- **Citation note:** this README (and the original code comments) cited "Teng et al. 2024" for the calibration source; a later product-review pass referenced "McMillan et al. 2024" for the same claim. Neither could be verified as a real canine/feline frailty-index paper via public search in this pass - still unresolved, calibrating off Banzato et al. 2019 in the meantime rather than guessing.
- Reproductive status detail (intact + age, a life-table modifier per the spec) isn't broken out as its own field yet; sex/neuter status is captured at baseline.
- Cat model is explicitly dog-derived-plus-confidence-dampened (`CAT_DELTA_DAMPENING`), not independently calibrated - no quantitative feline FI-by-age data exists publicly yet. Wider uncertainty bands and the Cambridge 2017 human-year formula are implemented; labeled as estimates in the UI.
- The brachycephalic- and chondrodystrophic-breed lists and activity-minutes thresholds (including the new `ACTIVITY_BREED_OVERRIDES`) are substring/lookup-matched against free-text breed input and illustrative thresholds - not a structured breed database.
- The single headline age (`r.center`, physiological estimate) is shown with no range - a later product-direction change from an earlier range-plus-headline display; the `low`/`high` band is still computed internally, just not rendered.
- `age-service/` has no trained model - a real, running Flask service with a real endpoint contract, but `confidence: 0` until real weights exist. See "Photo-based age estimation" above and `age-service/README.md` for exactly why and what's needed to change that (licensing, dataset, GPU training time - none of which happen inside a coding session). A candidate labeled dataset was located but its license/provenance is unconfirmed - flagged, not used.
- `overweightPercentile`'s BCS 7/9 values are interpolated/extrapolated, not independently sourced (BCS 6/8 are the real cited anchors).
- `healthScore()`'s 0–100 anchors reuse `fiZone`'s own FI breakpoints for consistency, but those breakpoints themselves are still the original spec's round-number wellness bands (only the 0.24 one has an independent citation - see Validation notes) - not a clinically validated 0–100 scoring instrument.
- `STAGE_CONTENT` (the per-stage "watch out for"/"what helps" copy) is general veterinary-informed care guidance authored for this pass, not a vet-reviewed clinical protocol - same wellness-not-diagnostic framing as the rest of the app.
- Per-BCS-point reference photos (`imageHook` keys on `BCS_CHART`) remain unused hook points - the BCS step currently shows one whole-chart image per species instead (see "Body condition chart" above).
- `healthMultiplier()`'s [0.4, 2] display clamp and `foodActivityBalance()`'s equal-weighting of activity/portion/treats are both reasonable-default choices, not independently validated ratios.
- Wearable connection is a real, honest UI placeholder (no fake "connected" state) - no wearable API integration exists yet; that's real remaining work, not a stub avoided for time.
- All project text and UI copy had em dashes replaced with plain hyphens project-wide this pass (comments included, not just user-facing strings); en dashes used in number ranges (e.g. "0-100") were left alone since the request named the em dash specifically.

## Testing

Pure scoring logic lives in `frailty-model.js` (no DOM dependency), tested with a zero-dependency Node script:

```
node test/frailty-model.test.js
```

Covers named fixtures: a bulldog with breed-typical findings (should not read prematurely old), a dachshund whose low activity is objectively surfaced by the minutes question and whose chondrodystrophic modifier is smaller than the bulldog's brachy modifier, a shih tzu (in both breed lists, gets the max modifier not the sum), a genuinely-declining great dane (proves the fix isn't one-directional), healthy senior dogs/cat (should not collapse toward a young estimate), cat-vs-dog delta dampening on identical inputs, size-based senior-guess ages, dog/cat human-year parity (Wang 2020 / Cambridge 2017), a young unhealthy dog (exercises the delta clamp), an unknown-DOB cat (confirms the size-based age-guess fallback lands in the correct life-stage bucket), breed-override activity thresholds, prevalence-anchored overweight percentiles, confidence-weighted age fusion (including the zero-confidence-signal-contributes-nothing case), the delta-as-percentage helper, BCS chart data shape, the puppy/kitten display bucket (confirms it doesn't affect the underlying FI-curve bucket), and the health-score anchors (confirms consistency with `fiZone`'s own breakpoints), the health multiplier (1.0 baseline, clamped range, zero-denominator guard), and food/activity balance (all-ideal/all-concerning bounds, partial-input averaging), the food equation multiplier (stays within its own 0.75x-1.75x limits), and the food balance percentile. 37 fixtures total.

`age-service/` has its own zero-dependency-beyond-Flask test suite:

```
cd age-service && python test_app.py
```

Covers the health check and the `/estimate-age` contract (missing image, invalid image, and the honest untrained-model response shape).

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

Photo-based age estimation additionally needs `age-service/` running (`cd age-service && pip install -r requirements.txt && python app.py`, serves on port 5001) - optional; the questionnaire degrades gracefully to its other age signals if the service isn't running.

## Sources

Banzato et al. 2019 (*Sci. Rep.*, FI-by-age anchors); Loyal Canine Frailty Index; Montoya et al. 2023 (*Front. Vet. Sci.*, life expectancy / size-stratified senior-onset ages - not FI); Teng et al. 2024 / "McMillan et al. 2024" (unresolved citation, see Status note above); Cambridge 2017 (feline human-year formula); Wang et al. 2020 (canine human-year formula); AAHA/AAFP Life-Stage Guidelines; canine frailty-phenotype survival-time data (cited for internal validation of the vet-flag zone only, not shown in UI copy per the no-prognosis guardrail); Purina lifetime calorie-restriction study and general dog/cat obesity-prevalence stats (BCS deficit thresholds and `overweightPercentile` anchors); `szmazurek/Age_recognition_Cyfrovet` (evaluated as the requested photo-age-estimation source - see `age-service/README.md` for why it's an abstraction/interface today, not a running model).
