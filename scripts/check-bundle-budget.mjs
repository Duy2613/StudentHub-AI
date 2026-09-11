import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveNextChunkPath } from "./next-chunk-path.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = join(root, "frontend");
const budgetBytes = Number(process.env.TRUST_INITIAL_JS_BUDGET_BYTES || 500_000);
const totals = new Map();

// Canonical Seven Core Routes (Binding Amendment 9)
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
console.log("CANONICAL PREINTERACTION_CLIENT_RSC_ENTRY_JS BUDGET AUDIT");
console.log(`Budget Limit: ${budgetBytes.toLocaleString()} bytes across 7 core routes`);
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
  const manifest = JSON.parse(source.slice(source.indexOf("{", assignmentIndex), source.lastIndexOf(";")));
  const chunks = manifest.entryJSFiles?.[route.entry] || [];
  if (chunks.length === 0) {
    throw new Error(`Missing entry chunks for ${route.path}. Run \`npm run build\` first.`);
  }
  const totalBytes = chunks.reduce((sum, chunk) => sum + statSync(resolveNextChunkPath(frontend, chunk)).size, 0);
  totals.set(route.path, totalBytes);
  const status = totalBytes <= budgetBytes ? "PASS" : "FAIL";
  console.log(`[${status}] PREINTERACTION_CLIENT_RSC_ENTRY_JS ${route.path.padEnd(12)}: ${totalBytes.toString().padStart(7)} B / ${budgetBytes} B (Margin: +${(budgetBytes - totalBytes).toLocaleString()} B, ${chunks.length} chunks)`);
}

const overBudget = [...totals.entries()].filter(([, bytes]) => bytes > budgetBytes);
console.log("\n------------------------------------------------------------");
if (overBudget.length) {
  console.error(`[BUNDLE_BUDGET] FAIL: ${overBudget.map(([routePath]) => routePath).join(", ")} exceed the 500,000-byte budget.`);
  process.exitCode = 1;
} else {
  console.log("[BUNDLE_BUDGET] PASS: All 7 core routes satisfy the canonical 500,000-byte limit.");
  console.log("------------------------------------------------------------");
}
