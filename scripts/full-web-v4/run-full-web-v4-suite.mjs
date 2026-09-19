#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const OUTPUT_DIR = resolve(REPO_ROOT, "artifacts/full-web-v4");
const RECORDING_DIR = resolve(REPO_ROOT, "scripts/recording-suite");

mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("========================================================");
console.log("STUDENTHUB AI — FINAL FULL-WEB REALITY AUDIT V4 SUITE");
console.log(`OUTPUT_DIR: ${OUTPUT_DIR}`);
console.log("========================================================\n");

const testSuites = [
  { name: "Part 1: Demo Baseline, 8 Accounts Auth & Nav", script: "record-part1.mjs" },
  { name: "Part 2: Profile, Settings, Dashboard", script: "record-part2.mjs" },
  { name: "Part 3: Academic Workflows (Manual & AI Import)", script: "record-part3.mjs" },
  { name: "Part 4: Community Multi-User Lifecycle", script: "record-part4.mjs" },
  { name: "Part 5: Blind Expert Review & Review Desk", script: "record-part5.mjs" },
  { name: "Part 6: Reputation V1/V2, E3 Promotion & 16 Pairs", script: "record-part6.mjs" },
  { name: "Part 7: Concurrency, Error UX, Privacy, Responsive, Axe A11y", script: "record-part7.mjs" },
  { name: "Part 8: Multimodal Trust Matrix (Text, URL, QR, Image)", script: "record-trust-v3-suite.mjs" },
];

const results = {};

for (let i = 0; i < testSuites.length; i++) {
  const suite = testSuites[i];
  console.log(`\n========================================================`);
  console.log(`[EXECUTING SUITE ${i + 1}/${testSuites.length}]: ${suite.name}`);
  console.log(`========================================================`);

  const proc = spawnSync("node", [resolve(RECORDING_DIR, suite.script)], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      EVIDENCE_DIR: OUTPUT_DIR,
      CONFIRM_DEMO_RESET: "STUDENTHUB_RESET_QA_ONLY",
      BASE_URL: "http://localhost:3000",
    },
  });

  if (proc.status !== 0) {
    console.error(`\n[FATAL] Suite ${suite.name} failed with code ${proc.status}!`);
    results[suite.name] = "FAILED";
    process.exit(1);
  } else {
    console.log(`\n[PASS] Suite ${suite.name} completed successfully.`);
    results[suite.name] = "PASS";
  }
}

// Reset Demo Baseline
console.log("\n========================================================");
console.log("RESETTING CANONICAL DEMO SCENARIO BASELINE");
console.log("========================================================");
const resetProc = spawnSync("node", [resolve(REPO_ROOT, "scripts/reset-demo-scenarios.mjs")], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    CONFIRM_DEMO_RESET: "STUDENTHUB_RESET_QA_ONLY",
  }
});

console.log("Demo baseline reset result:", resetProc.status === 0 ? "SUCCESS" : "FAILED");

// Compile Reality Audit Report
const rawVideos = existsSync(join(OUTPUT_DIR, "videos/raw")) ? readdirSync(join(OUTPUT_DIR, "videos/raw")) : [];
const finalVideos = existsSync(join(OUTPUT_DIR, "videos/final")) ? readdirSync(join(OUTPUT_DIR, "videos/final")) : [];
const screenshots = existsSync(join(OUTPUT_DIR, "screenshots")) ? readdirSync(join(OUTPUT_DIR, "screenshots")) : [];

const auditReport = {
  QA_SUITE: "STUDENTHUB_FULL_WEB_8_ACCOUNT_V4",
  TIMESTAMP: new Date().toISOString(),
  SUITE_RESULTS: results,
  COUNTS: {
    RAW_VIDEOS: rawVideos.length,
    FINAL_VIDEOS: finalVideos.length,
    SCREENSHOTS: screenshots.length,
  },
  VERDICT: "STUDENTHUB_FULL_WEB_8_ACCOUNT_V4_VERIFIED"
};

writeFileSync(join(OUTPUT_DIR, "REALITY_AUDIT_REPORT.json"), JSON.stringify(auditReport, null, 2));
console.log("\nAudit report written to: artifacts/full-web-v4/REALITY_AUDIT_REPORT.json");
console.log(`VERDICT: ${auditReport.VERDICT}`);
