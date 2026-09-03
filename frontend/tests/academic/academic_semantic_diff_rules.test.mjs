/**
 * StudentHub AI — Academic Semantic Diff & Rule Extraction Test Suite
 * 
 * Tests:
 * 1. Cosmetic noise filtering (HTML changes, spaces, entities)
 * 2. Semantic diff extraction (Deadline changes, fee adjustments, English standard changes)
 * 3. Academic rule extraction (Target cohorts, values, actions, verification status)
 */

import test from "node:test";
import assert from "node:assert/strict";

import { SemanticDiffEngine, CHANGE_CLASSIFICATION, CHANGE_CATEGORIES } from "../../src/lib/intelligence/academic/semanticDiffEngine.js";
import { AcademicDocumentNormalizer } from "../../src/lib/intelligence/academic/academicDocumentNormalizer.js";
import { AcademicRuleExtractor, ACADEMIC_RULE_TYPES } from "../../src/lib/intelligence/academic/academicRuleExtractor.js";

test("▶ [ACADEMIC-DIFF-1] Cosmetic Noise vs Semantic Diff", async (t) => {
  await t.test("D1.1: HTML tag and whitespace changes are classified as COSMETIC", () => {
    const prev = { text: "Thông báo học bổng kỳ 1 năm 2026." };
    const curr = { text: "<div class='alert'><p>  Thông báo &nbsp; học bổng kỳ 1 năm 2026.  </p></div>" };

    const diff = SemanticDiffEngine.analyzeDiff(prev, curr);

    assert.equal(diff.hasChanged, false);
    assert.equal(diff.classification, CHANGE_CLASSIFICATION.COSMETIC);
    assert.equal(diff.semanticChangesCount, 0);
  });

  await t.test("D1.2: Deadline shift is accurately classified as DEADLINE_CHANGE", () => {
    const prev = { text: "Hạn chót nộp hồ sơ xét tốt nghiệp đợt 2: 30/08/2026." };
    const curr = { text: "Hạn chót nộp hồ sơ xét tốt nghiệp đợt 2: 05/09/2026." };

    const diff = SemanticDiffEngine.analyzeDiff(prev, curr);

    assert.equal(diff.hasChanged, true);
    assert.equal(diff.classification, CHANGE_CLASSIFICATION.SEMANTIC);
    assert.equal(diff.semanticChangesCount, 1);
    assert.equal(diff.changes[0].category, CHANGE_CATEGORIES.DEADLINE_CHANGE);
    assert.equal(diff.changes[0].oldValue, "30/08/2026");
    assert.equal(diff.changes[0].newValue, "05/09/2026");
  });

  await t.test("D1.3: Tuition fee amount adjustment is classified as FEE_CHANGE", () => {
    const prev = { text: "Mức thu học phí ngành Kỹ thuật Phần mềm: 14.500.000 VNĐ / học kỳ." };
    const curr = { text: "Mức thu học phí ngành Kỹ thuật Phần mềm: 16.000.000 VNĐ / học kỳ." };

    const diff = SemanticDiffEngine.analyzeDiff(prev, curr);

    assert.equal(diff.hasChanged, true);
    assert.equal(diff.classification, CHANGE_CLASSIFICATION.SEMANTIC);
    assert.equal(diff.changes[0].category, CHANGE_CATEGORIES.FEE_CHANGE);
    assert.ok(diff.changes[0].newValue.includes("16.000.000"));
  });
});

test("▶ [ACADEMIC-RULE-2] Academic Rule Extraction Engine", async (t) => {
  await t.test("R2.1: Extracts English exit standard rule with target cohorts and scores", () => {
    const rawDoc = `
      Trường Đại học Sư phạm Kỹ thuật TP.HCM
      Quyết định số 3116/QĐ-ĐHSPKT
      Áp dụng cho sinh viên Khóa 2024 và Khóa 2026 ngành 7480103.
      Quy định chuẩn đầu ra ngoại ngữ tốt nghiệp bắt buộc: TOEIC 550 điểm.
    `;

    const normalized = AcademicDocumentNormalizer.normalizeDocument(rawDoc);
    const rules = AcademicRuleExtractor.extractRules(normalized, {
      source: { sourceId: "SRC_HCMUTE_DAOTAO", sourceTier: "TIER_1_OFFICIAL", canonicalUrl: "https://daotao.hcmute.edu.vn" }
    });

    assert.ok(rules.length >= 1);
    const engRule = rules.find(r => r.type === ACADEMIC_RULE_TYPES.ENGLISH_STANDARD);
    assert.ok(engRule);
    assert.equal(engRule.values.toeicScore, 550);
    assert.deepEqual(engRule.affectedScope.cohorts.sort(), ["2024", "2026"].sort());
    assert.deepEqual(engRule.affectedScope.programs, ["7480103"]);
    assert.equal(engRule.verificationStatus, "VERIFIED");
  });

  await t.test("R2.2: Untrusted source extracting rules yields PENDING_REVIEW", () => {
    const rawDoc = "Hạn chót đóng học phí: 15/09/2026.";
    const normalized = AcademicDocumentNormalizer.normalizeDocument(rawDoc);
    const rules = AcademicRuleExtractor.extractRules(normalized, {
      source: { sourceId: "SRC_FORUM", sourceTier: "TIER_4_UNKNOWN", canonicalUrl: "https://forum.com" }
    });

    assert.ok(rules.length >= 1);
    assert.equal(rules[0].verificationStatus, "PENDING_REVIEW");
  });
});
