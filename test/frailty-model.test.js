const assert = require("node:assert/strict");
const M = require("../frailty-model.js");

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok  -", name); }
  catch (e) { failed++; console.error("FAIL -", name, "\n     ", e.message); }
}

/* ---------- 1. Bulldog: breed-typical breathing/skin, otherwise stable ---------- */
test("bulldog: breed modifier detected, control breed unaffected", () => {
  assert.ok(M.breedModifier("English Bulldog") > 0);
  assert.equal(M.breedModifier("Mixed breed"), 0);
});
test("bulldog: same symptoms read less concerning than an identical non-brachy dog", () => {
  const args = {species:"dog", chronAge:4, weightKg:22, observedFI: 2/25}; // p3_breathing=1, p2_skin=0.5, p1_coat=0.5 of 25 answered
  const bulldog = M.estimatePhysiologicalAge({...args, breed:"English Bulldog"});
  const control = M.estimatePhysiologicalAge({...args, breed:"Mixed breed"});
  assert.ok(bulldog.delta < control.delta, "breed modifier should pull the bulldog's delta down relative to an identical-symptom non-brachy dog");
  assert.ok(bulldog.delta <= 0.5, "should not read as prematurely aging despite breed-typical findings");
  assert.equal(M.fiZone(2/25).vet, false);
  assert.notEqual(M.lifeStage("dog", 4, 22), "senior");
});

/* ---------- 2. Dachshund: low activity owner calls "normal for him" ---------- */
test("dachshund: minutes-based scoring flags low activity as a real deficit", () => {
  assert.equal(M.scoreActivityMinutes("dog", 10, 8), 1); // small dog, 30min threshold, 10min is well below
});
test("dachshund: activity-minutes signal shifts the estimate vs. a masked self-report", () => {
  const base = {species:"dog", chronAge:6, weightKg:8, breed:"Dachshund"};
  const withDeficit = M.estimatePhysiologicalAge({...base, observedFI: 1/25}); // p1_activity scored 1 (from minutes)
  const withoutDeficit = M.estimatePhysiologicalAge({...base, observedFI: 0/25}); // as an owner's "no change" self-report would have scored
  assert.ok(withDeficit.delta > withoutDeficit.delta, "objectively-measured low activity should surface a signal a subjective self-report could miss");
});
test("expectedFIContinuous is continuous at the middle/senior fraction boundary", () => {
  // small dog: seniorAge=11, middleAge=11*0.6=6.6 -> chronAge=6.6 sits exactly at fraction=1
  assert.equal(M.ageFraction("dog", 6.6, 8), 1);
  assert.equal(M.expectedFIContinuous("dog", 6.6, 8), M.FRAILTY_MODEL_CONFIG.EXPECTED_FI_ANCHORS.middle);
});

/* ---------- 3. Great Dane ~8yo genuinely declining ---------- */
test("great dane: real decline reads as senior with elevated frailty (fix isn't one-directional)", () => {
  const r = M.estimatePhysiologicalAge({species:"dog", chronAge:8, weightKg:65, breed:"Great Dane", observedFI:0.42});
  assert.equal(M.lifeStage("dog", 8, 65), "senior"); // giant breed: seniorAge=6, chronAge 8 > 6
  assert.ok(r.delta > 0);
  assert.equal(M.fiZone(0.42).vet, true);
});

/* ---------- 4. Healthy seniors (small dog, large dog, cat) should not collapse young ---------- */
test("healthy senior small dog does not collapse toward a young estimate", () => {
  const r = M.estimatePhysiologicalAge({species:"dog", chronAge:13, weightKg:4, breed:"Chihuahua", observedFI:0.24});
  assert.ok(Math.abs(r.delta) < 2);
  assert.ok(r.center > 13 / 2);
  assert.equal(M.lifeStage("dog", 13, 4), "senior");
});
test("healthy senior large dog does not collapse toward a young estimate", () => {
  const r = M.estimatePhysiologicalAge({species:"dog", chronAge:10, weightKg:32, breed:"Labrador", observedFI:0.26});
  assert.ok(Math.abs(r.delta) < 2);
  assert.ok(r.center > 10 / 2);
  assert.equal(M.lifeStage("dog", 10, 32), "senior");
});
test("healthy senior cat does not collapse toward a young estimate", () => {
  const r = M.estimatePhysiologicalAge({species:"cat", chronAge:14, weightKg:4.5, breed:"Domestic Shorthair", observedFI:0.24});
  assert.ok(Math.abs(r.delta) < 2);
  assert.ok(r.center > 14 / 2);
  assert.equal(M.lifeStage("cat", 14, 4.5), "senior");
});

/* ---------- 5. Young unhealthy pet: elevated frailty despite youth, exercises the clamp ---------- */
test("young unhealthy dog still reads elevated frailty, hits the delta clamp", () => {
  const r = M.estimatePhysiologicalAge({species:"dog", chronAge:2, weightKg:12, breed:"Beagle", observedFI:0.6});
  assert.equal(r.delta, M.FRAILTY_MODEL_CONFIG.MAX_DELTA_YEARS);
  assert.equal(r.center, 2 + M.FRAILTY_MODEL_CONFIG.MAX_DELTA_YEARS);
  assert.equal(M.fiZone(0.6).vet, true);
  assert.equal(M.lifeStage("dog", 2, 12), "young"); // stage label describes the pet's actual age, zone/delta carry the concern
});

/* ---------- 6. Unknown DOB / estimated age: estimation path still works ---------- */
test("unknown-DOB cat: estimation pipeline runs cleanly off a guessed age", () => {
  // Previously index.html used a flat AGE_GUESS.senior_guess=8 for every
  // species/size, which for cats fell in the "middle" life-stage bucket
  // instead of "senior" - a pre-existing quirk. seniorGuessAge() (this pass)
  // fixes it by asking per species/size instead of using a flat guess.
  const guessedAge = M.seniorGuessAge("cat", 4);
  assert.equal(guessedAge, 11);
  const r = M.estimatePhysiologicalAge({species:"cat", chronAge:guessedAge, weightKg:4, breed:"Maine Coon", observedFI:0.18});
  assert.ok(Number.isFinite(r.center) && r.center > 0);
  assert.equal(M.lifeStage("cat", guessedAge, 4), "senior");
});

/* ---------- 7. Chondrodystrophic breed modifier, no double-count on overlap ---------- */
test("dachshund: chondro-only modifier applies, smaller than a bulldog's brachy modifier", () => {
  const dachshund = M.breedModifier("Miniature Dachshund");
  const bulldog = M.breedModifier("English Bulldog");
  assert.ok(dachshund > 0);
  assert.ok(dachshund < bulldog);
});
test("shih tzu: in both brachy and chondro lists, gets max not sum", () => {
  const shihTzu = M.breedModifier("Shih Tzu");
  assert.equal(shihTzu, M.FRAILTY_MODEL_CONFIG.BRACHY_BREED_FI_MODIFIER);
});

/* ---------- 8. Cat delta dampening - no feline FI-age curve exists ---------- */
test("cat delta is dampened relative to an identical-input dog", () => {
  const args = {chronAge:8, weightKg:5, breed:"Mixed", observedFI:0.3};
  const dog = M.estimatePhysiologicalAge({...args, species:"dog"});
  const cat = M.estimatePhysiologicalAge({...args, species:"cat"});
  assert.ok(Math.abs(cat.delta) < Math.abs(dog.delta));
});

/* ---------- 9. Size-based senior guess replaces the old flat 8yr guess ---------- */
test("senior guess age varies by dog size, flat for cats", () => {
  assert.ok(M.seniorGuessAge("dog", 60) < M.seniorGuessAge("dog", 5));
  assert.equal(M.seniorGuessAge("cat", 4), 11);
  assert.equal(M.seniorGuessAge("cat", 8), 11);
});

/* ---------- 10. Dog human-year parity (Wang 2020) ---------- */
test("dogHumanEquivalent matches the Wang 2020 worked examples", () => {
  assert.ok(Math.abs(M.dogHumanEquivalent(1) - 31) < 1);
  assert.ok(Math.abs(M.dogHumanEquivalent(12) - 70) <= 1);
});

/* ---------- 11. Extensible breed/size activity thresholds ---------- */
test("activity threshold: breed override beats size-class default", () => {
  // Border Collie is medium-sized by weight but overridden to a higher bar
  assert.equal(M.getActivityMinutesThreshold("dog", 20, "Border Collie"), 90);
  assert.notEqual(M.getActivityMinutesThreshold("dog", 20, "Border Collie"),
                   M.ACTIVITY_MINUTES_TABLE.dog.medium);
});
test("activity threshold: falls back to size-class default when breed unknown", () => {
  assert.equal(M.getActivityMinutesThreshold("dog", 20, "Mixed breed"), M.ACTIVITY_MINUTES_TABLE.dog.medium);
  assert.equal(M.getActivityMinutesThreshold("dog", 20, ""), M.ACTIVITY_MINUTES_TABLE.dog.medium);
});
test("scoreActivityMinutes still works without a breed argument (back-compat)", () => {
  assert.equal(M.scoreActivityMinutes("dog", 10, 8), 1);
});
test("scoreActivityMinutes flags a likely-overexertion high end, not just a low end", () => {
  // medium dog, 45min threshold: 90min (2x) is a caution zone, 150min (3.3x) reads as overexertion
  assert.equal(M.scoreActivityMinutes("dog", 45, 20), 0);   // right at target - no flag either direction
  assert.equal(M.scoreActivityMinutes("dog", 90, 20), 0.5); // just past the caution multiplier
  assert.equal(M.scoreActivityMinutes("dog", 150, 20), 1);  // past the overexertion multiplier
});
test("activityGuidance exposes the same numbers scoreActivityMinutes uses internally", () => {
  const g = M.activityGuidance("dog", 20, "");
  assert.equal(g.target, M.ACTIVITY_MINUTES_TABLE.dog.medium);
  assert.equal(g.safeMax, g.target * M.ACTIVITY_UPPER_RATIO_CAUTION);
});

/* ---------- 12. Overweight percentile - real prevalence-anchored ---------- */
test("overweightPercentile: BCS anchors match cited prevalence stats exactly", () => {
  assert.equal(M.overweightPercentile("dog", 8), 22); // cited "22% obese" dogs
  assert.equal(M.overweightPercentile("dog", 6), 59); // cited "59% overweight-or-obese" dogs
  assert.equal(M.overweightPercentile("cat", 8), 33); // cited "33% obese" cats
  assert.equal(M.overweightPercentile("cat", 6), 61); // cited "61% overweight-or-obese" cats
});
test("overweightPercentile: ideal/underweight BCS returns null, not a fabricated number", () => {
  assert.equal(M.overweightPercentile("dog", 5), null);
  assert.equal(M.overweightPercentile("dog", 2), null);
});
test("overweightPercentile: monotonic - heavier BCS never ranks a lower percentile", () => {
  assert.ok(M.overweightPercentile("dog", 9) < M.overweightPercentile("dog", 8));
  assert.ok(M.overweightPercentile("dog", 8) < M.overweightPercentile("dog", 7));
  assert.ok(M.overweightPercentile("dog", 7) < M.overweightPercentile("dog", 6));
});

/* ---------- 13. Confidence-weighted age fusion ---------- */
test("fuseAge: exact DOB signal dominates a low-confidence guess", () => {
  const r = M.fuseAge([{years:8, confidence:1}, {years:3, confidence:0.1}]);
  assert.ok(Math.abs(r.years - 8) < 0.5, "high-confidence signal should dominate the average");
});
test("fuseAge: zero-confidence signal (untrained photo model) contributes nothing", () => {
  const withPhoto = M.fuseAge([{years:8, confidence:1}, {years:1, confidence:0}]);
  const withoutPhoto = M.fuseAge([{years:8, confidence:1}]);
  assert.equal(withPhoto.years, withoutPhoto.years, "a confidence:0 signal must not shift the fused age at all");
});
test("fuseAge: no valid signals returns null years, zero confidence", () => {
  const r = M.fuseAge([]);
  assert.equal(r.years, null);
  assert.equal(r.confidence, 0);
});

/* ---------- 14. Delta as a percentage of chronological age ---------- */
test("deltaPercentOfAge: real ratio, not an invented number", () => {
  assert.equal(M.deltaPercentOfAge(1, 10), 10);
  assert.equal(M.deltaPercentOfAge(-2, 8), -25);
  assert.equal(M.deltaPercentOfAge(1, 0), 0); // guards divide-by-zero
});

/* ---------- 15. BCS chart data sanity ---------- */
test("BCS_CHART: 9-point scale for both species, ideal band at 4-5", () => {
  ["dog","cat"].forEach(species=>{
    assert.equal(M.BCS_CHART[species].length, 9);
    const ideal = M.BCS_CHART[species].filter(c=>c.bcs===4||c.bcs===5);
    ideal.forEach(c=> assert.ok(/ideal/i.test(c.label)));
  });
});

/* ---------- 16. Display-only puppy/kitten stage bucket ---------- */
test("lifeStageDisplay: under-1yo reads as puppy regardless of species/size, doesn't touch lifeStage()", () => {
  assert.equal(M.lifeStageDisplay("dog", 0.5, 30), "puppy");
  assert.equal(M.lifeStageDisplay("cat", 0.5, 4), "puppy");
  assert.equal(M.lifeStage("dog", 0.5, 30), "young", "the FI-curve bucket is untouched by the display bucket");
});
test("lifeStageDisplay: 1yo+ falls through to the existing 3-bucket lifeStage()", () => {
  assert.equal(M.lifeStageDisplay("dog", 8, 65), M.lifeStage("dog", 8, 65));
});

/* ---------- 17. WHOOP-style Longevity Score reuses fiZone's own breakpoints ---------- */
test("longevityScore: anchored at fiZone's own breakpoints, monotonically decreasing", () => {
  assert.equal(M.longevityScore(0), 100);
  assert.equal(M.longevityScore(0.12), 85);
  assert.equal(M.longevityScore(0.24), 65);
  assert.equal(M.longevityScore(0.4), 40);
  assert.ok(M.longevityScore(0.24) < M.longevityScore(0.12));
  assert.ok(M.longevityScore(0.4) < M.longevityScore(0.24));
  assert.ok(M.longevityScore(1) >= 0);
});

/* ---------- 18. Health multiplier - completion-page metric, distinct from age ---------- */
test("healthMultiplier: 1.0 baseline when observed matches expected exactly", () => {
  assert.equal(M.healthMultiplier(0.16, 0.16), 1);
});
test("healthMultiplier: below 1 when fewer deficits than typical, above 1 when more", () => {
  assert.ok(M.healthMultiplier(0.08, 0.16) < 1);
  assert.ok(M.healthMultiplier(0.32, 0.16) > 1);
});
test("healthMultiplier: clamped to a display-sane range, never wild", () => {
  assert.ok(M.healthMultiplier(1, 0.01) <= 2);
  assert.equal(M.healthMultiplier(0.5, 0), 1, "guards a zero expectedFI denominator");
});

/* ---------- 19. Food & activity balance - soft 0-100, not a hard limit ---------- */
test("foodActivityBalance: all-ideal inputs score 100, all-concerning score 0", () => {
  assert.equal(M.foodActivityBalance({activityDeficit:0, portionScore:0, treatsScore:0}), 100);
  assert.equal(M.foodActivityBalance({activityDeficit:1, portionScore:1, treatsScore:1}), 0);
});
test("foodActivityBalance: averages whatever inputs are actually provided", () => {
  assert.equal(M.foodActivityBalance({activityDeficit:0.5}), 50);
  assert.equal(M.foodActivityBalance({}), null, "no inputs at all - no fabricated number");
});

/* ---------- 20. Food equation multiplier - 0.75x-1.75x, no fabricated tail ---------- */
test("foodEquationMultiplier: perfect balance is best (0.75x), zero balance is worst (1.75x)", () => {
  assert.equal(M.foodEquationMultiplier(100), 0.75);
  assert.equal(M.foodEquationMultiplier(0), 1.75);
  assert.equal(M.foodEquationMultiplier(null), 1);
});
test("foodEquationMultiplier: stays within its own stated limits across the whole 0-100 domain", () => {
  for (let pct = 0; pct <= 100; pct += 10){
    const m = M.foodEquationMultiplier(pct);
    assert.ok(m >= 0.75 && m <= 1.75);
  }
});

/* ---------- 21. Food balance percentile - comparable, explicitly illustrative ---------- */
test("foodBalancePercentile: mirrors the balance score directly, no separate fabricated curve", () => {
  assert.equal(M.foodBalancePercentile(67), 67);
  assert.equal(M.foodBalancePercentile(null), null);
});

/* ---------- 22. Breed-risk-note matching (life-stage survey content) ---------- */
const RISK_NOTES = [
  {tags:["brachycephalic"], text:"BOAS watch-out"},
  {tags:["chondrodystrophic"], text:"IVDD watch-out"},
  {tags:["giant"], text:"Giant-breed watch-out"},
  {tags:["generic"], text:"General watch-out"},
];
test("petBreedTags: brachy + chondro breeds tag by name, unrelated breed tags nothing", () => {
  assert.deepEqual(M.petBreedTags("dog", "French Bulldog", 12), ["brachycephalic"]);
  assert.deepEqual(M.petBreedTags("dog", "Dachshund", 8), ["chondrodystrophic"]);
  assert.deepEqual(M.petBreedTags("dog", "Mixed breed", 20), []);
});
test("petBreedTags: giant is weight-derived (dogSizeClass), not a breed-name list", () => {
  assert.deepEqual(M.petBreedTags("dog", "Great Dane", 55), ["giant"]);
  assert.deepEqual(M.petBreedTags("dog", "Chihuahua", 3), []);
  assert.deepEqual(M.petBreedTags("cat", "Maine Coon", 9), [], "giant tag is dog-only");
});
test("petBreedTags: a breed can carry more than one tag (e.g. brachy + giant)", () => {
  assert.deepEqual(M.petBreedTags("dog", "Bulldog", 45), ["brachycephalic", "giant"]);
});
test("matchBreedRiskNotes: returns the matching tagged note", () => {
  const notes = M.matchBreedRiskNotes("dog", "French Bulldog", 12, RISK_NOTES);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, "BOAS watch-out");
});
test("matchBreedRiskNotes: zero-tag-match pet falls back to the generic note, never empty", () => {
  const notes = M.matchBreedRiskNotes("dog", "Mixed breed", 20, RISK_NOTES);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, "General watch-out");
});
test("matchBreedRiskNotes: multi-tag pet can surface more than one note", () => {
  const notes = M.matchBreedRiskNotes("dog", "Bulldog", 45, RISK_NOTES);
  assert.equal(notes.length, 2);
  assert.deepEqual(notes.map(n => n.text).sort(), ["BOAS watch-out", "Giant-breed watch-out"]);
});

console.log(failed ? `\n${failed} test(s) failed` : "\nAll tests passed");
process.exit(failed ? 1 : 0);
