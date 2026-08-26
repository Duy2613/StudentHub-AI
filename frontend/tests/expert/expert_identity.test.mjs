import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ExpertIntelligenceModel,
  AFFILIATION_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertIdentity", () => {
  it("should verify identity with official ORCID, email, and institutional directory", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      name: "TS. Nguyễn Văn Minh",
      institution: "HCMUTE",
      orcid: "0000-0002-1825-0097",
      verifiedEmail: "minhnv@hcmute.edu.vn",
      directoryUrl: "https://fit.hcmute.edu.vn/faculty/minhnv",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE
    });

    assert.strictEqual(expert.isVerified, true);
    assert.strictEqual(expert.orcid, "0000-0002-1825-0097");
    assert.strictEqual(expert.affiliationStatus, AFFILIATION_STATUS.VERIFIED_ACTIVE);
  });

  it("should mark self-claimed profile without proof as UNVERIFIED", () => {
    const unverifiedExpert = ExpertIntelligenceModel.createExpert({
      name: "Tự Xưng Chuyên Gia",
      institution: "Đại Học Ảo",
      orcid: null,
      verifiedEmail: null,
      directoryUrl: null,
      affiliationStatus: AFFILIATION_STATUS.UNVERIFIED,
      isVerified: false
    });

    assert.strictEqual(unverifiedExpert.isVerified, false);
    assert.strictEqual(unverifiedExpert.affiliationStatus, AFFILIATION_STATUS.UNVERIFIED);
  });
});
