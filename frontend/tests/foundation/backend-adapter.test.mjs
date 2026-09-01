import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apiRequest } from "../../src/lib/api/client.ts";
import { ApiError } from "../../src/lib/api/errors.ts";
import { ApiProviderAdapter } from "../../src/lib/backend/adapters/ApiProviderAdapter.ts";
import { DemoProvider } from "../../src/lib/backend/providers/DemoProvider.ts";
import { FutureLiveProvider } from "../../src/lib/backend/providers/FutureLiveProvider.ts";
import { createApiProviderBundle, createDemoProviderBundle, selectProvider } from "../../src/lib/backend/providerFactory.ts";
import { providerFailure } from "../../src/lib/backend/ports.ts";

const input = {
  type: "TEXT",
  content: "Fixture input for provider boundary testing.",
  requestId: "request:foundation",
  runId: "run:foundation",
  confirmedEntities: [],
};

const STAGE_IDS = ["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"];

function incompleteStage(stageId) {
  return {
    schemaVersion: "trust.v5.stage",
    requestId: input.runId,
    stageId,
    architecturalLayer: "TEST",
    stageName: "Test stage",
    role: "Foundation fixture",
    checking: "No live result is available.",
    operationStatus: "BLOCKED",
    finding: null,
    severity: "INFO",
    startedAt: null,
    completedAt: null,
    latencyMs: null,
    providerStatus: "UNAVAILABLE",
    providerId: null,
    modelId: null,
    modelVersion: null,
    confidence: null,
    confidenceKind: "NOT_CALIBRATED",
    summary: "This stage did not return a result.",
    reasons: [],
    signals: [],
    evidenceRefs: [],
    meaning: "No conclusion is available.",
    notProve: "This stage does not prove safety.",
    limitations: ["Fixture does not include live evidence."],
    nextStage: null,
    safeToContinue: false,
    userAction: "Wait for an available provider.",
    audit: { attempt: 0, attemptCount: 0, errorCode: null, transition: "BLOCKED" },
  };
}

function incompleteTrustResponse() {
  return {
    success: true,
    contractVersion: "trust.v5",
    requestId: input.runId,
    version: "v5",
    demo: false,
    data: {
      schemaVersion: "trust.v5",
      pipelineVersion: "foundation-test",
      requestId: input.runId,
      pipelineStatus: "PARTIAL",
      currentStage: "l5",
      stages: Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, incompleteStage(stageId)])),
      finalDecision: null,
      assurance: null,
      startedAt: null,
      completedAt: null,
      audit: {
        requestId: input.runId,
        stageSequence: STAGE_IDS,
        stageAttempts: [],
        hardNegativePropagation: [],
        policyVersion: "foundation-test",
        assuranceVersion: "foundation-test",
      },
      layerResults: { layer1: null, layer2A: null, layer2B: null, layer2C: null, layer3: null, layer4: null },
    },
  };
}

describe("explicit provider modes", () => {
  it("DemoProvider is deterministic, labeled, and network-free", async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error("DemoProvider must not call fetch"); };
    try {
      const provider = new DemoProvider();
      const first = await provider.investigate(input);
      const second = await provider.investigate(input);
      assert.deepEqual(first, second);
      assert.equal(first.provenance.sourceMode, "DEMO");
      assert.equal(first.provenance.kind, "DEMO_FIXTURE");
      assert.equal(first.state, "INSUFFICIENT_EVIDENCE");
      assert.equal(first.trust?.value, "INSUFFICIENT_EVIDENCE");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("live selection never falls back to DemoProvider", async () => {
    const selection = selectProvider("LIVE");
    const result = await selection.provider.trust.investigate(input);
    assert.equal(selection.sourceMode, "UNAVAILABLE");
    assert.equal(selection.availability, "UNAVAILABLE");
    assert.equal(result.requestedMode, "LIVE");
    assert.equal(result.provenance.sourceMode, "UNAVAILABLE");
    assert.equal(result.provenance.kind, "UNAVAILABLE");
    assert.equal(result.state, "UNAVAILABLE");
    assert.equal(result.data, undefined);
    assert.equal(result.provenance.kind === "DEMO_FIXTURE", false);

    const future = new FutureLiveProvider();
    const community = await future.listObservations({ requestId: "request:community", limit: 10 });
    assert.equal(community.state, "UNAVAILABLE");
    assert.equal(community.providerStatus, "UNAVAILABLE");
  });

  it("rejects a demo bundle supplied to the live slot", () => {
    assert.throws(() => selectProvider("LIVE", { liveProvider: createDemoProviderBundle() }), TypeError);
  });
});

describe("API adapter boundary", () => {
  it("rejects invalid transport responses instead of creating a result", async () => {
    let calls = 0;
    const adapter = new ApiProviderAdapter({
      trustInvestigate: async () => { calls += 1; return { success: true, unexpected: true }; },
    });
    const result = await adapter.investigate(input);
    assert.equal(calls, 1);
    assert.equal(result.state, "ERROR");
    assert.equal(result.error?.code, "SCHEMA_MISMATCH");
    assert.equal(result.provenance.sourceMode, "UNAVAILABLE");
  });

  it("validates caller input before a provider call", async () => {
    let calls = 0;
    const adapter = new ApiProviderAdapter({ trustInvestigate: async () => { calls += 1; return {}; } });
    const result = await adapter.investigate({ ...input, content: "" });
    assert.equal(calls, 0);
    assert.equal(result.state, "ERROR");
    assert.equal(result.error?.code, "VALIDATION");
  });

  it("normalizes live community and expert DTOs without exposing backend shapes", async () => {
    const adapter = new ApiProviderAdapter({
      listCommunityPosts: async () => [{ postId: "post:1", topic: "TOPIC", title: "Observed", content: "A community observation.", context: { institution: "HCMUTE", cohort: "K24", procedure: "COURSE_REGISTRATION" }, evidenceRefs: ["evidence:community:1"], createdAt: "2026-09-01T00:00:00.000Z" }],
      listExperts: async () => ({ success: true, contractVersion: "experts.v1", data: { total: 1, experts: [{ expertId: "expert:1", name: "Reviewer", scopes: [{ domain: "AI_ML", level: "ESTABLISHED", citationCount: 12 }], credentials: [{ credentialId: "credential:1", type: "PhD", field: "AI", issuer: "University", issuedYear: 2022, status: "VERIFIED" }], publications: [{ pubId: "publication:1", title: "Evidence", venue: "Journal", year: 2025, domain: "AI_ML", doi: "10.1000/example" }], hasRegistrarAuthority: false }] } }),
    });
    const community = await adapter.listObservations({ requestId: "request:community", limit: 10 });
    assert.equal(community.state, "SUCCESS");
    assert.equal(community.provenance.kind, "COMMUNITY");
    assert.equal(community.data?.[0]?.observationId, "post:1");
    assert.equal(community.data?.[0]?.contextDetails?.cohort, "K24");
    assert.deepEqual(community.data?.[0]?.evidenceRefs, ["evidence:community:1"]);
    assert.equal("postId" in (community.data?.[0] || {}), false);

    const experts = await adapter.listExperts({ requestId: "request:experts", limit: 10 });
    assert.equal(experts.state, "SUCCESS");
    assert.equal(experts.provenance.kind, "EXPERT");
    assert.equal(experts.data?.[0]?.expertId, "expert:1");
    assert.equal(experts.data?.[0]?.credentials?.[0]?.credentialId, "credential:1");
    assert.equal(experts.data?.[0]?.publications?.[0]?.pubId, "publication:1");
  });

  it("submits a community observation through the existing endpoint and stays partial when case scope is not echoed", async () => {
    const adapter = new ApiProviderAdapter({
      createCommunityPost: async () => ({ success: true, post: { postId: "post:created", topic: "CASE_CORROBORATION", content: "Observed in person.", evidenceRefs: ["evidence:1"], createdAt: "2026-09-01T00:02:00.000Z" } }),
    });
    const result = await adapter.submitObservation({
      scope: { caseId: "case:1", caseRevision: 2 },
      statement: "Observed in person.",
      evidenceRefs: ["evidence:1"],
      requestId: "request:community-write",
      idempotencyKey: "idempotency:community-write",
    });
    assert.equal(result.state, "PARTIAL");
    assert.equal(result.data?.observationId, "post:created");
    assert.deepEqual(result.missing, ["community-case-scope-persistence"]);
    assert.notEqual(result.state, "SUCCESS");
  });

  it("reads existing community and expert detail endpoints through canonical ports", async () => {
    const adapter = new ApiProviderAdapter({
      readCommunityObservation: async () => ({ success: true, experience: { postId: "post:detail", content: "Detailed observation", context: { institution: "HCMUTE" }, createdAt: "2026-09-01T00:03:00.000Z" } }),
      readExpert: async () => ({ success: true, data: { expert: { expertId: "expert:detail", name: "Scoped reviewer", scopes: [{ domain: "AI_ML", level: "SUPPORTED" }], credentials: [], publications: [] } } }),
    });
    const observation = await adapter.getObservation("post:detail", { caseId: "case:1", caseRevision: 1 }, "request:community-detail");
    assert.equal(observation.state, "PARTIAL");
    assert.equal(observation.data?.observationId, "post:detail");
    assert.deepEqual(observation.data?.contextDetails, { institution: "HCMUTE" });

    const expert = await adapter.getExpert("expert:detail", "request:expert-detail");
    assert.equal(expert.state, "SUCCESS");
    assert.equal(expert.data?.scopes[0]?.domain, "AI_ML");
  });

  it("rejects a transport collection when a record cannot be normalized", async () => {
    const adapter = new ApiProviderAdapter({
      listCommunityPosts: async () => [{ postId: "post:invalid", topic: "TOPIC", title: "", content: "" }],
      listExperts: async () => ({ success: true, contractVersion: "experts.v1", data: { total: 1, experts: [{ expertId: "expert:invalid", name: "" }] } }),
    });
    const community = await adapter.listObservations({ requestId: "request:community-invalid", limit: 10 });
    const experts = await adapter.listExperts({ requestId: "request:experts-invalid", limit: 10 });
    assert.equal(community.state, "ERROR");
    assert.equal(community.error?.code, "SCHEMA_MISMATCH");
    assert.equal(experts.state, "ERROR");
    assert.equal(experts.error?.code, "SCHEMA_MISMATCH");
  });

  it("maps live provider failure to unavailable and never leaks the raw error", async () => {
    const adapter = new ApiProviderAdapter({
      trustInvestigate: async () => { throw new ApiError("provider secret and stack", "SERVICE_UNAVAILABLE", { requestId: "server:req" }); },
    });
    const result = await adapter.investigate(input);
    assert.equal(result.state, "UNAVAILABLE");
    assert.equal(result.providerStatus, "UNAVAILABLE");
    assert.equal(result.error?.code, "SERVICE_UNAVAILABLE");
    assert.equal(result.error?.retryable, true);
    assert.equal(result.error?.requestId, "server:req");
    assert.equal(JSON.stringify(result).includes("provider secret"), false);
    assert.equal(result.provenance.sourceMode, "UNAVAILABLE");
  });

  it("keeps provider partial results typed and identifies the missing dependency", () => {
    const result = providerFailure({
      requestedMode: "LIVE",
      dependency: "community-api",
      error: new ApiError("partial provider detail", "PROVIDER_PARTIAL"),
      data: [{ observationId: "known:1" }],
    });
    assert.equal(result.state, "PARTIAL");
    assert.deepEqual(result.data, [{ observationId: "known:1" }]);
    assert.deepEqual(result.missing, ["community-api"]);
    assert.equal(result.error?.code, "PROVIDER_PARTIAL");
  });

  it("preserves case/revision scope for assessment commands", async () => {
    const adapter = new ApiProviderAdapter({
      evaluateExpertClaim: async () => ({ success: true, evaluation: { claimStatus: "OUT_OF_SCOPE", explanation: "Scope is limited." } }),
    });
    const result = await adapter.requestAssessment({
      scope: { caseId: "case:1", caseRevision: 2 },
      expertId: "expert:1",
      claim: { text: "Claim", domain: "AI_ML", claimJurisdiction: "TECHNICAL_DOMAIN" },
      requestId: "request:assessment",
      idempotencyKey: "idempotency:assessment",
    });
    assert.equal(result.state, "SUCCESS");
    assert.deepEqual(result.data?.caseScope, { caseId: "case:1", caseRevision: 2 });
    assert.equal(result.data?.assessmentId, null);
  });

  it("normalizes the existing Passport endpoints without granting client authority", async () => {
    const rawPassport = {
      id: "passport:1",
      subjectType: "TRUST_CASE",
      subjectId: "case:1",
      currentStatus: "SUSPICIOUS",
      revision: 2,
      events: [
        { id: "event:1", type: "CREATED", provenanceClass: "USER_SUBMISSION", newStatus: "INSUFFICIENT_EVIDENCE", occurredAt: "2026-09-01T00:00:00.000Z", references: [] },
        { id: "event:2", type: "TRUST_RESULT", provenanceClass: "OFFICIAL", newStatus: "SUSPICIOUS", occurredAt: "2026-09-01T00:01:00.000Z", references: [{ id: "evidence:1" }] },
      ],
    };
    const bundle = createApiProviderBundle({ listPassports: async () => ({ success: true, passports: [rawPassport] }) });
    const result = await bundle.passport.getPassport({ caseId: "case:1", caseRevision: 2 }, "request:passport");
    assert.equal(bundle.mode, "LIVE");
    assert.equal(result.state, "SUCCESS");
    assert.equal(result.data?.passportId, "passport:1");
    assert.equal(result.data?.caseScope.caseId, "case:1");
    assert.equal(result.data?.revisions.length, 2);
    assert.equal(result.data?.revisions[1].evidenceRefs[0], "evidence:1");
    assert.equal(result.data?.sourceMode, "LIVE");
  });

  it("does not attach a Passport from a different case revision", async () => {
    const adapter = new ApiProviderAdapter({
      listPassports: async () => ({ success: true, passports: [{ id: "passport:stale", subjectId: "case:1", revision: 1, events: [] }] }),
    });
    const result = await adapter.getPassport({ caseId: "case:1", caseRevision: 2 }, "request:passport-stale");
    assert.equal(result.state, "EMPTY");
    assert.equal(result.data, null);
    assert.notEqual(result.state, "SUCCESS");
  });

  it("keeps a valid incomplete Trust pipeline partial instead of inventing success", async () => {
    const adapter = new ApiProviderAdapter({ trustInvestigate: async () => incompleteTrustResponse() });
    const result = await adapter.investigate(input);
    assert.equal(result.state, "PARTIAL");
    assert.equal(result.data, null);
    assert.ok(result.missing.length > 0);
    assert.notEqual(result.state, "SUCCESS");
  });
});

describe("safe API request behavior", () => {
  it("uses request identity and ignores raw backend messages", async () => {
    const previousFetch = globalThis.fetch;
    let receivedRequestId = null;
    globalThis.fetch = async (_path, options) => {
      receivedRequestId = new Headers(options.headers).get("X-Request-ID");
      return new Response(JSON.stringify({ error: { message: "raw internal detail" }, requestId: "server-request" }), { status: 503, headers: { "content-type": "application/json" } });
    };
    try {
      await assert.rejects(apiRequest("/api/test", { requestId: "client-request", timeoutMs: 100 }), (error) => {
        assert.equal(error.code, "SERVICE_UNAVAILABLE");
        assert.equal(error.requestId, "client-request");
        assert.equal(error.retryable, true);
        assert.equal(error.message.includes("raw internal detail"), false);
        return true;
      });
      assert.equal(receivedRequestId, "client-request");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("maps timeout and abort deterministically", async () => {
    const previousFetch = globalThis.fetch;
    const hangingFetch = (_path, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
    globalThis.fetch = hangingFetch;
    try {
      await assert.rejects(apiRequest("/api/test", { timeoutMs: 5 }), (error) => error.code === "TIMEOUT");
    } finally {
      globalThis.fetch = previousFetch;
    }

    const abortController = new AbortController();
    const abortFetch = globalThis.fetch;
    globalThis.fetch = hangingFetch;
    try {
      const pending = apiRequest("/api/test", { signal: abortController.signal, timeoutMs: 100 });
      abortController.abort("test");
      await assert.rejects(pending, (error) => error.code === "ABORTED");
    } finally {
      globalThis.fetch = abortFetch;
    }
  });

  it("maps invalid JSON to a typed response error without exposing the body", async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response("internal stack and provider secret", { status: 200, headers: { "content-type": "application/json" } });
    try {
      await assert.rejects(apiRequest("/api/test", { requestId: "request:invalid-json" }), (error) => {
        assert.equal(error.code, "INVALID_RESPONSE");
        assert.equal(error.requestId, "request:invalid-json");
        assert.equal(error.message.includes("provider secret"), false);
        return true;
      });
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
