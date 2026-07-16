const assert = require("node:assert/strict");
const path = require("node:path");

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok  -", name); }
  catch (e) { failed++; console.error("FAIL -", name, "\n     ", e.message); }
}

const CONTENT_DIR = path.join(__dirname, "..", "content");
const FILES = ["puppy-dog", "kitten-cat"];
const modules = {};
for (const f of FILES) modules[f] = require(path.join(CONTENT_DIR, `${f}.js`));

test("both bonding content files load and expose {species, stage, prompts[], tips}", () => {
  for (const f of FILES) {
    const m = modules[f];
    assert.equal(typeof m.species, "string", `${f}: species`);
    assert.equal(typeof m.stage, "string", `${f}: stage`);
    assert.ok(Array.isArray(m.prompts) && m.prompts.length, `${f}: prompts non-empty array`);
    assert.equal(typeof m.tips, "object", `${f}: tips object`);
  }
});

test("every prompt has a unique id, real text, and at least 2 opts", () => {
  for (const f of FILES) {
    const seen = new Set();
    for (const p of modules[f].prompts) {
      assert.ok(p.id, `${f}: prompt missing id`);
      assert.ok(!seen.has(p.id), `${f}: duplicate prompt id "${p.id}"`);
      seen.add(p.id);
      assert.ok(p.text, `${f}: prompt "${p.id}" missing text`);
      assert.ok(Array.isArray(p.opts) && p.opts.length >= 2, `${f}: prompt "${p.id}" needs at least 2 opts`);
      for (const o of p.opts) {
        assert.ok(o.v !== undefined, `${f}: prompt "${p.id}" has an opt with no value`);
        assert.ok(o.label, `${f}: prompt "${p.id}" opt "${o.v}" has no label`);
      }
    }
  }
});

test("every prompt has a tips entry, and every one of that prompt's opt values has a matching tip - no dead-end answers", () => {
  for (const f of FILES) {
    for (const p of modules[f].prompts) {
      assert.ok(modules[f].tips[p.id], `${f}: no tips entry for prompt "${p.id}"`);
      for (const o of p.opts) {
        assert.ok(modules[f].tips[p.id][o.v], `${f}: prompt "${p.id}" opt "${o.v}" has no matching tip - answering this would show nothing`);
      }
    }
  }
});

test("bonding content ids never collide with a real scored index.html question id - these must never leak into FI scoring", () => {
  const REAL_INDEX_HTML_IDS = new Set([
    "p4_gate", "mob_gate", "p1_activity", "p1_exhaustion", "p3_exercise_tolerance", "p3_muscle",
    "p2_vision", "p2_hearing", "p2_sleep", "p2_interaction", "p1_vitality",
    "p2_cognition", "p2_cognition_detail",
    "appetite_weight_gate", "appetite_weight_detail",
    "coat_dental_skin_gate", "coat_dental_skin_detail",
    "water_urination_continence_gate", "water_detail",
    "p3_digestion", "p3_breathing", "temperature_pain_gate", "discomfort_detail",
    "p4_diagnoses", "p4_medications", "p4_vet_visits", "p4_dental_history",
    "p4_surgical_history", "p4_bloodwork", "p4_organ_findings", "p4_owner_concern",
  ]);
  for (const f of FILES) {
    for (const p of modules[f].prompts) {
      assert.ok(!REAL_INDEX_HTML_IDS.has(p.id), `${f}: bonding prompt id "${p.id}" collides with a real scored question id`);
    }
  }
});

console.log(failed ? `\n${failed} test(s) failed` : "\nAll tests passed");
process.exit(failed ? 1 : 0);
