import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
})();

async function request(path) {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("the homepage leads with education, workflows, and source-backed learning", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /An open educational hub/);
  assert.match(html, /Educational field guide/);
  assert.match(html, /curated readings/);
  assert.match(html, /practical templates/);
  assert.match(html, /Learn the foundations/);
  assert.match(html, /Explore accounting workflows/);
  assert.match(html, /Put the guidance to work/);
  assert.match(html, /Research the field/);
  assert.doesNotMatch(html, /benchmark cases/i);

  assert.match(html, /href="\/start-here"/);
  assert.match(html, /Benchmark expansion is deferred/);
  const firstLearningPath = html.indexOf('href="/start-here"');
  const firstLedgerBenchLink = html.indexOf('href="/ledgerbench"');
  assert.ok(firstLearningPath >= 0);
  assert.ok(firstLedgerBenchLink > firstLearningPath);
});

test("utility navigation favors the reading and source libraries", async () => {
  const response = await request("/");
  const html = await response.text();
  const utilityNavigation = html.match(/<nav class="top-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1];

  assert.ok(utilityNavigation, "utility navigation should render");
  assert.match(utilityNavigation, /href="\/reading-room"/);
  assert.match(utilityNavigation, /href="\/resources"/);
  assert.doesNotMatch(utilityNavigation, /href="\/packs"/);
  assert.doesNotMatch(utilityNavigation, /href="\/machine-access"/);
});

test("the navigation keeps LedgerBench in a secondary lab", async () => {
  const contentSource = await readFile(new URL("../app/content.ts", import.meta.url), "utf8");
  const [navSource, searchSource] = contentSource.split("export const searchItems");

  assert.match(navSource, /label: "Library"/);
  assert.match(navSource, /label: "Lab"/);
  assert.doesNotMatch(navSource, /label: "Evaluate"/);
  assert.doesNotMatch(navSource, /label: "Build"/);
  assert.ok(
    navSource.indexOf('label: "Core conformance suite"') <
      navSource.indexOf('label: "LedgerBench research program"'),
  );
  assert.doesNotMatch(searchSource, /category: "(?:Build|Evaluate|Implement|Implementation|Reference)"/);
  assert.match(searchSource, /title: "Enter the reading room", category: "Library"/);
  assert.match(searchSource, /title: "Inspect the LedgerBench research program", category: "Lab"/);
});

test("evaluation pages state their bounded roles without removing the lab", async () => {
  const [coreResponse, ledgerBenchResponse] = await Promise.all([
    request("/bench"),
    request("/ledgerbench"),
  ]);
  assert.equal(coreResponse.status, 200);
  assert.equal(ledgerBenchResponse.status, 200);

  const coreHtml = await coreResponse.text();
  assert.match(coreHtml, /A bounded developer aid/);
  assert.match(coreHtml, /does not establish broad accounting competence/);

  const ledgerBenchHtml = await ledgerBenchResponse.text();
  assert.match(ledgerBenchHtml, /LedgerBench research program/);
  assert.match(ledgerBenchHtml, /specialist research program/);
});
