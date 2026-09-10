import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

test("migration and persistence failures remain truthful at the UI boundary", () => {
  const error = read("frontend/src/lib/api/runtimeError.js");
  const client = read("frontend/src/lib/api/runtimeClient.js");
  const provider = read("frontend/src/lib/backend/scopedRuntimeProvider.js");
  const boundary = read("frontend/src/components/ui/StateBoundary.jsx");
  const qualification = read("frontend/src/components/expert/ExpertQualificationPanel.jsx");
  assert.match(error, /PROMAX_MIGRATION_REQUIRED/);
  assert.match(error, /no data substitute|chưa có dữ liệu thay thế/i);
  assert.match(client, /SAFE_SERVER_ERROR_CODES/);
  assert.match(provider, /MIGRATION_REQUIRED/);
  assert.match(provider, /nextActions:\s*migrationRequired\s*\?\s*\[\]/);
  assert.match(boundary, /UNAVAILABLE/);
  assert.match(boundary, /role = \["ERROR", "UNAVAILABLE"/);
  assert.match(boundary, /aria-live="polite"/);
  assert.match(qualification, /temporarily|chưa được khởi tạo|không khả dụng|track record live/i);
});

test("live Community and Expert providers preserve EMPTY/UNAVAILABLE instead of synthetic fallback", () => {
  const provider = read("frontend/src/lib/backend/scopedRuntimeProvider.js");
  const community = read("frontend/src/components/community/CommunityIntelligenceView.jsx");
  const expert = read("frontend/src/components/expert/ExpertIntelligenceView.jsx");
  assert.match(provider, /state: data\.length \? "SUCCESS" : "EMPTY"/);
  assert.match(provider, /sourceMode: "LIVE"/);
  assert.match(provider, /SCOPED_PROVIDER_MODE === "DEMO"/);
  assert.match(provider, /migrationRequired\s*\n?\s*\?\s*\[\]/);
  assert.match(community, /providerResult\?\.state === "SUCCESS"\s*\|\|\s*providerResult\?\.state === "EMPTY"/);
  assert.match(expert, /\["SUCCESS", "EMPTY"\]\.includes\(listResult\.state\)/);
  assert.match(expert, /Không có hồ sơ phù hợp/);
});
