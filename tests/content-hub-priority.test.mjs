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

test("the homepage leads with an interactive governed-work learning path", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<h1[^>]*>Build your first governed accounting agent\.<\/h1>/);
  assert.match(html, /Learn the boundary\. Work a synthetic case\. Leave with a reviewer-ready plan\./);
  assert.match(html, /href="\/start-here"[^>]*>Start in five minutes/);
  assert.match(html, /href="\/tutorials\/bank-reconciliation"[^>]*>Practice bank reconciliation/);
  assert.match(html, /Agents prepare work\. People approve conclusions and sensitive actions\./);

  const learningMap = html.match(/<section[^>]+aria-label=["']Evidence to approval learning path["'][^>]*>([\s\S]*?)<\/section>/i)?.[1];
  assert.ok(learningMap, "homepage learning path map should render as a semantic section");
  for (const label of ["Evidence", "Prepare", "Review", "Approve"]) {
    assert.match(learningMap, new RegExp(`>${label}<`), `${label} learning stage`);
  }
  assert.match(learningMap, /aria-pressed="true"/);
  assert.match(html, /Role-based paths/);
  assert.match(html, /Accounting practitioner/);
  assert.match(html, /Finance transformation leader/);
});

test("the app shell exposes the modern learning navigation and a direct start action", async () => {
  const response = await request("/");
  const html = await response.text();
  const learningNavigation = html.match(/<nav[^>]+class=["'][^"']*learning-nav[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1];

  assert.ok(learningNavigation, "learning navigation should render");
  for (const [href, label] of [
    ["/start-here", "Learn"],
    ["/tutorials/bank-reconciliation", "Practice"],
    ["/atlas", "Atlas"],
    ["/resources", "Library"],
  ]) {
    assert.match(learningNavigation, new RegExp(`href=["']${href.replaceAll("/", "\\/")}["']`), `${href} learning navigation destination`);
    assert.match(learningNavigation, new RegExp(`>${label}<`), `${label} learning navigation label`);
  }

  assert.match(html, /<a(?=[^>]*class="aa2-start-action")(?=[^>]*href="\/start-here")[^>]*>/);
  assert.match(html, /Start learning/);
  assert.match(html, /aria-label="Mobile learning paths"/);
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
