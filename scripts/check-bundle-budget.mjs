import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = join(root, "frontend");
const budgetBytes = Number(process.env.TRUST_INITIAL_JS_BUDGET_BYTES || 500_000);
const totals = new Map();

for (const routeName of ["trust", "community", "expert"]) {
  const manifestPath = join(frontend, ".next", "server", "app", routeName, "page_client-reference-manifest.js");
  if (!existsSync(manifestPath)) throw new Error(`Missing production client manifest for /${routeName}. Run \`npm run build\` first.`);
  const source = readFileSync(manifestPath, "utf8");
  const routeAssignment = `globalThis.__RSC_MANIFEST["/${routeName}/page"]`;
  const assignmentIndex = source.indexOf(" = ", source.indexOf(routeAssignment));
  const manifest = JSON.parse(source.slice(source.indexOf("{", assignmentIndex), source.lastIndexOf(";")));
  const chunks = manifest.entryJSFiles?.[`[project]/src/app/${routeName}/page`] || [];
  const totalBytes = chunks.reduce((sum, chunk) => sum + statSync(join(frontend, ".next", chunk.replaceAll("/", "\\"))).size, 0);
  totals.set(routeName, totalBytes);
  console.log(`[BUNDLE_MEASURE] /${routeName} initial JS: ${totalBytes} bytes across ${chunks.length} chunks.`);
}

const trustBytes = totals.get("trust") || 0;
console.log(`[BUNDLE_BUDGET] /trust budget: ${budgetBytes} bytes.`);
if (trustBytes > budgetBytes) {
  console.error("[BUNDLE_BUDGET] FAIL: Trust route exceeds the interim initial-JS budget.");
  process.exitCode = 1;
} else {
  console.log("[BUNDLE_BUDGET] PASS");
}
