/* Senior-cat stage content. No breed exemplar - research found the working
   pick (Siamese) unsupported: elevated hyperthyroidism risk ties to
   long-haired non-purebred cats, not Siamese specifically, and no other
   breed held up under research for this cell (see
   ceo-plans/2026-07-16-life-stage-breed-surveys.md). Generic senior-cat
   framing instead, anchored on real population-level findings: CKD
   prevalence rises from 1.2% generally to 3.6% at 9y+, hyperthyroidism is
   the most common feline endocrine disease at this stage, and the two
   commonly co-occur (~5.7x odds).

   Net-new mobility module (cherry-pick #2, ceo-plans doc): replaces the
   single mob_gate item with the Enomoto/Lascelles/Gruen (2020) feline DJD
   checklist domains (run / jump up / jump down / stairs up / stairs down /
   chase), paraphrased rather than reproduced verbatim (licensing/
   reproduction-rights unconfirmed for the original published instrument).
   `mob_gate` becomes a DERIVED value (max of the 6 djd_* items below), never
   a directly-answered question in this stage's set, so index.html's 3
   existing `dependsOn:{id:"mob_gate",...}` consumers (p1_exhaustion,
   p3_exercise_tolerance, p3_muscle) and the joint-support food-tag read
   (index.html:1680) keep working unchanged once the loader computes that
   derived value - this file only supplies the 6 raw items, the loader is
   responsible for the roll-up. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.PawlStageContent = root.PawlStageContent || {}; root.PawlStageContent["senior-cat"] = factory(); }
})(typeof self !== "undefined" ? self : this, function () {

const sources = [
  {id:"djd-checklist", title:"Feline musculoskeletal pain / degenerative joint disease owner-observable checklist", author:"Enomoto M, Lascelles BDX, Gruen ME", year:2020, url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC7736399/"},
  {id:"hyperthyroid-ckd", title:"Hyperthyroidism and concurrent chronic kidney disease comorbidity in cats", author:"see URL", year:2022, url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC9543258/"},
];

/* mob_gate deliberately absent from this list - see file header. The 6
   djd_* items replace it; the loader derives mob_gate = max(djd_* answers)
   before handing state to the existing dependsOn/tag-read consumers. */
const questions = [
  {id:"djd_run", round:1, text:{both:"New reluctance or inability to run at a full sprint like they used to?"}},
  {id:"djd_jump_up", round:1, text:{both:"New hesitation or difficulty jumping UP onto furniture or counters?"}},
  {id:"djd_jump_down", round:1, text:{both:"New hesitation or difficulty jumping DOWN from furniture or counters?"}},
  {id:"djd_stairs_up", round:1, text:{both:"New difficulty climbing stairs?"}},
  {id:"djd_stairs_down", round:1, text:{both:"New difficulty going down stairs?"}},
  {id:"djd_chase", round:1, text:{both:"New disinterest or inability to chase toys or moving objects the way they used to?"}},
  "p1_activity", "p1_exhaustion", "p3_exercise_tolerance", "p3_muscle",
  "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
  "p2_cognition", "p2_cognition_detail",
  {id:"appetite_weight_gate", text:{both:"Losing weight despite a normal or increased appetite?"}},
  "appetite_weight_detail",
  {id:"coat_dental_skin_gate", text:{both:"Reduced grooming leading to a rougher coat, or new dental issues?"}},
  "coat_dental_skin_detail",
  {id:"water_urination_continence_gate", text:{both:"Drinking or urinating noticeably more than usual, or new accidents?"}},
  "water_detail",
  "p3_digestion", "p3_breathing", "temperature_pain_gate", "discomfort_detail",
  "p4_gate", "p4_diagnoses", "p4_medications", "p4_vet_visits", "p4_dental_history",
  "p4_surgical_history", "p4_bloodwork", "p4_organ_findings", "p4_owner_concern",
  {id:"senior_screening_history", round:4, text:{both:"Has your vet run senior bloodwork (kidney values, thyroid/T4) in the past year?"}, opts:[{v:0,label:"Yes, tested/screened"},{v:1,label:"No / not sure"}]},
];

const watchFor = [
  "Reluctance or difficulty jumping, running, or using stairs the way they used to - degenerative joint disease is very common in senior cats and very often missed",
  "Unexplained weight loss, increased thirst, or increased appetite despite weight loss - classic early signs of kidney disease or an overactive thyroid, which often occur together",
  "Getting \"stuck\" or seeming confused in familiar places",
];

const breedRiskNotes = [
  {tags:["brachycephalic"],
    text:"Flat-faced senior cats can see their breathing signs worsen with age as weight or muscle changes add extra strain on an already-narrowed airway.",
    sourceIds:[]},
  {tags:["chondrodystrophic"],
    text:"If applicable, sudden reluctance to jump or a hunched posture at any age is worth a same-day vet call rather than a wait-and-see.",
    sourceIds:[]},
  {tags:["generic"],
    text:"Chronic kidney disease and hyperthyroidism are the two most common senior-cat conditions overall - not tied to one specific breed - and often occur together. Unexplained weight loss or increased thirst/appetite is worth a vet visit regardless of breed.",
    sourceIds:["hyperthyroid-ckd"]},
];

return {species:"cat", stage:"senior", exemplarBreed:null, questions, watchFor, breedRiskNotes, sources};

});
