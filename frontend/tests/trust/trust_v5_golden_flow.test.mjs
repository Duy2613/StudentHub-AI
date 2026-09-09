import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../../");
const frontendRequire = createRequire(path.join(frontendDir, "package.json"));

const { loadEnvConfig } = frontendRequire("@next/env");
loadEnvConfig(frontendDir);

import { TrustV5Engine } from "../../src/lib/server/trust/TrustV5Engine.js";
import { CitationValidator } from "../../src/lib/server/trust/CitationValidator.js";
import { EvidenceDiscoveryService } from "../../src/lib/server/trust/EvidenceDiscoveryService.js";
import { EvidenceForensicsService } from "../../src/lib/server/trust/EvidenceForensicsService.js";

test("GOLDEN FLOW: Flagship scholarship scam with fee requirement", async () => {
  const scenarioInput = `
Thông báo cấp học bổng toàn phần 100% học phí Trường Đại học Sư phạm Kỹ thuật TP.HCM năm 2026.
Sinh viên trúng tuyển vui lòng chuyển khoản trước 1.500.000 VNĐ phí giữ chỗ vào tài khoản cá nhân.
`.trim();

  const result = await TrustV5Engine.verify({
    type: "text",
    content: scenarioInput,
    caseId: "case-golden-scholarship-001",
    revision: 1,
  });

  // 1. Basic Envelope
  assert.equal(result.caseId, "case-golden-scholarship-001");
  assert.ok(result.runId.startsWith("run-"));
  assert.equal(result.status, "COMPLETED");

  // 2. Claims separated
  assert.ok(result.claims.length >= 2, "Must separate at least scholarship and payment claims");
  const paymentClaim = result.claims.find((c) => c.type === "PAYMENT_REQUIREMENT");
  assert.ok(paymentClaim, "Must detect payment requirement claim");

  // 3. Evidence Sources & Inspection (Section 89)
  assert.ok(result.evidence.sources.length > 0, "Must discover relevant sources");
  for (const src of result.evidence.sources) {
    assert.ok(src.title, "Source must have exact title");
    assert.ok(src.canonicalUrl, "Source must have canonical URL");
    assert.ok(src.publisher, "Source must have publisher");
    assert.ok(src.publishedAt, "Source must have published date");
    assert.ok(src.quality, "Source must have quality explanation");
    assert.ok(src.contentDigest, "Source must have SHA-256 content digest");
  }

  // 4. Source Clustering & Independence
  assert.ok(result.evidence.independenceGroups.length > 0, "Must construct independence groups");
  assert.ok(result.evidence.relationships.length > 0, "Must evaluate claim-source relationships");

  // 5. Verdict & Decision Intelligence
  assert.ok(
    result.verdict.label === "HIGH_RISK" || result.verdict.label === "CONTRADICTED",
    `Expected HIGH_RISK or CONTRADICTED, got: ${result.verdict.label}`
  );
  assert.ok(result.verdict.reasons.length > 0, "Must have reasons");

  // 6. Decision Twin
  assert.ok(result.decisionTwin, "Must return Decision Twin");
  assert.ok(result.decisionTwin.decisionDrivers.length > 0, "Must have decision drivers");
  assert.ok(result.decisionTwin.reversalConditions.length > 0, "Must specify reversal conditions");

  // 7. Next Actions
  assert.ok(result.nextActions.length > 0, "Must recommend next actions");
  const noTransferAction = result.nextActions.find(
    (a) => a.actionType === "DO_NOT_TRANSFER_MONEY_YET"
  );
  assert.ok(noTransferAction, "Must recommend DO_NOT_TRANSFER_MONEY_YET for fee scam");

  // 8. Evidence Passport
  assert.ok(result.passport.passportId, "Must issue Passport ID");
  assert.ok(result.passport.artifactHash, "Must compute cryptographic artifact hash");
});

test("FAILURE INJECTION: Citation validator rejects hallucinated evidence ID and invented URLs", () => {
  const mockEvidence = [
    {
      evidenceId: "ev-real-001",
      revision: 1,
      source: { canonicalUrl: "https://hcmute.edu.vn/thong-bao" },
    },
  ];

  const res = CitationValidator.validateCitations({
    citedEvidenceIds: ["ev-real-001", "ev-hallucinated-999"],
    availableEvidence: mockEvidence,
    currentRevision: 1,
  });

  assert.equal(res.valid, false);
  assert.deepEqual(res.validCitationIds, ["ev-real-001"]);
  assert.equal(res.rejectedCitations.length, 1);
  assert.equal(res.rejectedCitations[0].evidenceId, "ev-hallucinated-999");
  assert.equal(res.rejectedCitations[0].reason, "HALLUCINATED_EVIDENCE_ID");
});

test("FAILURE INJECTION: SSRF gate blocks private IPs and malicious schemes", () => {
  assert.equal(EvidenceDiscoveryService.isSafeUrl("http://localhost:3000"), false);
  assert.equal(EvidenceDiscoveryService.isSafeUrl("http://127.0.0.1/admin"), false);
  assert.equal(EvidenceDiscoveryService.isSafeUrl("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(EvidenceDiscoveryService.isSafeUrl("javascript:alert(1)"), false);
  assert.equal(EvidenceDiscoveryService.isSafeUrl("file:///etc/passwd"), false);
  assert.equal(EvidenceDiscoveryService.isSafeUrl("https://hcmute.edu.vn/thong-bao"), true);
});

test("FAILURE INJECTION: 5 copied syndicated sources are collapsed to 1 independent weight", () => {
  const syndicatedSources = [1, 2, 3, 4, 5].map((idx) => ({
    sourceId: `src-${idx}`,
    domain: "vietnamnet.vn",
    publisher: "Báo VietNamNet",
    contentDigest: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  }));

  const clusters = EvidenceForensicsService.clusterSources(syndicatedSources);
  assert.equal(clusters.length, 1, "Must cluster all 5 copies into 1 single cluster");
  assert.equal(clusters[0].members.length, 5);

  const independenceGroups = EvidenceForensicsService.buildIndependenceGraph(syndicatedSources, clusters);
  assert.equal(independenceGroups.length, 1);
  assert.equal(independenceGroups[0].effectiveIndependentWeight, 1);
});
