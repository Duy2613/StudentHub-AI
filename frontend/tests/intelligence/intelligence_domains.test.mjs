/**
 * StudentHub AI — Comprehensive Test Suite for 10 Intelligence Domains & 28 Specialist Capabilities
 * 
 * Verifies:
 * 1. Source Registry & Provenance (Tier 1-4, 6-Question Provenance Model)
 * 2. HCMUTE Knowledge Graph & Academic Reasoning Engine (Prerequisite Cascade & GPA Trajectory)
 * 3. Document AI & Version Diff (v1 vs v2 diffing)
 * 4. Contract Intelligence (14 clauses, Labor & Civil Code risk flags)
 * 5. Claim Verification & Conflict Engine (Abstaining on insufficient evidence)
 * 6. Threat Intelligence & Psychological Manipulation
 * 7. Cross-Modal Contradiction Engine (Brand vs Domain vs QR)
 * 8. Geospatial Safety & GPS Routing (Fastest / Safest / Balanced)
 * 9. Emergency System & Companion (Hold-2s, 112/113/114/115 dispatch, Trip timer)
 * 10. 7-Head Student Radar & Unified Copilot (6 Situation Modes)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Imports
import { SOURCE_TIERS, evaluateDataProvenance, calculateFreshnessScore } from "../../src/lib/intelligence/academic/sourceRegistry.js";
import { HCMUTE_UNIVERSITY_PROFILE } from "../../src/lib/intelligence/academic/hcmuteKnowledgeGraph.js";
import { evaluatePrerequisiteCascade, calculateGpaTrajectory } from "../../src/lib/intelligence/academic/academicReasoningEngine.js";
import { extractDocumentIntelligence, computeDocumentVersionDiff } from "../../src/lib/intelligence/document/documentVersionDiffEngine.js";
import { analyzeContractIntelligence } from "../../src/lib/intelligence/contract/contractIntelligenceEngine.js";
import { verifyFactualClaim, calculateEvidenceStrength } from "../../src/lib/intelligence/fusion/claimVerificationEngine.js";
import { queryThreatIntelligence } from "../../src/lib/intelligence/fraud/threatIntelligenceFeed.js";
import { analyzePsychologicalVectors } from "../../src/lib/intelligence/fraud/psychologicalManipulationEngine.js";
import { evaluateCrossModalContradictions } from "../../src/lib/intelligence/fraud/crossModalContradictionEngine.js";
import { calculateGeospatialSafetyScore } from "../../src/lib/intelligence/safety/geospatialSafetyEngine.js";
import { calculateSafetyRoutes } from "../../src/lib/intelligence/safety/safetyRoutingEngine.js";
import { OFFICIAL_EMERGENCY_HOTLINES, generateEmergencySosPayload, createTripCompanion } from "../../src/lib/intelligence/emergency/emergencySystemEngine.js";
import { getEvaluatedStudentRadar } from "../../src/lib/intelligence/radar/studentRadarEngine.js";
import { getProfessorIntelligence } from "../../src/lib/intelligence/community/teachingReviewIntelligence.js";
import { queryStudentCopilot, STUDENT_SITUATION_MODES } from "../../src/lib/intelligence/copilot/studentCopilotEngine.js";

describe("Domain 1: Academic & University OS", () => {
  it("should enforce Tier 1-4 Source Governance and 6-Question Provenance", () => {
    const validOfficialRecord = {
      publisher: "Phòng Đào tạo HCMUTE",
      source_url: "https://online.hcmute.edu.vn",
      retrieved_at: "2026-08-25T12:00:00.000Z",
      valid_from: "2026-08-25",
      corroboration_sources: ["https://daotao.hcmute.edu.vn"],
      content_hash: "sha256-abc12345",
    };

    const provenance = evaluateDataProvenance(validOfficialRecord);
    assert.strictEqual(provenance.passedCount, 6);
    assert.strictEqual(provenance.isGoldEligible, true);
    assert.strictEqual(provenance.provenanceScore, 1.0);

    const freshness = calculateFreshnessScore("2026-08-20T00:00:00.000Z", "ANNOUNCEMENT");
    assert.strictEqual(freshness.status, "FRESH");
  });

  it("should trace prerequisite cascade and identify bottleneck courses in HCMUTE Graph", () => {
    const calculusCascade = evaluatePrerequisiteCascade("MATH141701");
    assert.strictEqual(calculusCascade.found, true);
    assert.strictEqual(calculusCascade.targetCourse.name.includes("Giải tích 1"), true);
    assert.ok(calculusCascade.allBlocked.length >= 1);
    assert.ok(calculusCascade.totalCreditsBlocked >= 4);

    const gpaPlan = calculateGpaTrajectory(2.2, 45, 3.2, 18);
    assert.ok(gpaPlan.requiredNextGpa > 0);
    assert.strictEqual(gpaPlan.academicWarningRisk, "MODERATE_ATTENTION");
  });
});

describe("Domain 2: Document & Contract Intelligence", () => {
  it("should compute Document Version Diff (v1 vs v2) with ADDED, REMOVED, MODIFIED", () => {
    const docV1 = extractDocumentIntelligence("Hạn chót đóng học phí là ngày 25/02/2026 cho sinh viên K22.", { title: "Công văn v1" });
    const docV2 = extractDocumentIntelligence("Hạn chót đóng học phí là ngày 15/03/2026 cho sinh viên K22 và K23.", { title: "Công văn v2" });

    const diff = computeDocumentVersionDiff(docV1, docV2);
    assert.strictEqual(diff.status, "DIFF_COMPLETED");
    assert.ok(diff.totalChanges > 0);
    assert.ok(diff.diffItems.some((d) => d.changeType === "MODIFIED" || d.changeType === "ADDED"));
  });

  it("should flag illegal ID retention and deposit traps under Labor Code 2019", () => {
    const badContract = "Công ty tuyển dụng yêu cầu ứng viên nộp bản chính CCCD gốc và đặt cọc 500k tiền đồng phục.";
    const analysis = analyzeContractIntelligence(badContract, "LABOR");

    assert.strictEqual(analysis.overallRiskScore >= 80, true);
    assert.ok(analysis.riskFlags.some((f) => f.id === "FLAG_ID_RETENTION"));
    assert.ok(analysis.riskFlags.some((f) => f.id === "FLAG_LABOR_DEPOSIT"));
  });
});

describe("Domain 3: Multimodal Fraud Intelligence & Evidence Fusion", () => {
  it("should detect NCSC blacklisted phishing domains and fraudulent bank accounts", () => {
    const threatCheck = queryThreatIntelligence({
      domain: "hcmute-daotao.xyz",
      accountNumber: "098765432188",
    });

    assert.strictEqual(threatCheck.isThreatDetected, true);
    assert.strictEqual(threatCheck.matchesCount, 2);
  });

  it("should analyze 24 psychological manipulation tactics (Fear, Urgency, Authority)", () => {
    const scamText = "Cơ quan công an yêu cầu bạn vào phòng kín một mình và nộp tiền ngay lập tức trong 15 phút nếu không sẽ khởi tố bắt tạm giam.";
    const psycho = analyzePsychologicalVectors(scamText);

    assert.ok(psycho.detectedCount >= 3);
    assert.ok(psycho.manipulationScore >= 0.7);
  });

  it("should detect cross-modal brand vs domain and tuition QR code contradictions", () => {
    const contradiction = evaluateCrossModalContradictions({
      textClaim: "Thông báo nộp học phí trường HCMUTE",
      claimedBrand: "HCMUTE",
      urlDomain: "hocphi-fake.xyz",
      qrPayload: { accountHolder: "NGUYEN VAN LUA" },
    });

    assert.strictEqual(contradiction.hasContradiction, true);
    assert.ok(contradiction.contradictionsCount >= 2);
    assert.strictEqual(contradiction.overallRiskScore, 95);
  });

  it("should responsibly ABSTAIN (INSUFFICIENT_EVIDENCE) when no authoritative source exists", () => {
    const ungroundedClaim = verifyFactualClaim("Trường đã miễn toàn bộ học phí năm 2026", []);
    assert.strictEqual(ungroundedClaim.status, "INSUFFICIENT_EVIDENCE");
    assert.strictEqual(ungroundedClaim.verdict, "UNVERIFIED");
  });
});

describe("Domain 4: Geospatial Safety & Emergency System", () => {
  it("should compute Provenance-Based Safety Score with explicit environmental evidence", () => {
    const safety = calculateGeospatialSafetyScore("ZONE_HCMUTE_LINH_CHIEU");
    assert.ok(safety.safetyScore >= 70);
    assert.ok(safety.provenance.positiveEvidence.length >= 2);
    assert.ok(safety.googleMapsUrl.includes("google.com/maps"));
  });

  it("should calculate 3 GPS Safety Routes (Fastest, Safest, Balanced)", () => {
    const routes = calculateSafetyRoutes({ timeOfDay: "NIGHT" });
    assert.strictEqual(routes.routes.length, 3);
    assert.strictEqual(routes.recommendedRouteId, "ROUTE_SAFEST");
    assert.strictEqual(routes.routes.find((r) => r.id === "ROUTE_SAFEST").safetyScore, 94);
  });

  it("should provide official emergency channels (112, 113, 114, 115) and trip companion", () => {
    assert.ok(OFFICIAL_EMERGENCY_HOTLINES.some((h) => h.code === "112"));
    assert.ok(OFFICIAL_EMERGENCY_HOTLINES.some((h) => h.code === "113"));

    const sos = generateEmergencySosPayload({ lat: 10.8524, lng: 106.7712, studentName: "Trần Minh Quân" });
    assert.ok(sos.message.includes("10.8524,106.7712"));
    assert.ok(sos.smsUrl.startsWith("sms:?body="));

    const companion = createTripCompanion({ estimatedMinutes: 20 });
    assert.strictEqual(companion.status, "ACTIVE_IN_TRANSIT");
  });
});

describe("Domain 5: 7-Head Radar, Teaching Intelligence & Unified Copilot", () => {
  it("should evaluate 7-Head Student Radar streams with real-time freshness decay", () => {
    const radar = getEvaluatedStudentRadar();
    assert.strictEqual(radar.length, 7);
    assert.ok(radar.every((stream) => stream.signals.length > 0));
  });

  it("should provide multi-dimensional Teaching Review Intelligence with sample size and fact/opinion separation", () => {
    const prof = getProfessorIntelligence("prof_ute_01");
    assert.strictEqual(prof.sampleSize, 86);
    assert.ok(prof.metrics.clarity.score >= 4.5);
    assert.strictEqual(prof.factualSyllabus.type, "FACT");
  });

  it("should support 6 Student Situation Modes in Unified Copilot", () => {
    assert.strictEqual(STUDENT_SITUATION_MODES.length, 6);

    const studyResult = queryStudentCopilot({ query: "Giải tích 1", situationMode: "STUDY" });
    assert.strictEqual(studyResult.situationMode, "STUDY");
    assert.strictEqual(studyResult.provenance.authorityTier, "TIER_1_OFFICIAL");

    const emergencyResult = queryStudentCopilot({ query: "SOS cứu nạn", situationMode: "EMERGENCY" });
    assert.strictEqual(emergencyResult.situationMode, "EMERGENCY");
    assert.ok(emergencyResult.hotlines.length >= 4);
  });
});
