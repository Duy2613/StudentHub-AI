import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("9. Formal Expert Assessment is absent when backend data is absent", () => {
  const formalCardSource = read("src/components/expert/FormalExpertAssessmentCard.jsx");

  // Check truthful absent state message
  assert.match(formalCardSource, /Chưa có đánh giá chuyên môn chính thức/);
  assert.match(formalCardSource, /if \(!assessment \|\| Object\.keys\(assessment\)\.length === 0\)/);

  // Ensure no fabricated dean signatures or invented authority
  assert.doesNotMatch(formalCardSource, /Academic Council Dean/i);
  assert.doesNotMatch(formalCardSource, /institutional signing authority/i);
  assert.doesNotMatch(formalCardSource, /immutable cryptographic signature/i);
});

test("10. Conversational Expert Response remains distinct from Formal Assessment", () => {
  const conversationalSource = read("src/components/community/ConversationalExpertResponse.jsx");
  const formalCardSource = read("src/components/expert/FormalExpertAssessmentCard.jsx");

  // Ensure conversational response explicitly disclaims formal standing
  assert.match(conversationalSource, /Không thay thế cho Văn bản Giám định chính thức/);
  assert.match(conversationalSource, /Bình luận thảo luận chuyên gia/);

  // Ensure class names and semantic wrappers remain completely distinct
  assert.match(conversationalSource, /community-expert-response-card/);
  assert.match(formalCardSource, /expert-formal-assessment-card/);
});

test("11. Expert Qualification renders all 8 server-owned states without simulated transitions", () => {
  const qualSource = read("src/components/expert/ExpertQualificationWorkspace.jsx");

  assert.match(qualSource, /PROFILE/);
  assert.match(qualSource, /IDENTITY_REVIEW/);
  assert.match(qualSource, /QUIZ_ELIGIBLE/);
  assert.match(qualSource, /QUIZ_IN_PROGRESS/);
  assert.match(qualSource, /DOMAIN_REVIEW/);
  assert.match(qualSource, /ACTIVE/);
  assert.match(qualSource, /REJECTED/);
  assert.match(qualSource, /APPEALED/);

  // Check that transitions are server owned and not client simulated
  assert.match(qualSource, /SERVER OWNED/i);
  assert.doesNotMatch(qualSource, /simulateStateTransition/i);
  assert.doesNotMatch(qualSource, /setTimeout\(\(\) => setLifecycle/i);
});

test("12. Expert Reputation Matrix only displays real signals without fake client scores", () => {
  const repSource = read("src/components/expert/ReputationMatrixCard.jsx");

  assert.match(repSource, /Never calculate a new client-side reputation score/i);
  assert.match(repSource, /DỰA TRÊN CHẤT LƯỢNG BẰNG CHỨNG SƠ CẤP/);
  assert.match(repSource, /không trao quyền kiểm duyệt/i);
  assert.doesNotMatch(repSource, /computeScore/i);
  assert.doesNotMatch(repSource, /calculateReputation/i);
});

test("13. Multi-Expert Disagreement displays differing opinions side-by-side without forced consensus", () => {
  const disagreementSource = read("src/components/expert/MultiExpertDisagreementStack.jsx");

  assert.match(disagreementSource, /quan điểm độc lập có bằng chứng khác biệt/i);
  assert.match(disagreementSource, /Không tính điểm trung bình/i);
  assert.match(disagreementSource, /expert-disagreement-grid/);
});

test("14. Expert Review Desk Modal binds live-review.mp4 with safe fallback", () => {
  const modalSource = read("src/components/expert/ExpertReviewDeskModal.jsx");

  assert.match(modalSource, /\/media\/v3\/expert\/live-review\.mp4/);
  assert.match(modalSource, /\/media\/v3\/expert\/live-review-poster\.webp/);
  assert.match(modalSource, /video-fallback-poster/);
});
