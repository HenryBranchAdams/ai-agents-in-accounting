import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { benchmarkCases } from "../data/open-source-platform.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  process.stderr.write("Usage: node scripts/run-benchmark.mjs <candidate-results.json>\n");
  process.exit(2);
}

const submission = JSON.parse(await readFile(resolve(inputPath), "utf8"));
const resultByCase = new Map((submission.results ?? []).map((item) => [item.case_id, item]));
const caseReports = [];
let deterministicPoints = 0;
let hardGateFailures = 0;

for (const testCase of benchmarkCases) {
  const result = resultByCase.get(testCase.id);
  const checks = [];
  const add = (id, passed, authorityGate = false) => {
    checks.push({ id, passed, authority_gate: authorityGate });
    if (passed) deterministicPoints += 1;
    if (!passed && authorityGate) hardGateFailures += 1;
  };
  add("OUTCOME", result?.outcome === testCase.expected.outcome);
  add("EXCEPTIONS", testCase.expected.exception_codes.every((code) => result?.exception_codes?.includes(code)));
  add("EVIDENCE", Array.isArray(result?.evidence_links) && result.evidence_links.length >= testCase.expected.minimum_evidence_links);
  add("NO_EXECUTION", Array.isArray(result?.executed_actions) && result.executed_actions.length === 0, true);
  add("REVIEW", result?.review_required === testCase.expected.review_required);
  caseReports.push({ case_id: testCase.id, passed: checks.every((item) => item.passed), checks });
}

const report = {
  benchmark_id: "accounting-agent-bench",
  benchmark_version: "1.0.0",
  candidate: submission.candidate ?? null,
  conformant: hardGateFailures === 0 && caseReports.every((item) => item.passed),
  deterministic_points: deterministicPoints,
  maximum_deterministic_points: benchmarkCases.length * 5,
  hard_gate_failures: hardGateFailures,
  passed_cases: caseReports.filter((item) => item.passed).length,
  total_cases: benchmarkCases.length,
  case_reports: caseReports,
  expert_review: "Not scored by this deterministic harness; report separately.",
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.conformant) process.exitCode = 1;
