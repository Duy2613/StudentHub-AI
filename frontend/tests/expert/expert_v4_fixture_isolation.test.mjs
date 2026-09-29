import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  });
}

test("production profile refuses demo-fixture DTOs and labels accepted dev fixtures", () => {
  const profile = read("frontend/src/components/expert/ExpertPublicProfileWorkspace.jsx");
  assert.match(profile, /payload\?\.meta\?\.sourceState === "DEMO_FIXTURE"/);
  assert.match(profile, /isDemoFixture && process\.env\.NODE_ENV === "production"/);
  assert.match(profile, /DEVELOPMENT FIXTURE/);
  assert.match(profile, /demoFixture \? <span>Không thể gửi yêu cầu tới hồ sơ fixture\.<\/span>/);
});

test("Expert demo profiles and queues are not reachable through production product routes", () => {
  const store = read("frontend/src/lib/intelligence/expert/expertStore.js");
  const directoryRoute = read("frontend/src/app/api/v1/experts/route.js");
  const network = read("frontend/src/components/expert/ExpertNetworkWorkspace.jsx");
  const shell = read("frontend/src/components/layout/UnifiedAppShell.jsx");
  assert.match(store, /process\.env\.NODE_ENV !== "production"/);
  assert.match(directoryRoute, /if \(!isExpertDemoMode\(\)\)/);
  assert.match(directoryRoute, /sourceState: "DURABLE_POSTGRES"/);
  assert.match(network, /SCOPED_PROVIDER_MODE === "DEMO" \? \[\] :/);
  assert.match(shell, /isExpert && !isExpertV4Route && !isTrustRoute && <ExpertBlindReviewWidget userRole="expert" \/>/);

  const routes = listFiles(join(root, "frontend/src/app")).map((path) => relative(join(root, "frontend/src/app"), path).replaceAll("\\", "/"));
  assert.equal(routes.some((path) => /expert-(?:fixture|performance)|\/(?:perf|fixtures?)\//i.test(path)), false);
  assert.equal(existsSync(join(root, "frontend/src/app/api/expert-v4-performance")), false);
});

test("public Expert search adapter contains no private queue or case index path", () => {
  const adapter = read("frontend/src/lib/backend/scopedRuntimeProvider.js");
  const expertProvider = adapter.slice(adapter.indexOf("export function getExpertRuntimeProvider"));
  assert.match(expertProvider, /api\/v1\/experts/);
  assert.doesNotMatch(expertProvider, /blind-reviews|review-requests|expert\/assessments/);
});
