/**
 * StudentHub AI — Grounded AI Recommendation & Context Compiler Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { AiRecommendationEngine, RECOMMENDATION_CONFIDENCE_BAND } from "../../src/lib/intelligence/recommendation/AiRecommendationEngine.js";
import { AiContextCompiler } from "../../src/lib/intelligence/recommendation/AiContextCompiler.js";
import { OutcomeFeedbackEngine } from "../../src/lib/intelligence/recommendation/OutcomeFeedbackEngine.js";
import { SecurityPrincipal, PRINCIPAL_TYPE } from "../../src/lib/security/core/SecurityPrincipal.js";
import { AgentIdentity } from "../../src/lib/security/ai/AgentIdentity.js";

describe("AI Grounded Recommendation Engine & Context Compiler", () => {
  beforeEach(() => {
    OutcomeFeedbackEngine.clear();
  });

  it("should compile sanitized AI context with Security Fabric data minimization", () => {
    const agent = AgentIdentity.createAcademicPlannerAgent("24110001");
    const agentPrincipal = new SecurityPrincipal({
      subjectId: "agent:academic_planner_24110001",
      principalType: PRINCIPAL_TYPE.AI_AGENT,
      roles: ["ai_agent"],
      scopes: ["academic:read", "academic:plan"],
      agentIdentity: agent
    });

    const rawProfile = {
      studentId: "24110001",
      cohort: 2024,
      programCode: "7480103",
      academicSummary: { cgpa: 3.45, earnedCredits: 52 },
      courses: [
        { courseId: "MATH141701", courseName: "Giải tích 1", credits: 4, status: "PASSED" }
      ],
      // Sensitive internal fields that MUST be stripped:
      passwordHash: "secret_hash",
      otpSecret: "secret_otp",
      internalRiskSignals: ["RISK_FLAG"],
      administrativeNotes: "Confidential note"
    };

    const compiledContext = AiContextCompiler.compileContextForAgent({
      agentPrincipal,
      purpose: "ACADEMIC_PLANNING",
      rawStudentProfile: rawProfile,
      fusedClaims: [
        { claimId: "c1", statement: "Giải tích 1 là môn tiên quyết.", topicId: "academic.curriculum", status: "VALIDATED", scope: "ALL_STUDENTS", confidence: 0.95, isContested: false }
      ],
      evidenceList: [
        { evidenceId: "e1", claimId: "c1", type: "OFFICIAL_REGULATION", contentReference: "Quyết định 3116", authority: 0.98, recency: 0.9 }
      ]
    });

    assert.ok(compiledContext.contextId.startsWith("ctx_"));
    assert.strictEqual(compiledContext.targetSubjectId, "agent:academic_planner_24110001");
    assert.strictEqual(compiledContext.studentData.academicSummary.cgpa, 3.45);

    // Data minimization verification: sensitive fields are not in context
    assert.strictEqual(compiledContext.studentData.passwordHash, undefined);
    assert.strictEqual(compiledContext.studentData.otpSecret, undefined);
    assert.strictEqual(compiledContext.studentData.internalRiskSignals, undefined);
    assert.strictEqual(compiledContext.studentData.administrativeNotes, undefined);
  });

  it("should generate grounded recommendations with explicit uncertainty and alternatives", () => {
    const studentProfile = {
      academicSummary: { cohort: 2024, programCode: "7480103", cgpa: 3.10, earnedCredits: 30 },
      courses: [] // Not passed MATH141701
    };

    const result = AiRecommendationEngine.generateAcademicRecommendations({
      subjectId: "student:24110001",
      studentProfile,
      fusedClaims: [],
      availableEvidence: []
    });

    assert.ok(result.recommendations.length >= 1);
    const rec = result.recommendations[0];
    assert.strictEqual(rec.confidenceBand, RECOMMENDATION_CONFIDENCE_BAND.HIGH_CONFIDENCE);
    assert.ok(rec.rationale.length > 20);
    assert.ok(rec.uncertaintyExplanation.length > 10);
    assert.ok(rec.alternatives.length >= 1);
  });
});
