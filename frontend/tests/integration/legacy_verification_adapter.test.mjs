import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LegacyVerificationAdapter,
  normalizeLegacyLayer3Payload,
  normalizeLegacyLayer4Payload,
} from "../../src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js";
import { createLayer2AResult } from "../../src/lib/ai-trust/layer2a/types.js";
import { buildCanonicalEvidence, buildPassportProjection, buildTrustGraph } from "../../src/lib/ai-trust/integrations/canonicalTrustProjection.js";

function responseFor(payload, status = 200, contentType = "application/json", extraHeaders = {}) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        const extra = extraHeaders[String(name).toLowerCase()];
        if (extra !== undefined) return String(extra);
        if (name === "content-type") return contentType;
        if (name === "content-length") return String(bytes.byteLength);
        return null;
      },
    },
    arrayBuffer: async () => bytes.buffer,
  };
}

function adapterWith(handler, options = {}) {
  const { env = {}, ...adapterOptions } = options;
  return new LegacyVerificationAdapter({
    env: { STUDENTHUB_LEGACY_VERIFICATION_BASE_URL: "https://legacy.example.test", STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false", ...env },
    fetchImpl: handler,
    resolveDns: false,
    ...adapterOptions,
  });
}

const claims = [{ claimId: "claim-1", rawText: "Trường công bố lịch học." }];

describe("legacy four-layer anti-corruption adapter", () => {
  it("normalizes Layer 2 SAFE/no-match without converting it to safe proof", async () => {
    const adapter = adapterWith(async (endpoint) => {
      assert.match(endpoint, /\/api\/verify\/layer2$/);
      return responseFor({ verdict: "SAFE", confidence: 0.94, reason: "No known match", providers: [{ provider: "safe-provider", success: true, verdict: "SAFE", confidence: 0.94 }] });
    });
    const result = await adapter.verifyLayer2({ url: "https://example.com", requestId: "legacy-l2-safe" });
    assert.equal(result.finding, "NO_KNOWN_THREAT");
    assert.equal(result.provenance.noMatchIsSafetyProof, false);
    assert.equal(result.securityClassification, "NO_KNOWN_THREAT");
  });

  it("redacts provider diagnostics before they enter the Layer 2 DTO", async () => {
    const adapter = adapterWith(async () => responseFor({
      verdict: "UNKNOWN",
      reason: "provider token=upstream-secret connectionString=postgres://user:pw@db.example.test/app",
      providers: [{
        provider: "legacy-provider",
        success: false,
        verdict: "UNKNOWN",
        message: "api_key=provider-secret password=another-secret",
      }],
    }));
    const result = await adapter.verifyLayer2({ url: "https://example.com/provider-diagnostics" });
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("upstream-secret"), false);
    assert.equal(serialized.includes("provider-secret"), false);
    assert.equal(serialized.includes("another-secret"), false);
    assert.equal(serialized.includes("postgres://"), false);
    assert.match(result.message, /token=\[REDACTED\]/);
    assert.match(result.providerResults[0].message, /api_key=\[REDACTED\]/);
  });

  it("retains Layer 2 DANGEROUS and UNKNOWN as distinct findings", async () => {
    let verdict = "DANGEROUS";
    const adapter = adapterWith(async () => responseFor({ verdict, providers: [{ provider: "safe-provider", success: true, verdict, threatTypes: ["PHISHING"] }] }));
    const dangerous = await adapter.verifyLayer2({ url: "https://example.com/dangerous", requestId: "legacy-l2-dangerous" });
    assert.equal(dangerous.finding, "THREAT_MATCH");
    verdict = "UNKNOWN";
    const unknown = await adapter.verifyLayer2({ url: "https://example.com/unknown", requestId: "legacy-l2-unknown" });
    assert.equal(unknown.finding, "UNKNOWN");
  });

  it("maps Layer 2 outage to UNAVAILABLE and never DEMO", async () => {
    const adapter = adapterWith(async () => { throw new Error("network down"); });
    const result = await adapter.verifyLayer2({ url: "https://example.com", requestId: "legacy-l2-outage" });
    assert.equal(result.providerStatus, "UNAVAILABLE");
    assert.equal(result.finding, "UNKNOWN");
    assert.equal("demo" in result, false);
  });

  it("maps a malformed Layer 2 payload to typed invalid response without provider truth", async () => {
    const adapter = adapterWith(async () => responseFor({ verdict: "SAFE", confidence: 2 }));
    const result = await adapter.verifyLayer2({ url: "https://example.com", requestId: "legacy-l2-malformed" });
    assert.equal(result.providerStatus, "INVALID_RESPONSE");
    assert.equal(result.finding, "UNKNOWN");
    assert.equal(result.rawVerdict, null);
  });

  it("sends only bounded server-side JSON and rejects non-JSON responses", async () => {
    let request;
    const adapter = adapterWith(async (endpoint, init) => {
      request = { endpoint, init };
      return responseFor({ verdict: "TRUE" }, 200, "text/plain");
    });
    const result = await adapter.verifyLayer3({
      input: { type: "text", content: "A bounded claim" },
      claims,
      requestId: "legacy-transport-contract",
    });
    assert.equal(result.legacyIntegration.providerStatus, "INVALID_RESPONSE");
    assert.equal(request.endpoint, "https://legacy.example.test/api/verify/layer3");
    assert.equal(request.init.method, "POST");
    assert.equal(request.init.redirect, "error");
    assert.equal(request.init.headers["X-Request-ID"], "legacy-transport-contract");
    const body = JSON.parse(request.init.body);
    assert.deepEqual(Object.keys(body).sort(), ["content", "type"]);
    assert.equal(body.requestId, undefined);
    assert.equal(body.type, "text");
    assert.equal(body.content, "A bounded claim");
  });

  it("redacts sensitive URL query material before the Layer 2 provider boundary", async () => {
    let request;
    const adapter = adapterWith(async (endpoint, init) => {
      request = { endpoint, init };
      return responseFor({
        verdict: "SAFE",
        providers: [{ provider: "bounded-provider", success: true, verdict: "SAFE" }],
      });
    });
    const result = await adapter.verifyLayer2({
      url: "https://example.com/login?token=do-not-send&next=%2Fdashboard",
      requestId: "legacy-sensitive-url",
    });
    const body = JSON.parse(request.init.body);
    assert.equal(result.finding, "NO_KNOWN_THREAT");
    assert.equal(body.content, "https://example.com/login");
    assert.equal(body.content.includes("do-not-send"), false);
    assert.deepEqual(Object.keys(body).sort(), ["content", "type"]);
    assert.equal(result.reputationLookupStatus, "LOOKUP_REDACTED");
  });

  it("emits the exact pinned Layer 4 DTO and keeps provider observations bounded", async () => {
    let request;
    const adapter = adapterWith(async (endpoint, init) => {
      request = { endpoint, init };
      return responseFor({ verdict: "UNKNOWN", confidence: 0.5, evidenceAgreement: 0.5, sourceQuality: 0.5, stop: false, canContinueToLayer4: true, mode: "user", geminiModel: "none", groqModel: "openai/gpt-oss-120b", reason: "Bounded provider result.", contradictoryEvidence: [], sources: [] });
    });
    const result = await adapter.verifyLayer4({
      input: { type: "url", content: "https://example.com/claim" },
      layer3Result: {
        legacyIntegration: { rawVerdict: "TRUE", legacyAssessmentConfidence: 0.91, reason: "Provider observation" },
        evidence: [
          { evidenceId: "l3-evidence", sourceUrl: "https://example.com/source", sourceTitle: "Example source", excerpt: "Bounded excerpt" },
          { evidenceId: "private-evidence", sourceUrl: "http://127.0.0.1/private", sourceTitle: "Must be dropped", excerpt: "Do not send" },
        ],
        sources: [{ sourceId: "l3-source", url: "https://example.com/source", title: "Example source" }],
      },
      requestId: "legacy-layer4-dto",
    });
    const body = JSON.parse(request.init.body);
    assert.equal(result.status, "COMPLETED");
    assert.equal(request.endpoint, "https://legacy.example.test/api/verify/layer4");
    assert.deepEqual(Object.keys(body).sort(), ["content", "layer3", "mode", "type"]);
    assert.deepEqual(Object.keys(body.layer3).sort(), ["confidence", "evidence", "reason", "sources", "verdict"]);
    assert.equal(body.type, "url");
    assert.equal(body.content, "https://example.com/claim");
    assert.equal(body.mode, "user");
    assert.equal(body.layer3.verdict, "TRUE");
    assert.equal(body.layer3.confidence, 0.91);
    assert.equal(body.layer3.evidence.length, 1);
    assert.equal(body.layer3.evidence[0].url, "https://example.com/source");
    assert.equal(body.layer3.sources.length, 1);
    assert.equal("requestId" in body, false);
    assert.equal("layers" in body, false);
  });

  it("retries transient legacy responses with bounded jittered backoff", async () => {
    let calls = 0;
    const delays = [];
    const adapter = adapterWith(async () => {
      calls += 1;
      return calls === 1
        ? responseFor({ error: "temporary" }, 503)
        : responseFor({ verdict: "SAFE", confidence: 0.7, providers: [{ provider: "bounded", success: true, verdict: "SAFE", confidence: 0.7 }] });
    }, {
      sleep: async (milliseconds) => { delays.push(milliseconds); },
      random: () => 0,
    });
    const result = await adapter.verifyLayer2({ url: "https://example.com/retry", requestId: "legacy-retry" });
    assert.equal(result.finding, "NO_KNOWN_THREAT");
    assert.equal(calls, 2);
    assert.deepEqual(delays, [150]);
    assert.equal(adapter.describe().resilience.circuitState, "CLOSED");
  });

  it("honors a bounded Retry-After response header", async () => {
    let calls = 0;
    const delays = [];
    const adapter = adapterWith(async () => {
      calls += 1;
      return calls === 1
        ? responseFor({ error: "rate limited" }, 429, "application/json", { "retry-after": "3" })
        : responseFor({ verdict: "SAFE", confidence: 0.7, providers: [{ provider: "bounded", success: true, verdict: "SAFE", confidence: 0.7 }] });
    }, {
      env: {
        STUDENTHUB_LEGACY_VERIFICATION_RETRY_BASE_DELAY_MS: "10",
        STUDENTHUB_LEGACY_VERIFICATION_RETRY_MAX_DELAY_MS: "5000",
      },
      sleep: async (milliseconds) => { delays.push(milliseconds); },
      random: () => 0,
    });
    const result = await adapter.verifyLayer2({ url: "https://example.com/rate", requestId: "legacy-retry-after" });
    assert.equal(result.finding, "NO_KNOWN_THREAT");
    assert.equal(calls, 2);
    assert.deepEqual(delays, [3000]);
  });

  it("opens a circuit after repeated provider failures and probes after cooldown", async () => {
    let now = 0;
    let calls = 0;
    const adapter = adapterWith(async () => {
      calls += 1;
      if (calls < 3) throw new Error("provider unavailable");
      return responseFor({ verdict: "SAFE", confidence: 0.7, providers: [{ provider: "bounded", success: true, verdict: "SAFE", confidence: 0.7 }] });
    }, {
      env: {
        STUDENTHUB_LEGACY_VERIFICATION_MAX_ATTEMPTS: "1",
        STUDENTHUB_LEGACY_VERIFICATION_CIRCUIT_FAILURE_THRESHOLD: "2",
        STUDENTHUB_LEGACY_VERIFICATION_CIRCUIT_COOLDOWN_MS: "1000",
      },
      clock: () => now,
    });
    const first = await adapter.verifyLayer2({ url: "https://example.com/circuit-1" });
    const second = await adapter.verifyLayer2({ url: "https://example.com/circuit-2" });
    const blocked = await adapter.verifyLayer2({ url: "https://example.com/circuit-3" });
    assert.equal(first.providerStatus, "UNAVAILABLE");
    assert.equal(second.providerStatus, "UNAVAILABLE");
    assert.equal(blocked.providerStatus, "CIRCUIT_OPEN");
    assert.equal(calls, 2);
    assert.equal(adapter.describe().resilience.circuitState, "OPEN");

    now = 1000;
    const recovered = await adapter.verifyLayer2({ url: "https://example.com/circuit-recovery" });
    assert.equal(recovered.finding, "NO_KNOWN_THREAT");
    assert.equal(calls, 3);
    assert.equal(adapter.describe().resilience.circuitState, "CLOSED");
  });

  it("rejects work above the legacy bulkhead without queueing or fallback", async () => {
    let calls = 0;
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    const adapter = adapterWith(async () => {
      calls += 1;
      await pending;
      return responseFor({ verdict: "SAFE", confidence: 0.7, providers: [{ provider: "bounded", success: true, verdict: "SAFE", confidence: 0.7 }] });
    }, {
      env: {
        STUDENTHUB_LEGACY_VERIFICATION_BULKHEAD_MAX_CONCURRENCY: "1",
        STUDENTHUB_LEGACY_VERIFICATION_MAX_ATTEMPTS: "1",
      },
    });
    const firstPromise = adapter.verifyLayer2({ url: "https://example.com/bulkhead-1" });
    await Promise.resolve();
    const second = await adapter.verifyLayer2({ url: "https://example.com/bulkhead-2" });
    assert.equal(second.providerStatus, "UNAVAILABLE");
    assert.equal(calls, 1);
    release();
    const first = await firstPromise;
    assert.equal(first.finding, "NO_KNOWN_THREAT");
  });

  it("rejects oversized responses before JSON parsing", async () => {
    const adapter = adapterWith(async () => ({
      ok: true,
      status: 200,
      headers: { get: (name) => name === "content-type" ? "application/json" : String(384 * 1024 + 1) },
      arrayBuffer: async () => { throw new Error("must not read oversized body"); },
    }));
    const result = await adapter.verifyLayer4({ input: { type: "url", content: "https://example.com" }, requestId: "legacy-response-limit" });
    assert.equal(result.status, "UNAVAILABLE");
    assert.equal(result.providerStatus, "INVALID_RESPONSE");
    assert.equal(result.errorCode, "LEGACY_RESPONSE_TOO_LARGE");
  });

  it("times out a hanging legacy request after bounded retries without substituting demo data", async () => {
    let calls = 0;
    const adapter = new LegacyVerificationAdapter({
      env: {
        STUDENTHUB_LEGACY_VERIFICATION_BASE_URL: "https://legacy.example.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
        STUDENTHUB_LEGACY_VERIFICATION_TIMEOUT_MS: "300",
        STUDENTHUB_LEGACY_VERIFICATION_RETRY_BASE_DELAY_MS: "0",
      },
      resolveDns: false,
      sleep: async () => {},
      fetchImpl: async (_endpoint, { signal }) => {
        calls += 1;
        return await new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        }, { once: true });
        });
      },
    });
    const result = await adapter.verifyLayer3({ input: { type: "text", content: "A bounded claim" }, claims, requestId: "legacy-timeout" });
    assert.equal(result.legacyIntegration.providerStatus, "TIMEOUT");
    assert.equal(result.legacyIntegration.status, "UNAVAILABLE");
    assert.equal(result.legacyIntegration.canContinueToLayer4, false);
    assert.equal(result.legacyIntegration.rawVerdict, null);
    assert.equal(calls, 2);
  });

  it("propagates caller cancellation instead of converting it to provider outage", async () => {
    const controller = new AbortController();
    const adapter = adapterWith(async (_endpoint, { signal }) => await new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => {
        const error = new Error("caller aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
      controller.abort("stale-run");
    }));
    await assert.rejects(
      adapter.verifyLayer3({ input: { type: "text", content: "A bounded claim" }, claims, requestId: "legacy-cancelled", signal: controller.signal }),
      (error) => error?.name === "AbortError",
    );
  });

  it("fails closed for a private legacy backend target before issuing a request", async () => {
    let calls = 0;
    const adapter = new LegacyVerificationAdapter({
      env: { STUDENTHUB_LEGACY_VERIFICATION_BASE_URL: "http://127.0.0.1:8080" },
      fetchImpl: async () => { calls += 1; },
      resolveDns: false,
    });
    const result = await adapter.verifyLayer4({ input: { type: "url", content: "https://example.com" }, requestId: "legacy-ssrf" });
    assert.equal(adapter.describe().enabled, false);
    assert.equal(adapter.describe().configError, "SSRF_RESTRICTED");
    assert.equal(result.providerStatus, "NOT_CONFIGURED");
    assert.equal(calls, 0);
  });

  it("preserves Layer 3 TRUE/FALSE/UNKNOWN and validated continuation", () => {
    const base = {
      sources: [{ id: "source-1", url: "https://official.example/source", title: "Official", sourceType: "OFFICIAL", liveEvidence: true, retrievalOutcome: "SUCCESS", sourceFingerprint: "src-fp" }],
      evidence: [{ id: "evidence-1", claimId: "claim-1", sourceId: "source-1", excerpt: "Observed official fact", relation: "SUPPORTS", liveEvidence: true, retrievalOutcome: "SUCCESS", sourceFingerprint: "src-fp" }],
      externalEvidence: true,
      stop: false,
      canContinueToLayer4: true,
    };
    const supported = normalizeLegacyLayer3Payload({ ...base, verdict: "TRUE", confidence: 0.88 }, { claims, requestId: "legacy-l3-true" });
    assert.equal(supported.ok, true);
    assert.equal(supported.result.legacyIntegration.rawVerdict, "TRUE");
    assert.equal(supported.result.status, "VERIFIED");
    assert.equal(supported.result.legacyIntegration.canContinueToLayer4, true);
    assert.equal(supported.result.sources[0].origin, "LAYER_3_WEB_EVIDENCE");
    assert.equal(supported.result.evidence[0].origin, "LAYER_3_WEB_EVIDENCE");

    const contradicted = normalizeLegacyLayer3Payload({ ...base, verdict: "FALSE", canContinueToLayer4: false }, { claims, requestId: "legacy-l3-false" });
    assert.equal(contradicted.result.legacyIntegration.rawVerdict, "FALSE");
    assert.equal(contradicted.result.status, "CONTESTED");
    assert.equal(contradicted.result.legacyIntegration.canContinueToLayer4, false);

    const unknown = normalizeLegacyLayer3Payload({ verdict: "UNKNOWN", reason: "Not enough data", stop: false, canContinueToLayer4: true }, { claims, requestId: "legacy-l3-unknown" });
    assert.equal(unknown.result.status, "INSUFFICIENT_EVIDENCE");
    assert.equal(unknown.result.legacyIntegration.rawVerdict, "UNKNOWN");
  });

  it("does not promote a high-confidence TRUE claim without evidence-backed provenance", () => {
    const normalized = normalizeLegacyLayer3Payload({
      verdict: "TRUE",
      confidence: 0.99,
      externalEvidence: true,
      reason: "Provider asserted the claim.",
      sources: [{ id: "source-without-proof", url: "https://example.com/source", title: "Unverified source" }],
      evidence: [],
    }, { claims, requestId: "legacy-true-without-evidence" });
    assert.equal(normalized.ok, true);
    assert.equal(normalized.result.status, "INSUFFICIENT_EVIDENCE");
    assert.equal(normalized.result.externalEvidence, false);
    assert.equal(normalized.result.legacyIntegration.rawVerdict, "TRUE");
    assert.equal(normalized.result.legacyIntegration.legacyAssessmentConfidence, 0.99);
  });

  it("does not auto-continue an unavailable Layer 3 verdict when continuation is omitted", () => {
    const normalized = normalizeLegacyLayer3Payload({ verdict: "UNAVAILABLE", reason: "Provider unavailable" }, { claims, requestId: "legacy-l3-unavailable" });
    assert.equal(normalized.ok, true);
    assert.equal(normalized.result.status, "PARTIAL");
    assert.equal(normalized.result.legacyIntegration.canContinueToLayer4, false);
  });

  it("rejects malformed Layer 3 continuation and maps it to unavailable", async () => {
    const malformed = normalizeLegacyLayer3Payload({ verdict: "TRUE", stop: true, canContinueToLayer4: true }, { claims, requestId: "legacy-l3-malformed" });
    assert.equal(malformed.ok, false);
    const adapter = adapterWith(async () => responseFor({ verdict: "TRUE", confidence: 0.9, stop: true, canContinueToLayer4: true, reason: "Contradictory continuation.", evidence: [], sources: [] }));
    const result = await adapter.verifyLayer3({ input: { type: "text", content: "A bounded claim" }, claims, requestId: "legacy-l3-malformed-adapter" });
    assert.equal(result.legacyIntegration.status, "UNAVAILABLE");
    assert.equal(result.legacyIntegration.providerStatus, "MALFORMED");
  });

  it("normalizes Layer 4 TRUE/FALSE/UNKNOWN, contradictions, and model confidence separately", () => {
    for (const verdict of ["TRUE", "FALSE", "UNKNOWN"]) {
      const normalized = normalizeLegacyLayer4Payload({ verdict, confidence: 0.73, reason: "bounded reason", contradictoryEvidence: ["source disagreement"] }, { requestId: `legacy-l4-${verdict}` });
      assert.equal(normalized.ok, true);
      assert.equal(normalized.result.rawVerdict, verdict);
      assert.equal(normalized.result.assessmentConfidence, 0.73);
      assert.deepEqual(normalized.result.contradictoryEvidence, ["source disagreement"]);
    }
    const malformed = normalizeLegacyLayer4Payload({ verdict: "TRUE", confidence: 9 }, { requestId: "legacy-l4-malformed" });
    assert.equal(malformed.ok, false);
  });

  it("keeps Layer 4 sources separate from Layer 3 sources", () => {
    const layer3 = normalizeLegacyLayer3Payload({ verdict: "TRUE", sources: [{ id: "l3-source", url: "https://example.com/l3", title: "Web" }], evidence: [] }, { claims, requestId: "legacy-origin-l3" }).result;
    const layer4 = normalizeLegacyLayer4Payload({ verdict: "UNKNOWN", sources: [{ id: "l4-source", url: "https://example.com/l4", title: "Research" }] }, { requestId: "legacy-origin-l4" }).result;
    assert.equal(layer3.sources[0].origin, "LAYER_3_WEB_EVIDENCE");
    assert.equal(layer4.sources[0].origin, "LAYER_4_INDEPENDENT_RESEARCH");
    assert.notEqual(layer3.sources[0].origin, layer4.sources[0].origin);
  });

  it("returns explicit NOT_CONFIGURED without a demo fallback", async () => {
    let calls = 0;
    const adapter = new LegacyVerificationAdapter({ env: {}, fetchImpl: async () => { calls += 1; } });
    const result = await adapter.verifyLayer3({ input: { type: "text", content: "A bounded claim" }, claims, requestId: "legacy-not-configured" });
    assert.equal(result.legacyIntegration.status, "UNAVAILABLE");
    assert.equal(result.legacyIntegration.providerStatus, "NOT_CONFIGURED");
    assert.equal(calls, 0);
    assert.equal(adapter.describe().enabled, false);
  });

  it("projects only normalized records into TrustGraph and Passport descriptors", () => {
    const evidence = buildCanonicalEvidence({
      requestId: "projection-run",
      input: { type: "url", content: "https://example.com" },
      layers: {
        layer1: { signals: [{ signalId: "signal-1", code: "URL_OBSERVED", details: "URL parsed" }] },
        layer2A: { providerResults: [{ provider: "provider-1", success: true, verdict: "SAFE", confidence: 0.8 }] },
        layer2: { claims },
        layer3: { evidence: [{ evidenceId: "evidence-1", claimId: "claim-1", sourceId: "official-source", sourceUrl: "https://official.example", excerpt: "fact", relation: "SUPPORTS", providerStatus: "SUCCESS", liveEvidence: false }], sources: [{ sourceId: "official-source", title: "Official" }] },
        layer4: { legacyIntegration: { status: "COMPLETED", providerId: "legacy-l4", rawVerdict: "UNKNOWN", assessmentConfidence: 0.4, reason: "Review" } },
      },
    });
    const graph = buildTrustGraph({ requestId: "projection-run", input: { type: "url", content: "https://example.com" }, layers: { layer2: { claims }, layer3: {}, layer4: {} }, evidence });
    assert.ok(graph.nodes.some((node) => node.kind === "INPUT"));
    assert.ok(graph.nodes.some((node) => node.id === "claim:claim-1"));
    assert.ok(graph.nodes.some((node) => node.id === "source:layer_3_web_evidence:official-source"));
    assert.equal(graph.nodes.some((node) => /related-case|source-\d+$/.test(node.id)), false);
    const passport = buildPassportProjection({ requestId: "projection-run", pipelineStatus: "COMPLETED", stages: { l1: { operationStatus: "COMPLETED", finding: "LOCAL_CLEAR" }, l3: { operationStatus: "PARTIAL", finding: "INSUFFICIENT", evidenceRefs: ["evidence-1"] } }, finalDecision: { security: "UNKNOWN", truth: "INSUFFICIENT_EVIDENCE", action: "REVIEW" }, evidence });
    assert.equal(passport.appendOnly, true);
    assert.equal(passport.persistenceStatus, "NOT_PERSISTED");
    assert.ok(passport.events.some((event) => event.type === "PROVIDER_UNAVAILABLE"));
  });

  it("does not equate legacy assessment confidence with safety probability", () => {
    const l2 = createLayer2AResult({ providerStatus: "SUCCESS", finding: "NO_KNOWN_THREAT", providerConfidence: 0.99 });
    assert.equal(l2.provenance.noMatchIsSafetyProof, false);
    const l4 = normalizeLegacyLayer4Payload({ verdict: "TRUE", confidence: 0.99 }, { requestId: "confidence-separation" });
    assert.equal(l4.result.assessmentConfidence, 0.99);
    assert.equal("decisionConfidence" in l4.result, false);
  });

  it("preserves distinct Layer 3 and Layer 4 provenance when IDs and URLs overlap", () => {
    const evidence = buildCanonicalEvidence({
      requestId: "provenance-collision",
      input: { type: "url", content: "https://example.com" },
      layers: {
        layer3: {
          evidence: [{ evidenceId: "same-evidence", claimId: "claim-1", sourceId: "same-source", sourceUrl: "https://same.example/source", excerpt: "Web observation", relation: "SUPPORTS", providerStatus: "SUCCESS", liveEvidence: true }],
          sources: [{ sourceId: "same-source", url: "https://same.example/source", title: "Web source" }],
        },
        layer4: {
          legacyIntegration: {
            status: "COMPLETED",
            providerId: "legacy-layer4",
            rawVerdict: "UNKNOWN",
            sources: [{ id: "same-source", url: "https://same.example/source", title: "Research source" }],
          },
        },
      },
    });
    const overlapping = evidence.filter((item) => item.source.url === "https://same.example/source");
    assert.equal(overlapping.length, 2);
    assert.deepEqual(new Set(overlapping.map((item) => item.origin)), new Set(["LAYER_3_WEB_EVIDENCE", "LAYER_4_INDEPENDENT_RESEARCH"]));
    assert.notEqual(overlapping[0].id, overlapping[1].id);

    const graph = buildTrustGraph({
      requestId: "provenance-collision",
      input: { type: "url", content: "https://example.com" },
      layers: { layer2: { claims }, layer3: {}, layer4: {} },
      evidence,
    });
    const sourceNodes = graph.nodes.filter((node) => node.kind === "SOURCE" && ["same-evidence", "same-source"].includes(node.rawReference));
    assert.equal(sourceNodes.length, 2);
    assert.deepEqual(new Set(sourceNodes.map((node) => node.origin)), new Set(["LAYER_3_WEB_EVIDENCE", "LAYER_4_INDEPENDENT_RESEARCH"]));
    assert.notEqual(sourceNodes[0].id, sourceNodes[1].id);
  });
});
