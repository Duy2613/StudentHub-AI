/**
 * StudentHub AI — Scientific TEVV (Testing, Evaluation, Verification, Validation) Benchmark Suite
 * 
 * Enforces Constitution 18-24, 58-63, and NIST AI RMF / OWASP 2025 guidelines:
 * - Decouples software unit test correctness from scientific AI generalization metrics
 * - Verifies Champion vs Challenger MLOps Gate under zero-regression constraints
 * - Evaluates Out-of-Distribution (OOD) detection and responsible abstention
 * - Validates Master Evidence Graph multi-dimensional confidence calibration
 * - Validates AI Observatory telemetry health & drift monitoring
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ChampionChallengerGate } from "../../src/lib/ai-trust/mlops/ChampionChallengerGate.js";
import { OODDetector } from "../../src/lib/ai-trust/mlops/OODDetector.js";
import { MasterEvidenceGraph, SourceTier, FactCategory } from "../../src/lib/ai-trust/evidence/MasterEvidenceGraph.js";
import { AIObservatoryEngine } from "../../src/lib/ai-trust/observatory/AIObservatoryEngine.js";
import { StudentHubMultiLabelNeuralModel } from "../../src/lib/ai-trust/models/StudentHubMultiLabelNeuralModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("======================================================================");
console.log("🏛️ STUDENTHUB AI v9 — SCIENTIFIC TEVV BENCHMARK SUITE");
console.log("======================================================================");

describe("Protocol 1: Model Champion / Challenger Gate & Zero-Regression Constraints", () => {
  const registryPath = path.resolve(__dirname, "../../../ai/models/model_registry.json");

  it("should load valid Model Registry under Constitution 25-26", () => {
    assert.strictEqual(fs.existsSync(registryPath), true, "model_registry.json must exist");
    const raw = fs.readFileSync(registryPath, "utf-8");
    const registry = JSON.parse(raw);

    assert.strictEqual(registry.constitution_level, "EXTREME_REALITY_FIRST_V9");
    assert.ok(registry.model_slots.champion, "Champion model must be defined");
    assert.strictEqual(registry.model_slots.champion.slot, "CHAMPION");
    assert.ok(registry.model_slots.champion.locked_benchmark_metrics.f1_score >= 0.90);
  });

  it("should approve promotion of a strictly superior challenger (PhoBERT-Mini)", () => {
    const raw = fs.readFileSync(registryPath, "utf-8");
    const registry = JSON.parse(raw);
    const champion = {
      ...registry.model_slots.champion.locked_benchmark_metrics,
      ...registry.model_slots.champion.generalization_benchmarks
    };
    const challenger1 = {
      ...registry.model_slots.challengers[0].locked_benchmark_metrics,
      ...registry.model_slots.challengers[0].generalization_benchmarks
    };

    const result = ChampionChallengerGate.evaluatePromotion(champion, challenger1, { maxLatencyMs: 50.0 });
    assert.strictEqual(result.decision, "PROMOTION_APPROVED");
    assert.strictEqual(result.status, "READY_FOR_DEPLOYMENT");
    assert.strictEqual(result.checks.every(c => c.passed), true);
  });

  it("should REJECT promotion of a candidate with temporal regression or lower F1", () => {
    const raw = fs.readFileSync(registryPath, "utf-8");
    const registry = JSON.parse(raw);
    const champion = {
      ...registry.model_slots.champion.locked_benchmark_metrics,
      ...registry.model_slots.champion.generalization_benchmarks
    };
    const challenger2 = {
      ...registry.model_slots.challengers[1].locked_benchmark_metrics,
      ...registry.model_slots.challengers[1].generalization_benchmarks
    };

    const result = ChampionChallengerGate.evaluatePromotion(champion, challenger2);
    assert.strictEqual(result.decision, "PROMOTION_REJECTED");
    assert.strictEqual(result.status, "RETAIN_CHAMPION");
    // Should fail because F1 delta is below requirement and temporal holdout regressed
    const failedChecks = result.checks.filter(c => !c.passed);
    assert.ok(failedChecks.length > 0, "Must have at least one failing constraint");
  });
});

describe("Protocol 2: Out-of-Distribution (OOD) Detection & Responsible Abstention", () => {
  it("should responsibly abstain (INSUFFICIENT_EVIDENCE) on empty or ultra-short input", () => {
    const res = OODDetector.assess("alo", { confidence: 0.5 });
    assert.strictEqual(res.is_ood, true);
    assert.strictEqual(res.recommended_action, "ABSTAIN");
    assert.ok(res.reasons.length > 0);
  });

  it("should flag unfamiliar foreign scripts as OUT_OF_DISTRIBUTION", () => {
    const russianText = "Привет это срочное сообщение для подтверждения банковского счета 123456789";
    const res = OODDetector.assess(russianText, { confidence: 0.5 });
    assert.strictEqual(res.is_ood, true);
    assert.strictEqual(res.ood_status, "OUT_OF_DISTRIBUTION");
    assert.strictEqual(res.recommended_action, "ABSTAIN");
  });

  it("should flag random entropy/gibberish payloads as OUT_OF_DISTRIBUTION", () => {
    const gibberish = "@#$$%^&*!~!~!!@#$$%^&*()__+_+_+==={}{}{}[][];';;:";
    const res = OODDetector.assess(gibberish, { confidence: 0.5 });
    assert.strictEqual(res.is_ood, true);
    assert.strictEqual(res.recommended_action, "ABSTAIN");
  });

  it("should recognize standard Vietnamese academic/banking text as IN_DISTRIBUTION", () => {
    const normalText = "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo kế hoạch đăng ký môn học học kỳ 1 năm học 2026-2027.";
    const res = OODDetector.assess(normalText, { confidence: 0.98 });
    assert.strictEqual(res.is_ood, false);
    assert.strictEqual(res.ood_status, "IN_DISTRIBUTION");
    assert.strictEqual(res.recommended_action, "PROCEED_WITH_INFERENCE");
  });
});

describe("Protocol 3: Master Evidence Graph & Multi-Evidence Reasoning", () => {
  it("should construct an Evidence Graph with individual confidences, source tiers, and timestamps", () => {
    const graph = new MasterEvidenceGraph("SMS mạo danh ngân hàng yêu cầu nhập mã OTP", {
      category: FactCategory.OBSERVATION
    });

    graph.addEvidence({
      type: "URL_REPUTATION",
      description: "Tên miền nằm trong blacklist của NCSC và URLhaus",
      confidence: 0.97,
      sourceId: "SRC_NCSC_VN",
      sourceName: "Cục An toàn Thông tin - NCSC",
      sourceTier: SourceTier.TIER_2_THREAT_INTEL,
      sourceUrl: "https://tinnhiemmang.vn"
    });

    graph.addEvidence({
      type: "PSYCHOLOGICAL_TACTIC",
      description: "Thao túng tâm lý khẩn cấp (URGENCY) đe dọa khóa tài khoản sau 15 phút",
      confidence: 0.92,
      sourceId: "MOD_MULTIHEAD_V1_4",
      sourceName: "StudentHub Multi-Head Neural Engine",
      sourceTier: SourceTier.TIER_3_RESEARCH
    });

    graph.addEvidence({
      type: "ACTION_HARVESTING",
      description: "Yêu cầu cung cấp mã xác thực OTP ngân hàng",
      confidence: 0.99,
      sourceId: "MOD_DETERMINISTIC_RULES",
      sourceName: "NIST SP 800-63B Hard Rule Policy",
      sourceTier: SourceTier.TIER_1_OFFICIAL
    });

    const evaluation = graph.evaluate();
    assert.strictEqual(evaluation.calibrated_verdict, "SCAM");
    assert.strictEqual(evaluation.risk_level, "CRITICAL");
    assert.strictEqual(evaluation.supporting_evidence_count, 3);
    assert.strictEqual(evaluation.contradicting_evidence_count, 0);
    assert.strictEqual(evaluation.multi_dimensional_confidence.evidence_strength, "VERY_HIGH");
    assert.strictEqual(evaluation.multi_dimensional_confidence.data_quality, "HIGH");
    assert.strictEqual(evaluation.multi_dimensional_confidence.coverage_score, "COMPREHENSIVE");
    assert.ok(evaluation.multi_dimensional_confidence.uncertainty_index < 0.10);
  });

  it("should responsibly report CONFLICT_UNRESOLVED when contradicting evidence is detected", () => {
    const graph = new MasterEvidenceGraph("Email thông báo học bổng doanh nghiệp", {
      category: FactCategory.INFERENCE
    });

    // Supporting scam evidence: asks for deposit
    graph.addEvidence({
      type: "FEE_EXTRACTION",
      description: "Yêu cầu đóng phí xét duyệt 500k",
      confidence: 0.85,
      sourceTier: SourceTier.TIER_4_COMMUNITY
    });

    // Contradicting official evidence: official university announcement states no fee
    graph.addEvidence({
      type: "OFFICIAL_ANNOUNCEMENT",
      description: "Phòng CTSV HCMUTE xác nhận học bổng không thu bất kỳ khoản phí nào",
      confidence: 0.99,
      sourceTier: SourceTier.TIER_1_OFFICIAL,
      isContradicting: true
    });

    const evaluation = graph.evaluate();
    assert.strictEqual(evaluation.calibrated_verdict, "CONFLICT_UNRESOLVED");
    assert.strictEqual(evaluation.supporting_evidence_count, 1);
    assert.strictEqual(evaluation.contradicting_evidence_count, 1);
  });
});

describe("Protocol 4: AI Observatory Telemetry & OWASP GenAI 2025 Defense", () => {
  it("should generate a complete, valid observatory snapshot", () => {
    const snapshot = AIObservatoryEngine.getObservatorySnapshot();

    assert.strictEqual(snapshot.version, "v9.0.0-RealityFirst");
    assert.ok(snapshot.data_plane.total_registered_sources >= 1800);
    assert.ok(snapshot.data_plane.verified_active_sources >= 1200);
    assert.strictEqual(snapshot.drift_monitoring.data_drift.status, "NORMAL");
    assert.strictEqual(snapshot.drift_monitoring.model_drift.status, "NORMAL");
    assert.ok(snapshot.ai_security_owasp_2025.prompt_injection_defense.includes("ACTIVE"));
    assert.ok(snapshot.ai_security_owasp_2025.data_model_poisoning_defense.includes("ACTIVE"));
    assert.ok(snapshot.ai_security_owasp_2025.supply_chain_integrity.includes("ACTIVE"));
  });
});
