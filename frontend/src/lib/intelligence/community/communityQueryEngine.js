/**
 * StudentHub AI — Community Query & Real-World Reality Answering Engine V2
 * 
 * Supports 7 canonical community query types:
 * 1. "What are students experiencing with X?"
 * 2. "Are there recurring problems with process Y?"
 * 3. "Are there recent reports?"
 * 4. "Is there a conflict between official policy and real experience?" (Official vs Reality Gap)
 * 5. "What changed recently?"
 * 6. "Which edge cases are being reported?"
 * 7. "Is this one person's experience or a repeated pattern?"
 * 
 * Output Structure:
 * - CURRENT COMMUNITY SIGNAL
 * - FIRST-HAND EVIDENCE
 * - CONTEXT
 * - RECENCY
 * - INDEPENDENCE
 * - CONTRADICTIONS
 * - OFFICIAL COMPARISON
 * - LIMITATIONS
 * 
 * Enforces the core invariant:
 * COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC REGULATIONS.
 */

import { CommunityStore } from "./communityStore.js";
import { CommunityExperienceEngine } from "./communityExperienceEngine.js";
import { CommunityRealityGapEngine } from "./communityRealityGapEngine.js";
import { CommunityFrictionEngine } from "./communityFrictionEngine.js";
import { CommunityIntegrityEngine } from "./communityIntegrityEngine.js";

export const COMMUNITY_QUERY_TYPE = Object.freeze({
  WHAT_STUDENTS_EXPERIENCING: "WHAT_STUDENTS_EXPERIENCING",
  RECURRING_PROBLEMS: "RECURRING_PROBLEMS",
  RECENT_REPORTS: "RECENT_REPORTS",
  OFFICIAL_VS_REALITY_GAP: "OFFICIAL_VS_REALITY_GAP",
  WHAT_CHANGED_RECENTLY: "WHAT_CHANGED_RECENTLY",
  EDGE_CASE_REPORTS: "EDGE_CASE_REPORTS",
  ANECDOTE_VS_PATTERN: "ANECDOTE_VS_PATTERN"
});

export class CommunityQueryEngine {
  /**
   * Executes a canonical community query
   */
  static query(params = {}) {
    const topic = typeof params.topic === "string" ? params.topic.trim().toUpperCase() : "TOEIC_SUBMISSION_TIME";
    const queryType = COMMUNITY_QUERY_TYPE[params.queryType] || COMMUNITY_QUERY_TYPE.WHAT_STUDENTS_EXPERIENCING;
    const filterCohort = params.cohort ? String(params.cohort).trim().toUpperCase() : null;

    let posts = CommunityStore.getPostsByTopic(topic, { redactPrivate: true });
    if (filterCohort) {
      posts = posts.filter(p => p.context?.cohort === filterCohort);
    }

    const consensus = CommunityExperienceEngine.evaluateConsensus(topic, posts);
    const realityGap = CommunityRealityGapEngine.evaluateRealityGap({ topic, posts });
    const frictionSignals = CommunityFrictionEngine.extractFrictionSignals(posts);
    const edgeCases = CommunityIntegrityEngine.mineEdgeCases(posts);

    const firstHandPosts = posts.filter(p => p.contentType === "FIRST_HAND_EXPERIENCE" || p.contentType === "GUIDE" || p.contentType === "WARNING");

    return {
      queryType,
      topic,
      filterCohort,
      communityReality: {
        signal: consensus.consensusState,
        signalSummary: consensus.summary,
        firstHandReportCount: firstHandPosts.length,
        independentProvenanceClustersCount: consensus.provenanceClustersCount,
        medianObservedDays: consensus.medianProcedureDays,
        topFriction: frictionSignals.length > 0 ? frictionSignals[0] : null
      },
      firstHandEvidence: firstHandPosts.slice(0, 5).map(p => ({
        postId: p.postId,
        statement: p.body || p.content,
        cohort: p.context?.cohort,
        durationDays: p.procedureDurationDays,
        publishedAt: p.publishedAt
      })),
      context: {
        institution: "HCMUTE",
        cohorts: Array.from(new Set(posts.map(p => p.context?.cohort).filter(Boolean))),
        faculties: Array.from(new Set(posts.map(p => p.context?.faculty || p.context?.department).filter(Boolean))),
        procedure: topic
      },
      recency: {
        status: "CURRENT_PROCESS",
        recentPostCount: posts.filter(p => (Date.now() - new Date(p.publishedAt).getTime()) <= 90 * 24 * 60 * 60 * 1000).length,
        timeRange: "August 2026"
      },
      independence: {
        provenanceClustersCount: consensus.provenanceClustersCount,
        uniqueAuthorsCount: consensus.independentAuthorsCount,
        isIndependentConsensus: consensus.provenanceClustersCount >= 2 && consensus.independentAuthorsCount >= 3,
        syndicationWarning: consensus.manipulationRisk !== "NONE" ? consensus.summary : null
      },
      contradictions: consensus.contradictionAnalysis,
      officialComparison: {
        officialTarget: realityGap.officialTarget,
        officialCitation: realityGap.officialCitation,
        communityObserved: realityGap.communityObserved,
        gapStatus: realityGap.gapStatus,
        gapExplanation: realityGap.explanation
      },
      edgeCases,
      frictionSignals,
      invariants: {
        isOfficialPolicy: false,
        disclaimer: "Thông tin xuất phát từ kinh nghiệm thực tế của sinh viên các khóa trước. Thời gian và quy trình thực tế có thể thay đổi tùy đợt xét của Phòng Đào Tạo."
      },
      limitations: [
        "Dữ liệu xuất phát từ trải nghiệm thực tế quan sát được của sinh viên.",
        "Không thay thế hoặc phủ quyết quy chế đào tạo chính thức của nhà trường.",
        "Độ trễ vận hành thực tế có thể dao động tùy từng đợt xét của Phòng Đào Tạo."
      ]
    };
  }

  /**
   * Helper query method for backward compatibility
   */
  static queryTopicExperience(topic = "TOEIC_SUBMISSION_TIME") {
    return this.query({ topic, queryType: COMMUNITY_QUERY_TYPE.WHAT_STUDENTS_EXPERIENCING });
  }
}
