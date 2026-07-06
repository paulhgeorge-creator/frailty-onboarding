/* Pure frailty/physiological-age scoring functions.
   UMD-style export: works as <script src="frailty-model.js"> in index.html
   and via require() from Node tests — no build step, no dependencies. */
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
const DOG_SENIOR_ONSET = {small:10, medium:10, large:8, giant:6};

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

/* ---------- FRAILTY MODEL CONFIG (interim, pre-calibration) ---------- */
/* ponytail: no calibration dataset exists yet — BETA, MAX_DELTA_YEARS, the
   breed modifier, and the activity-minutes table below are placeholder
   constants, not fit to real longitudinal data.
   TODO(calibration): replace against Montoya et al. 2023 and McMillan et al.
   2024 once real size/breed-stratified FI curves are available.
   NOTE: README.md currently cites "Teng et al. 2024" for this same claim —
   unresolved whether that's the same work under a different lead author or a
   genuinely different source. Flagged, not silently reconciled. */
const FRAILTY_MODEL_CONFIG = {
  BETA: 20,                           // years of physiological-age shift per unit of FI delta
  MAX_DELTA_YEARS: 6,                 // hard clamp on |delta| regardless of how extreme observedFI is
  EXPECTED_FI_ANCHORS: {young:0.08, middle:0.16, senior:0.24}, // curve anchors, not step buckets
  BRACHY_BREED_FI_MODIFIER: 0.03,     // added to expectedFI for brachycephalic breeds
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

function breedModifier(breedText){
  if (!breedText) return 0;
  const s = breedText.toLowerCase();
  return BRACHY_BREEDS.some(b => s.includes(b)) ? FRAILTY_MODEL_CONFIG.BRACHY_BREED_FI_MODIFIER : 0;
}

/* ---------- interim scoring model (isolated swap point) ---------- */

function estimatePhysiologicalAge({species, chronAge, weightKg, breed, observedFI}){
  const eFI = expectedFIContinuous(species, chronAge, weightKg) + breedModifier(breed);
  const rawDelta = FRAILTY_MODEL_CONFIG.BETA * (observedFI - eFI);
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
/* ponytail: no real per-breed/species minimum-activity data exists — these
   are illustrative placeholder thresholds (minutes/day of walking+play), not
   derived from veterinary activity guidelines. Swap in real thresholds when
   available. */
const ACTIVITY_MINUTES_TABLE = {
  dog: {small:30, medium:45, large:60, giant:45},
  cat: 20,
};

function scoreActivityMinutes(species, minutes, weightKg){
  if (minutes == null || isNaN(minutes)) return undefined;
  const threshold = species === "cat" ? ACTIVITY_MINUTES_TABLE.cat
                                       : ACTIVITY_MINUTES_TABLE.dog[dogSizeClass(weightKg)];
  const ratio = minutes / threshold;
  if (ratio >= 0.8) return 0;
  if (ratio >= 0.4) return 0.5;
  return 1;
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

function catHumanEquivalent(catAge){
  if (catAge < 1.5) return null;
  return Math.round(4.14*catAge + 15);
}

function bcsToDeficit(bcs){
  const d = Math.abs(bcs - 4.5);
  if (d <= 0.5) return 0;
  if (d <= 1.5) return 0.5;
  return 1;
}

const AGE_GUESS = {puppy:0.5, young:2, adult:5, senior_guess:8}; // used only when DOB unknown

return {
  dogSizeClass, DOG_SENIOR_ONSET, lifeStage,
  ageFraction, expectedFIContinuous, breedModifier,
  estimatePhysiologicalAge, classifyDelta, scoreActivityMinutes,
  bandYears, fiZone, catHumanEquivalent, bcsToDeficit, AGE_GUESS,
  FRAILTY_MODEL_CONFIG, ACTIVITY_MINUTES_TABLE,
};

});
