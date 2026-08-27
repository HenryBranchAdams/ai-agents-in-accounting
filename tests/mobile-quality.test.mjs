import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("mobile-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
})();

async function request(path) {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

function attributeValues(html, attribute) {
  return [...html.matchAll(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "gi"))].map((match) => match[1]);
}

function extractBlock(css, marker) {
  const start = css.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  const opening = css.indexOf("{", start);
  let depth = 0;
  for (let index = opening; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(opening + 1, index);
  }
  assert.fail(`unterminated ${marker}`);
}

async function compiledCss() {
  const assets = new URL("../dist/client/assets/", import.meta.url);
  const files = (await readdir(assets)).filter((file) => file.endsWith(".css"));
  assert.ok(files.length > 0, "compiled CSS asset");
  return (await Promise.all(files.map((file) => readFile(new URL(file, assets), "utf8")))).join("\n");
}

const primaryPages = [
  "/", "/start-here", "/course", "/tutorials/bank-reconciliation", "/fundamentals", "/lifecycle", "/authority", "/workflows", "/controls",
  "/sensitive-actions", "/evidence-assurance", "/security-identity", "/architecture",
  "/ecosystem", "/evaluation", "/pilot", "/operations", "/templates", "/glossary",
  "/resources", "/reading-room", "/machine-access", "/packs", "/bench", "/spec",
  "/methodology", "/changes", "/open-source", "/content-contract", "/control-model", "/coverage",
];

test("primary pages expose a complete mobile navigation contract", async () => {
  for (const path of primaryPages) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<meta[^>]+name=["']viewport["'][^>]+width=device-width/i, `${path} viewport`);

    const mobile = html.match(/<details[^>]+class=["']mobile-navigation["'][^>]*>([\s\S]*?)<\/details>/i)?.[1];
    const desktop = html.match(/<aside[^>]+class=["']sidebar["'][^>]*>[\s\S]*?<nav[^>]+aria-label=["']Documentation["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1];
    assert.ok(mobile, `${path} mobile navigation`);
    assert.ok(desktop, `${path} desktop navigation`);
    assert.match(mobile, /<summary>Menu<\/summary>/i, `${path} menu control`);

    const mobileLinks = attributeValues(mobile, "href");
    const desktopLinks = attributeValues(desktop, "href");
    assert.deepEqual(mobileLinks, desktopLinks, `${path} navigation parity`);
    assert.equal((mobile.match(/aria-current=["']page["']/gi) ?? []).length, 1, `${path} active mobile item`);
  }
});

test("phone layouts keep wide content inside explicit scroll containers", async () => {
  for (const path of primaryPages) {
    const html = await (await request(path)).text();
    const tables = (html.match(/<table\b/gi) ?? []).length;
    const wrappedTables = (html.match(/<div[^>]+class=["'][^"']*table-wrap[^"']*["'][^>]*>\s*<table\b/gi) ?? []).length;
    assert.equal(wrappedTables, tables, `${path} table overflow containment`);
    assert.doesNotMatch(html, /style=["'][^"']*(?:width|min-width):\s*[5-9]\d{2,}px/i, `${path} fixed inline width`);
  }
});

test("source and compiled CSS preserve the mobile breakpoint contract", async () => {
  const source = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const mobile = extractBlock(source, "@media (max-width: 760px)");

  for (const [label, pattern] of [
    ["single-column document", /\.docs-layout\s*\{[^}]*display:\s*block/s],
    ["desktop sidebar hidden", /\.wordmark small,\s*\.top-links,\s*\.sidebar\s*\{[^}]*display:\s*none/s],
    ["mobile navigation shown", /\.mobile-navigation\s*\{[^}]*display:\s*block/s],
    ["search trigger touch target", /\.search-trigger\s*\{[^}]*min-height:\s*44px/s],
    ["menu touch target", /\.mobile-navigation summary\s*\{[^}]*min-height:\s*44px/s],
    ["navigation touch targets", /\.mobile-navigation\[open\] \.nav-group a\s*\{[^}]*min-height:\s*44px/s],
    ["search-result touch targets", /\.search-results a\s*\{[^}]*min-height:\s*44px/s],
    ["iOS-safe input size", /\.search-input-row input\s*\{[^}]*font-size:\s*16px/s],
    ["dynamic search viewport", /\.search-dialog\s*\{[^}]*100dvh/s],
    ["top safe areas", /\.topbar\s*\{[^}]*safe-area-inset-left[^}]*safe-area-inset-right/s],
    ["content safe areas", /\.doc-article\s*\{[^}]*safe-area-inset-left[^}]*safe-area-inset-right/s],
    ["compact article measure", /\.doc-article\s*\{[^}]*padding:\s*28px 18px 28px/s],
    ["compact body rhythm", /\.doc-body p,[\s\S]*?font-size:\s*14px;[^}]*line-height:\s*1\.62/s],
    ["two-column corpus summary", /\.corpus-summary\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s],
    ["corpus row divider", /\.corpus-summary > div:nth-child\(n \+ 3\)\s*\{[^}]*border-top:/s],
    ["single-column resource filters", /\.resource-controls\s*\{[^}]*grid-template-columns:\s*1fr/s],
  ]) assert.match(mobile, pattern, label);

  assert.match(source, /\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s, "table horizontal scrolling");
  assert.match(source, /\.code-block\s*\{[^}]*overflow-x:\s*auto/s, "code horizontal scrolling");

  const built = (await compiledCss()).replace(/\s+/g, "");
  assert.match(built, /@media\((?:max-width:760px|width<=760px)\)/, "compiled phone breakpoint");
  assert.match(built, /min-height:44px/, "compiled touch targets");
  assert.match(built, /100dvh/, "compiled dynamic viewport");
  assert.match(built, /safe-area-inset-left/, "compiled safe-area support");
});
