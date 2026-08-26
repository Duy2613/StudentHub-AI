import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertEntityResolver } from "../../src/lib/intelligence/expert/expertEntityResolver.js";
import {
  ExpertIntelligenceModel,
  RESOLUTION_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertEntityResolution", () => {
  const candidatePool = [
    ExpertIntelligenceModel.createExpert({
      expertId: "EXP_MINH_FIT",
      name: "Nguyễn Văn Minh",
      department: "Khoa CNTT",
      institution: "HCMUTE",
      orcid: "0000-0002-1825-0097",
      verifiedEmail: "minhnv@hcmute.edu.vn"
    }),
    ExpertIntelligenceModel.createExpert({
      expertId: "EXP_MINH_FEE",
      name: "Nguyễn Văn Minh",
      department: "Khoa Điện - Điện Tử",
      institution: "HCMUTE",
      orcid: "0000-0003-9999-1111",
      verifiedEmail: "minhnv_fee@hcmute.edu.vn"
    })
  ];

  it("should disambiguate same-name experts using exact ORCID", () => {
    const result = ExpertEntityResolver.resolve({ orcid: "0000-0002-1825-0097" }, candidatePool);
    assert.strictEqual(result.status, RESOLUTION_STATUS.EXACT_MATCH);
    assert.strictEqual(result.expert.expertId, "EXP_MINH_FIT");
  });

  it("should flag IDENTITY_AMBIGUOUS and never merge when only common name is provided without strong signals", () => {
    const result = ExpertEntityResolver.resolve({ name: "Nguyễn Văn Minh" }, candidatePool);
    assert.strictEqual(result.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
    assert.strictEqual(result.expert, null);
    assert.strictEqual(result.candidateMatches.length, 2);
    assert.ok(result.explanation.includes("Cảnh báo trùng tên"));
  });
});
