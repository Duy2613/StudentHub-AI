/**
 * StudentHub AI — PROVIP Master Reconstruction Full E2E Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { ContentItemNormalizer } from "../../src/lib/intelligence/social/ContentItemNormalizer.js";
import { SocialClaimExtractor } from "../../src/lib/intelligence/social/SocialClaimExtractor.js";
import { SocialSignalQualityEngine } from "../../src/lib/intelligence/social/SocialSignalQualityEngine.js";
import { SocialDuplicationDetector } from "../../src/lib/intelligence/social/SocialDuplicationDetector.js";
import { CoordinationDetector } from "../../src/lib/intelligence/social/CoordinationDetector.js";
import { EarlyWarningEngine } from "../../src/lib/intelligence/social/EarlyWarningEngine.js";
import { SocialToOfficialPipeline } from "../../src/lib/intelligence/social/SocialToOfficialPipeline.js";
import { SocialContentFirewall } from "../../src/lib/intelligence/safety/SocialContentFirewall.js";
import { PersonalDigitalTwin } from "../../src/lib/personalization/PersonalDigitalTwin.js";
import { AcademicBriefingEngine } from "../../src/lib/personalization/AcademicBriefingEngine.js";

describe("PROVIP Master Reconstruction — Closed-Loop E2E", () => {
  beforeEach(() => {
    SocialDuplicationDetector.clear();
    CoordinationDetector.clear();
    EarlyWarningEngine.clear();
    PersonalDigitalTwin.clear();
  });

  it("should execute complete closed-loop from social ingest to AI safety, official fusion and personalized briefing", () => {
    const subjectId = "student:24110001";

    // 1. Ingest raw social post
    const rawPost = {
      content: "sv chú ý: cổng online.hcmute.edu.vn vừa bị lỗi 504 khi lưu môn Giải tích 1 lúc 20h30.",
      author: "Nguyễn Văn B",
      authorId: "user_student_b",
      publishedAt: new Date().toISOString()
    };

    // 2. Normalization & Entity Linking
    const normalizedItem = ContentItemNormalizer.normalize(rawPost, {
      connectorId: "forum_community"
    });
    assert.strictEqual(normalizedItem.language, "vi");
    assert.ok(normalizedItem.normalizedText.includes("sinh viên"));
    assert.ok(normalizedItem.linkedEntities.some(e => e.entityId === "COURSE:MATH1401"));

    // 3. Claim Extraction & Classification
    const claimCandidate = SocialClaimExtractor.extractClaimCandidate(normalizedItem);
    assert.strictEqual(claimCandidate.signalType, "WARNING");
    assert.strictEqual(claimCandidate.status, "CANDIDATE_UNVERIFIED");

    // 4. Duplication & Coordination Checks
    const dupResult = SocialDuplicationDetector.processItem(normalizedItem);
    assert.strictEqual(dupResult.isDuplicate, false);
    const coordResult = CoordinationDetector.evaluateCoordination(normalizedItem);
    assert.strictEqual(coordResult.isCoordinated, false);

    // 5. Signal Quality Scoring
    const quality = SocialSignalQualityEngine.evaluateQuality(normalizedItem, claimCandidate);
    assert.ok(quality.compositeScore >= 0.50);

    // 6. AI Safety Firewall Isolation
    const safeWrapped = SocialContentFirewall.wrapForAIContext(normalizedItem);
    assert.strictEqual(safeWrapped.isQuarantined, false);
    assert.ok(safeWrapped.safeText.includes('<untrusted_external_content is_instruction="false"'));

    // 7. Social-to-Official Pipeline
    const advisory = SocialToOfficialPipeline.evaluateSignalAgainstOfficial({
      topic: "academic.registration",
      claimText: normalizedItem.normalizedText,
      authorId: rawPost.authorId
    });
    assert.strictEqual(advisory.officialPolicy.status, "STATUTORY_AUTHORITY");
    assert.strictEqual(advisory.operationalSignal.status, "OPERATIONAL_REALITY");

    // 8. Personal Digital Twin & Academic Briefing
    const twin = PersonalDigitalTwin.buildDigitalTwin(subjectId);
    assert.strictEqual(twin.identity.studentId, "24110001");

    const briefing = AcademicBriefingEngine.compileBriefing(subjectId);
    assert.ok(briefing.briefingId);
    assert.ok(briefing.recommendedActions.length >= 1);
    assert.ok(briefing.recommendedActions[0].whyAmISeeingThis);
  });
});
