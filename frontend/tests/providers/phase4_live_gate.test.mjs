import test from "node:test";
import assert from "node:assert/strict";
import {
  ProviderGateway,
  PROVIDER_CAPABILITY,
  GATEWAY_MODE,
} from "../../src/lib/server/providers/ProviderGateway.js";
import { ReputationGatewayAdapter } from "../../src/lib/server/providers/adapters/ReputationGatewayAdapter.js";
import { SearchGatewayAdapter } from "../../src/lib/server/providers/adapters/SearchGatewayAdapter.js";
import { AIGatewayAdapter } from "../../src/lib/server/providers/adapters/AIGatewayAdapter.js";

test("PHASE 4 LIVE GATE: 5 Synthetic Verification Scenarios", async () => {
  const gateway = new ProviderGateway({ maxRetries: 1, defaultTimeoutMs: 2000 });

  // Mock underlying providers
  const mockReputation = {
    checkUrl: async (url) => {
      if (url.includes("phish") || url.includes("malicious")) {
        return { threatMatch: true, threatType: "PHISHING", confidence: 0.99 };
      }
      return { threatMatch: false, confidence: 0.95 };
    },
  };

  const mockSearch = {
    search: async (query) => {
      if (query.includes("miễn 100% học phí")) {
        return {
          sources: [
            {
              title: "Thông cáo báo chí ĐHQG: Cảnh báo tin giả về miễn 100% học phí",
              url: "https://vnuhcm.edu.vn/tin-tuc/thong-cao",
              snippet: "ĐHQG không có chính sách miễn 100% học phí đồng loạt.",
              sourceIndependence: "OFFICIAL_REGISTRY",
            },
          ],
        };
      }
      if (query.includes("cấp tốc 3 ngày")) {
        return { sources: [] }; // Insufficient evidence
      }
      return {
        sources: [
          {
            title: "Cổng thông tin Bộ GD&ĐT",
            url: "https://moet.gov.vn",
            snippet: "Thông tin tuyển sinh chính thức",
            sourceIndependence: "GOVERNMENT_AUTHORITY",
          },
        ],
      };
    },
  };

  const mockAI = {
    generateText: async (prompt) => ({
      text: "Phân tích ngữ nghĩa độc lập",
      claims: [{ statement: "Thông tin cần kiểm chứng", status: "NEEDS_EVIDENCE" }],
      tokensUsed: 42,
    }),
  };

  gateway.registerAdapter(PROVIDER_CAPABILITY.REPUTATION, new ReputationGatewayAdapter({ underlyingProvider: mockReputation }));
  gateway.registerAdapter(PROVIDER_CAPABILITY.SEARCH, new SearchGatewayAdapter({ underlyingProvider: mockSearch }));
  gateway.registerAdapter(PROVIDER_CAPABILITY.AI, new AIGatewayAdapter({ underlyingProvider: mockAI }));

  // Case 1: Safe URL
  const safeRes = await gateway.execute(PROVIDER_CAPABILITY.REPUTATION, { url: "https://moet.gov.vn" });
  assert.equal(safeRes.success, true);
  assert.equal(safeRes.data.threatMatch, false);
  assert.equal(safeRes.data.finding, "NO_KNOWN_THREAT");

  // Case 2: Obvious Malicious URL
  const malRes = await gateway.execute(PROVIDER_CAPABILITY.REPUTATION, { url: "https://malicious-scholarship-steal.phish.com" });
  assert.equal(malRes.success, true);
  assert.equal(malRes.data.threatMatch, true);
  assert.equal(malRes.data.finding, "THREAT_MATCH");
  assert.equal(malRes.data.threatType, "PHISHING");

  // Case 3: Uncertain Claim (Zero sources -> insufficient evidence)
  const uncRes = await gateway.execute(PROVIDER_CAPABILITY.SEARCH, { query: "cấp tốc 3 ngày" });
  assert.equal(uncRes.success, true);
  assert.equal(uncRes.data.verified, false);
  assert.equal(uncRes.data.sources.length, 0);

  // Case 4: Contradictory Evidence Claim (Source with contradiction exists)
  const contraRes = await gateway.execute(PROVIDER_CAPABILITY.SEARCH, { query: "ĐHQG miễn 100% học phí" });
  assert.equal(contraRes.success, true);
  assert.equal(contraRes.data.verified, true);
  assert.ok(contraRes.data.sources[0].title.includes("Cảnh báo tin giả"));
  assert.ok(contraRes.data.sources[0].contentHash, "Content hash present for provenance");
  assert.equal(contraRes.data.sources[0].sourceIndependence, "OFFICIAL_REGISTRY");

  // Case 5: Provider Outage -> Degraded fallback, zero secrets leaked
  const brokenGateway = new ProviderGateway({ maxRetries: 0 });
  brokenGateway.registerAdapter(PROVIDER_CAPABILITY.REPUTATION, new ReputationGatewayAdapter({
    underlyingProvider: {
      checkUrl: async () => {
        const secretKey = "Bearer test_secret_token_12345";
        throw new Error(`Upstream connection failed with ${secretKey}`);
      },
    },
  }));

  const outageRes = await brokenGateway.execute(PROVIDER_CAPABILITY.REPUTATION, { url: "https://test.edu.vn" });
  assert.equal(outageRes.success, true);
  assert.equal(outageRes.mode, GATEWAY_MODE.DEGRADED);
  assert.equal(outageRes.degraded, true);
  assert.equal(outageRes.data.provider, "NATIVE_HEURISTIC");

  // Verify zero secrets leaked in telemetry
  const logs = brokenGateway.telemetryLogs;
  assert.ok(logs.length > 0);
  for (const log of logs) {
    const serialized = JSON.stringify(log);
    assert.ok(!serialized.includes("test_secret_token_12345"), "Secret must be redacted from telemetry");
  }
});
