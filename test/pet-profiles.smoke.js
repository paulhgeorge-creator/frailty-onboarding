/* Runs every named pet profile through the full scoring pipeline (all 4
   rounds' worth of answers) and prints a one-line summary each - a quick
   spread-check before a stakeholder review, not a pass/fail test suite. */
const M = require("../frailty-model.js");
const { PROFILES } = require("./pet-profiles.js");

function chronAgeFor(profile){
  return M.AGE_GUESS[profile.baseline.ageGuess] ?? 5;
}

for (const profile of PROFILES) {
  const { species, weight, breed } = profile.baseline;
  const scores = Object.values(profile.answers);
  const observedFI = scores.reduce((a,b)=>a+b,0) / scores.length;
  const age = chronAgeFor(profile);
  const { center, delta } = M.estimatePhysiologicalAge({species, chronAge: age, weightKg: weight, breed, observedFI});
  let band = M.bandYears(scores.length);
  if (species === "cat") band *= 1.3;
  const low = Math.max(0.1, center - band), high = center + band;
  const stage = M.lifeStage(species, age, weight);
  const zone = M.fiZone(observedFI);
  const deltaCategory = M.classifyDelta(delta);

  console.log(
    `${profile.name.padEnd(45)} chronAge=${age.toFixed(1).padStart(4)}  ` +
    `range=${low.toFixed(1)}-${high.toFixed(1).padEnd(4)}  ` +
    `stage=${stage.padEnd(6)}  zone=${zone.label.padEnd(22)}  ${deltaCategory}` +
    (zone.vet ? "  [VET]" : "")
  );
}
