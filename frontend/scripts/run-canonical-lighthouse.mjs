import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3200";
const outputDir = join(frontendRoot, ".lighthouseci", "academic-mobile", "final-canonical");
const runs = Number(process.env.LIGHTHOUSE_RUNS || 3);
const routes = [
  ["landing", "/"],
  ["lesson", "/learn/cs101/fullstack-intro"],
  ["roadmap", "/roadmap"],
  ["trust", "/trust"],
];

mkdirSync(outputDir, { recursive: true });
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const failures = [];

const runLighthouse = (args) =>
  new Promise((resolve) => {
    const child = spawn(npx, args, {
      cwd: frontendRoot,
      stdio: ["ignore", "ignore", "pipe"],
      env: process.env,
      shell: true,
      windowsHide: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => resolve({ status: null, stderr: `${stderr}${error.message}` }));
    child.on("close", (status) => resolve({ status, stderr }));
  });

for (const [slug, path] of routes) {
  for (let run = 1; run <= runs; run += 1) {
    const outputPath = join(outputDir, `${slug}-${run}.json`);
    // Never let a failed Lighthouse invocation make a stale report look like
    // evidence for this run. The output path is recreated by Lighthouse.
    unlinkSync(outputPath, { force: true });
    const args = [
      "--yes",
      "lighthouse@13.4.1",
      `${baseUrl}${path}`,
      "--output=json",
      `--output-path=${outputPath}`,
      "--quiet",
      "--form-factor=mobile",
      "--screen-emulation.mobile",
      "--screen-emulation.width=360",
      "--screen-emulation.height=640",
      "--screen-emulation.device-scale-factor=2",
      "--throttling-method=devtools",
      "--chrome-flags=--headless --no-sandbox --disable-gpu --disable-dev-shm-usage",
      "--locale=vi",
      "--max-wait-for-load=45000",
    ];
    const result = await runLighthouse(args);
    const hasJson = existsSync(outputPath);
    console.log(`[LIGHTHOUSE_RUN] ${slug}-${run}: exit=${result.status ?? "signal"} json=${hasJson ? "yes" : "no"}`);
    if (result.stderr.trim()) console.error(result.stderr.trim().split("\n").slice(-3).join("\n"));
    if (result.status !== 0 || !hasJson) failures.push(`${slug}-${run}`);
  }
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
for (const [slug] of routes) {
  const reports = Array.from({ length: runs }, (_, index) => {
    const reportPath = join(outputDir, `${slug}-${index + 1}.json`);
    if (!existsSync(reportPath)) {
      console.error(`[LIGHTHOUSE_METRICS_MISSING] ${slug}-${index + 1}: no JSON artifact was produced`);
      return null;
    }
    try {
      return JSON.parse(readFileSync(reportPath, "utf8"));
    } catch (error) {
      console.error(`[LIGHTHOUSE_METRICS_INVALID] ${slug}-${index + 1}: ${error.message}`);
      return null;
    }
  }).filter(Boolean);
  if (reports.length === 0) continue;
  const values = reports.map((report) => ({
    lcp: report.audits["largest-contentful-paint"]?.numericValue ?? null,
    fcp: report.audits["first-contentful-paint"]?.numericValue ?? null,
    cls: report.audits["cumulative-layout-shift"]?.numericValue ?? null,
    tbt: report.audits["total-blocking-time"]?.numericValue ?? null,
  }));
  console.log(`[LIGHTHOUSE_MEDIAN] ${slug}: ${JSON.stringify({
    sampleCount: values.length,
    runs: values,
    median: {
      lcp: median(values.map((value) => value.lcp)),
      fcp: median(values.map((value) => value.fcp)),
      cls: median(values.map((value) => value.cls)),
      tbt: median(values.map((value) => value.tbt)),
    },
  })}`);
}

if (failures.length > 0) {
  console.error(`[LIGHTHOUSE_RUNNER_TEARDOWN_FAIL_WINDOWS_EPERM_OR_OTHER] ${failures.join(", ")}`);
  process.exitCode = 1;
}
