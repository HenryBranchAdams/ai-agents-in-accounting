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

  const learningMap = html.match(/<section[^>]+data-learning-path-map[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  assert.ok(learningMap, "homepage learning path map should render as a semantic section");
  assert.match(
    html,
    /<section(?=[^>]*data-learning-path-map)(?=[^>]*aria-labelledby=["']learning-map-title["'])[^>]*>/i,
  );

  assert.match(html, /An open educational hub/);
  assert.match(html, /Educational field guide/);
  assert.match(html, /curated readings/);
  assert.match(html, /practical templates/);
  assert.doesNotMatch(html, /benchmark cases/i);

  for (const [href, label] of [
    ["/start-here", "Learn the foundations"],
    ["/course", "Take the core course"],
    ["/tutorials/bank-reconciliation", "Practice a complete accounting lesson"],
    ["/workflows", "Explore accounting workflows"],
    ["/templates", "Put the guidance to work"],
    ["/reading-room", "Research the field"],
  ]) {
    assert.match(learningMap, new RegExp(`href=["']${href.replaceAll("/", "\\/")}["']`), `${href} learning destination`);
    assert.match(learningMap, new RegExp(label), `${href} learning label`);
  }

  assert.match(learningMap, /href=["']\/resources\?industry=general["']/);
  assert.match(learningMap, /Browse the source catalog/);
  assert.match(learningMap, /<h3>Learn the foundations<\/h3>/);

  assert.match(html, /Benchmark expansion is deferred/);
  const firstLearningPath = html.indexOf('href="/start-here"');
  const firstLedgerBenchLink = html.indexOf('href="/ledgerbench"');
  assert.ok(firstLearningPath >= 0);
  assert.ok(firstLedgerBenchLink > firstLearningPath);
});

test("the app shell exposes learning navigation and a current-signal utility link", async () => {
  const response = await request("/");
  const html = await response.text();
  const learningNavigation = html.match(/<nav[^>]+class=["']learning-nav["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  const utilityNavigation = html.match(/<nav class="top-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1];

  assert.ok(learningNavigation, "learning navigation should render");
  for (const [href, label] of [
    ["/start-here", "Learn"],
    ["/tutorials/bank-reconciliation", "Practice"],
    ["/control-model", "Govern"],
    ["/reading-room", "Research"],
  ]) {
    assert.match(learningNavigation, new RegExp(`href=["']${href.replaceAll("/", "\\/")}["']`), `${href} learning navigation destination`);
    assert.match(learningNavigation, new RegExp(`>${label}<`), `${label} learning navigation label`);
  }

  assert.ok(utilityNavigation, "utility navigation should render");
  assert.match(utilityNavigation, /href="\/observatory"/);
  assert.match(utilityNavigation, /Current signal/);
  assert.match(utilityNavigation, /class="signal-dot"/);
  assert.doesNotMatch(utilityNavigation, /href="\/reading-room"/);
  assert.doesNotMatch(utilityNavigation, /href="\/resources"/);
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
  assert.match(searchSource, /href: "\/bench"[\s\S]*detail: "Deferred compatibility reference/);
  assert.match(searchSource, /href: "\/ledgerbench"[\s\S]*detail: "Deferred compatibility reference/);
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

test("agent discovery leads with the Atlas and keeps benchmark surfaces secondary", async () => {
  const [instructionsResponse, machineResponse, sitemapResponse] = await Promise.all([
    request("/AGENTS.md"),
    request("/machine-access"),
    request("/sitemap.xml"),
  ]);
  const [instructions, machineHtml, sitemap] = await Promise.all([
    instructionsResponse.text(),
    machineResponse.text(),
    sitemapResponse.text(),
  ]);

  assert.match(instructions, /Living Atlas as the primary map/);
  assert.match(instructions, /Benchmark and LedgerBench product development is fully deferred/);
  assert.ok(instructions.indexOf("Use /atlas") < instructions.indexOf("Use /observatory"));
  assert.match(machineHtml, /Start discovery with the Living Atlas/);
  assert.match(machineHtml, /fully deferred compatibility and reference assets/);
  for (const path of ["bench", "ledgerbench"]) {
    assert.match(
      sitemap,
      new RegExp(`<loc>[^<]+/${path}<\\/loc>[\\s\\S]*?<priority>0\\.4<\\/priority>`),
      `${path} remains discoverable at secondary priority`,
    );
  }
});
