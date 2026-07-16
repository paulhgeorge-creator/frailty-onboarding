/* Puppy (dog, <1yr) bonding content. Deliberately a SEPARATE schema from
   content/{young,middle,senior}-dog.js - those are FI-scoring-coupled
   ({questions[] with opts/dependsOn/detailOnly semantics feeding
   categoryFI()/observedFI}). This flow has zero scoring: per product
   direction, puppies/kittens get preventative, psychology-led content
   (bonding, socialization, dependency prevention), not a clinical/frailty
   Longevity Score. `prompts` are simple multiple-choice reflection
   questions stored in state.bonding (never state.answers), used only to
   pick a more relevant tip at the end - never fed into idsForPart()/
   categoryFI()/computeResult() anywhere. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.PawlBondingContent = root.PawlBondingContent || {}; root.PawlBondingContent["puppy-dog"] = factory(); }
})(typeof self !== "undefined" ? self : this, function () {

const prompts = [
  {id:"bond_alone_time", text:"How does your puppy handle being left alone for a short while?",
    opts:[{v:"settles",label:"Settles fine"},{v:"fuss",label:"Some whining or barking"},{v:"distress",label:"Real distress - crying, scratching, destructive"}]},
  {id:"bond_socialization", text:"How much variety of new people, dogs, and places have they been exposed to so far?",
    opts:[{v:"lots",label:"Lots of variety"},{v:"some",label:"Some"},{v:"little",label:"Mostly just home"}]},
  {id:"bond_handling", text:"How do they react to being touched or handled - paws, ears, mouth?",
    opts:[{v:"comfortable",label:"Comfortable"},{v:"squirmy",label:"A little squirmy"},{v:"avoids",label:"Avoids it or nips"}]},
  {id:"bond_routine", text:"Do they have a predictable daily routine - feeding, walks, sleep?",
    opts:[{v:"consistent",label:"Yes, pretty consistent"},{v:"somewhat",label:"Somewhat"},{v:"random",label:"Pretty random day to day"}]},
];

/* One tip per prompt, keyed by the answer that most needs a nudge - the
   "settles"/"lots"/"comfortable"/"consistent" (healthiest) answers get a
   simple affirmation instead, so this never reads as a scored pass/fail. */
const TIPS = {
  bond_alone_time: {
    settles: "Great sign - keep alone-time sessions short and positive so it stays that way as they grow.",
    fuss: "A little fuss when you leave is normal at this age - build up alone-time gradually, starting with just a minute or two.",
    distress: "Real distress when left alone is worth addressing early - short, calm practice departures (even just stepping outside for 30 seconds) help prevent this from becoming separation anxiety later.",
  },
  bond_socialization: {
    lots: "Keep it up - varied, positive early exposure is one of the best predictors of a confident adult dog.",
    some: "Try to add one new person, place, or gentle dog interaction a week - the socialization window closes faster than it feels like it should.",
    little: "Worth prioritizing now - this window for easy, low-stress socialization is narrower than most owners expect, and it's much harder to build confidence later than now.",
  },
  bond_handling: {
    comfortable: "Great foundation - this will make vet visits and grooming much easier for life.",
    squirmy: "Normal at this age - short, positive handling sessions (a few seconds, then a treat) build tolerance gradually.",
    avoids: "Worth gentle, gradual work now - a puppy who avoids handling often becomes an adult dog who's hard to examine or groom; short positive-only sessions help.",
  },
  bond_routine: {
    consistent: "Consistency is one of the best things you can offer a young puppy - keep it up.",
    somewhat: "Even a rough routine helps - predictable feeding/walk/sleep times reduce anxiety more than most owners expect.",
    random: "Worth tightening up if you can - a predictable routine is one of the simplest ways to help a young puppy feel secure.",
  },
};

return {species:"dog", stage:"puppy", prompts, tips: TIPS};

});
