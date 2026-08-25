/**
 * Layer 3 — TemporalEvaluator
 * 
 * Evaluates the temporal validity and freshness of evidence.
 * Flags outdated evidence when source publication predates claim validity requirements.
 */

import { FRESHNESS_STATUS } from "../types.js";
import { LAYER_3_CONFIG } from "../config/Layer3Config.js";

export class TemporalEvaluator {
  /**
   * Evaluates freshness and temporal validity of evidence against claim
   * @param {object} params
   * @param {string|null} params.publishedAt
   * @param {object} params.claim
   * @param {string} params.claimType
   * @returns {object} { freshness, isValidForClaim, timeDeltaDays, notes }
   */
  static evaluate({ publishedAt = null, claim = {}, claimType = "general" }) {
    if (!publishedAt) {
      return {
        freshness: FRESHNESS_STATUS.UNKNOWN,
        isValidForClaim: true,
        timeDeltaDays: null,
        notes: "Không xác định được ngày công bố nguồn tin.",
      };
    }

    const pubDate = new Date(publishedAt);
    if (isNaN(pubDate.getTime())) {
      return {
        freshness: FRESHNESS_STATUS.UNKNOWN,
        isValidForClaim: true,
        timeDeltaDays: null,
        notes: "Định dạng ngày công bố không hợp lệ.",
      };
    }

    const now = new Date();
    const timeDeltaDays = Math.max(0, Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)));
    const claimYear = claim.time || "2026";
    const pubYear = pubDate.getFullYear().toString();

    // 1. Year Mismatch (e.g. Claim is about 2026, but Source is from 2022)
    if (claimYear && pubYear && parseInt(claimYear, 10) - parseInt(pubYear, 10) >= 2) {
      return {
        freshness: FRESHNESS_STATUS.OUTDATED,
        isValidForClaim: false,
        timeDeltaDays,
        notes: `Nguồn tin cũ (${pubYear}) đã hết hiệu lực cho sự kiện / chính sách năm ${claimYear}.`,
      };
    }

    // 2. Freshness categorization based on claim type
    let freshness = FRESHNESS_STATUS.CURRENT;
    if (timeDeltaDays > LAYER_3_CONFIG.FRESHNESS_DAYS.POLICY_ANNOUNCEMENT) {
      freshness = FRESHNESS_STATUS.AGING;
    } else if (timeDeltaDays > LAYER_3_CONFIG.FRESHNESS_DAYS.BREAKING_NEWS) {
      freshness = FRESHNESS_STATUS.RECENT;
    }

    return {
      freshness,
      isValidForClaim: true,
      timeDeltaDays,
      notes: `Nguồn tin phát hành ngày ${pubDate.toISOString().slice(0, 10)}.`,
    };
  }
}
