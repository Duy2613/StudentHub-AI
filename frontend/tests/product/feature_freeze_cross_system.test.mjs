import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  appendEvidenceEvent,
  createEvidencePassport,
  PASSPORT_EVENT_TYPE,
  PROVENANCE_CLASS,
  EvidencePassportValidationError,
  passportChangeSummary,
} from "../../src/lib/intelligence/passport/evidencePassportModel.js";
import {
  DECISION_BASIS,
  DECISION_CERTAINTY,
  DecisionTwinValidationError,
  evaluateDecisionScenario,
} from "../../src/lib/intelligence/decision/studentDecisionTwinEngine.js";
import { COMPETITION_SUPERFLOWS } from "../../src/lib/competition/competitionSuperflows.js";

function livePassport() {
  return createEvidencePassport({
    id: "a7b72bf1-6069-45cb-9a56-30299f077a72",
    ownerId: "1af108d6-27fa-4da0-8616-92f59f27b7b5",
    title: "Suspicious scholarship request",
    subjectType: "FRAUD_INCIDENT",
    subjectId: "case-1",
    initialStatus: "INSUFFICIENT_EVIDENCE",
    createdAt: "2026-08-29T00:00:00.000Z",
  });
}

describe("Living Evidence Passport", () => {
  it("appends immutable material changes and preserves old and new results", () => {
    const original = livePassport();
    const updated = appendEvidenceEvent(original, {
      id: "event-2",
      type: PASSPORT_EVENT_TYPE.RESULT_CHANGED,
      provenanceClass: PROVENANCE_CLASS.OFFICIAL,
      summary: "Official policy contradicts the payment request.",
      occurredAt: "2026-08-29T00:01:00.000Z",
      newStatus: "HIGH_RISK",
      changeReason: "The official process does not request a deposit.",
      references: [{ id: "source-1", label: "Official policy", sourceType: "OFFICIAL" }],
    });

    assert.equal(original.currentStatus, "INSUFFICIENT_EVIDENCE");
    assert.equal(original.events.length, 1);
    assert.equal(original.events[0].provenanceClass, "USER_SUBMISSION");
    assert.equal(updated.currentStatus, "HIGH_RISK");
    assert.equal(updated.revision, 2);
    assert.deepEqual(passportChangeSummary(updated), {
      changed: true,
      materialChangeCount: 1,
      oldResult: "INSUFFICIENT_EVIDENCE",
      newResult: "HIGH_RISK",
      why: "The official process does not request a deposit.",
      newEvidence: [{ id: "source-1", label: "Official policy", sourceType: "OFFICIAL" }],
      changedAt: "2026-08-29T00:01:00.000Z",
    });
  });

  it("rejects demo evidence in a live passport and Community-only resolution", () => {
    const passport = livePassport();
    assert.throws(() => appendEvidenceEvent(passport, {
      id: "demo-event",
      type: PASSPORT_EVENT_TYPE.COMMUNITY_UPDATE,
      provenanceClass: PROVENANCE_CLASS.DEMO_FIXTURE,
      summary: "Demo observation",
      occurredAt: "2026-08-29T00:01:00.000Z",
    }), (error) => error instanceof EvidencePassportValidationError && error.code === "DEMO_DATA_REJECTED");

    assert.throws(() => appendEvidenceEvent(passport, {
      id: "community-resolution",
      type: PASSPORT_EVENT_TYPE.RESOLVED,
      provenanceClass: PROVENANCE_CLASS.COMMUNITY,
      summary: "Community says this is resolved.",
      occurredAt: "2026-08-29T00:01:00.000Z",
      newStatus: "RESOLVED",
    }), (error) => error instanceof EvidencePassportValidationError && error.code === "UNSCOPED_RESOLUTION");
  });

  it("allows user notes without granting them result-changing authority", () => {
    const passport = appendEvidenceEvent(livePassport(), {
      id: "user-note",
      type: PASSPORT_EVENT_TYPE.USER_NOTE,
      provenanceClass: PROVENANCE_CLASS.USER_SUBMISSION,
      summary: "I received the message at 09:00.",
      occurredAt: "2026-08-29T00:01:00.000Z",
    });
    assert.equal(passport.currentStatus, "INSUFFICIENT_EVIDENCE");
    assert.equal(passport.events.at(-1).material, false);
  });

  it("rejects out-of-order evidence events", () => {
    assert.throws(() => appendEvidenceEvent(livePassport(), {
      id: "old-event",
      type: PASSPORT_EVENT_TYPE.TRUST_RESULT,
      provenanceClass: PROVENANCE_CLASS.TRUST_ENGINE,
      summary: "Late-arriving write with an older append time.",
      occurredAt: "2026-08-28T23:59:00.000Z",
    }), (error) => error.code === "NON_MONOTONIC_EVENT");
  });
});

describe("Student Decision Twin", () => {
  const scenario = {
    id: "decision-1",
    title: "Pay now or verify",
    currentState: "The sender requests an urgent deposit.",
    unknowns: [],
    options: [
      {
        id: "pay",
        label: "Pay now",
        summary: "Follow the unverified request.",
        nextAction: "Do not proceed.",
        factors: { risk: 5, deadline: 2, dependency: 1, importance: 5, uncertainty: 4 },
        consequences: [{ id: "loss", statement: "Money may be lost.", basis: DECISION_BASIS.TRUST_EVIDENCE, certainty: DECISION_CERTAINTY.SUPPORTED, direction: "BLOCKER", severity: 5 }],
      },
      {
        id: "verify",
        label: "Verify first",
        summary: "Use an independent official channel.",
        nextAction: "Open the official portal directly.",
        factors: { risk: 1, deadline: 1, dependency: 1, importance: 5, uncertainty: 1 },
        consequences: [{ id: "safer", statement: "Reduces payment risk.", basis: DECISION_BASIS.DETERMINISTIC_RULE, certainty: DECISION_CERTAINTY.CONFIRMED, direction: "BENEFIT", severity: 5 }],
      },
    ],
  };

  it("recommends from explicit deterministic factors and exposes every basis", () => {
    const result = evaluateDecisionScenario(scenario);
    assert.equal(result.evaluationMethod, "DETERMINISTIC_WEIGHTED_FACTORS_V1");
    assert.equal(result.recommendedOptionId, "verify");
    assert.equal(result.recommendationState, "RECOMMENDED");
    assert.ok(result.options.every((option) => option.consequences.every((item) => item.basis && item.certainty)));
  });

  it("requires two options and refuses critical unknowns", () => {
    assert.throws(() => evaluateDecisionScenario({ ...scenario, options: [scenario.options[0]] }), DecisionTwinValidationError);
    const uncertain = structuredClone(scenario);
    uncertain.unknowns = ["Official policy version"];
    uncertain.options[1].factors.uncertainty = 4;
    const result = evaluateDecisionScenario(uncertain);
    assert.equal(result.recommendationState, "REVIEW_REQUIRED");
    assert.equal(result.recommendedOptionId, null);
  });
});

describe("Competition superflows", () => {
  it("ships exactly three labeled deterministic flows with all cross-system outputs", () => {
    assert.equal(COMPETITION_SUPERFLOWS.length, 3);
    assert.deepEqual(COMPETITION_SUPERFLOWS.map((flow) => flow.id), ["fake-scholarship", "fake-internship", "academic-conflict"]);
    for (const flow of COMPETITION_SUPERFLOWS) {
      assert.equal(flow.demo, true);
      assert.equal(flow.provenance, "DEMO_FIXTURE");
      assert.match(flow.dataNotice, /fixture/i);
      assert.ok(flow.officialEvidence && flow.community && flow.expert);
      assert.ok(flow.conflicts.length > 0 && flow.unknowns.length > 0);
      assert.ok(flow.passport.events.length >= 3);
      assert.ok(flow.decision.options.length >= 2);
      assert.ok(flow.nextAction);
    }
  });
});
