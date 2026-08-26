import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertTemporal", () => {
  it("should flag AUTHORITY_MISMATCH when an administrative position has expired in 2024 and is evaluated in 2026", () => {
    const formerRegistrar = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_FORMER_REGISTRAR",
      name: "PGS.TS. Cựu Trưởng Phòng",
      orcid: "0000-0001-9988-7766",
      roles: [
        { roleId: "ROLE_EXPIRED", roleTitle: "REGISTRAR_DIRECTOR", organization: "HCMUTE", validFrom: "2020-01-01", validUntil: "2024-06-30" }
      ],
      scopes: [{ domain: "ACADEMIC_REGULATION", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN }]
    });

    const currentClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Phòng Đào Tạo quyết định miễn học phí học kỳ 1 năm học 2026-2027.",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const result = ExpertScopeEngine.evaluateClaimScope(formerRegistrar, currentClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(result.isWithinJurisdiction, false);
  });
});
