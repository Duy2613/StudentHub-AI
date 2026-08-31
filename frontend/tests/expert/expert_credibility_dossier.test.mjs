import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ExpertDiscoveryEngine } from "../../src/lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "../../src/lib/intelligence/expert/ExpertPublicDTO.js";
import { ExpertIntelligenceModel, EXPERT_STATUS, AFFILIATION_STATUS, EXPERTISE_LEVEL, CREDENTIAL_STATUS } from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("Expert credibility dossier V3", () => {
  it("uses canonical model fields and does not invent a high history score", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_DOSSIER_01",
      name: "TS. Kiểm Chứng",
      status: EXPERT_STATUS.VERIFIED_EXPERT,
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      verifiedEmail: "verified@hcmute.edu.vn",
      scopes: [{ domain: "AI_ML", subdomain: "Deep Learning", level: EXPERTISE_LEVEL.ESTABLISHED, citationCount: 12, recencyYear: 2025 }],
      credentials: [{ status: CREDENTIAL_STATUS.VERIFIED, isVerified: true }],
      publications: [{ domain: "AI_ML", year: 2025, doi: "10.1000/test" }]
    });
    ExpertStore.upsertExpert(expert);

    const result = ExpertDiscoveryEngine.discoverExperts({ topic: "Deep Learning", limit: 1 });
    const match = result.topMatches.find((item) => item.expertId === expert.expertId);
    assert.ok(match);
    assert.strictEqual(match.fullName, "TS. Kiểm Chứng");
    assert.ok(match.matchedDomains.some((value) => value.includes("Deep Learning")));
    assert.strictEqual(match.signals.historyConfidenceLabel, "Chưa đủ lịch sử đánh giá");
    assert.ok(match.signals.historicalAccuracyPercentage < 90);
  });

  it("returns a public verification dossier without exposing institutional email", () => {
    const raw = ExpertIntelligenceModel.createExpert({
      name: "TS. Public Dossier",
      status: EXPERT_STATUS.VERIFIED_EXPERT,
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      verifiedEmail: "person@hcmute.edu.vn",
      privateContact: { phone: "0900000000" },
      roles: [{ roleTitle: "LECTURER", organization: "HCMUTE", validFrom: "2020-01-01" }],
      credentials: [{ status: CREDENTIAL_STATUS.VERIFIED, isVerified: true }],
      publications: [{ year: 2025, doi: "10.1000/public" }]
    });

    const dto = ExpertPublicDTO.toPublicDTO(raw);
    assert.strictEqual(dto.verifiedEmail, undefined);
    assert.strictEqual(dto.verifiedEmailDomain, "hcmute.edu.vn");
    assert.strictEqual(dto.privateContact, undefined);
    assert.ok(["A", "B", "C"].includes(dto.verificationSummary.evidenceGrade));
    assert.strictEqual(dto.verificationSummary.affiliation, "CURRENT");
    assert.match(dto.authorityBoundaries.warning, /thẩm quyền/);
  });
});
