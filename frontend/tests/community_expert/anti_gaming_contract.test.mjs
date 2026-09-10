import assert from "node:assert/strict";
import test from "node:test";
import { analyzeReactionIntegrity } from "../../src/lib/communityExpert/promaxDomain.js";

const now = Date.parse("2026-09-10T00:00:00.000Z");

test("reaction integrity keeps a normal typed reaction clean", () => {
  const result = analyzeReactionIntegrity({
    now,
    reactions: [{ actorId: "u-1", contributionId: "c-1", kind: "HELPFUL", idempotencyKey: "r-1", createdAt: new Date(now - 86_400_000).toISOString() }],
    contributions: [{ id: "c-1", publicationState: "PUBLISHED" }],
  });
  assert.equal(result.status, "CLEAN");
  assert.equal(result.abuseSignal, false);
  assert.equal(result.automaticAction, "NONE");
});

test("duplicate, burst, and coordinated-account patterns are signals only", () => {
  const burst = Array.from({ length: 13 }, (_, index) => ({
    actorId: "u-burst",
    contributionId: `c-${index}`,
    kind: "HELPFUL",
    idempotencyKey: `burst-${index}`,
    identityClusterKey: "cluster-1",
    createdAt: new Date(now - index * 1_000).toISOString(),
  }));
  const result = analyzeReactionIntegrity({
    now,
    reactions: [
      { actorId: "u-1", contributionId: "c-dup", kind: "HELPFUL", idempotencyKey: "same", createdAt: new Date(now - 2_000).toISOString() },
      { actorId: "u-1", contributionId: "c-dup", kind: "HELPFUL", idempotencyKey: "same", createdAt: new Date(now - 1_000).toISOString() },
      { actorId: "u-2", contributionId: "c-other", kind: "HELPFUL", idempotencyKey: "other", identityClusterKey: "cluster-1", createdAt: new Date(now - 3_000).toISOString() },
      ...burst,
    ],
    contributions: [{ id: "c-dup", publicationState: "PUBLISHED" }, { id: "c-other", publicationState: "PUBLISHED" }],
  });
  const codes = result.signals.map((signal) => signal.code);
  assert.equal(result.status, "ABUSE_SIGNAL");
  assert.ok(codes.includes("DUPLICATE_REACTION_TUPLE"));
  assert.ok(codes.includes("DUPLICATE_REACTION_IDEMPOTENCY"));
  assert.ok(codes.includes("MULTIPLE_ACCOUNTS_IDENTITY_CLUSTER"));
  assert.ok(codes.includes("REACTION_BURST"));
  assert.equal(result.automaticAction, "NONE");
  assert.equal(result.reviewRequired, true);
});

test("reciprocal helpful, suspended actor, and inactive target remain reviewable without automatic guilt", () => {
  const result = analyzeReactionIntegrity({
    now,
    reactions: [
      { actorId: "u-a", targetAuthorId: "u-b", contributionId: "c-b", kind: "HELPFUL", idempotencyKey: "a", createdAt: new Date(now - 5_000).toISOString() },
      { actorId: "u-b", targetAuthorId: "u-a", contributionId: "c-a", kind: "HELPFUL", idempotencyKey: "b", createdAt: new Date(now - 4_000).toISOString() },
      { actorId: "u-suspended", contributionId: "c-withdrawn", kind: "CHALLENGE", idempotencyKey: "s", createdAt: new Date(now - 2_000).toISOString() },
    ],
    contributions: [{ id: "c-a", publicationState: "PUBLISHED" }, { id: "c-b", publicationState: "PUBLISHED" }, { id: "c-withdrawn", publicationState: "WITHDRAWN" }],
    actorStates: [{ actorId: "u-suspended", status: "SUSPENDED" }],
  });
  const codes = result.signals.map((signal) => signal.code);
  assert.ok(codes.includes("RECIPROCAL_HELPFUL_RING_SIGNAL"));
  assert.ok(codes.includes("REACTION_FROM_SUSPENDED_ACTOR"));
  assert.ok(codes.includes("REACTION_TARGET_NOT_ACTIVE"));
  assert.equal(result.automaticAction, "NONE");
});
