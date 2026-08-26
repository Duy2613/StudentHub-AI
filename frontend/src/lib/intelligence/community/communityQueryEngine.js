/**
 * StudentHub AI — Community Query & Real-World Friction Answering Engine V1
 * 
 * Provides evidence-backed synthesis of student experiences, calculating
 * real turnaround durations and highlighting mined edge-cases.
 * 
 * Enforces the core invariant:
 * COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY.
 */

import { CommunityStore } from "./communityStore.js";
import { CommunityExperienceEngine } from "./communityExperienceEngine.js";

export class CommunityQueryEngine {
  /**
   * Answers a query regarding student procedure experiences
   * @param {string} topic Topic identifier (e.g. "TOEIC_SUBMISSION_TIME")
   * @returns {object} Query response with real-world vs official comparison
   */
  static queryTopicExperience(topic = "TOEIC_SUBMISSION_TIME") {
    const targetTopic = String(topic).trim().toUpperCase();
    const consensus = CommunityStore.getConsensus(targetTopic);
    const posts = CommunityStore.getPostsByTopic(targetTopic, { redactPrivate: true });

    return {
      topic: targetTopic,
      consensus,
      totalExperiences: posts.length,
      recentExperiences: posts.slice(0, 5),
      invariants: {
        isOfficialPolicy: false,
        disclaimer: "Thông tin xuất phát từ kinh nghiệm thực tế của sinh viên các khóa trước. Thời gian và quy trình thực tế có thể thay đổi tùy đợt xét của Phòng Đào Tạo."
      }
    };
  }
}
