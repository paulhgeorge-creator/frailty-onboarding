/* Young-dog stage content. Exemplar breed: French Bulldog (BOAS).
   UMD-style export, matching frailty-model.js - works as
   <script src="content/young-dog.js"> and via require() from Node tests.

   `questions` entries are either a plain string (an existing PART1-4
   question id from index.html that still applies at this life stage - the
   loader resolves the string against those arrays rather than duplicating
   the question object) or a full question object (net-new item, only used
   where a stage specifically needed one - none for this stage, see
   ceo-plans/2026-07-16-life-stage-breed-surveys.md).

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
  "mob_gate", "p1_activity", "p1_exhaustion", "p3_exercise_tolerance", "p3_muscle",
  "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
  "appetite_weight_gate", "appetite_weight_detail",
  "coat_dental_skin_gate", "coat_dental_skin_detail",
  "water_urination_continence_gate", "water_detail",
  "p3_digestion", "p3_breathing", "temperature_pain_gate", "discomfort_detail",
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
