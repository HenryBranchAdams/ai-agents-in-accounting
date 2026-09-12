#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { createHash } from "node:crypto";

const OBSERVATIONS_FILE = "data/source-observations.json";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function loadCorpusRecords(dir = "data/corpus") {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}

export function loadObservations(file = OBSERVATIONS_FILE) {
  if (!fs.existsSync(file)) return { schema_version: "1.0.0", observations: [] };
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  return { schema_version: value.schema_version || "1.0.0", observations: value.observations || [] };
}

function rightsUnknown(record) {
  const rights = record.rights || {};
  return [rights.source_status, rights.external_content, rights.metadata, rights.content]
    .some((v) => typeof v === "string" && /unknown|unresolved|conflict|undetermined|not recorded/i.test(v));
}

export function buildReviewQueue(records, observationDocument = { observations: [] }, { now = new Date(), staleAfterDays = 90 } = {}) {
  const observations = observationDocument.observations || [];
  const byId = new Map();
  for (const observation of observations) {
    const prior = byId.get(observation.record_id);
    if (!prior || String(observation.checked_at || "") > String(prior.checked_at || "")) byId.set(observation.record_id, observation);
  }
  const cited = new Set(records.flatMap((r) => r.source_ids || []));
  const rows = [];
  for (const record of records) {
    const reasons = [];
    const observation = byId.get(record.id);
    const inherited = typeof record.review_status === "string" && record.review_status.startsWith("inherited");
    if (inherited) reasons.push("inherited-review-needs-source-check");
    const review = record.data?.source_review;
    if (review?.review_level === 'attempted-unresolved') reasons.push('source-access-indeterminate');
    if (review?.review_level === 'abstract-or-landing') reasons.push('substantive-source-review-needed');
    if (record.kind === 'source' && record.reviewed_at && now.getTime() - new Date(record.reviewed_at).getTime() > staleAfterDays * 86400000) reasons.push('substantive-review-due');
    if (/conflict|inconsisten/i.test(JSON.stringify([review?.limitations,record.data?.rights_review,record.data?.source_conflicts]))) reasons.push('source-conflict-review');
    if (observation?.reachable === false || ["broken", "access-indeterminate", "access-restricted", "blocked", "indeterminate"].includes(observation?.access))
      reasons.push(observation.access === "broken" ? "source-unreachable" : "source-access-indeterminate");
    if (observation?.version_change_hint) reasons.push("edition-change-alert");
    if (observation?.next_review_at && new Date(observation.next_review_at) <= now) reasons.push("review-due");
    if (observation?.checked_at && now.getTime() - new Date(observation.checked_at).getTime() > staleAfterDays * 86400000) reasons.push("stale-source-observation");
    if (rightsUnknown(record)) reasons.push("rights-unknown");
    if (record.kind === "source" && !cited.has(record.id)) reasons.push("citation-use-gap");
    if (!record.source_ids?.length && record.kind !== "source") reasons.push("missing-supporting-citation");
    if (!reasons.length) continue;
    const priority = reasons.some((r) => ["source-unreachable", "edition-change-alert"].includes(r)) ? "urgent" :
      reasons.some((r) => r.includes("indeterminate") || r.includes("unknown")) ? "review" : "routine";
    rows.push({ id: record.id, kind: record.kind, title: record.title, priority, reasons, review_status: record.review_status,
      reviewed_at: record.reviewed_at ?? null, review_basis: inherited ? "inherited" : record.reviewed_at ? "explicit" : "unrecorded",
      observation: observation ? { checked_at: observation.checked_at ?? null, access: observation.access ?? null, version_change_hint: observation.version_change_hint ?? null } : null });
  }
  const rank = { urgent: 0, review: 1, routine: 2 };
  return rows.sort((a, b) => rank[a.priority] - rank[b.priority] || a.id.localeCompare(b.id));
}

function isPublicUrl(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  const normalizedHost = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  const ipKind = net.isIP(normalizedHost);
  if (ipKind === 4 && /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(normalizedHost)) return false;
  if (ipKind === 6 && (normalizedHost === "::" || normalizedHost === "::1" || normalizedHost.startsWith("fc") || normalizedHost.startsWith("fd") || normalizedHost.startsWith("fe8") || normalizedHost.startsWith("fe9") || normalizedHost.startsWith("fea") || normalizedHost.startsWith("feb") || normalizedHost.startsWith("::ffff:"))) return false;
  return true;
}

export async function checkSourceUrl(sourceUrl, { fetchImpl = globalThis.fetch, now = new Date(), maxBytes = 64 * 1024, maxRedirects = 3, timeoutMs = 10000 } = {}) {
  const checkedAt = now.toISOString();
  if (!isPublicUrl(sourceUrl)) return { url: sourceUrl, checked_at: checkedAt, reachable: false, access: "blocked", error: "unsafe-or-non-public-url" };
  let current = sourceUrl;
  let response;
  let timer = null;
  try {
    for (let redirects = 0; redirects <= maxRedirects; redirects++) {
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), timeoutMs);
      try { response = await fetchImpl(current, { method: "GET", redirect: "manual", signal: controller.signal, headers: { accept: "text/html,application/xhtml+xml" } }); }
      catch (error) { clearTimeout(timer); timer = null; throw error; }
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      clearTimeout(timer); timer = null;
      const location = response.headers.get("location");
      if (!location || redirects === maxRedirects) return { url: sourceUrl, checked_at: checkedAt, reachable: false, access: "indeterminate", status: response.status, error: "redirect-limit" };
      const next = new URL(location, current).toString();
      if (!isPublicUrl(next)) return { url: sourceUrl, checked_at: checkedAt, reachable: false, access: "blocked", status: response.status, redirected_to: next, error: "unsafe-redirect" };
      current = next;
    }
    const chunks = [];
    let bytes = 0;
    const readWithTimeout = (promise) => new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error("body-timeout")), timeoutMs);
      promise.then((value) => { clearTimeout(deadline); resolve(value); }, (error) => { clearTimeout(deadline); reject(error); });
    });
    if (response.body?.getReader) {
      const reader = response.body.getReader();
      while (bytes < maxBytes) { const item = await readWithTimeout(reader.read()); if (item.done) break; const chunk = Buffer.from(item.value); chunks.push(chunk.subarray(0, maxBytes - bytes)); bytes += chunk.length; if (bytes >= maxBytes) await reader.cancel(); }
    } else chunks.push(Buffer.from(await readWithTimeout(response.arrayBuffer())).subarray(0, maxBytes));
    const body = Buffer.concat(chunks).subarray(0, maxBytes);
    const text = body.toString("utf8");
    const title = text.match(/<title[^>]*>\s*([^<]{1,300})\s*<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || null;
    clearTimeout(timer); timer = null;
    return { url: sourceUrl, checked_at: checkedAt, reachable: response.status >= 200 && response.status < 400,
      access: [401, 403].includes(response.status) ? "access-restricted" : response.status === 429 || response.status >= 500 ? "indeterminate" : response.status >= 400 ? "broken" : "public", status: response.status,
      redirected_to: current === sourceUrl ? null : current, etag: response.headers.get("etag"), last_modified: response.headers.get("last-modified"), title,
      content_fingerprint: createHash("sha256").update(body).digest("hex"), version_change_hint: null };
  } catch (error) {
    if (timer) clearTimeout(timer);
    return { url: sourceUrl, checked_at: checkedAt, reachable: false, access: "indeterminate", error: String(error?.message || error) };
  }
}

export async function checkSources(records, options = {}) {
  const limit = options.limit ?? 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Check limit must be an integer from 1 to 100");
  const observations = options.observations?.observations || [];
  const byId = new Map(observations.map((o) => [o.record_id, o]));
  const now = options.now || new Date();
  const due = records.filter((r) => r.kind === "source" && r.source_url).filter((r) => {
    const next = byId.get(r.id)?.next_review_at;
    return !next || new Date(next) <= now;
  }).sort((a, b) => {
    const ta = byId.get(a.id)?.checked_at || "";
    const tb = byId.get(b.id)?.checked_at || "";
    return ta.localeCompare(tb) || a.id.localeCompare(b.id);
  });
  const offset = options.rotateWeekly && due.length ? (Math.floor(now.getTime() / (7 * 86400000)) * limit) % due.length : 0;
  const sources = [...due.slice(offset),...due.slice(0,offset)].slice(0, limit);
  const rows = [];
  for (const record of sources) {
    const row = { record_id: record.id, ...(await checkSourceUrl(record.source_url, options)) };
    const previous = byId.get(record.id);
    if (previous && row.content_fingerprint && previous.content_fingerprint && previous.content_fingerprint !== row.content_fingerprint)
      row.version_change_hint = "content-fingerprint-changed";
    rows.push(row);
  }
  return rows;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const records = loadCorpusRecords();
  if (args.has("--check")) {
    const previous = loadObservations(process.env.MAINTENANCE_OBSERVATIONS || OBSERVATIONS_FILE);
    return checkSources(records, { limit: Number(process.env.MAINTENANCE_LIMIT || 10), observations: previous, now: new Date(), rotateWeekly: process.env.MAINTENANCE_ROTATE_WEEKLY === 'true' }).then((observations) => {
    const out = { schema_version: "1.0.0", generated_at: new Date().toISOString(), observations: [...previous.observations, ...observations] };
    if (process.env.MAINTENANCE_OBSERVATIONS) fs.writeFileSync(process.env.MAINTENANCE_OBSERVATIONS, JSON.stringify(out, null, 2) + "\n");
    else process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  });
  }
  const result = { schema_version: "1.0.0", generated_at: process.env.MAINTENANCE_AS_OF || null, records: records.length, entries: buildReviewQueue(records, loadObservations()) };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
