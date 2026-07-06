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
  // small dog: middleAge=6, seniorAge=10 -> chronAge=6 sits exactly at fraction=1
  assert.equal(M.ageFraction("dog", 6, 8), 1);
  assert.equal(M.expectedFIContinuous("dog", 6, 8), M.FRAILTY_MODEL_CONFIG.EXPECTED_FI_ANCHORS.middle);
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
  const guessedAge = 8; // AGE_GUESS.senior_guess from index.html
  const r = M.estimatePhysiologicalAge({species:"cat", chronAge:guessedAge, weightKg:4, breed:"Maine Coon", observedFI:0.18});
  assert.ok(Number.isFinite(r.center) && r.center > 0);
  // Pre-existing quirk (not introduced by this fix): the "looks senior" age
  // guess (8) falls in the cat model's "middle" bucket (young<7, middle<11),
  // not "senior" — cat life-stage cutoffs and the age-guess buckets aren't
  // aligned. Documented here, not silently treated as a bug in this pass.
  assert.equal(M.lifeStage("cat", guessedAge, 4), "middle");
});

console.log(failed ? `\n${failed} test(s) failed` : "\nAll tests passed");
process.exit(failed ? 1 : 0);
