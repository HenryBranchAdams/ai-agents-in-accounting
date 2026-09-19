// Add only issue 97-owned records and assessments. Shared source/guide imports use
// import-research-packages.mjs; changed existing content requires separate review.
import fs from "node:fs";
import assert from "node:assert/strict";
const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const pkg = read("data/research/agriculture-i97.json");
const updates = new Map();
const newest = (current, incoming) => !current || current.localeCompare(incoming, 'en', {numeric:true}) < 0 ? incoming : current;
const add = (rows, incoming) => {
  for (const item of incoming) {
    const current = rows.find(row => row.id === item.id);
    if (current) assert.deepEqual(current, item, `Existing issue artifact differs: ${item.id}; review before replacement`);
    else rows.push(item);
  }
};
for (const kind of ["example", "workflow", "control"]) {
  const file = `data/corpus/${kind}.json`, rows = read(file);
  add(rows, pkg.records.filter(r => r.kind === kind));
  updates.set(file, rows);
}
const assessments = read("data/coverage/assessments.json");
add(assessments.assessments, pkg.assessments);
assessments.assessment_version = newest(assessments.assessment_version, pkg.version);
updates.set("data/coverage/assessments.json", assessments);
const overrides = read("data/coverage/mapping-overrides.json");
for (const [id, value] of Object.entries(pkg.mapping_overrides)) {
  if (overrides.records[id]) assert.deepEqual(overrides.records[id], value, `Conflicting mapping: ${id}`);
  else overrides.records[id] = value;
}
overrides.mapping_version = newest(overrides.mapping_version, pkg.version);
updates.set("data/coverage/mapping-overrides.json", overrides);
// Preflight every collision before any write; preserve all unrelated rows.
for (const [file, value] of updates) {
  const original = fs.readFileSync(file, "utf8");
  let content = JSON.stringify(value, null, 2) + "\n";
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) {
    content = content.replace(/[\u007f-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }
  fs.writeFileSync(file, content);
}
console.log(`Added or verified ${pkg.records.length} issue records and ${pkg.assessments.length} assessments.`);
