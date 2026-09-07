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
    path: "/learn/cs101/fullstack-intro",
    manifest: ["server", "app", "learn", "[courseId]", "[lessonId]", "page_client-reference-manifest.js"],
    assignment: "/learn/[courseId]/[lessonId]/page",
    entry: "[project]/src/app/learn/[courseId]/[lessonId]/page",
  },
  {
    path: "/roadmap",
    manifest: ["server", "app", "roadmap", "page_client-reference-manifest.js"],
    assignment: "/roadmap/page",
    entry: "[project]/src/app/roadmap/page",
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
];

for (const route of routes) {
  const manifestPath = join(frontend, ".next", ...route.manifest);
  if (!existsSync(manifestPath)) throw new Error(`Missing production client manifest for ${route.path}. Run \`npm run build\` first.`);
  const source = readFileSync(manifestPath, "utf8");
  const routeAssignment = `globalThis.__RSC_MANIFEST["${route.assignment}"]`;
  const assignmentIndex = source.indexOf(" = ", source.indexOf(routeAssignment));
  if (assignmentIndex < 0) throw new Error(`Missing manifest assignment for ${route.path}. Run \`npm run build\` first.`);
  const manifest = JSON.parse(source.slice(source.indexOf("{", assignmentIndex), source.lastIndexOf(";")));
  const chunks = manifest.entryJSFiles?.[route.entry] || [];
  if (chunks.length === 0) throw new Error(`Missing entry chunks for ${route.path}. Run \`npm run build\` first.`);
  const totalBytes = chunks.reduce((sum, chunk) => sum + statSync(resolveNextChunkPath(frontend, chunk)).size, 0);
  totals.set(route.path, totalBytes);
  console.log(`[BUNDLE_MEASURE] ${route.path} initial JS: ${totalBytes} bytes across ${chunks.length} chunks.`);
}

const overBudget = [...totals.entries()].filter(([, bytes]) => bytes > budgetBytes);
for (const [routePath] of totals) {
  console.log(`[BUNDLE_BUDGET] ${routePath} budget: ${budgetBytes} bytes.`);
}
if (overBudget.length) {
  console.error(`[BUNDLE_BUDGET] FAIL: ${overBudget.map(([routePath]) => routePath).join(", ")} exceed the interim initial-JS budget.`);
  process.exitCode = 1;
} else {
  console.log("[BUNDLE_BUDGET] PASS");
}
