/* Reusable pet profiles for testing THROUGH THE SYSTEM (not just the pure
   math). Each profile is a full baseline + deficit-answer set matching the
   shape of index.html's `state` object, so it can drive computeResult()
   across all 4 rounds or be pasted into the live app for manual QA.

   Manual QA in the browser:
     1. Open index.html, open devtools console.
     2. Paste the contents of loadProfile below (or `require` this file if
        running via a bundler-less <script> - this file uses the same UMD
        guard as frailty-model.js).
     3. Run: PetProfiles.applyProfile(state, PetProfiles.PROFILES[0], FrailtyModel)
     4. Run: state.step = "result4"; render();
     5. Read the result card for that profile.

   Automated smoke test: node test/pet-profiles.smoke.js runs every profile
   through computeResult-equivalent logic and prints a one-line summary -
   useful for eyeballing the full spread before a stakeholder review. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PetProfiles = factory();
})(typeof self !== "undefined" ? self : this, function () {

const PROFILES = [
  {
    name: "Bulldog - breed-typical, otherwise stable",
    notes: "Breathing/skin issues are breed-normal, not decline. Should NOT read prematurely old.",
    baseline: {species:"dog", name:"Winston", breed:"English Bulldog", weight:22, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"adult", bcs:5},
    activityMinutesPerDay: 35,
    answers: {
      p1_mobility:0, p1_exhaustion:0.5, p1_stiffness:0, p1_appetite:0, p1_coat:0.5, p1_vitality:0,
      p2_vision:0, p2_hearing:0, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0, p2_skin:0.5, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:1, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Dachshund - low activity owner calls \"normal for him\"",
    notes: "Owner self-report would've scored this fine; objective minutes should surface a real signal.",
    baseline: {species:"dog", name:"Otto", breed:"Dachshund", weight:8, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"adult", bcs:6},
    activityMinutesPerDay: 10,
    answers: {
      p1_mobility:0, p1_exhaustion:0, p1_stiffness:0, p1_appetite:0, p1_coat:0, p1_vitality:0.5,
      p2_vision:0, p2_hearing:0, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0, p2_skin:0, p2_weight_trend:0.5,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Great Dane - genuinely declining at ~8yo",
    notes: "Real joint/muscle decline. Should read senior + elevated frailty - proves the fix isn't one-directional.",
    baseline: {species:"dog", name:"Duke", breed:"Great Dane", weight:65, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"senior_guess", bcs:4},
    activityMinutesPerDay: 15,
    answers: {
      p1_mobility:1, p1_exhaustion:1, p1_stiffness:1, p1_appetite:0.5, p1_coat:0, p1_vitality:1,
      p2_vision:0, p2_hearing:0, p2_cognition:1, p2_sleep:0.5, p2_interaction:0, p2_dental:0, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:1, p3_muscle:1, p3_temperature:0.5, p3_pain:1,
      p4_diagnoses:0.5, p4_medications:0.5, p4_vet_visits:0.5, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:1,
    },
  },
  {
    name: "Healthy senior - small dog (Chihuahua)",
    notes: "Should stay near chronological age, not collapse young.",
    baseline: {species:"dog", name:"Pepper", breed:"Chihuahua", weight:4, sexNeuter:"female-spayed", dobKnown:false, ageGuess:"senior_guess", bcs:5},
    activityMinutesPerDay: 25,
    answers: {
      p1_mobility:0, p1_exhaustion:0, p1_stiffness:0.5, p1_appetite:0, p1_coat:0, p1_vitality:0,
      p2_vision:0.5, p2_hearing:0, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0.5, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0.5, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Healthy senior - large dog (Labrador)",
    notes: "Should stay near chronological age, not collapse young.",
    baseline: {species:"dog", name:"Bailey", breed:"Labrador", weight:32, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"senior_guess", bcs:5},
    activityMinutesPerDay: 40,
    answers: {
      p1_mobility:0.5, p1_exhaustion:0, p1_stiffness:0, p1_appetite:0, p1_coat:0, p1_vitality:0,
      p2_vision:0, p2_hearing:0.5, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0.5, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Healthy senior - cat",
    notes: "Should stay near chronological age; wider band expected (feline uncertainty).",
    baseline: {species:"cat", name:"Luna", breed:"Domestic Shorthair", weight:4.5, sexNeuter:"female-spayed", dobKnown:false, ageGuess:"senior_guess", bcs:5},
    activityMinutesPerDay: 15,
    answers: {
      p1_mobility:0, p1_exhaustion:0, p1_stiffness:0.5, p1_appetite:0, p1_coat:0, p1_vitality:0,
      p2_vision:0, p2_hearing:0, p2_cognition:0, p2_sleep:0.5, p2_interaction:0, p2_dental:0.5, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Young unhealthy dog (Beagle, ~2yo)",
    notes: "Should still read elevated frailty despite youth - proves the fix isn't one-directional.",
    baseline: {species:"dog", name:"Rusty", breed:"Beagle", weight:12, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"young", bcs:6},
    activityMinutesPerDay: 10,
    answers: {
      p1_mobility:1, p1_exhaustion:1, p1_stiffness:1, p1_appetite:0.5, p1_coat:0.5, p1_vitality:1,
      p2_vision:0, p2_hearing:0, p2_cognition:1, p2_sleep:0.5, p2_interaction:0.5, p2_dental:0, p2_skin:0, p2_weight_trend:0.5,
      p3_water:0.5, p3_urination:0, p3_continence:0, p3_digestion:0.5, p3_breathing:0, p3_exercise_tolerance:1, p3_muscle:0.5, p3_temperature:0, p3_pain:1,
      p4_diagnoses:0.5, p4_medications:0.5, p4_vet_visits:0.5, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:1,
    },
  },
  {
    name: "Unknown DOB - senior-looking cat, estimated age",
    notes: "Confirms the age-guess fallback path still works with the new formula.",
    baseline: {species:"cat", name:"Simba", breed:"Maine Coon", weight:4, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"senior_guess", bcs:5},
    activityMinutesPerDay: 20,
    answers: {
      p1_mobility:0.5, p1_exhaustion:0, p1_stiffness:0, p1_appetite:0, p1_coat:0.5, p1_vitality:0,
      p2_vision:0, p2_hearing:0, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0.5, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Typical healthy adult dog - sanity baseline",
    notes: "Nothing wrong anywhere. Should land close to chronological age, Thriving zone, small band.",
    baseline: {species:"dog", name:"Max", breed:"Labrador", weight:28, sexNeuter:"male-neutered", dobKnown:false, ageGuess:"adult", bcs:5},
    activityMinutesPerDay: 50,
    answers: {
      p1_mobility:0, p1_exhaustion:0, p1_stiffness:0, p1_appetite:0, p1_coat:0, p1_vitality:0,
      p2_vision:0, p2_hearing:0, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
  {
    name: "Senior cat - vet-flagged, needs attention",
    notes: "Multiple systemic signals plus vet-confirmed findings. Should route to the vet banner.",
    baseline: {species:"cat", name:"Whiskers", breed:"Domestic Shorthair", weight:3.8, sexNeuter:"female-spayed", dobKnown:false, ageGuess:"senior_guess", bcs:3},
    activityMinutesPerDay: 8,
    answers: {
      p1_mobility:1, p1_exhaustion:1, p1_stiffness:0.5, p1_appetite:1, p1_coat:0.5, p1_vitality:1,
      p2_vision:0.5, p2_hearing:0, p2_cognition:0.5, p2_sleep:0.5, p2_interaction:0.5, p2_dental:0.5, p2_skin:0, p2_weight_trend:1,
      p3_water:1, p3_urination:1, p3_continence:0.5, p3_digestion:0.5, p3_breathing:0, p3_exercise_tolerance:1, p3_muscle:1, p3_temperature:0.5, p3_pain:0.5,
      p4_diagnoses:1, p4_medications:1, p4_vet_visits:1, p4_dental_history:0.5, p4_surgical_history:0, p4_bloodwork:1, p4_organ_findings:1, p4_owner_concern:1,
    },
  },
  {
    name: "Fit senior dog - high activity, staying spry",
    notes: "Contrast case for stakeholder review: genuinely fit senior should read 'aging slower than typical'.",
    baseline: {species:"dog", name:"Scout", breed:"Border Collie", weight:18, sexNeuter:"female-spayed", dobKnown:false, ageGuess:"senior_guess", bcs:4},
    activityMinutesPerDay: 60,
    answers: {
      p1_mobility:0, p1_exhaustion:0, p1_stiffness:0, p1_appetite:0, p1_coat:0, p1_vitality:0,
      p2_vision:0, p2_hearing:0, p2_cognition:0, p2_sleep:0, p2_interaction:0, p2_dental:0, p2_skin:0, p2_weight_trend:0,
      p3_water:0, p3_urination:0, p3_continence:0, p3_digestion:0, p3_breathing:0, p3_exercise_tolerance:0, p3_muscle:0, p3_temperature:0, p3_pain:0,
      p4_diagnoses:0, p4_medications:0, p4_vet_visits:0, p4_dental_history:0, p4_surgical_history:0, p4_bloodwork:0, p4_organ_findings:0, p4_owner_concern:0,
    },
  },
];

function applyProfile(state, profile, FrailtyModel) {
  state.baseline = {...profile.baseline, dob: "", weight: profile.baseline.weight};
  state.answers = {...profile.answers};
  state.raw = {p1_activity: profile.activityMinutesPerDay};
  state.answers.p1_bcs = FrailtyModel.bcsToDeficit(profile.baseline.bcs);
  state.answers.p1_activity = FrailtyModel.scoreActivityMinutes(
    profile.baseline.species, profile.activityMinutesPerDay, profile.baseline.weight
  );
  return state;
}

return { PROFILES, applyProfile };

});
