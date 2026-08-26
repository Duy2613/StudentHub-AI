import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ExpertIntelligenceModel,
  CREDENTIAL_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertCredentials", () => {
  it("should mark valid degree as VERIFIED with verificationSource", () => {
    const cred = ExpertIntelligenceModel.createCredential({
      type: "DEGREE_PHD",
      field: "Computer Science",
      issuer: "KAIST",
      verificationSource: "REGISTRY_MOET",
      status: CREDENTIAL_STATUS.VERIFIED
    });

    assert.strictEqual(cred.status, CREDENTIAL_STATUS.VERIFIED);
    assert.strictEqual(cred.isVerified, true);
    assert.strictEqual(cred.verificationSource, "REGISTRY_MOET");
  });

  it("should automatically detect EXPIRED credentials when validUntil is in the past", () => {
    const expiredCred = ExpertIntelligenceModel.createCredential({
      type: "CERTIFICATION_AWS_ARCHITECT",
      field: "Cloud Computing",
      validUntil: "2022-01-01",
      status: CREDENTIAL_STATUS.VERIFIED
    });

    assert.strictEqual(expiredCred.status, CREDENTIAL_STATUS.EXPIRED);
    assert.strictEqual(expiredCred.isVerified, false);
  });
});
