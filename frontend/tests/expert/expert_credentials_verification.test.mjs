import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ExpertIntelligenceModel,
  AFFILIATION_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertCredentialsVerification", () => {
  it("should create verified expert profile with verified credentials and publications", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_TEST_1",
      name: "TS. Lê Thị Mai",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      credentials: [
        { type: "DEGREE_PHD", field: "Computer Engineering", issuer: "NTU Singapore", isVerified: true }
      ],
      publications: [
        { title: "Edge AI Architecture", venue: "ACM Computing", year: 2024 }
      ]
    });

    assert.strictEqual(expert.isVerified, true);
    assert.strictEqual(expert.credentials.length, 1);
    assert.strictEqual(expert.credentials[0].isVerified, true);
    assert.strictEqual(expert.publications.length, 1);
  });
});
