import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("Expert review requests are durable, private, and separate from assignment authority", () => {
  const migration = read("database/migrations/202609150004_expert_review_requests.sql");
  const repository = read("frontend/src/lib/server/database/ExpertRepository.js");
  const route = read("frontend/src/app/api/expert/review-requests/route.js");
  const scope = read("frontend/src/lib/server/database/CommunityExpertScope.js");
  const ui = read("frontend/src/components/trust/PostResultGateways.jsx");

  assert.match(migration, /create table if not exists private\.expert_review_requests/i);
  assert.match(migration, /requester_id uuid/i);
  assert.match(migration, /case_revision integer/i);
  assert.match(migration, /claim_id uuid/i);
  assert.match(migration, /domain_code text/i);
  assert.match(migration, /question text/i);
  assert.match(migration, /status text not null default 'REQUESTED'/i);
  assert.match(migration, /REQUESTED.*MATCHING.*ASSIGNED.*IN_REVIEW.*COMPLETED.*CANCELLED.*EXPIRED/is);
  assert.match(migration, /expert_review_request_events/i);
  assert.match(migration, /add column if not exists review_request_id/i);
  assert.match(migration, /alter table private\.expert_review_requests enable row level security/i);
  assert.match(migration, /revoke all on private\.expert_review_requests, private\.expert_review_request_events from public, anon, authenticated/i);

  assert.match(scope, /export async function assertOwnedCaseScope/);
  assert.match(scope, /CASE_OWNER_REQUIRED/);
  assert.match(repository, /static async createReviewRequest/);
  assert.match(repository, /EXPERT_REVIEW_REQUESTED/);
  assert.match(repository, /ACTIVE_REVIEW_REQUEST_EXISTS/);
  assert.match(repository, /requester cannot name an/i);
  assert.match(repository, /reviewRequestId/);
  assert.match(repository, /REVIEW_REQUEST_SCOPE_MISMATCH/);

  assert.match(route, /requiredPermission: "EXPERT\.REQUEST"/g);
  assert.match(route, /expert-review-request\.v1/);
  assert.match(route, /NOT_REQUESTER_CONTROLLED/);
  assert.match(ui, /Yêu cầu chuyên gia xem xét/);
  assert.match(ui, /matching\/assignment/);
  assert.match(ui, /Idempotency-Key/);
  assert.match(ui, /caseId/);
});

test("Expert request permission is available to authenticated student and expert roles", () => {
  const rbac = read("frontend/src/lib/security/authorization/RBACPolicy.js");
  const identity = read("frontend/src/lib/security/identity/IdentityResolver.js");
  assert.match(rbac, /EXPERT_REQUEST: "EXPERT\.REQUEST"/);
  assert.match(rbac, /PERMISSIONS\.EXPERT_REQUEST/);
  assert.match(identity, /"EXPERT\.REQUEST"/);
});
