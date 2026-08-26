import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertV2MetamorphicTests", () => {
  it("Metamorphic 1: JSON Serialization Roundtrip preserves evaluation semantics", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_JSON",
      name: "TS. Nguyễn Văn Minh",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Thuật toán tối ưu hóa.",
      domain: "AI_ML"
    });

    const evalBefore = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    const jsonStr = JSON.stringify(expert);
    const deserializedExpert = ExpertIntelligenceModel.createExpert(JSON.parse(jsonStr));
    const evalAfter = ExpertScopeEngine.evaluateClaimScope(deserializedExpert, claim);

    assert.strictEqual(evalBefore.claimStatus, evalAfter.claimStatus);
    assert.strictEqual(evalBefore.isWithinExpertise, evalAfter.isWithinExpertise);
  });

  it("Metamorphic 2: Publication array reordering has zero effect on domain scope evaluation", () => {
    const pub1 = { title: "Paper 1", year: 2023, domain: "AI_ML" };
    const pub2 = { title: "Paper 2", year: 2024, domain: "AI_ML" };

    const expA = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }],
      publications: [pub1, pub2]
    });

    const expB = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }],
      publications: [pub2, pub1]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({ text: "Test", domain: "AI_ML" });

    const evalA = ExpertScopeEngine.evaluateClaimScope(expA, claim);
    const evalB = ExpertScopeEngine.evaluateClaimScope(expB, claim);

    assert.strictEqual(evalA.claimStatus, evalB.claimStatus);
    assert.strictEqual(evalA.scopeLevel, evalB.scopeLevel);
  });

  it("Metamorphic 3: Adding newer expired role preserves historical interval without escalating current authority", () => {
    const historicalRole = { roleTitle: "REGISTRAR_DIRECTOR", validFrom: "2020-01-01", validUntil: "2024-01-01" };
    const newLecturerRole = { roleTitle: "SENIOR_LECTURER", validFrom: "2024-01-02", validUntil: null };

    const exp = ExpertIntelligenceModel.createExpert({
      name: "PGS.TS. Cựu Trưởng Phòng",
      roles: [historicalRole, newLecturerRole]
    });

    assert.strictEqual(exp.hasRegistrarAuthority, false);
    assert.strictEqual(exp.roles.length, 2);
    assert.strictEqual(exp.roles[0].isCurrent, false);
    assert.strictEqual(exp.roles[1].isCurrent, true);
  });
});
