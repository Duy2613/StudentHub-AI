/**
 * StudentHub AI — Community Claim Extraction Architecture V1
 * Extracts structured, verifiable claim entities from student posts while preserving raw text provenance.
 */

import { ClaimEntity, CLAIM_STATUS, CLAIM_SCOPE } from "../fabric/ClaimEntity.js";
import { ProvenanceGraph, TRANSFORMATION_TYPE } from "../fabric/ProvenanceGraph.js";

export class CommunityClaimExtractor {
  /**
   * Extracts structured claims from a community post
   * @param {object} post - { postId, authorId, content, topicHint, cohortHint, createdAt }
   * @returns {object} Extracted ClaimEntity, extraction confidence, and raw provenance
   */
  static extractClaimsFromPost(post) {
    if (!post || !post.content) {
      throw new Error("extractClaimsFromPost requires a valid post with content.");
    }

    const rawText = post.content.trim();
    const authorId = post.authorId || "student:anonymous";
    const topicId = post.topicHint || this.#inferTopic(rawText);
    const scope = post.cohortHint ? CLAIM_SCOPE.COHORT_SPECIFIC : CLAIM_SCOPE.ALL_STUDENTS;

    // Deterministic statement normalization
    const normalizedStatement = this.#cleanStatement(rawText);

    // Create First-Class Claim Entity
    const claim = new ClaimEntity({
      statement: normalizedStatement,
      normalizedStatement,
      topicId,
      authorId,
      status: CLAIM_STATUS.EXTRACTED,
      scope,
      temporalContext: {
        effectiveFrom: post.createdAt || new Date().toISOString(),
        semester: post.semester || "HK2-2025-2026"
      },
      confidence: 0.60, // Initial extraction prior
      originalText: rawText,
      createdAt: post.createdAt || new Date().toISOString()
    });

    // Record Immutable Provenance
    ProvenanceGraph.recordProvenance({
      targetEntityId: claim.claimId,
      targetEntityType: "CLAIM",
      sourceIds: [post.postId || `post_${Date.now()}`],
      authorId,
      transformations: [TRANSFORMATION_TYPE.EXTRACTED, TRANSFORMATION_TYPE.NORMALIZED],
      confidence: 0.60
    });

    return {
      claim,
      extractionConfidence: 0.85,
      isAiAssisted: false,
      preservedRawText: rawText,
      topicId
    };
  }

  static #inferTopic(text) {
    const lower = text.toLowerCase();
    if (lower.includes("học phí") || lower.includes("đóng tiền") || lower.includes("miễn giảm")) {
      return "academic.tuition";
    }
    if (lower.includes("tiên quyết") || lower.includes("môn học") || lower.includes("đăng ký tín chỉ") || lower.includes("rút môn")) {
      return "academic.curriculum.registration";
    }
    if (lower.includes("chứng chỉ") || lower.includes("toeic") || lower.includes("tin học")) {
      return "academic.certification";
    }
    if (lower.includes("thực tập") || lower.includes("đồ án") || lower.includes("tốt nghiệp")) {
      return "academic.graduation";
    }
    return "general.student_life";
  }

  static #cleanStatement(text) {
    // Strips greeting noise and normalizes punctuation
    return text
      .replace(/^(mọi người ơi|cho mình hỏi|ad ơi|mn ơi|ad cho em hỏi|alo alo)[,:\s]*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
