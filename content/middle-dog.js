/* Middle-dog stage content. Exemplar breed: Dachshund (IVDD).
   UMD-style export, matching frailty-model.js.

   MECE note: unlike young-dog, p2_cognition/p2_cognition_detail stay in the
   active set here - early cognitive decline can start pre-senior (see
   README's Round 2 framing), so excluding it at middle-age would create a
   gap rather than close one. The deeper, validated CADES/CCDR-style module
   is reserved for the senior-dog cell (see senior-dog.js) where cognitive
   decline is the dominant concern, not introduced early. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.PawlStageContent = root.PawlStageContent || {}; root.PawlStageContent["middle-dog"] = factory(); }
})(typeof self !== "undefined" ? self : this, function () {

const sources = [
  {id:"fgf4-chondro", title:"FGF4 retrogene insertion (12-FGF4RG) and disc calcification risk in chondrodystrophic breeds", author:"Reunanen VLJ et al.", year:2025, url:"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12577395/"},
  {id:"oneill2023osa", title:"Dog breeds and conformations predisposed to osteosarcoma in the UK: a VetCompass study", author:"O'Neill DG et al.", year:2023, url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10294386/"},
];

const questions = [
  "mob_gate", "p1_activity", "p1_exhaustion", "p3_exercise_tolerance", "p3_muscle",
  "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
  "p2_cognition", "p2_cognition_detail",
  "appetite_weight_gate", "appetite_weight_detail",
  "coat_dental_skin_gate", "coat_dental_skin_detail",
  "water_urination_continence_gate", "water_detail",
  "p3_digestion", "p3_breathing", "temperature_pain_gate", "discomfort_detail",
  "p4_diagnoses", "p4_medications", "p4_vet_visits", "p4_dental_history",
  "p4_surgical_history", "p4_bloodwork", "p4_organ_findings", "p4_owner_concern",
];

const watchFor = [
  "Sudden back pain, reluctance to jump/climb, dragging or wobbly hind legs - an IVDD emergency sign in chondrodystrophic breeds, not a normal stiff-day",
  "Weight creeping up as metabolism quietly slows while feeding habits stay the same",
  "Early joint stiffness or reduced stamina on walks that wasn't there a year or two ago",
];

const breedRiskNotes = [
  {tags:["chondrodystrophic"],
    text:"Dachshunds and other chondrodystrophic breeds (Corgis, Basset Hounds, French Bulldogs) carry a real, breed-typical early spinal-disc risk (FGF4-driven). Sudden back pain, reluctance to jump, or dragging/wobbly hind legs is an IVDD emergency sign - same-day vet visit, not wait-and-see.",
    sourceIds:["fgf4-chondro"]},
  {tags:["brachycephalic"],
    text:"Brachycephalic breeds (French Bulldogs, Pugs, Bulldogs) can still show BOAS-type breathing signs well into middle age, not just as puppies - noisy breathing, reduced heat tolerance, or exercise avoidance are worth mentioning at a checkup even if they've 'always been like that.'",
    sourceIds:[]},
  {tags:["giant"],
    text:"Giant breeds are already approaching their earlier senior-onset window at this stage (they age on a compressed timeline) - joint stiffness or reduced stamina that would be unremarkable in a small-breed middle-aged dog deserves a closer look here.",
    sourceIds:[]},
  {tags:["generic"],
    text:"No specific breed-risk flagged for this pet - the general mobility, weight, and organ-signal questions below still cover the most common middle-age concerns.",
    sourceIds:[]},
];

return {species:"dog", stage:"middle", exemplarBreed:"Dachshund", questions, watchFor, breedRiskNotes, sources};

});
