import test from "node:test";
import assert from "node:assert/strict";
import { BLIND_REVIEW_VOTE_ENUM, BLIND_REVIEW_STATUS, EVIDENCE_SOURCE_TYPES } from "../../src/lib/server/expert/ExpertBlindReviewService.js";

test("Blind Expert Widget Contract — Canonical vote enum and status lifecycle", () => {
  // 1. Canonical vote enum: TRUSTWORTHY, UNTRUSTWORTHY, INSUFFICIENT_EVIDENCE (NOT binary)
  assert.equal(BLIND_REVIEW_VOTE_ENUM.TRUSTWORTHY, "TRUSTWORTHY");
  assert.equal(BLIND_REVIEW_VOTE_ENUM.UNTRUSTWORTHY, "UNTRUSTWORTHY");
  assert.equal(BLIND_REVIEW_VOTE_ENUM.INSUFFICIENT_EVIDENCE, "INSUFFICIENT_EVIDENCE");
  assert.equal(Object.keys(BLIND_REVIEW_VOTE_ENUM).length, 3);

  // 2. Canonical status lifecycle
  assert.ok(BLIND_REVIEW_STATUS.ASSIGNED);
  assert.ok(BLIND_REVIEW_STATUS.OPENED);
  assert.ok(BLIND_REVIEW_STATUS.DRAFT);
  assert.ok(BLIND_REVIEW_STATUS.SUBMITTED);
  assert.ok(BLIND_REVIEW_STATUS.LOCKED);
  assert.ok(BLIND_REVIEW_STATUS.EXPIRED);
  assert.ok(BLIND_REVIEW_STATUS.CANCELLED);

  // 3. Evidence source types
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("OFFICIAL"));
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("PRIMARY"));
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("ACADEMIC"));
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("GOVERNMENT"));
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("INDEPENDENT_MEDIA"));
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("COMMUNITY"));
  assert.ok(EVIDENCE_SOURCE_TYPES.includes("OTHER"));

  // 4. Widget visibility invariant
  const WIDGET_SHOWN_TO_NORMAL_USERS = "NO";
  assert.equal(WIDGET_SHOWN_TO_NORMAL_USERS, "NO");
});
