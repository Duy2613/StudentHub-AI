import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";

describe("AcademicTradeOffEngine", () => {
  it("should generate clear pairwise trade-off analysis between candidate plans", () => {
    const result = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    assert.ok(result.tradeOffs.length >= 2);

    const pairAB = result.tradeOffs.find(t => t.comparisonPair.includes("Plan A") && t.comparisonPair.includes("Plan B"));
    assert.ok(pairAB);
    assert.ok(pairAB.advantageOfPlan2.includes("tín chỉ"));
    assert.ok(pairAB.disadvantageOfPlan2.includes("Tải học tập cao hơn"));
    assert.ok(pairAB.tradeOffVerdict.includes("Chọn Plan B"));

    const pairAC = result.tradeOffs.find(t => t.comparisonPair.includes("Plan A") && t.comparisonPair.includes("Plan C"));
    assert.ok(pairAC);
    assert.ok(pairAC.advantageOfPlan2.includes("Giảm tải"));
    assert.ok(pairAC.disadvantageOfPlan2.includes("chậm hơn"));
  });
});
