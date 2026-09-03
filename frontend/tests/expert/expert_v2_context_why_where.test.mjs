import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertContextEngine } from "../../src/lib/intelligence/expert/expertContextEngine.js";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertV2ContextWhyAndWhere", () => {
  const expert = ExpertIntelligenceModel.createExpert({
    expertId: "EXP_MINH",
    name: "TS. Nguyễn Văn Minh",
    institution: "HCMUTE",
    orcid: "0000-0002-1825-0097",
    scopes: [
      { domain: "AI_ML", subdomain: "NLP", level: EXPERTISE_LEVEL.ESTABLISHED },
      { domain: "COMPUTER_VISION", subdomain: "Robotics", level: EXPERTISE_LEVEL.SUPPORTED },
      { domain: "EDTECH", subdomain: "Interactive", level: EXPERTISE_LEVEL.EMERGING }
    ],
    roles: [
      { roleTitle: "Trưởng Bộ Môn AI", organization: "HCMUTE", isCurrent: true }
    ],
    publications: [
      { title: "Deep Learning for Vietnamese NLP", venue: "IEEE", year: 2024, doi: "10.1109/nlp.2024" }
    ]
  });

  it("should generate complete 'Why this expert?' report with identity and role proofs", () => {
    const report = ExpertContextEngine.generateWhyThisExpert(expert);

    assert.strictEqual(report.expertId, "EXP_MINH");
    assert.strictEqual(report.isIdentityVerified, true);
    assert.ok(report.identityEvidence.includes("0000-0002-1825-0097"));
    assert.ok(report.currentRole.includes("Trưởng Bộ Môn AI"));
    assert.ok(report.relevantExpertise.includes("AI_ML"));
    assert.strictEqual(report.supportingEvidence.length, 1);
    assert.ok(report.authorityScope.includes("KHÔNG có thẩm quyền hành chính Phòng Đào Tạo"));
  });

  it("should generate 'Where NOT to trust' scope boundaries classifying established vs unestablished domains", () => {
    const boundaries = ExpertScopeEngine.generateScopeBoundaries(expert);

    assert.strictEqual(boundaries.name, "TS. Nguyễn Văn Minh");
    assert.ok(boundaries.established.some(e => e.includes("AI_ML")));
    assert.ok(boundaries.supported.some(s => s.includes("COMPUTER_VISION")));
    assert.ok(boundaries.emerging.some(em => em.includes("EDTECH")));
    assert.ok(boundaries.unestablished.some(u => u.includes("Quy chế Đào tạo")));
    assert.strictEqual(boundaries.whereNotToTrust.length, 3);
  });
});
