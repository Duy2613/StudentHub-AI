import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "../../src/lib/api/errors.ts";
import {
  UIStateContractError,
  canTransition,
  commitIfCurrent,
  createConflictingEvidenceState,
  createEmptyState,
  createAuthRequiredState,
  createErrorState,
  createForbiddenState,
  createInsufficientEvidenceState,
  createLoadingState,
  createPartialState,
  createStateEnvelope,
  createSuccessState,
  createUnavailableState,
  createUnknownState,
  isCurrentWork,
  uiStateForApiError,
} from "../../src/lib/ui-state/model.ts";

const demoProvenance = {
  requestedMode: "DEMO",
  sourceMode: "DEMO",
  kind: "DEMO_FIXTURE",
  label: "Test fixture",
  fixtureId: "foundation-test",
  fixtureVersion: "1",
};

const liveUnavailableProvenance = {
  requestedMode: "LIVE",
  sourceMode: "UNAVAILABLE",
  kind: "UNAVAILABLE",
  label: "Live provider unavailable",
  providerId: "test-provider",
};

describe("canonical UI state envelope", () => {
  it("preserves success, empty, and partial semantics", () => {
    const success = createSuccessState({ report: "valid" }, { requestId: "request:1", provenance: demoProvenance });
    assert.equal(success.state, "SUCCESS");
    assert.deepEqual(success.data, { report: "valid" });

    const empty = createEmptyState([], { requestId: "request:2", provenance: demoProvenance });
    assert.equal(empty.state, "EMPTY");
    assert.deepEqual(empty.data, []);

    const partial = createPartialState({ completed: ["l1"] }, ["l2", "l3"], { requestId: "request:3", provenance: demoProvenance });
    assert.equal(partial.state, "PARTIAL");
    assert.deepEqual(partial.data, { completed: ["l1"] });
    assert.deepEqual(partial.missing, ["l2", "l3"]);
    assert.throws(() => createStateEnvelope({ state: "PARTIAL", data: {}, provenance: demoProvenance }), UIStateContractError);
  });

  it("requires explicit uncertainty and rejects UNKNOWN-to-SAFE presentation", () => {
    const unknown = createUnknownState(["source authority is unresolved"], { value: null }, { requestId: "request:4", provenance: demoProvenance, trust: { kind: "TRUST_DECISION", value: "UNKNOWN" } });
    assert.equal(unknown.state, "UNKNOWN");
    assert.deepEqual(unknown.unknowns, ["source authority is unresolved"]);

    const insufficient = createInsufficientEvidenceState(["independent evidence is missing"], undefined, { requestId: "request:5", provenance: demoProvenance });
    assert.equal(insufficient.state, "INSUFFICIENT_EVIDENCE");
    assert.throws(() => createUnknownState(["unresolved"], undefined, { provenance: demoProvenance, trust: { kind: "TRUST_DECISION", value: "SAFE" } }), UIStateContractError);
    assert.throws(() => createStateEnvelope({ state: "UNKNOWN", provenance: demoProvenance }), UIStateContractError);
  });

  it("preserves conflict/unavailable/error/offline meanings", () => {
    const conflict = createConflictingEvidenceState({ official: "A", observed: "B" }, ["sources disagree"], { provenance: demoProvenance });
    assert.equal(conflict.state, "CONFLICTING_EVIDENCE");
    assert.deepEqual(conflict.data, { official: "A", observed: "B" });

    const unavailable = createUnavailableState({
      provenance: liveUnavailableProvenance,
      unavailable: { dependency: "live-provider", reason: "NOT_CONFIGURED" },
      requestId: "request:6",
    });
    assert.equal(unavailable.state, "UNAVAILABLE");
    assert.equal(canTransition("UNAVAILABLE", "SUCCESS"), false);

    const error = createErrorState(new ApiError("internal provider detail", "SERVICE_UNAVAILABLE", { requestId: "request:7" }).toSafeError(), { provenance: liveUnavailableProvenance });
    assert.equal(error.state, "ERROR");
    assert.equal(error.error.userMessage.includes("internal provider detail"), false);
    assert.equal(uiStateForApiError("NETWORK_ERROR"), "OFFLINE");
    assert.equal(uiStateForApiError("TIMEOUT"), "UNAVAILABLE");
    assert.equal(uiStateForApiError("ABORTED"), "CANCELLED");

    const auth = createAuthRequiredState(new ApiError("session detail", "UNAUTHORIZED").toSafeError(), { provenance: demoProvenance });
    const forbidden = createForbiddenState(new ApiError("authorization detail", "FORBIDDEN").toSafeError(), { provenance: demoProvenance });
    assert.equal(auth.state, "AUTH_REQUIRED");
    assert.equal(auth.error.code, "UNAUTHORIZED");
    assert.equal(forbidden.state, "FORBIDDEN");
    assert.equal(forbidden.error.code, "FORBIDDEN");
  });
});

describe("stale request/run guard", () => {
  it("commits only the current request and run", () => {
    const current = createLoadingState({ requestId: "request:new", runId: "run:new", provenance: demoProvenance });
    const stale = createSuccessState({ value: "old" }, { requestId: "request:old", runId: "run:old", provenance: demoProvenance });
    const fresh = createSuccessState({ value: "new" }, { requestId: "request:new", runId: "run:new", provenance: demoProvenance });
    const identity = { requestId: "request:new", runId: "run:new" };
    assert.equal(isCurrentWork(stale, identity), false);
    assert.equal(isCurrentWork(fresh, identity), true);
    assert.equal(commitIfCurrent(current, stale, identity), current);
    assert.equal(commitIfCurrent(current, fresh, identity), fresh);
  });
});
