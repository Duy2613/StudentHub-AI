import fs from "node:fs";
import path from "node:path";

const BUDGET_BYTES = 500 * 1024;
const nextDir = path.resolve(process.cwd(), ".next");
const manifestPath = path.join(nextDir, "build-manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("BUNDLE_BUDGET_BLOCKED_BY_ENV: .next/build-manifest.json not found. Run next build first.");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const rootMainFiles = [...new Set((manifest.rootMainFiles || []).filter((file) => file.endsWith(".js")))];
const files = rootMainFiles.map((file) => {
  const absolutePath = path.join(nextDir, file);
  if (!fs.existsSync(absolutePath)) throw new Error("Missing build manifest file: " + file);
  return { file, bytes: fs.statSync(absolutePath).size };
});
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const totalKiB = totalBytes / 1024;

console.log("[BUNDLE_BUDGET] Root initial JS: " + totalBytes + " bytes (" + totalKiB.toFixed(2) + " KiB)");
console.log("[BUNDLE_BUDGET] Budget: " + BUDGET_BYTES + " bytes (" + Math.round(BUDGET_BYTES / 1024) + " KiB)");
console.log("[BUNDLE_BUDGET] Files: " + files.length);

if (totalBytes > BUDGET_BYTES) {
  console.error("[BUNDLE_BUDGET] Status: FAIL (" + (totalBytes - BUDGET_BYTES) + " bytes over budget)");
  process.exit(1);
}

console.log("[BUNDLE_BUDGET] Status: PASS");
