/* Kitten (cat, <1yr) bonding content. Same deliberate separation from the
   scored content/{young,middle,senior}-cat.js schema as puppy-dog.js -
   see that file's header comment for the full reasoning. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.PawlBondingContent = root.PawlBondingContent || {}; root.PawlBondingContent["kitten-cat"] = factory(); }
})(typeof self !== "undefined" ? self : this, function () {

const prompts = [
  {id:"bond_alone_time", text:"How does your kitten handle being left alone for a short while?",
    opts:[{v:"settles",label:"Settles fine"},{v:"fuss",label:"Some crying or pacing"},{v:"distress",label:"Real distress - crying, scratching at doors"}]},
  {id:"bond_socialization", text:"How much variety of handling, new people, and gentle novelty have they been exposed to so far?",
    opts:[{v:"lots",label:"Lots of variety"},{v:"some",label:"Some"},{v:"little",label:"Mostly just home"}]},
  {id:"bond_play_style", text:"How do they play - chasing/pouncing toys, or mostly on people's hands/feet?",
    opts:[{v:"toys",label:"Mostly toys"},{v:"mixed",label:"A mix of both"},{v:"hands",label:"Mostly hands/feet"}]},
  {id:"bond_routine", text:"Do they have a predictable daily routine - feeding, play, litter box access?",
    opts:[{v:"consistent",label:"Yes, pretty consistent"},{v:"somewhat",label:"Somewhat"},{v:"random",label:"Pretty random day to day"}]},
];

const TIPS = {
  bond_alone_time: {
    settles: "Great sign - keep alone-time low-key and positive as they grow.",
    fuss: "A little fuss is normal at this age - a consistent departure routine (same cue, no big goodbye) helps them settle faster over time.",
    distress: "Real distress when left alone is worth addressing early - a predictable routine and short practice absences now can prevent this from becoming a bigger issue later.",
  },
  bond_socialization: {
    lots: "Keep it up - varied, gentle early exposure builds a confident, adaptable adult cat.",
    some: "Try adding a little more variety (new sounds, new people, gentle handling) - the socialization window for cats closes earlier than most owners expect.",
    little: "Worth prioritizing now - kittens have a narrow early window for building comfort with novelty, and it's much harder to build later.",
  },
  bond_play_style: {
    toys: "Great habit - toy-directed play keeps hands/feet from becoming a play target as they grow.",
    mixed: "Worth nudging fully toward toys - redirecting hand-play to toys now prevents nippy/scratchy habits from sticking around into adulthood.",
    hands: "Worth redirecting now - hand/foot play that feels cute in a kitten often becomes a real problem in an adult cat; toys channel the same instinct safely.",
  },
  bond_routine: {
    consistent: "Consistency is one of the best things you can offer a young kitten - keep it up.",
    somewhat: "Even a rough routine helps - predictable feeding/play/litter access reduces stress more than most owners expect.",
    random: "Worth tightening up if you can - a predictable routine is one of the simplest ways to help a young kitten feel secure.",
  },
};

return {species:"cat", stage:"kitten", prompts, tips: TIPS};

});
