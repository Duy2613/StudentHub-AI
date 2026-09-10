import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveNextChunkPath } from "./next-chunk-path.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = join(root, "frontend");
const budgetBytes = Number(process.env.TRUST_INITIAL_JS_BUDGET_BYTES || 500_000);
const totals = new Map();

const routes = [
  {
    path: "/",
    manifest: ["server", "app", "page_client-reference-manifest.js"],
    assignment: "/page",
    entry: "[project]/src/app/page",
  },
  {
    path: "/trust",
    manifest: ["server", "app", "trust", "page_client-reference-manifest.js"],
    assignment: "/trust/page",
    entry: "[project]/src/app/trust/page",
  },
  {
    path: "/community",
    manifest: ["server", "app", "community", "page_client-reference-manifest.js"],
    assignment: "/community/page",
    entry: "[project]/src/app/community/page",
  },
  {
    path: "/expert",
    manifest: ["server", "app", "expert", "page_client-reference-manifest.js"],
    assignment: "/expert/page",
    entry: "[project]/src/app/expert/page",
  },
  {
    path: "/cases",
    manifest: ["server", "app", "cases", "page_client-reference-manifest.js"],
    assignment: "/cases/page",
    entry: "[project]/src/app/cases/page",
  },
  {
    path: "/dashboard",
    manifest: ["server", "app", "dashboard", "page_client-reference-manifest.js"],
    assignment: "/dashboard/page",
    entry: "[project]/src/app/dashboard/page",
  },
  {
    path: "/settings",
    manifest: ["server", "app", "settings", "page_client-reference-manifest.js"],
    assignment: "/settings/page",
    entry: "[project]/src/app/settings/page",
  },
];

console.log("============================================================");
console.log("PHASE D.2 RELEASE BUNDLE BUDGET VALIDATOR");
console.log("============================================================\n");

for (const route of routes) {
  const manifestPath = join(frontend, ".next", ...route.manifest);
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing production client manifest for ${route.path}. Run \`npm run build\` first.`);
  }
  const source = readFileSync(manifestPath, "utf8");
  const routeAssignment = `globalThis.__RSC_MANIFEST["${route.assignment}"]`;
  let assignmentIndex = source.indexOf(" = ", source.indexOf(routeAssignment));
  if (assignmentIndex < 0) {
    assignmentIndex = source.indexOf("=", source.indexOf(routeAssignment));
  }
  if (assignmentIndex < 0) {
    throw new Error(`Missing manifest assignment for ${route.path}. Run \`npm run build\` first.`);
  }
  const braceIndex = source.indexOf("{", assignmentIndex);
  const manifest = JSON.parse(source.slice(braceIndex, source.lastIndexOf(";")));
  const chunks = manifest.entryJSFiles?.[route.entry] || [];
  if (chunks.length === 0) {
    throw new Error(`Missing entry chunks for ${route.path}. Run \`npm run build\` first.`);
  }
  const totalBytes = chunks.reduce((sum, chunk) => sum + statSync(resolveNextChunkPath(frontend, chunk)).size, 0);
  totals.set(route.path, totalBytes);
  const kb = (totalBytes / 1024).toFixed(1);
  const margin = budgetBytes - totalBytes;
  const pct = ((totalBytes / budgetBytes) * 100).toFixed(1);
  const status = totalBytes <= budgetBytes ? "PASS" : "FAIL";
  console.log(`[${status}] ${route.path.padEnd(12)}: ${totalBytes.toString().padStart(7)} bytes (${kb.padStart(6)} KB) / ${budgetBytes} bytes (${pct}%). Margin: +${margin} B. Chunks: ${chunks.length}`);
}

const overBudget = [...totals.entries()].filter(([, bytes]) => bytes > budgetBytes);
console.log("\n------------------------------------------------------------");
if (overBudget.length) {
  console.error(`[BUNDLE_BUDGET] FAIL: ${overBudget.map(([routePath]) => routePath).join(", ")} exceed the 500 KB budget.`);
  process.exit(1);
} else {
  console.log("[BUNDLE_BUDGET] PASS: All 7 core routes satisfy the 500 KB budget.");
  console.log("------------------------------------------------------------");
}
