/* Senior-dog stage content. Exemplar breed: Great Dane (giant-breed early
   senior onset, osteosarcoma). UMD-style export, matching frailty-model.js.

   Net-new cognition module (cherry-pick #3, ceo-plans doc): replaces the
   old p2_cognition/p2_cognition_detail pair with a deeper, paraphrased
   module inspired by CADES (Madari et al. 2015) and CCDR (Salvin et al.
   2011) domain structure - NOT a verbatim reproduction of either published
   instrument (licensing/reproduction-rights unconfirmed, see plan doc), and
   deliberately NOT a full 13-17 item copy of either scale. Instead it adds
   only the two domains genuinely uncovered elsewhere in this app's question
   set: house-soiling (a validated, later-emerging CADES factor) and
   aimless/repetitive activity (a classic DISHA-style marker distinct from
   p1_activity's exercise-minutes or mob_gate's physical mobility check).
   Disorientation keeps the existing p2_cognition wording/refine mechanism;
   sleep-wake and social-interaction domains are deliberately NOT duplicated
   here since p2_sleep and p2_interaction already cover them at a general
   level - adding cognition-flavored twins would double-count the same
   underlying deficit in the FI denominator.
   FI integration: cog_* ids are plain SCALE3-scored items feeding the same
   categoryFI()/observedFI Round-2 aggregation p2_* items already use - not
   a second, parallel score. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.PawlStageContent = root.PawlStageContent || {}; root.PawlStageContent["senior-dog"] = factory(); }
})(typeof self !== "undefined" ? self : this, function () {

const sources = [
  {id:"oneill2023osa", title:"Dog breeds and conformations predisposed to osteosarcoma in the UK: a VetCompass study", author:"O'Neill DG et al.", year:2023, url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10294386/"},
  {id:"madari2015cades", title:"Assessment of severity and progression of canine cognitive dysfunction syndrome using the CAnine DEmentia Scale (CADES)", author:"Madari A et al.", year:2015, url:"https://doi.org/10.1016/j.applanim.2015.08.034"},
  {id:"salvin2011ccdr", title:"Development of a novel owner-based method for assessing canine cognitive decline (CCDR)", author:"Salvin HE, McGreevy PD, Sachdev PS, Valenzuela MJ", year:2011, url:"https://www.sciencedirect.com/science/article/abs/pii/S1090023310001644"},
  {id:"fgf4-chondro", title:"FGF4 retrogene insertion (12-FGF4RG) and disc calcification risk in chondrodystrophic breeds", author:"Reunanen VLJ et al.", year:2025, url:"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12577395/"},
];

const questions = [
  {id:"mob_gate", text:{both:"Any new stiffness getting up, reluctance on stairs, or a limp that's stuck around?"}},
  "p1_activity", "p1_exhaustion",
  {id:"p3_exercise_tolerance", text:{both:"Stopping to rest on normal walks that didn't used to bother them?"}},
  {id:"p3_muscle", text:{both:"Noticeable muscle loss over the back or hind legs?"}},
  "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
  {id:"cog_disorientation", round:2, text:{both:"Getting \"stuck\" in corners, doorways, or under furniture, staring blankly at walls, or seeming confused in familiar places?"}},
  {id:"cog_disorientation_detail", round:2, detailOnly:true, refines:"cog_disorientation", dependsOn:{id:"cog_disorientation", min:0.5},
    text:{both:"Is that a daily thing, or just occasional?"}, opts:[{v:0.5,label:"Occasional"},{v:1,label:"Daily"}]},
  {id:"cog_house_soiling", round:2, text:{both:"House-training accidents, or forgetting to signal needing to go out, despite no change in routine?"}},
  {id:"cog_house_soiling_detail", round:2, detailOnly:true, refines:"cog_house_soiling", dependsOn:{id:"cog_house_soiling", min:0.5},
    text:{both:"Is that a daily thing, or just occasional?"}, opts:[{v:0.5,label:"Occasional"},{v:1,label:"Daily"}]},
  {id:"cog_activity_change", round:2, text:{both:"New aimless pacing, wandering, or repetitive movements with no clear purpose?"}},
  {id:"appetite_weight_gate", text:{both:"Weight loss or a drop in appetite, or the opposite - weight gain as they've slowed down?"}},
  "appetite_weight_detail",
  {id:"coat_dental_skin_gate", text:{both:"A rougher or duller coat, new dental issues, or new lumps/skin changes?"}},
  "coat_dental_skin_detail",
  {id:"water_urination_continence_gate", text:{both:"Drinking, urinating, or having accidents more than usual - common early kidney/heart-related signs at this age?"}},
  "water_detail",
  "p3_digestion", "p3_breathing", "temperature_pain_gate", "discomfort_detail",
  "p4_gate", "p4_diagnoses", "p4_medications", "p4_vet_visits", "p4_dental_history",
  "p4_surgical_history", "p4_bloodwork", "p4_organ_findings", "p4_owner_concern",
];

const watchFor = [
  "New or worsening limp that doesn't resolve with rest, or swelling on a leg - in giant breeds this is worth imaging, not just a wait-and-see, given their real elevated cancer risk",
  "Getting \"stuck\" in corners, house-training accidents, or aimless pacing with no clear purpose - cognitive-decline signs that are easy to write off as \"just getting old\"",
  "Joint pain and reduced mobility that's crept up gradually enough to not seem urgent",
];

/* Breed-conditional net-new modules. Giant-breed items are a dedicated
   limb/swelling check (separate from the general p3_exercise_tolerance
   above, not a duplicate of it) - the actual owner-observable cancer-watch
   signs the osteosarcoma research flagged. Chondrodystrophic/brachycephalic
   items reuse the same conditions as young-dog.js/middle-dog.js but framed
   for a senior dog specifically ("still" / "at this age" language matching
   the breedRiskNotes copy below), not copy-pasted verbatim. */
const breedConditionalQuestions = [
  {tags:["giant"], questions:[
    {id:"giant_limb_swelling", round:1, text:{both:"Any new swelling, lump, or firm spot on a leg?"}},
    {id:"giant_limp_progression", round:1, text:{both:"A limp that's gotten worse over the past few weeks rather than better?"}},
  ]},
  {tags:["chondrodystrophic"], questions:[
    {id:"ivdd_handling", round:1, text:{both:"Crying out, flinching, or reluctance when picked up or touched along the back - still, at this age?"}},
    {id:"ivdd_gait", round:1, text:{both:"Front or hind legs dragging, knuckling under, or an unsteady/wobbly gait?"}},
  ]},
  {tags:["brachycephalic"], questions:[
    {id:"boas_heat_exercise", round:3, text:{both:"Breathing noisily or needing to stop in warm weather or after modest exercise, even at this age?"}},
  ]},
];

const breedRiskNotes = [
  {tags:["giant"],
    text:"Giant breeds carry a real, well-documented elevated osteosarcoma risk (one large UK study found Great Danes at roughly 34x the odds of crossbred dogs) alongside their earlier senior-onset window. A new or worsening limp, or any swelling on a leg, deserves prompt vet attention rather than a wait-and-see - these can look like a normal orthopedic strain at first. (A commonly-cited Great Dane/DCM heart-disease link could not be independently verified this pass and isn't asserted here.)",
    sourceIds:["oneill2023osa"]},
  {tags:["chondrodystrophic"],
    text:"Chondrodystrophic breeds (Dachshunds, Corgis, Basset Hounds, French Bulldogs) can still develop new spinal-disc symptoms in their senior years, not only earlier in life - sudden back pain or hind-leg weakness is still an urgent, same-day concern at this age.",
    sourceIds:["fgf4-chondro"]},
  {tags:["brachycephalic"],
    text:"Brachycephalic breeds' breathing signs (noisy breathing, reduced heat/exercise tolerance) can worsen with age as senior-stage weight or muscle changes add extra strain on an already-narrowed airway.",
    sourceIds:[]},
  {tags:["generic"],
    text:"No specific breed-risk flagged for this pet - the mobility, cognition, and organ-signal questions below still cover the most common senior-dog concerns.",
    sourceIds:[]},
];

return {species:"dog", stage:"senior", exemplarBreed:"Great Dane", questions, watchFor, breedRiskNotes, breedConditionalQuestions, sources};

});
