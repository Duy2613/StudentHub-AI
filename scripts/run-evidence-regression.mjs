import { spawnSync } from "node:child_process";

const testFiles = [
  "frontend/tests/evidence/live_web_retrieval.test.mjs",
  "frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs",
  "frontend/tests/evidence/retrieval_benchmark.test.mjs",
  "frontend/tests/evidence/source_independence_benchmark.test.mjs",
  "frontend/tests/privacy/pii_benchmark.test.mjs",
  "frontend/tests/ai-eval/tevv_ai_evaluation.test.mjs",
  "frontend/tests/security/malicious_source_injection.test.mjs",
  "frontend/tests/security/secret_boundary.test.mjs"
];

console.log("============================================================");
console.log("🚀 STUDENTHUB V5 — FULL EVIDENCE REGRESSION RUNNER");
console.log("============================================================");

let allPassed = true;
const summary = [];

for (const file of testFiles) {
  process.stdout.write(`▶ Running: ${file} ... `);
  const start = Date.now();
  const res = spawnSync(process.execPath, [file], {
    stdio: "pipe",
    encoding: "utf8"
  });
  const duration = Date.now() - start;

  if (res.status === 0) {
    console.log(`PASS (${duration}ms)`);
    summary.push({ file, status: "PASS", duration });
  } else {
    console.log(`FAIL (${duration}ms)`);
    console.error(res.stdout);
    console.error(res.stderr);
    summary.push({ file, status: "FAIL", duration });
    allPassed = false;
  }
}

console.log("\n============================================================");
console.log(`REGRESSION SUMMARY: ${summary.filter(s => s.status === "PASS").length}/${summary.length} SUITES PASSED`);
console.log("============================================================");

if (!allPassed) {
  process.exit(1);
} else {
  console.log("✅ ALL SCIENTIFIC CLOSURE TEST SUITES PASSED CLEANLY.\n");
}
