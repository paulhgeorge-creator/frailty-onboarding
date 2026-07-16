const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok  -", name); }
  catch (e) { failed++; console.error("FAIL -", name, "\n     ", e.message); }
}

/* Real question ids defined in index.html's PART1-4 arrays - kept as a
   flat list here (not required from index.html, since that file isn't a
   Node module) so string refs in content/*.js can be checked against
   something real instead of just trusting the string. Re-extract via
   `grep -oE 'id:"[a-z0-9_]+"' index.html` if PART1-4 ever changes. */
const REAL_INDEX_HTML_IDS = new Set([
  "mob_gate", "p1_activity", "p1_exhaustion", "p3_exercise_tolerance", "p3_muscle",
  "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
  "p2_cognition", "p2_cognition_detail",
  "appetite_weight_gate", "appetite_weight_detail",
  "coat_dental_skin_gate", "coat_dental_skin_detail",
  "water_urination_continence_gate", "water_detail",
  "p3_digestion", "p3_breathing", "temperature_pain_gate", "discomfort_detail",
  "p4_diagnoses", "p4_medications", "p4_vet_visits", "p4_dental_history",
  "p4_surgical_history", "p4_bloodwork", "p4_organ_findings", "p4_owner_concern",
]);

const CONTENT_DIR = path.join(__dirname, "..", "content");
const FILES = ["young-dog", "middle-dog", "senior-dog", "young-cat", "middle-cat", "senior-cat"];
const modules = {};
for (const f of FILES) modules[f] = require(path.join(CONTENT_DIR, `${f}.js`));

test("all 6 stage-species files load and expose the required top-level shape", () => {
  for (const f of FILES) {
    const m = modules[f];
    assert.equal(typeof m.species, "string", `${f}: species`);
    assert.equal(typeof m.stage, "string", `${f}: stage`);
    assert.ok(Array.isArray(m.questions), `${f}: questions is an array`);
    assert.ok(Array.isArray(m.watchFor), `${f}: watchFor is an array`);
    assert.ok(Array.isArray(m.breedRiskNotes), `${f}: breedRiskNotes is an array`);
    assert.ok(Array.isArray(m.sources), `${f}: sources is an array`);
  }
});

test("species/stage fields match the filename (young-dog.js => dog/young, etc.)", () => {
  for (const f of FILES) {
    const [stage, species] = f.split("-");
    assert.equal(modules[f].species, species, f);
    assert.equal(modules[f].stage, stage, f);
  }
});

test("every file has a mandatory generic breedRiskNotes fallback (no-tag-match pets never see an empty section)", () => {
  for (const f of FILES) {
    const hasGeneric = modules[f].breedRiskNotes.some(n => n.tags && n.tags.includes("generic"));
    assert.ok(hasGeneric, `${f}: missing a "generic"-tagged breedRiskNotes fallback entry`);
  }
});

test("every breedRiskNotes.sourceIds entry resolves to a real id in that file's own sources[]", () => {
  for (const f of FILES) {
    const sourceIds = new Set(modules[f].sources.map(s => s.id));
    for (const note of modules[f].breedRiskNotes) {
      for (const sid of (note.sourceIds || [])) {
        assert.ok(sourceIds.has(sid), `${f}: breedRiskNotes references unknown sourceId "${sid}"`);
      }
    }
  }
});

test("every sources[] entry has the full {id,title,author,year,url} shape", () => {
  for (const f of FILES) {
    for (const s of modules[f].sources) {
      assert.equal(typeof s.id, "string", `${f}: source missing id`);
      assert.equal(typeof s.title, "string", `${f}: source ${s.id} missing title`);
      assert.equal(typeof s.author, "string", `${f}: source ${s.id} missing author`);
      assert.equal(typeof s.year, "number", `${f}: source ${s.id} missing numeric year`);
      assert.ok(/^https?:\/\//.test(s.url), `${f}: source ${s.id} missing/invalid url`);
    }
  }
});

test("every string question-ref resolves to a real id.html question id", () => {
  for (const f of FILES) {
    for (const q of modules[f].questions) {
      if (typeof q === "string") {
        assert.ok(REAL_INDEX_HTML_IDS.has(q), `${f}: unknown question ref "${q}"`);
      }
    }
  }
});

test("every text-override object (no round tag) targets a real existing id.html question - catches typos that would silently become a fake net-new item", () => {
  for (const f of FILES) {
    for (const q of modules[f].questions) {
      if (typeof q === "object" && q.round === undefined) {
        assert.ok(REAL_INDEX_HTML_IDS.has(q.id), `${f}: override "${q.id}" doesn't match any real index.html id - typo, or missing round tag for a genuine net-new item?`);
        assert.ok(q.text, `${f}: override "${q.id}" has no text - pointless override`);
      }
    }
  }
});

test("no id is referenced twice (once as a plain string, once as an override) in the same file", () => {
  for (const f of FILES) {
    const ids = modules[f].questions.map(q => typeof q === "string" ? q : q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.equal(dupes.length, 0, `${f}: duplicate question id(s) ${dupes.join(", ")} - each id should appear once, either as a string ref or as an override, not both`);
  }
});

test("every net-new question object has a unique id (within its own file) and a text field", () => {
  for (const f of FILES) {
    const seen = new Set();
    for (const q of modules[f].questions) {
      if (typeof q === "object") {
        assert.ok(q.id, `${f}: net-new question object missing id`);
        assert.ok(!seen.has(q.id), `${f}: duplicate net-new question id "${q.id}"`);
        seen.add(q.id);
        assert.ok(q.text && (q.text.both || q.text.dog || q.text.cat), `${f}: question "${q.id}" missing text`);
      }
    }
  }
});

test("genuine net-new (round-tagged) question ids never collide with an existing index.html id (would silently overwrite a real question) - text overrides (no round tag) are expected to match one on purpose", () => {
  for (const f of FILES) {
    for (const q of modules[f].questions) {
      if (typeof q === "object" && q.round !== undefined) {
        assert.ok(!REAL_INDEX_HTML_IDS.has(q.id), `${f}: net-new id "${q.id}" collides with a real index.html id`);
      }
    }
  }
});

test("senior-cat.js omits mob_gate as a direct question - it's derived (max of djd_* items) per the file's own header comment", () => {
  const ids = modules["senior-cat"].questions.map(q => typeof q === "string" ? q : q.id);
  assert.ok(!ids.includes("mob_gate"), "senior-cat should not list mob_gate directly");
  for (const djd of ["djd_run","djd_jump_up","djd_jump_down","djd_stairs_up","djd_stairs_down","djd_chase"]) {
    assert.ok(ids.includes(djd), `senior-cat missing DJD item ${djd}`);
  }
});

test("senior-dog.js replaces p2_cognition/p2_cognition_detail with the new cog_* module, not both", () => {
  const ids = modules["senior-dog"].questions.map(q => typeof q === "string" ? q : q.id);
  assert.ok(!ids.includes("p2_cognition"), "senior-dog should not keep the old p2_cognition gate");
  assert.ok(!ids.includes("p2_cognition_detail"), "senior-dog should not keep the old p2_cognition_detail");
  assert.ok(ids.includes("cog_disorientation") && ids.includes("cog_house_soiling") && ids.includes("cog_activity_change"),
    "senior-dog missing one of the new cognition module items");
});

test("young-dog/young-cat exclude cognition entirely (no developmental relevance); middle/senior keep or replace it", () => {
  for (const f of ["young-dog", "young-cat"]) {
    const ids = modules[f].questions.map(q => typeof q === "string" ? q : q.id);
    assert.ok(!ids.includes("p2_cognition"), `${f} should exclude p2_cognition`);
    assert.ok(!ids.includes("p2_cognition_detail"), `${f} should exclude p2_cognition_detail`);
  }
});

test("dog files declare giant-breed matcher notes; cat files never do (petBreedTags is dog-only for giant)", () => {
  for (const f of ["young-dog", "middle-dog", "senior-dog"]) {
    assert.ok(modules[f].breedRiskNotes.some(n => n.tags.includes("giant")), `${f}: expected a giant-tagged note`);
  }
  for (const f of ["young-cat", "middle-cat", "senior-cat"]) {
    assert.ok(!modules[f].breedRiskNotes.some(n => n.tags.includes("giant")), `${f}: giant tag never applies to cats, petBreedTags() confirms this`);
  }
});

console.log(failed ? `\n${failed} test(s) failed` : "\nAll tests passed");
process.exit(failed ? 1 : 0);
