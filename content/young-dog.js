/* Young-dog stage content. Exemplar breed: French Bulldog (BOAS).
   UMD-style export, matching frailty-model.js - works as
   <script src="content/young-dog.js"> and via require() from Node tests.

   `questions` entries are one of three things: a plain string (an existing
   PART1-4 question id, unchanged text - the loader resolves it against those
   arrays), an override object `{id, text}` (same id, so identical
   opts/dependsOn/scoring - "the same calculations" - just reworded for this
   stage/breed), or a full net-new question object (none needed for this
   stage). Overrides below reword breathing/skin/weight questions toward
   BOAS/brachycephalic-relevant framing and soften mob_gate away from
   aging-decline language that doesn't fit a young dog.

   MECE note: p2_cognition/p2_cognition_detail are deliberately excluded -
   canine cognitive dysfunction is an age-related syndrome (Salvin et al.
   2011; Madari et al. 2015) with no developmental relevance to young dogs,
   so asking about it here would be the exact "don't ask a puppy owner about
   senior stuff" problem this whole project pass exists to fix. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.PawlStageContent = root.PawlStageContent || {}; root.PawlStageContent["young-dog"] = factory(); }
})(typeof self !== "undefined" ? self : this, function () {

const sources = [
  {id:"oneill2023osa", title:"Dog breeds and conformations predisposed to osteosarcoma in the UK: a VetCompass study", author:"O'Neill DG et al.", year:2023, url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10294386/"},
  {id:"boas-fbdog", title:"BOAS prevalence and owner/veterinary-diagnosis gap in French Bulldogs (peer-reviewed prevalence study)", author:"see URL - specific author list not independently re-verified this pass", year:2022, url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10702215/"},
  {id:"fgf4-chondro", title:"FGF4 retrogene insertion (12-FGF4RG) and disc calcification risk in chondrodystrophic breeds including French Bulldog", author:"Reunanen VLJ et al.", year:2025, url:"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12577395/"},
];

const questions = [
  {id:"mob_gate", text:{both:"Any reluctance to keep up on runs or hikes, or stiffness after an active day?"}},
  "p1_activity", "p1_exhaustion", "p3_exercise_tolerance", "p3_muscle",
  "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
  {id:"appetite_weight_gate", text:{both:"Weight creeping up now that growth has slowed but portions haven't, or any other appetite change?"}},
  "appetite_weight_detail",
  {id:"coat_dental_skin_gate", text:{both:"New skin-fold irritation, or dental tartar starting to build up?"}},
  "coat_dental_skin_detail",
  "water_urination_continence_gate", "water_detail",
  "p3_digestion",
  {id:"p3_breathing", text:{both:"Noisy or labored breathing, snoring, or reduced tolerance for heat and exercise?"}},
  {id:"temperature_pain_gate", text:{both:"New sensitivity to heat, flinching when touched, or vocalizing?"}},
  "discomfort_detail",
  "p4_diagnoses", "p4_medications", "p4_vet_visits", "p4_dental_history",
  "p4_surgical_history", "p4_bloodwork", "p4_organ_findings", "p4_owner_concern",
];

const watchFor = [
  "Noisy or labored breathing, snoring, or reduced tolerance for heat/exercise - common brachycephalic-breed signs that show up well before a formal diagnosis",
  "Sudden reluctance to jump, yelping, or a hunched back - an early chondrodystrophic-breed spinal-disc signal worth a same-day vet call, not a wait-and-see",
  "Dental tartar building up unnoticed - easy to miss at this age since it rarely causes an obvious symptom yet",
];

const breedRiskNotes = [
  {tags:["brachycephalic"],
    text:"Watch for noisy or labored breathing, snoring, or reduced heat/exercise tolerance. One peer-reviewed prevalence study found 64% of French Bulldogs showed owner-observable BOAS signs, but only 13% had a formal vet diagnosis - a real diagnostic gap this kind of question is meant to help close.",
    sourceIds:["boas-fbdog"]},
  {tags:["chondrodystrophic"],
    text:"Chondrodystrophic breeds (Dachshunds, Corgis, Basset Hounds, French Bulldogs themselves) carry a real, breed-typical early spinal-disc risk (FGF4 retrogene-driven). Sudden reluctance to jump, yelping, or a hunched back at any age is worth a same-day vet call.",
    sourceIds:["fgf4-chondro"]},
  {tags:["giant"],
    text:"Giant-breed puppies/young adults grow fast on a body frame that reaches full size quickly - keep an eye on any persistent limping or reluctance to exercise rather than assuming it's normal growing pains.",
    sourceIds:[]},
  {tags:["generic"],
    text:"No specific breed-risk flagged for this pet - the general mobility, breathing, and body-condition questions below still cover the most common young-dog concerns.",
    sourceIds:[]},
];

return {species:"dog", stage:"young", exemplarBreed:"French Bulldog", questions, watchFor, breedRiskNotes, sources};

});
