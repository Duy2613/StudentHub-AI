import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isPublicExpertReviewCase, ExpertBlindReviewService } from "../../src/lib/server/expert/ExpertBlindReviewService.js";

const readSource = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("Expert V4 blind DTO keeps missing contract fields unknown and separates the question from the claim", () => {
  const dto = ExpertBlindReviewService._buildBlindSummaryDTO({
    assignment_id: "assignment-1",
    case_id: "case-1",
    case_revision: null,
    claim_id: null,
    domain_code: "PUBLIC_POLICY",
    assignment_status: "ASSIGNED",
    question: "Which source supports this claim?",
    context_refs: [],
    case_visibility: "PUBLIC",
    conflict_of_interest: null,
  });

  assert.equal(dto.caseRevision, null);
  assert.equal(dto.claim, null);
  assert.equal(dto.reviewQuestion, "Which source supports this claim?");
  assert.equal(dto.conflictOfInterest, null);
  assert.equal(dto.caseVisibility, "PUBLIC");
});

test("Expert case exposure fails closed unless the case visibility is explicitly public", () => {
  assert.equal(isPublicExpertReviewCase({ case_visibility: "PUBLIC" }), true);
  assert.equal(isPublicExpertReviewCase({ case_visibility: "public" }), true);
  assert.equal(isPublicExpertReviewCase({ case_visibility: "PRIVATE" }), false);
  assert.equal(isPublicExpertReviewCase({ case_visibility: null }), false);
  assert.equal(isPublicExpertReviewCase({}), false);
});

test("Expert V4 uses the canonical review request and assessment APIs without browser draft persistence", () => {
  const requestSheet = readSource("../../src/components/expert/RequestExpertReviewSheet.jsx");
  const assessment = readSource("../../src/components/expert/ExpertAdjudicationWorkspace.jsx");

  assert.match(requestSheet, /apiRequest\("\/api\/expert\/review-requests"/);
  assert.match(assessment, /apiRequest\("\/api\/expert\/assessments"/);
  assert.doesNotMatch(requestSheet, /localStorage\s*\./);
  assert.doesNotMatch(assessment, /localStorage\s*\./);
  assert.match(assessment, /subscribe\("expert", "expert:assignment"/);
  assert.match(assessment, /subscribe\("expert", "expert:revision"/);
  assert.match(assessment, /subscribe\("trust", "trust:revision"/);
  assert.match(assessment, /subscribe\("trust", "trust:expert_review"/);
});

test("public Expert UI does not mount legacy reputation or cinematic surfaces", () => {
  const network = readSource("../../src/components/expert/ExpertNetworkWorkspace.jsx");
  const profile = readSource("../../src/components/expert/ExpertPublicProfileWorkspace.jsx");
  const styles = readSource("../../src/components/expert/expert-v4.module.css");

  assert.match(network, /ExpertAdjudicationWorkspace/);
  assert.match(network, /ExpertPublicDirectory/);
  assert.doesNotMatch(network, /ExpertAuthorityNetwork|ExpertCinematicHero|ReputationMatrixCard|ExpertPublicStory/);
  assert.match(profile, /DEVELOPMENT FIXTURE/);
  assert.match(styles, /@media \(max-width: 768px\)/);
  assert.match(styles, /\.queuePaneHiddenMobile/);
  assert.match(styles, /\.casePaneVisibleMobile/);
});
