import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const route = readFileSync(join(root, "frontend", "src", "app", "api", "intelligence", "community", "track-record", "route.js"), "utf8");
const repository = readFileSync(join(root, "frontend", "src", "lib", "server", "database", "CommunityRepository.js"), "utf8");

test("track record is authenticated, principal-bound, aggregate-only, and non-authoritative", () => {
  assert.match(route, /allowAnonymous:\s*false/);
  assert.match(route, /requiredPermission:\s*["']COMMUNITY\.READ["']/);
  assert.match(route, /userIdFromPrincipal\(principal\)/);
  assert.match(route, /getContributorTrackRecord\(userId\)/);
  assert.match(route, /authority:\s*["']NON_AUTHORITATIVE["']/);
  assert.match(route, /trustVerdictMutation:\s*false/);
  assert.doesNotMatch(route, /body\.(?:score|points|stars|qualityEvents)/i);
});

test("private quality history stays server-owned and is never exposed by the projection route", () => {
  assert.match(repository, /private\.community_quality_events/);
  assert.match(repository, /calculateCommunityTrackRecord\(summary\)/);
  assert.match(repository, /summaryResult/);
  assert.doesNotMatch(route, /community_quality_events|qualityEvent/i);
  assert.doesNotMatch(route, /INSERT|UPDATE|DELETE|setStars|setScore/i);
});
