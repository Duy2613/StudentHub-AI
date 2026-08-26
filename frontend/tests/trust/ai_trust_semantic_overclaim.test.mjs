import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SemanticOverclaimDetector } from "../../src/lib/intelligence/trust/semanticOverclaimDetector.js";

describe("AiTrustSemanticOverclaim", () => {
  it("should detect ungrounded channel and deadline extensions added by generative AI", () => {
    const sourcePassage = "Sinh viên phải nộp chứng chỉ tiếng Anh theo quy định.";
    const draftText = "Sinh viên phải nộp chứng chỉ tiếng Anh online trực tuyến trước ngày 05/09.";

    const result = SemanticOverclaimDetector.detectOverclaim(draftText, sourcePassage);
    assert.strictEqual(result.hasOverclaim, true);
    assert.ok(result.ungroundedExtensions.some(e => e.includes("online")));
    assert.ok(result.ungroundedExtensions.some(e => e.includes("05/09")));
    assert.ok(result.safeGroundedText.includes("nộp chứng chỉ"));
  });

  it("should approve draft when strictly grounded within source passage semantics", () => {
    const sourcePassage = "Sinh viên K24 nộp chứng chỉ TOEIC đạt từ 550 điểm trở lên.";
    const draftText = "Sinh viên K24 nộp chứng chỉ TOEIC 550 điểm.";

    const result = SemanticOverclaimDetector.detectOverclaim(draftText, sourcePassage);
    assert.strictEqual(result.hasOverclaim, false);
    assert.strictEqual(result.ungroundedExtensions.length, 0);
  });
});
