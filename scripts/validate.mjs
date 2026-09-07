import fs from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export function loadRecords() {
  return fs
    .readdirSync("data/corpus")
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((file) => {
      const items = read(`data/corpus/${file}`);
      for (const r of items)
        assert.equal(
          `${r.kind}.json`,
          file,
          `${r.id}: place this record in its canonical kind file`,
        );
      return items;
    });
}
// The public schema uses this deliberately small set of JSON Schema keywords.
export function validateSchema(value, schema, at = "$") {
  const type =
    value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (schema.type)
    assert.ok(
      [schema.type].flat().includes(type),
      `${at}: expected ${schema.type}, found ${type}`,
    );
  if (schema.enum)
    assert.ok(schema.enum.includes(value), `${at}: value is outside the enum`);
  if ("const" in schema)
    assert.deepEqual(value, schema.const, `${at}: unexpected constant`);
  if (type === "string") {
    if (schema.minLength)
      assert.ok(value.length >= schema.minLength, `${at}: empty text`);
    if (schema.pattern) assert.match(value, new RegExp(schema.pattern), at);
    if (schema.format === "uri")
      assert.ok(
        ["http:", "https:"].includes(new URL(value).protocol),
        `${at}: use an HTTP(S) URL`,
      );
    if (schema.format === "date")
      assert.equal(
        new Date(value).toISOString().slice(0, 10),
        value,
        `${at}: invalid date`,
      );
  }
  if (type === "array") {
    if (schema.uniqueItems)
      assert.equal(
        new Set(value.map((x) => JSON.stringify(x))).size,
        value.length,
        `${at}: duplicate items`,
      );
    if (schema.items)
      value.forEach((x, i) => validateSchema(x, schema.items, `${at}[${i}]`));
  }
  if (type === "object") {
    for (const key of schema.required || [])
      assert.ok(Object.hasOwn(value, key), `${at}: missing ${key}`);
    for (const [key, x] of Object.entries(value)) {
      if (schema.properties?.[key])
        validateSchema(x, schema.properties[key], `${at}.${key}`);
      else if (schema.additionalProperties === false)
        assert.fail(`${at}: unexpected property ${key}`);
    }
  }
}
export function validateCorpus() {
  const all = loadRecords(),
    schema = read("schemas/record.schema.json"),
    meta = read("data/catalog.json");
  const ids = new Map(all.map((r) => [r.id, r]));
  assert.equal(ids.size, all.length, "Duplicate record IDs");
  for (const id of read("data/migration.json").preserved_ids)
    assert.ok(ids.has(id), `Migrated record ID missing: ${id}`);
  assert.match(meta.corpus_version, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  for (const r of all) {
    validateSchema(r, schema, r.id);
    assert.ok(r.publisher.trim(), `${r.id}: publisher required`);
    for (const id of r.source_ids)
      assert.equal(
        ids.get(id)?.kind,
        "source",
        `${r.id}: unresolved source ${id}`,
      );
    for (const id of r.related_ids)
      assert.ok(ids.has(id), `${r.id}: unresolved related record ${id}`);
    if (r.kind === "source") {
      assert.ok(r.source_url, `${r.id}: original publisher URL required`);
      assert.ok(r.source_type, `${r.id}: source type required`);
      assert.ok(
        Object.hasOwn(r.rights, "source_status"),
        `${r.id}: external source rights required`,
      );
    }
    if (r.kind === "collection")
      assert.ok(r.source_ids.length, `${r.id}: empty collection`);
    if (r.review_status.startsWith("inherited"))
      assert.equal(
        r.reviewed_at,
        null,
        `${r.id}: migration cannot assert a new review date`,
      );
    if (r.kind === "example") {
      assert.ok(
        Array.isArray(r.data.examples) && r.data.examples.length > 0,
        `${r.id}: synthetic scenarios missing`,
      );
      assert.ok(
        r.data.limitations.some((s) => s.includes("Synthetic")),
        `${r.id}: synthetic label required`,
      );
    }
  }
  return {
    records: all.length,
    sources: all.filter((r) => r.kind === "source").length,
    version: meta.corpus_version,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log("Corpus integrity verified:", validateCorpus());
