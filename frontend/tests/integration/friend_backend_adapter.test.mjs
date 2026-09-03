import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FriendBackendAdapter,
  createFriendBackendAdapter,
} from "../../src/lib/ai-trust/integrations/friendBackend/FriendBackendAdapter.js";

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

describe("FriendBackendAdapter", () => {
  it("resolves FRIEND_BACKEND_API_URL as primary configuration", () => {
    const factoryAdapter = createFriendBackendAdapter();
    assert.ok(factoryAdapter instanceof FriendBackendAdapter);
    const adapter = new FriendBackendAdapter({
      env: {
        FRIEND_BACKEND_API_URL: "https://friend.backend.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      resolveDns: false,
    });
    assert.equal(adapter.isConfigured, true);
    assert.equal(adapter.status, "READY");
    assert.equal(adapter.config.baseUrl, "https://friend.backend.test");
  });

  it("reports NOT_CONFIGURED when FRIEND_BACKEND_API_URL and fallbacks are absent", () => {
    const adapter = new FriendBackendAdapter({
      env: {},
      resolveDns: false,
    });
    assert.equal(adapter.isConfigured, false);
    assert.equal(adapter.status, "NOT_CONFIGURED");
  });

  it("sends Authorization header when FRIEND_BACKEND_API_KEY is supplied", async () => {
    let capturedHeaders = null;
    const adapter = new FriendBackendAdapter({
      env: {
        FRIEND_BACKEND_API_URL: "https://friend.backend.test",
        FRIEND_BACKEND_API_KEY: "secret-token-12345",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      fetchImpl: async (url, options) => {
        capturedHeaders = options.headers;
        return responseFor({
          verdict: "SAFE",
          confidence: 0.95,
          reason: "No threat detected",
          providers: [{ provider: "safe-browsing", success: true, verdict: "SAFE" }],
        });
      },
      resolveDns: false,
    });

    const result = await adapter.verifyLayer2({ url: "https://school.edu.vn", requestId: "req-auth-test" });
    assert.equal(result.finding, "NO_KNOWN_THREAT");
    assert.ok(capturedHeaders);
    assert.equal(capturedHeaders.Authorization, "Bearer secret-token-12345");
  });

  it("calls /api/verify/layer2 and normalizes response", async () => {
    let targetEndpoint = null;
    const adapter = new FriendBackendAdapter({
      env: {
        FRIEND_BACKEND_API_URL: "https://friend.backend.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      fetchImpl: async (url) => {
        targetEndpoint = url;
        return responseFor({
          verdict: "DANGEROUS",
          confidence: 0.99,
          reason: "Phishing site detected",
          providers: [{ provider: "google-safe-browsing", success: true, verdict: "DANGEROUS", threatTypes: ["MALWARE"] }],
        });
      },
      resolveDns: false,
    });

    const result = await adapter.verifyLayer2({ url: "https://phishing.site", requestId: "req-l2" });
    assert.equal(targetEndpoint, "https://friend.backend.test/api/verify/layer2");
    assert.equal(result.finding, "THREAT_MATCH");
    assert.equal(result.securityClassification, "MALICIOUS");
  });

  it("calls /api/verify/layer3 and normalizes Tavily search evidence", async () => {
    let targetEndpoint = null;
    const adapter = new FriendBackendAdapter({
      env: {
        FRIEND_BACKEND_API_URL: "https://friend.backend.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      fetchImpl: async (url) => {
        targetEndpoint = url;
        return responseFor({
          verdict: "TRUE",
          confidence: 0.9,
          stop: false,
          canContinueToLayer4: true,
          reason: "Official university calendar verified",
          evidence: [
            {
              title: "Lịch thi học kỳ",
              url: "https://university.edu.vn/calendar",
              content: "Lịch thi bắt đầu từ ngày 15.",
            },
          ],
          sources: [
            { title: "University Portal", url: "https://university.edu.vn" },
          ],
        });
      },
      resolveDns: false,
    });

    const result = await adapter.verifyLayer3({
      input: { type: "text", content: "Lịch thi học kỳ bắt đầu từ 15" },
      claims: [{ claimId: "c1", rawText: "Lịch thi bắt đầu từ 15" }],
      requestId: "req-l3",
    });

    assert.equal(targetEndpoint, "https://friend.backend.test/api/verify/layer3");
    assert.equal(result.legacyIntegration?.canContinueToLayer4, true);
    assert.equal(result.sources.length, 1);
    assert.equal(result.sources[0].url, "https://university.edu.vn/");
    assert.equal(result.evidence.length, 1);
  });

  it("calls /api/verify/layer4 and normalizes Gemini/Groq synthesis with layer3 envelope", async () => {
    let targetEndpoint = null;
    let requestBody = null;
    const adapter = new FriendBackendAdapter({
      env: {
        FRIEND_BACKEND_API_URL: "https://friend.backend.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      fetchImpl: async (url, options) => {
        targetEndpoint = url;
        requestBody = JSON.parse(options.body);
        return responseFor({
          verdict: "TRUE",
          confidence: 0.92,
          evidenceAgreement: 0.95,
          sourceQuality: 0.9,
          stop: true,
          canContinueToLayer4: false,
          mode: "pro",
          geminiModel: "gemini-2.5-flash",
          groqModel: null,
          reason: "All verified evidence confirms the announcement is authentic.",
          contradictoryEvidence: [],
          sources: [{ title: "University Portal", url: "https://university.edu.vn" }],
        });
      },
      resolveDns: false,
    });

    const layer3Mock = {
      status: "VERIFIED",
      evidenceConfidence: 0.9,
      evidence: [{ sourceTitle: "Univ", sourceUrl: "https://university.edu.vn", excerpt: "Schedule" }],
      sources: [{ title: "Univ", url: "https://university.edu.vn" }],
      legacyIntegration: {
        rawVerdict: "TRUE",
        legacyAssessmentConfidence: 0.9,
        reason: "Valid announcement",
      },
    };

    const result = await adapter.verifyLayer4({
      input: { type: "text", content: "Thông báo chính thức" },
      layer3Result: layer3Mock,
      mode: "pro",
      requestId: "req-l4",
    });

    assert.equal(targetEndpoint, "https://friend.backend.test/api/verify/layer4");
    assert.equal(requestBody.mode, "pro");
    assert.equal(requestBody.layer3.verdict, "TRUE");
    assert.equal(result.rawVerdict, "TRUE");
    assert.equal(result.geminiModel, "gemini-2.5-flash");
    assert.equal(result.sources.length, 1);
  });

  it("handles backend outage gracefully with typed UNAVAILABLE result", async () => {
    const adapter = new FriendBackendAdapter({
      env: {
        FRIEND_BACKEND_API_URL: "https://friend.backend.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      fetchImpl: async () => {
        throw new Error("Connection refused");
      },
      resolveDns: false,
    });

    const result = await adapter.verifyLayer2({ url: "https://example.com", requestId: "req-down" });
    assert.equal(result.providerStatus, "UNAVAILABLE");
    assert.equal(result.finding, "UNKNOWN");
  });
});
