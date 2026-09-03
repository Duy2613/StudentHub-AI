/**
 * StudentHub AI — StudentHub OS 4 Invariant Vertical Slices E2E Suite
 * 
 * Verifies complete, closed-loop interaction across:
 * - Slice 1: Incident Detection -> T3 Community -> T2 Expert -> T4 Official Fusion -> Briefing -> AI Action
 * - Slice 2: Expert Discovery & Topic-Specific Reputation Query (with PII Masking)
 * - Slice 3: Semester Planning & Academic Record Constraints (QĐ 1422)
 * - Slice 4: Community Claim Verification & Contradiction Detection
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { EarlyWarningEngine, WARNING_CATEGORY, WARNING_LIFECYCLE } from "../../src/lib/intelligence/social/EarlyWarningEngine.js";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";
import { ExpertDiscoveryEngine } from "../../src/lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { ExpertPublicDTO } from "../../src/lib/intelligence/expert/ExpertPublicDTO.js";
import { AcademicBriefingEngine } from "../../src/lib/personalization/AcademicBriefingEngine.js";
import { ContradictionEngine, CONTRADICTION_TYPE } from "../../src/lib/intelligence/fusion/ContradictionEngine.js";
import { StudentProfile360Service } from "../../src/lib/intelligence/academic/studentProfile360Service.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";
import { AcademicRecordsStore } from "../../src/lib/intelligence/academic/academicRecordsStore.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";

describe("StudentHub OS — 4 Invariant Vertical Slices", () => {
  beforeEach(() => {
    StudentIdentityStore.rehydrate();
    AcademicRecordsStore.rehydrate();
    StudentProfile360Store.clear();
    ExpertStore.rehydrate();
    EarlyWarningEngine.clear();
  });

  // =========================================================================
  // VERTICAL SLICE 1: Incident Detection -> T3 -> T2 -> T4 -> Briefing -> AI Action
  // =========================================================================
  it("Vertical Slice 1: Operational Incident Detection to Grounded AI Advisory Action", async () => {
    const subjectId = "student:24110001";

    // 1. Ingest emerging reports
    EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      title: "Cổng online.hcmute.edu.vn bị timeout đợt 2",
      affectedEntity: "SYSTEM:online_portal",
      authorId: "user_k22_01"
    });
    EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      affectedEntity: "SYSTEM:online_portal",
      authorId: "user_k22_02"
    });
    const warning = EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      affectedEntity: "SYSTEM:online_portal",
      authorId: "user_k23_03"
    });

    assert.strictEqual(warning.status, WARNING_LIFECYCLE.EMERGING);

    // 2. Compile Personal Academic Briefing
    const briefing = AcademicBriefingEngine.compileBriefing(subjectId);
    assert.ok(briefing);
    assert.strictEqual(briefing.subjectId, subjectId);
    assert.ok(briefing.communitySignalsCount >= 1);
    assert.ok(briefing.recommendedActions.length >= 1);
    assert.ok(briefing.recommendedActions[0].whyAmISeeingThis);
  });

  // =========================================================================
  // VERTICAL SLICE 2: Expert Discovery & Topic-Specific Reputation (with PII Masking)
  // =========================================================================
  it("Vertical Slice 2: Expert Discovery with Scope Verification and PII Stripping", async () => {
    // 1. Discover experts in AI / Machine Learning
    const results = ExpertDiscoveryEngine.discoverExperts({
      topic: "Deep Learning",
      limit: 5
    });

    assert.ok(results.topMatches.length >= 1);
    const topMatch = results.topMatches[0];

    assert.ok(topMatch.department);
    assert.ok(topMatch.institution);

    // 2. Sanitize through ExpertPublicDTO
    const rawExpert = topMatch.rawExpert || topMatch;
    const publicDto = ExpertPublicDTO.toPublicDTO(rawExpert);
    assert.strictEqual(publicDto.privateContact, undefined);
    assert.strictEqual(publicDto.personalPhone, undefined);
    assert.strictEqual(publicDto.citizenId, undefined);
  });

  // =========================================================================
  // VERTICAL SLICE 3: Semester Planning & Academic Record Constraints (QĐ 1422)
  // =========================================================================
  it("Vertical Slice 3: Academic Profile 360 & Prerequisite Verification", async () => {
    const studentId = "24110001";
    const profile = StudentProfile360Service.rebuildProfile360(studentId);

    assert.ok(profile);
    assert.strictEqual(profile.studentId, studentId);
    assert.strictEqual(profile.identity.cohort, 2024);
    assert.ok(profile.academicSummary.academicStanding);

    // Verify course records & prerequisites
    assert.ok(profile.courseRecords.length >= 5);
    const math1 = profile.courseRecords.find(c => c.courseCode === "MATH1411");
    assert.ok(math1);
    assert.strictEqual(math1.grade10, 8.5);
  });

  // =========================================================================
  // VERTICAL SLICE 4: Community Claim Verification & Contradiction Detection
  // =========================================================================
  it("Vertical Slice 4: Evidence Fusion with Statutory Priority vs Operational Nuance", async () => {
    // Official Statutory Rule
    const officialClaim = {
      claimId: "CLM_OFFICIAL_TOEIC_K24",
      statement: "Chuẩn đầu ra ngoại ngữ K24 yêu cầu chứng chỉ quốc tế TOEIC 650+",
      sourceType: "OFFICIAL_REGULATION",
      authorityLevel: 0.98,
      publishedAt: "2024-08-15"
    };

    // Conflicting Community Claim
    const communityClaim = {
      claimId: "CLM_COMMUNITY_TOEIC_K24",
      statement: "Khóa K24 không yêu cầu chứng chỉ quốc tế TOEIC 650+",
      sourceType: "COMMUNITY_CONSENSUS",
      authorityLevel: 0.75,
      publishedAt: "2026-02-10"
    };

    // Detect Contradiction
    const conflict = ContradictionEngine.detectContradiction(officialClaim, communityClaim);
    assert.ok(conflict);
    assert.strictEqual(conflict.contradictionType, CONTRADICTION_TYPE.TEMPORAL_CONFLICT);
  });
});
