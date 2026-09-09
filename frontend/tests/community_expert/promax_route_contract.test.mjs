import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("Community live routes cannot silently use the JSON authority", () => {
  const posts = read("frontend/src/app/api/intelligence/community/posts/route.js");
  const detail = read("frontend/src/app/api/intelligence/community/experiences/[experienceId]/route.js");
  assert.match(posts, /CommunityRepository\.listContributions/);
  assert.match(posts, /isCommunityDemoMode/);
  assert.match(posts, /privacyConfirmed/);
  assert.match(posts, /previewDigest/);
  assert.match(posts, /saved\.idempotent \? 200 : 201/);
  assert.match(detail, /CommunityRepository\.getContribution/);
  assert.match(detail, /isCommunityDemoMode/);
  const trackRecord = read("frontend/src/app/api/intelligence/community/track-record/route.js");
  assert.match(trackRecord, /CommunityRepository\.getContributorTrackRecord/);
  assert.match(trackRecord, /NON_AUTHORITATIVE/);
  assert.match(trackRecord, /PROMAX_MIGRATION_REQUIRED/);
});

test("Forum reactions are durable and explicitly separated from trust", () => {
  const voteRoute = read("frontend/src/app/api/forum/vote/route.js");
  assert.match(voteRoute, /CommunityRepository\.setReaction/);
  assert.match(voteRoute, /trustMutation: false/);
  assert.match(voteRoute, /demo-only/i);
  assert.doesNotMatch(voteRoute, /authorTrustScore|scoreDelta/);
  assert.match(read("frontend/src/lib/server/database/CommunityRepository.js"), /reaction-state:/);
  assert.match(read("frontend/src/lib/server/database/CommunityRepository.js"), /currentReaction/);
});

test("Expert submission route requires assignment, COI declaration, and no submission quality mutation", () => {
  const repository = read("frontend/src/lib/server/database/ExpertRepository.js");
  const route = read("frontend/src/app/api/expert/assessments/route.js");
  assert.match(repository, /requireAssignment = true/);
  assert.match(repository, /COI_DECLARATION_REQUIRED/);
  assert.match(repository, /no private\.reputation_events insert here/i);
  assert.match(route, /qualityMutation: "NONE_ON_SUBMISSION"/);
  assert.match(route, /assignmentId/);
});

test("Expert assignment is scoped and idempotent before it enters the review queue", () => {
  const repository = read("frontend/src/lib/server/database/ExpertRepository.js");
  const route = read("frontend/src/app/api/expert/assignments/route.js");
  assert.match(repository, /assignment:\$\{assignedBy\}:\$\{idempotencyKey\}/);
  assert.match(repository, /expert_assignment.*idempotency|idempotency_key/si);
  assert.match(route, /idempotency-key/);
});

test("legacy stores are only selected through explicit demo adapters", () => {
  const communityStore = read("frontend/src/lib/intelligence/community/communityStore.js");
  const expertStore = read("frontend/src/lib/intelligence/expert/expertStore.js");
  assert.match(communityStore, /isCommunityDemoMode/);
  assert.match(expertStore, /isExpertDemoMode/);
  for (const path of ["frontend/src/app/api/intelligence/community/consensus/route.js", "frontend/src/app/api/intelligence/community/reality-gaps/route.js", "frontend/src/app/api/intelligence/community/friction/route.js", "frontend/src/app/api/intelligence/experts/verify-claim/route.js"]) {
    assert.match(read(path), /is(?:Community|Expert)DemoMode/);
  }
});

test("review and Trust bridge routes preserve scope and authority boundaries", () => {
  const reviewRoute = read("frontend/src/app/api/expert/reviews/route.js");
  const trustSignals = read("frontend/src/app/api/v1/trust/cases/[caseId]/community-signals/route.js");
  const repository = read("frontend/src/lib/server/database/ExpertRepository.js");
  const communityRepository = read("frontend/src/lib/server/database/CommunityRepository.js");
  assert.match(reviewRoute, /EXPERT\.EVALUATE/);
  assert.match(reviewRoute, /majorityApplied: false/);
  assert.match(repository, /recordReviewDecision/);
  assert.match(repository, /SELF_REVIEW_FORBIDDEN/);
  assert.match(repository, /REQUEST_INDEPENDENT_THIRD_REVIEW|resolveAssessmentDisagreement/);
  assert.match(trustSignals, /trustVerdictMutation: false/);
  assert.match(communityRepository, /listEvidenceSignalsForTrust/);
  assert.match(communityRepository, /NON_AUTHORITATIVE/);
  assert.match(communityRepository, /community_contribution_revisions/);
});

test("file preview validates binary content before any private object is publishable", () => {
  const previewRoute = read("frontend/src/app/api/intelligence/community/contributions/preview/route.js");
  assert.match(previewRoute, /detectMagic/);
  assert.match(previewRoute, /PRIVATE_FILE_CONTENT_MISMATCH/);
  assert.match(previewRoute, /PRIVATE_FILE_DIMENSIONS_INVALID/);
  assert.match(previewRoute, /detectPII/);
  assert.match(previewRoute, /originalStored: false/);
  assert.match(previewRoute, /publicDerivative: null/);
});

test("community revisions use expected-revision, privacy confirmation, and durable history", () => {
  const repository = read("frontend/src/lib/server/database/CommunityRepository.js");
  const route = read("frontend/src/app/api/intelligence/community/contributions/[contributionId]/route.js");
  assert.match(repository, /static async editContribution/);
  assert.match(repository, /STALE_REVISION/);
  assert.match(repository, /community_contribution_revisions/);
  assert.match(repository, /requiresRereview: true/);
  assert.match(route, /EDIT_COMMUNITY_CONTRIBUTION/);
  assert.match(route, /READ_COMMUNITY_CONTRIBUTION_REVISIONS/);
});

test("expert qualification requires a supervised evidence-based practice review before activation", () => {
  const service = read("frontend/src/lib/server/expert/ExpertQualificationService.js");
  const migration = read("database/migrations/202609090001_community_expert_promax.sql");
  assert.match(service, /submitPractice/);
  assert.match(service, /reviewPractice/);
  assert.match(service, /PRACTICE_REVIEW_REQUIRED/);
  assert.match(service, /REVIEWER_CANNOT_SELF_APPROVE/);
  assert.doesNotMatch(service, /reviewedBy\s*:/);
  assert.match(migration, /expert_practice_submissions/);
  assert.match(migration, /expert_practice_decisions/);
});

test("appeals have a separate independent resolver and append-only decision history", () => {
  const repository = read("frontend/src/lib/server/database/CommunityRepository.js");
  const route = read("frontend/src/app/api/expert/appeals/review/route.js");
  const migration = read("database/migrations/202609090001_community_expert_promax.sql");
  assert.match(repository, /static async reviewAppeal/);
  assert.match(repository, /SELF_APPEAL_REVIEW_FORBIDDEN/);
  assert.match(repository, /APPEALS_REVIEWER_REQUIRED/);
  assert.match(route, /ADMIN\.SECURITY/);
  assert.match(migration, /case_appeal_reviews/);
  assert.match(migration, /case_appeal_reviews_no_update/);
});
