/* Pure frailty/physiological-age scoring functions.
   UMD-style export: works as <script src="frailty-model.js"> in index.html
   and via require() from Node tests - no build step, no dependencies. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FrailtyModel = factory();
})(typeof self !== "undefined" ? self : this, function () {

/* ---------- size / life-stage ---------- */

function dogSizeClass(kg){
  if (kg < 10) return "small";
  if (kg < 25) return "medium";
  if (kg < 40) return "large";
  return "giant";
}
/* Senior-onset ages: midpoints of real benchmarks (small 10-12, medium 8-10,
   large 7-8, giant 5-6 yr). Larger dogs also lose ~1 month of lifespan per
   2kg body mass - that's a lifespan-shortening rate, not a senior-onset-age
   rate, so it's cited only as qualitative support for the size ordering,
   not fit into a formula (would be spurious precision). */
const DOG_SENIOR_ONSET = {small:11, medium:9, large:7.5, giant:5.5};

function lifeStage(species, chronAge, weightKg){
  if (species === "cat") {
    if (chronAge < 7) return "young";
    if (chronAge < 11) return "middle";
    return "senior";
  }
  const seniorAge = DOG_SENIOR_ONSET[dogSizeClass(weightKg)];
  const middleAge = seniorAge * 0.6;
  if (chronAge < middleAge) return "young";
  if (chronAge < seniorAge) return "middle";
  return "senior";
}

/* Display-only 4-bucket stage (puppy/young/middle/senior) for the result
   page. Does NOT feed the expected-FI curve - that still runs on lifeStage()
   above untouched. 1-year puppy/kitten cutoff is a common general convention,
   not size-stratified like the rest of this model; it's a display label, not
   a scoring input, so the simplification is lower-stakes here. */
const PUPPY_CUTOFF_YEARS = 1;

function lifeStageDisplay(species, chronAge, weightKg){
  if (chronAge < PUPPY_CUTOFF_YEARS) return "puppy";
  return lifeStage(species, chronAge, weightKg);
}

/* ---------- FRAILTY MODEL CONFIG ---------- */
/* EXPECTED_FI_ANCHORS are now Banzato et al. 2019's real reported mean FI by
   age band (young 2-6y=0.08, middle 7-10y=0.11, old 10+y=0.23; population
   mean 0.14) - no longer placeholders. Banzato also reports an approximately
   linear FI-vs-age relationship (b=0.016, Spearman rho=0.51), which is why
   piecewise-linear interpolation between anchors is a literature-consistent
   shape rather than an invented curve.
   ponytail: BETA, MAX_DELTA_YEARS, BRACHY/CHONDRO_BREED_FI_MODIFIER,
   CAT_DELTA_DAMPENING, and the activity-minutes table are still placeholder
   constants - no public source gives a numeric FI-delta-to-years coefficient,
   breed-modifier magnitude, or feline FI-age curve. Swap in real numbers if
   an internal Pawl dataset produces them.
   NOTE: README.md's "Teng et al. 2024" vs. a previously-cited "McMillan et
   al. 2024" remains unresolved - neither could be verified as a real
   canine/feline frailty-index paper via public search. Calibrating off
   Banzato 2019 in the meantime rather than guessing. */
const FRAILTY_MODEL_CONFIG = {
  BETA: 20,                           // years of physiological-age shift per unit of FI delta
  MAX_DELTA_YEARS: 6,                 // hard clamp on |delta| regardless of how extreme observedFI is
  EXPECTED_FI_ANCHORS: {young:0.08, middle:0.11, senior:0.23}, // Banzato et al. 2019 reported means
  BRACHY_BREED_FI_MODIFIER: 0.03,     // added to expectedFI for brachycephalic breeds
  CHONDRO_BREED_FI_MODIFIER: 0.02,    // added to expectedFI for chondrodystrophic breeds (spinal-disc risk, not the same claim as brachy)
  CAT_DELTA_DAMPENING: 0.75,          // no feline FI-age curve exists in the literature; pull cat deltas toward "typical" instead of assuming dog anchors transfer 1:1
  MAX_AGE_FRACTION: 3,                // cap on ageFraction() extrapolation for very old pets
  SENIOR_EXTENSION_SLOPE_FACTOR: 0.5, // diminishing eFI growth rate applied past senior onset
  DELTA_INDICATOR_THRESHOLD_YEARS: 0.5, // |delta| below this reads as "about typical" in copy
};

/* ---------- continuous expected-FI curve ---------- */

function ageFraction(species, chronAge, weightKg){
  let middleAge, seniorAge;
  if (species === "cat") { middleAge = 7; seniorAge = 11; }
  else {
    seniorAge = DOG_SENIOR_ONSET[dogSizeClass(weightKg)];
    middleAge = seniorAge * 0.6;
  }
  if (chronAge <= 0) return 0;
  if (chronAge < middleAge) return chronAge / middleAge;                       // 0..1 : young -> middle
  if (chronAge < seniorAge) return 1 + (chronAge - middleAge) / (seniorAge - middleAge); // 1..2 : middle -> senior
  const extra = (chronAge - seniorAge) / (seniorAge - middleAge);
  return Math.min(FRAILTY_MODEL_CONFIG.MAX_AGE_FRACTION, 2 + extra);
}

function expectedFIContinuous(species, chronAge, weightKg){
  const a = FRAILTY_MODEL_CONFIG.EXPECTED_FI_ANCHORS;
  const frac = ageFraction(species, chronAge, weightKg);
  if (frac <= 1) return a.young + (a.middle - a.young) * frac;
  if (frac <= 2) return a.middle + (a.senior - a.middle) * (frac - 1);
  const slope = a.senior - a.middle;
  const extra = Math.min(1, frac - 2);
  return a.senior + slope * FRAILTY_MODEL_CONFIG.SENIOR_EXTENSION_SLOPE_FACTOR * extra;
}

/* ---------- breed modifier layer ---------- */
/* Brachycephalic breeds carry breed-typical breathing/skin-fold traits that
   are normal-for-breed, not accelerated aging. Modifier raises the expected-FI
   bar for these breeds so those findings don't inflate the frailty delta. */
const BRACHY_BREEDS = [
  "bulldog","pug","french bulldog","frenchie","boston terrier",
  "shih tzu","pekingese","boxer","cavalier king charles","cavalier",
  "persian","himalayan","exotic shorthair",
];

/* Chondrodystrophic breeds (FGF4-driven early disc degeneration) carry a
   real, distinct structural risk - not the same claim as "breed-typical
   trait misread as a deficit," but treated the same way here (raise the
   expected-FI bar) since no separate scoring lever exists yet. Overlaps
   with BRACHY_BREEDS (Shih Tzu, Pekingese) are resolved by taking the max
   modifier, not summing, in breedModifier(). */
const CHONDRODYSTROPHIC_BREEDS = [
  "dachshund","corgi","welsh corgi","basset hound","shih tzu","pekingese",
];

function breedModifier(breedText){
  if (!breedText) return 0;
  const s = breedText.toLowerCase();
  const brachy = BRACHY_BREEDS.some(b => s.includes(b)) ? FRAILTY_MODEL_CONFIG.BRACHY_BREED_FI_MODIFIER : 0;
  const chondro = CHONDRODYSTROPHIC_BREEDS.some(b => s.includes(b)) ? FRAILTY_MODEL_CONFIG.CHONDRO_BREED_FI_MODIFIER : 0;
  return Math.max(brachy, chondro);
}

/* ---------- interim scoring model (isolated swap point) ---------- */

function estimatePhysiologicalAge({species, chronAge, weightKg, breed, observedFI}){
  const eFI = expectedFIContinuous(species, chronAge, weightKg) + breedModifier(breed);
  let rawDelta = FRAILTY_MODEL_CONFIG.BETA * (observedFI - eFI);
  if (species === "cat") rawDelta *= FRAILTY_MODEL_CONFIG.CAT_DELTA_DAMPENING;
  const delta = Math.max(-FRAILTY_MODEL_CONFIG.MAX_DELTA_YEARS,
                 Math.min(FRAILTY_MODEL_CONFIG.MAX_DELTA_YEARS, rawDelta));
  const center = Math.max(0.1, chronAge + delta);
  return {center, eFI, delta, rawDelta};
}

function classifyDelta(delta, threshold){
  threshold = threshold ?? FRAILTY_MODEL_CONFIG.DELTA_INDICATOR_THRESHOLD_YEARS;
  if (delta <= -threshold) return "slower";
  if (delta >= threshold) return "faster";
  return "typical";
}

/* ---------- activity-minutes scoring (Problem 3) ---------- */
/* ponytail: literature check (PDSA, Merck, AAHA, plus a direct check for
   minutes-to-years coefficients) confirms no size/breed-stratified numeric
   activity standard exists publicly - only a general "30min-2hr/day" range
   by energy level, and validated proxies like timed mobility trials, not a
   minutes threshold. Size-class defaults stay illustrative placeholders
   within that general range. Swap in real thresholds if a real standard or
   internal dataset is ever published. */
const ACTIVITY_MINUTES_TABLE = {
  dog: {small:30, medium:45, large:60, giant:45},
  cat: 20,
};

/* ponytail: same tier as the rest of this table - no size/breed-stratified
   public standard exists for "how much daily exercise is too much" either,
   only general owner guidance to build up gradually and watch for
   overexertion signs (heavy panting that doesn't recover, limping,
   collapse). These multipliers of the existing target are illustrative
   caution bands, not a clinical overexertion threshold. */
const ACTIVITY_UPPER_RATIO_CAUTION = 2; // beyond ~2x the daily target starts reading as a caution zone
const ACTIVITY_UPPER_RATIO_MAX = 3;     // beyond ~3x reads as a likely-overexertion flag

/* Breed-specific overrides, keyed by lowercase substring, checked before the
   size-class default. Sourced from general breed-standard energy-level
   descriptions (AKC/breed-club characterizations of "high energy" vs
   "low energy" breeds), not a controlled study - same placeholder tier as
   the size-class table above, just breed-extensible. Extend this object
   (no logic changes needed) as real per-breed data becomes available. */
const ACTIVITY_BREED_OVERRIDES = {
  "border collie":90, "australian shepherd":90, "husky":90, "siberian husky":90,
  "vizsla":90, "weimaraner":90, "german shepherd":75, "labrador":60,
  "bulldog":20, "french bulldog":20, "frenchie":20, "pug":20,
  "shih tzu":20, "pekingese":15, "basset hound":25,
  "great dane":40, "mastiff":30, "saint bernard":30,
};

function getActivityMinutesThreshold(species, weightKg, breedText){
  if (species === "cat") return ACTIVITY_MINUTES_TABLE.cat;
  if (breedText){
    const s = breedText.toLowerCase();
    for (const breed in ACTIVITY_BREED_OVERRIDES){
      if (s.includes(breed)) return ACTIVITY_BREED_OVERRIDES[breed];
    }
  }
  return ACTIVITY_MINUTES_TABLE.dog[dogSizeClass(weightKg)];
}

function scoreActivityMinutes(species, minutes, weightKg, breedText){
  if (minutes == null || isNaN(minutes)) return undefined;
  const threshold = getActivityMinutesThreshold(species, weightKg, breedText);
  const ratio = minutes / threshold;
  if (ratio >= ACTIVITY_UPPER_RATIO_MAX) return 1;     // likely overexertion for this pet's size/species
  if (ratio >= ACTIVITY_UPPER_RATIO_CAUTION) return 0.5; // more than usual - a caution zone, not yet flagged
  if (ratio >= 0.8) return 0;
  if (ratio >= 0.4) return 0.5;
  return 1;
}

/* Copy-facing companion to scoreActivityMinutes() - the actual minute
   figures behind "target" and "safe maximum" guidance, so the UI can show a
   real number instead of a vague warning. Same threshold table, just
   exposed as a range instead of folded straight into a deficit score. */
function activityGuidance(species, weightKg, breedText){
  const target = getActivityMinutesThreshold(species, weightKg, breedText);
  return {target, safeMax: Math.round(target * ACTIVITY_UPPER_RATIO_CAUTION)};
}

/* ---------- health multiplier (completion-page metric) ---------- */
/* observedFI / expectedFI-for-age - the same two numbers estimatePhysiologicalAge()
   already computes, just expressed as a ratio instead of folded into an age
   shift. 1.0 = exactly typical for age; below 1 = fewer deficits than typical;
   above 1 = more than typical. Clamped to a display-sane range so a very
   young pet with a tiny expectedFI denominator can't produce a wild number.
   This is a DIFFERENT metric from the page-2 aging-pace percentage
   (deltaPercentOfAge) - that one stays percentage-framed per product
   direction; this multiplier is the completion page's own distinct number,
   not a reversal of that earlier decision. */
function healthMultiplier(observedFI, expectedFI){
  if (!expectedFI) return 1;
  const raw = observedFI / expectedFI;
  return Math.max(0.4, Math.min(2, +raw.toFixed(2)));
}

/* ---------- food & activity balance (completion-page metric) ---------- */
/* Each input follows the same 0 (ideal) .. 1 (concerning) deficit convention
   used everywhere else in this model - activityDeficit is scoreActivityMinutes()
   output as-is; portionScore/treatsScore are simple 0/0.5/1 owner-reported
   selects. Expressed as a 0-100 "balance" so it reads as a soft relative
   measure, not a hard limit. */
function foodActivityBalance({activityDeficit, portionScore, treatsScore}){
  const scores = [activityDeficit, portionScore, treatsScore].filter(s => s != null);
  if (!scores.length) return null;
  const avg = scores.reduce((a,b)=>a+b,0) / scores.length;
  return Math.round(100 * (1 - avg));
}

/* Same balance score, re-expressed as a 0.75x-1.75x multiplier instead of a
   percentage - 1.0x sits at the middle, no scary hard limit either end.
   Same 1=more-concerning/below-1=better convention as healthMultiplier(),
   just derived from food/activity signals instead of the frailty answers. */
function foodEquationMultiplier(balancePct){
  if (balancePct == null) return 1;
  return +(1.75 - (balancePct/100)).toFixed(2);
}

/* Reframes the same balance score as a plain-language comparison ("better
   balanced than about N% of pets") - explicitly a comparable, illustrative
   figure, not drawn from a real population dataset (none exists for this
   synthetic combined score). */
function foodBalancePercentile(balancePct){
  if (balancePct == null) return null;
  return Math.round(balancePct);
}

/* ---------- misc (unchanged from original) ---------- */

const BAND_TABLE = [[8,3],[16,2],[25,1.2],[33,0.8]];
function bandYears(n){
  if (n <= BAND_TABLE[0][0]) return BAND_TABLE[0][1];
  for (let i=0;i<BAND_TABLE.length-1;i++){
    const [n0,b0] = BAND_TABLE[i], [n1,b1] = BAND_TABLE[i+1];
    if (n <= n1) return b0 + (b1-b0)*(n-n0)/(n1-n0);
  }
  return BAND_TABLE[BAND_TABLE.length-1][1];
}

function fiZone(fi){
  if (fi < 0.12) return {label:"Thriving", vet:false};
  if (fi <= 0.24) return {label:"Steady", vet:false};
  if (fi <= 0.4) return {label:"Needs a little attention", vet:false};
  return {label:"Talk to your vet", vet:true};
}

/* 0-100 "health score" for a WHOOP-style badge - reuses fiZone's own FI
   breakpoints (0.12/0.24/0.4, the 0.24 one validated against a cited FI>0.25
   elevated-mortality-risk threshold - see README) rather than inventing a
   second, competing scale. Piecewise-linear between them. */
const HEALTH_SCORE_ANCHORS = [[0,100],[0.12,85],[0.24,65],[0.4,40],[0.6,15],[1,0]];
function healthScore(fi){
  const a = HEALTH_SCORE_ANCHORS;
  if (fi <= a[0][0]) return a[0][1];
  for (let i=0;i<a.length-1;i++){
    const [f0,s0]=a[i], [f1,s1]=a[i+1];
    if (fi<=f1) return Math.round(s0 + (s1-s0)*(fi-f0)/(f1-f0));
  }
  return a[a.length-1][1];
}

function catHumanEquivalent(catAge){
  if (catAge < 1.5) return null;
  return Math.round(4.14*catAge + 15);
}

// Wang et al. 2020: human_age = 16*ln(dog_age) + 31. Floors dog_age so ln() stays defined.
function dogHumanEquivalent(dogAge){
  return Math.round(16 * Math.log(Math.max(dogAge, 0.05)) + 31);
}

function seniorGuessAge(species, weightKg){
  if (species === "cat") return 11;
  return DOG_SENIOR_ONSET[dogSizeClass(weightKg)];
}

function bcsToDeficit(bcs){
  const d = Math.abs(bcs - 4.5);
  if (d <= 0.5) return 0;
  if (d <= 1.5) return 0.5;
  return 1;
}

/* ---------- weight/BCS percentile ranking ---------- */
/* Anchored on real cited prevalence stats: 59% of dogs / 61% of cats are
   overweight-or-obese (roughly the BCS>=6 population), 22% of dogs / 33% of
   cats are obese (BCS 8-9). BCS 6 and 8 anchors are those real numbers; BCS
   7 and 9 are linearly interpolated/extrapolated between them - flagged,
   not independently sourced. BCS<=5 (ideal or underweight) returns null -
   no percentile framing where a pet isn't in the overweight tail. */
const OVERWEIGHT_PERCENTILE_ANCHORS = {
  dog: {6:59, 8:22, 9:8},
  cat: {6:61, 8:33, 9:10},
};

function overweightPercentile(species, bcs){
  if (bcs == null || isNaN(bcs) || bcs < 6) return null;
  const anchors = OVERWEIGHT_PERCENTILE_ANCHORS[species] || OVERWEIGHT_PERCENTILE_ANCHORS.dog;
  const keys = Object.keys(anchors).map(Number).sort((a,b)=>a-b);
  if (bcs <= keys[0]) return anchors[keys[0]];
  if (bcs >= keys[keys.length-1]) return anchors[keys[keys.length-1]];
  for (let i=0;i<keys.length-1;i++){
    if (bcs >= keys[i] && bcs <= keys[i+1]){
      const t = (bcs-keys[i]) / (keys[i+1]-keys[i]);
      return Math.round(anchors[keys[i]] + (anchors[keys[i+1]]-anchors[keys[i]])*t);
    }
  }
}

/* ---------- confidence-weighted age fusion ---------- */
/* Combines whatever age signals are available (exact DOB, an owner years-only
   guess, a size-based prior, a photo-model estimate) into one age value via a
   confidence-weighted average - never a category label, never a single model
   deciding alone. Pure function: callers supply {years, confidence} signals;
   a signal with confidence 0 (e.g. an unreachable/untrained photo model)
   contributes nothing, which is how "don't rely on image estimation alone"
   is enforced structurally rather than by convention. */
function fuseAge(signals){
  const valid = (signals || []).filter(s => s && Number.isFinite(s.years) && s.confidence > 0);
  if (!valid.length) return {years: null, confidence: 0};
  const totalConf = valid.reduce((sum, s) => sum + s.confidence, 0);
  const years = valid.reduce((sum, s) => sum + s.years * s.confidence, 0) / totalConf;
  return {years, confidence: Math.min(1, totalConf)};
}

/* ---------- aging-pace delta as a percentage ---------- */
/* delta expressed as % of chronological age, e.g. delta=1.2yr at chronAge=8
   -> "15% faster/slower than typical for their age" - a real ratio of the
   model's own numbers, not an invented percentage. */
function deltaPercentOfAge(delta, chronAge){
  if (!chronAge) return 0;
  return Math.round((delta / chronAge) * 100);
}

/* ---------- body condition chart (real 9-point WSAVA/Purina-style scale) ---------- */
/* imageHook is a stable key for the UI to look up a placeholder slot by -
   drop real photos in later keyed by these strings, no logic changes needed. */
const BCS_CHART = {
  dog: [
    {bcs:1, label:"Emaciated", desc:"Ribs, spine, and pelvic bones visible at a distance. No palpable fat.", imageHook:"bcs-dog-1"},
    {bcs:2, label:"Very thin", desc:"Ribs, spine easily visible. Obvious waist and abdominal tuck.", imageHook:"bcs-dog-2"},
    {bcs:3, label:"Thin", desc:"Ribs easily felt, minimal fat cover. Waist and tuck present.", imageHook:"bcs-dog-3"},
    {bcs:4, label:"Ideal (lean)", desc:"Ribs easily felt with slight fat cover. Waist visible from above.", imageHook:"bcs-dog-4"},
    {bcs:5, label:"Ideal", desc:"Ribs easily felt. Visible waist behind ribs and abdominal tuck.", imageHook:"bcs-dog-5"},
    {bcs:6, label:"Slightly heavy", desc:"Ribs felt with slight excess fat cover. Waist discernible but not prominent.", imageHook:"bcs-dog-6"},
    {bcs:7, label:"Heavy", desc:"Ribs felt with difficulty under heavy fat. Waist barely visible or absent.", imageHook:"bcs-dog-7"},
    {bcs:8, label:"Obese", desc:"Ribs not felt under heavy fat cover. No waist. Abdominal distension.", imageHook:"bcs-dog-8"},
    {bcs:9, label:"Severely obese", desc:"Massive fat deposits. No waist or tuck. Marked abdominal distension.", imageHook:"bcs-dog-9"},
  ],
  cat: [
    {bcs:1, label:"Emaciated", desc:"Ribs, spine, pelvic bones visible. No palpable fat. Severe abdominal tuck.", imageHook:"bcs-cat-1"},
    {bcs:2, label:"Very thin", desc:"Ribs easily visible, minimal muscle mass. Pronounced abdominal tuck.", imageHook:"bcs-cat-2"},
    {bcs:3, label:"Thin", desc:"Ribs easily palpated, minimal fat cover. Abdominal tuck present.", imageHook:"bcs-cat-3"},
    {bcs:4, label:"Ideal (lean)", desc:"Ribs palpable with slight fat cover. Waist visible behind ribs.", imageHook:"bcs-cat-4"},
    {bcs:5, label:"Ideal", desc:"Well-proportioned. Ribs palpable, visible waist, minimal abdominal fat pad.", imageHook:"bcs-cat-5"},
    {bcs:6, label:"Slightly heavy", desc:"Ribs palpable with slight excess fat. Waist discernible, abdominal fat pad present.", imageHook:"bcs-cat-6"},
    {bcs:7, label:"Heavy", desc:"Ribs felt with difficulty. Noticeable rounding of abdomen, moderate fat pad.", imageHook:"bcs-cat-7"},
    {bcs:8, label:"Obese", desc:"Ribs not felt under heavy fat. Distended abdomen, prominent fat pad.", imageHook:"bcs-cat-8"},
    {bcs:9, label:"Severely obese", desc:"Massive fat deposits over chest, abdomen, and base of tail.", imageHook:"bcs-cat-9"},
  ],
};

const AGE_GUESS = {puppy:0.5, young:2, adult:5, senior_guess:8}; // legacy fallback map; seniorGuessAge() is preferred for the size-aware case

return {
  dogSizeClass, DOG_SENIOR_ONSET, lifeStage, lifeStageDisplay, PUPPY_CUTOFF_YEARS,
  ageFraction, expectedFIContinuous, breedModifier, CHONDRODYSTROPHIC_BREEDS, BRACHY_BREEDS,
  estimatePhysiologicalAge, classifyDelta, scoreActivityMinutes, seniorGuessAge,
  getActivityMinutesThreshold, ACTIVITY_BREED_OVERRIDES, activityGuidance,
  ACTIVITY_UPPER_RATIO_CAUTION, ACTIVITY_UPPER_RATIO_MAX,
  overweightPercentile, fuseAge, deltaPercentOfAge, BCS_CHART,
  bandYears, fiZone, healthScore, healthMultiplier, foodActivityBalance,
  foodEquationMultiplier, foodBalancePercentile,
  catHumanEquivalent, dogHumanEquivalent, bcsToDeficit, AGE_GUESS,
  FRAILTY_MODEL_CONFIG, ACTIVITY_MINUTES_TABLE,
};

});
