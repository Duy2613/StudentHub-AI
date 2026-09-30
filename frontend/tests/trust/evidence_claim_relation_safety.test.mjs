import assert from "node:assert/strict";
import test from "node:test";

import { EvidenceForensicsService } from "../../src/lib/server/trust/EvidenceForensicsService.js";

test("retrieval overlap and discovery metadata do not become claim support", () => {
  const claim = {
    claimId: "claim-hcmut",
    text: "Trường Đại học Bách khoa Đại học Quốc gia Thành phố Hồ Chí Minh là cơ sở giáo dục đại học công lập hàng đầu về kỹ thuật và công nghệ.",
    entities: [{ name: "Trường Đại học Bách khoa - ĐHQG TP.HCM", entityId: "HCMUT_VNUHCM" }],
  };
  const source = {
    sourceId: "source-city",
    title: "Thành phố Hồ Chí Minh",
    relevantSnippet: "Thành phố Hồ Chí Minh là trung tâm kinh tế lớn của Việt Nam.",
    claimRelations: { "claim-hcmut": "SUPPORTS" },
  };

  const [relationship] = EvidenceForensicsService.evaluateClaimRelations([claim], [source]);
  assert.equal(relationship.relation, "UNKNOWN");
  assert.match(relationship.rationale, /chưa có đối chiếu trực tiếp/);
});

test("a shared claim-specific fact phrase can support a claim without inventing confidence", () => {
  const claim = {
    claimId: "claim-registration",
    text: "Trường Đại học Sư phạm Kỹ thuật TP.HCM công bố thời gian đăng ký tín chỉ học phần tốt nghiệp cho sinh viên khóa tuyển sinh 2022.",
    entities: [{ name: "Trường Đại học Sư phạm Kỹ thuật TP.HCM", entityId: "HCMUTE" }],
  };
  const source = {
    sourceId: "source-registration",
    title: "Kế hoạch đào tạo học kỳ 2 HCMUTE",
    relevantSnippet: "Phòng Đào tạo thông báo kế hoạch mở cổng đăng ký tín chỉ học phần tốt nghiệp cho sinh viên khóa 2022.",
    domain: "hcmute.edu.vn",
  };

  const [relationship] = EvidenceForensicsService.evaluateClaimRelations([claim], [source]);
  assert.equal(relationship.relation, "SUPPORTS");
  assert.equal(relationship.confidence, null);
  assert.equal(relationship.confidenceKind, "NOT_CALCULATED");
});

test("ordinary topical overlap remains unresolved without a claim-level comparison", () => {
  const claim = {
    claimId: "claim-policy",
    text: "Sinh viên được miễn học phí kỳ hè năm 2026.",
    entities: [{ name: "HCMUTE", entityId: "HCMUTE" }],
  };
  const source = {
    sourceId: "source-campus",
    title: "Thông tin học phí và lịch học tại HCMUTE",
    relevantSnippet: "Thông báo về học phí và lịch học kỳ hè năm 2026.",
    claimRelations: { "claim-policy": "DISCOVERY_ONLY" },
  };

  const [relationship] = EvidenceForensicsService.evaluateClaimRelations([claim], [source]);
  assert.equal(relationship.relation, "UNKNOWN");
});

test("direct requirement clashes can still be classified as contradiction", () => {
  const claim = {
    claimId: "claim-payment",
    text: "Sinh viên không cần nộp lệ phí hồ sơ.",
    entities: [{ name: "HCMUTE", entityId: "HCMUTE" }],
  };
  const source = {
    sourceId: "source-requirement",
    title: "Hướng dẫn hồ sơ",
    relevantSnippet: "Thí sinh bắt buộc nộp lệ phí hồ sơ khi đăng ký.",
  };

  const [relationship] = EvidenceForensicsService.evaluateClaimRelations([claim], [source]);
  assert.equal(relationship.relation, "CONTRADICTS");
});

test("an official source without a direct claim relation is insufficient evidence", () => {
  const result = EvidenceForensicsService.evaluateSufficiency(
    [{ claimId: "claim-1", text: "A factual claim." }],
    [{ claimId: "claim-1", sourceId: "official-city", relation: "UNKNOWN" }],
    [{ sourceId: "official-city", domain: "city.gov.vn" }],
  );

  assert.equal(result.status, "INSUFFICIENT");
  assert.equal(result.claimCoverageRatio, 0);
  assert.match(result.reason, /chưa có đối chiếu trực tiếp/);
});

test("sufficiency coverage is computed from claim-level official relations", () => {
  const result = EvidenceForensicsService.evaluateSufficiency(
    [{ claimId: "claim-1", text: "A factual claim." }],
    [{ claimId: "claim-1", sourceId: "official-source", relation: "CONTRADICTS" }],
    [{ sourceId: "official-source", domain: "example.gov.vn" }],
  );

  assert.equal(result.status, "SUFFICIENT");
  assert.equal(result.claimCoverageRatio, 1);
});
