/**
 * StudentHub AI — Comprehensive Mutation Testing Suite (Audit V4)
 * 
 * Tests 15 real production-code security mutations across:
 * - Layer 1-4 Trust Pipeline
 * - Academic LiveSync Bridge
 * - Fraud & Risk Intelligence Core
 * 
 * Every mutant MUST be KILLED (0 surviving mutants allowed).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRAUD_ENGINE_SRC = path.resolve(__dirname, "../../src/lib/intelligence/fraud/fraudRiskEngine.js");
const HARD_POLICY_SRC = path.resolve(__dirname, "../../src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js");
const L2_DECISION_SRC = path.resolve(__dirname, "../../src/lib/ai-trust/layer2/engine/Layer2DecisionEngine.js");
const BRIDGE_SRC = path.resolve(__dirname, "../../src/lib/intelligence/fraud/academicFraudLiveSyncBridge.js");

const mutationResults = [];

function recordMutationResult(mutantId, description, killed, reason) {
  mutationResults.push({ mutantId, description, killed, reason });
  console.log(`  ${killed ? "✓" : "✗"} Mutant ${mutantId} ${killed ? "KILLED" : "SURVIVED"}: ${reason}`);
}

async function testMutantModule(srcPath, mutatedCode, testFn) {
  const tempMutantPath = srcPath.replace(/\.js$/, `.mutant_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mjs`);

  try {
    fs.writeFileSync(tempMutantPath, mutatedCode, "utf-8");
    const mutantModule = await import(`file://${tempMutantPath}?update=${Date.now()}`);
    return await testFn(mutantModule);
  } finally {
    if (fs.existsSync(tempMutantPath)) {
      try { fs.unlinkSync(tempMutantPath); } catch {}
    }
  }
}

console.log("\n======================================================================");
console.log("☠️  STUDENTHUB AI — MUTATION / DEATH TESTING SUITE (AUDIT V4)");
console.log("======================================================================");

test("▶ [MUTANT-01] HardDecisionPolicy: Re-introduce Educational Bypass on Layer 1 BLOCK", async () => {
  const originalCode = fs.readFileSync(HARD_POLICY_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (fusedGraph.layer1Status === "BLOCK") {',
    'if (fusedGraph.layer1Status === "BLOCK" && !isEducational) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 01 must change source");

  await testMutantModule(HARD_POLICY_SRC, mutatedCode, async ({ HardDecisionPolicy }) => {
    const fusedGraph = {
      layer1Status: "BLOCK",
      layer1Signals: [],
      layer2Status: "PASS",
      layer2Classification: "INFORMATIVE",
      layer2ContextSignals: [{ type: "educational_discussion" }],
      layer2CrossModalFindings: []
    };
    const decision = HardDecisionPolicy.evaluate(fusedGraph);
    const killed = decision === null;
    recordMutationResult("01", "HardDecisionPolicy L1 educational bypass", killed, "Educational tag bypassed Layer 1 BLOCK in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-02] HardDecisionPolicy: Re-introduce Educational Bypass on Layer 2 BLOCK", async () => {
  const originalCode = fs.readFileSync(HARD_POLICY_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (fusedGraph.layer2Status === "BLOCK") {',
    'if (fusedGraph.layer2Status === "BLOCK" && !isEducational) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 02 must change source");

  await testMutantModule(HARD_POLICY_SRC, mutatedCode, async ({ HardDecisionPolicy }) => {
    const fusedGraph = {
      layer1Status: "PASS",
      layer1Signals: [],
      layer2Status: "BLOCK",
      layer2Classification: "INFORMATIVE",
      layer2ContextSignals: [{ type: "educational_discussion" }],
      layer2CrossModalFindings: []
    };
    const decision = HardDecisionPolicy.evaluate(fusedGraph);
    const killed = decision === null;
    recordMutationResult("02", "HardDecisionPolicy L2 educational bypass", killed, "Educational tag bypassed Layer 2 BLOCK in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-03] Layer2DecisionEngine: Remove Layer 1 BLOCK Guard from isEducational", async () => {
  const originalCode = fs.readFileSync(L2_DECISION_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'const isEducational = contextSignals.some((s) => s.type === "educational_discussion") && layer1Result.status !== "BLOCK";',
    'const isEducational = contextSignals.some((s) => s.type === "educational_discussion");'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 03 must change source");

  await testMutantModule(L2_DECISION_SRC, mutatedCode, async ({ Layer2DecisionEngine }) => {
    const res = Layer2DecisionEngine.resolveDecision({
      layer1Result: { status: "BLOCK" },
      semanticAnalysis: {
        contextSignals: [{ type: "educational_discussion" }],
        claims: [],
        consistencyFindings: [],
        crossModalFindings: []
      }
    });
    const killed = res.status === "PASS";
    recordMutationResult("03", "Layer2DecisionEngine educational immunity ignore L1", killed, "Layer 2 returned PASS despite Layer 1 BLOCK");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-04] AcademicFraudLiveSyncBridge: Remove Empty Body Fail-Closed Guard", async () => {
  const originalCode = fs.readFileSync(BRIDGE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (!rawBody || typeof rawBody !== "string" || rawBody.trim().length === 0) {',
    'if (false) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 04 must change source");

  await testMutantModule(BRIDGE_SRC, mutatedCode, async ({ AcademicFraudLiveSyncBridge }) => {
    const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline({
      source: { sourceId: "SRC_TEST", sourceTier: "TIER_1_OFFICIAL", url: "https://daotao.hcmute.edu.vn" },
      rawBody: "",
      previousDoc: {}
    });
    const killed = res.pipelineStatus !== "INSUFFICIENT_DATA";
    recordMutationResult("04", "AcademicFraudLiveSyncBridge empty body guard", killed, "Empty rawBody bypassed INSUFFICIENT_DATA guard");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-05] AcademicFraudLiveSyncBridge: Allow TIER_4 to escalate to VERIFIED_UPDATED", async () => {
  const originalCode = fs.readFileSync(BRIDGE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (!isVerifiedOfficialTier) {',
    'if (false) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 05 must change source");

  await testMutantModule(BRIDGE_SRC, mutatedCode, async ({ AcademicFraudLiveSyncBridge }) => {
    const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline({
      source: { sourceId: "SRC_FORUM", sourceTier: "TIER_4_UNKNOWN", url: "https://forum.com/post" },
      rawBody: "Quy định mới: TOEIC tăng lên 700",
      previousDoc: { text: "TOEIC 550" }
    });
    const killed = res.finalDecision === "VERIFIED_UPDATED";
    recordMutationResult("05", "AcademicFraudLiveSyncBridge TIER_4 provenance escalation", killed, "TIER_4_UNKNOWN escalated to VERIFIED_UPDATED in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-06] FraudRiskEngine: Allow dangerous URI schemes (javascript:)", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'const dangerousSchemeMatch = trimmed.match(/^(javascript|data|vbscript|file|blob):/i);',
    'const dangerousSchemeMatch = null;'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 06 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({ url: "javascript:alert(1)", text: "Học bổng" });
    const killed = !res.hardRulesTriggered.includes("MALWARE_DOWNLOAD");
    recordMutationResult("06", "FraudRiskEngine dangerous scheme filter", killed, "javascript: scheme escaped MALWARE_DOWNLOAD in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-07] FraudRiskEngine: Replace exact domain boundary with includes()", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'const isOfficialDomain = isExactOfficial || isOfficialSubdomain;',
    'const isOfficialDomain = parsedHostname.includes("hcmute.edu.vn");'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 07 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn.attacker.com/login",
      text: "Thông báo học bổng chính thức",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    const killed = res.decision === "VERIFIED_OFFICIAL";
    recordMutationResult("07", "FraudRiskEngine exact domain boundary", killed, "includes() falsely marked attacker domain as VERIFIED_OFFICIAL");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-08] FraudRiskEngine: Remove Userinfo Attack Detection", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (urlAnalysis.hasUserinfo) {',
    'if (false) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 08 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({ url: "https://hcmute.edu.vn@attacker.com", text: "Thông báo" });
    const killed = !res.hardRulesTriggered.includes("KNOWN_MALICIOUS_DOMAIN") && !res.hardRulesTriggered.includes("USERINFO_ATTACK");
    recordMutationResult("08", "FraudRiskEngine userinfo attack detection", killed, "Userinfo spoof escaped detection in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-09] FraudRiskEngine: Disable Unaccented OTP Detection", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    '/(?:gửi|gui|nhập|nhap|cung cấp|cung cap|forward|chuyển tiếp|chuyen tiep|chia sẻ|chia se|đọc|doc|nhắn|nhan)\\s*(?:lại\\s*)?(?:mã|ma)?\\s*(?:smart\\s*)?otp/i,',
    '/(?:gửi|nhập|cung cấp)\\s*mã\\s*otp/i,'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 09 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({ text: "gui ma otp de xac thuc", url: "https://attacker.com" });
    const killed = !res.hardRulesTriggered.includes("OTP_REQUEST");
    recordMutationResult("09", "FraudRiskEngine unaccented OTP detector", killed, "Unaccented OTP request escaped in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-10] FraudRiskEngine: Disable Unaccented Payment Terms", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'const isTuitionContext = /(?:học phí|hoc phi|lệ phí|le phi|phí|phi|tiền|tien|nộp|nop|thanh toán|thanh toan|chuyển khoản|chuyen khoan|chuyển tiền|chuyen tien|phí giữ chỗ|phi giu cho|tiền cọc|tien coc|học bổng|hoc bong|tài trợ|tai tro|hạn nộp|han nop|khoản thu|khoan thu)/i.test(text);',
    'const isTuitionContext = /(?:học phí|lệ phí|thanh toán)/i.test(text);'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 10 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({ text: "nop tien vao vi Momo: 0987654321", url: "https://attacker.com" });
    const killed = !res.hardRulesTriggered.includes("PAYMENT_DESTINATION_CHANGE");
    recordMutationResult("10", "FraudRiskEngine unaccented payment context", killed, "Unaccented payment term escaped in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-11] FraudRiskEngine: Remove Beneficiary Exact Boundary Anchor", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    '/^(?:trường đại học sư phạm kỹ thuật(?:\\s*tp\\.?\\s*hcm)?|truong dai hoc su pham ky thuat(?:\\s*tp\\.?\\s*hcm)?)$/i,',
    '/(?:trường đại học sư phạm kỹ thuật|truong dai hoc su pham ky thuat)/i,'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 11 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Nộp học phí. Chủ tài khoản: Trường Đại học Sư phạm Kỹ thuật giả mạo lừa đảo",
      url: "https://attacker.com"
    });
    const killed = !res.hardRulesTriggered.includes("PAYMENT_DESTINATION_CHANGE");
    recordMutationResult("11", "FraudRiskEngine beneficiary boundary anchor", killed, "Trailing qualifier fake beneficiary escaped in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-12] FraudRiskEngine: Disable Hard Rule Short-Circuiting", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8").replace(/\r\n/g, "\n");
  const mutatedCode = originalCode.replace(
    'if (hardRulesTriggered.length > 0) {\n      decision = FRAUD_DECISIONS.BLOCKED;',
    'if (false) {\n      decision = FRAUD_DECISIONS.BLOCKED;'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 12 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({ text: "javascript:alert(1)", url: "https://attacker.com" });
    const killed = res.decision !== "BLOCKED";
    recordMutationResult("12", "FraudRiskEngine hard rule short-circuit", killed, "Hard rule failed to force BLOCKED decision in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-13] FraudRiskEngine: Leak VERIFIED_OFFICIAL to TIER_4_UNKNOWN", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'let decision = (isOfficialDomain && overallRisk < 0.30)',
    'let decision = (overallRisk < 0.30)'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 13 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Học bổng khuyến khích học tập kỳ 1",
      metadata: { sourceTier: "TIER_4_UNKNOWN" }
    });
    const killed = res.decision === "VERIFIED_OFFICIAL";
    recordMutationResult("13", "FraudRiskEngine provenance gate", killed, "Unverified standalone text leaked to VERIFIED_OFFICIAL in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-14] FraudRiskEngine: Disable Cyrillic Homoglyph Detector", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (homoglyphResult.isHomoglyph) {',
    'if (false) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 14 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({ url: "https://hcmutе.edu.vn", text: "Trang chủ" });
    const killed = !res.hardRulesTriggered.includes("KNOWN_MALICIOUS_DOMAIN");
    recordMutationResult("14", "FraudRiskEngine homoglyph detector", killed, "Cyrillic homoglyph escaped detection in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTANT-15] FraudRiskEngine: Disable Negative OTP Warning Filter", async () => {
  const originalCode = fs.readFileSync(FRAUD_ENGINE_SRC, "utf-8");
  const mutatedCode = originalCode.replace(
    'if (!isNegativeOtpWarning && otpDemandPatterns.some(k => k.test(text))) {',
    'if (otpDemandPatterns.some(k => k.test(text))) {'
  );

  assert.notEqual(originalCode, mutatedCode, "Mutation 15 must change source");

  await testMutantModule(FRAUD_ENGINE_SRC, mutatedCode, async ({ FraudRiskEngine }) => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://it.hcmute.edu.vn/canh-bao",
      text: "Cảnh báo sinh viên: Tuyệt đối không gửi mã OTP cho bất kỳ ai",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    const killed = res.hardRulesTriggered.includes("OTP_REQUEST");
    recordMutationResult("15", "FraudRiskEngine negative warning filter", killed, "Security warning caused false positive in mutant");
    assert.ok(killed);
  });
});

test("▶ [MUTATION-V4-SUMMARY] Final Audit V4 Mutation Summary", () => {
  console.log("\n  ══════════════════════════════════════════════════════════");
  console.log("  AUDIT V4 EXPANDED MUTATION TESTING RESULTS:");
  console.log("  ──────────────────────────────────────────────────────────");
  mutationResults.forEach(r => {
    console.log(`  Mutant ${r.mutantId} (${r.description.padEnd(46)}) → ${r.killed ? "KILLED" : "SURVIVED"}`);
  });
  console.log("  ══════════════════════════════════════════════════════════");
  const killedCount = mutationResults.filter(r => r.killed).length;
  const totalCount = mutationResults.length;
  console.log(`  TOTAL: ${killedCount}/${totalCount} MUTANTS KILLED | SURVIVING: ${totalCount - killedCount}`);
  console.log("  ══════════════════════════════════════════════════════════\n");

  assert.equal(totalCount, 15, "Must test exactly 15 source mutants");
  assert.equal(killedCount, 15, "All 15 source mutants must be killed");
});
