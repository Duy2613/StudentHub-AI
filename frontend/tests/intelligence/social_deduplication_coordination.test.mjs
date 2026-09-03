/**
 * StudentHub AI — Social Deduplication & Coordination Detection Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { ContentItemNormalizer } from "../../src/lib/intelligence/social/ContentItemNormalizer.js";
import { SocialDuplicationDetector } from "../../src/lib/intelligence/social/SocialDuplicationDetector.js";
import { CoordinationDetector } from "../../src/lib/intelligence/social/CoordinationDetector.js";

describe("Social Deduplication & Coordination Engine", () => {
  beforeEach(() => {
    SocialDuplicationDetector.clear();
    CoordinationDetector.clear();
  });

  it("should cluster duplicate reposts and dampen effective independence weight", () => {
    const text = "Cổng đăng ký học phần online.hcmute.edu.vn vừa bị lỗi 504 gateway timeout không thể đăng ký.";

    const item1 = ContentItemNormalizer.normalize({ content: text, authorId: "user_01" });
    const dup1 = SocialDuplicationDetector.processItem(item1);
    assert.strictEqual(dup1.isDuplicate, false);
    assert.strictEqual(dup1.clusterSize, 1);
    assert.strictEqual(dup1.effectiveIndependenceWeight, 1.0);

    // Repost 1
    const item2 = ContentItemNormalizer.normalize({ content: text, authorId: "user_02" });
    const dup2 = SocialDuplicationDetector.processItem(item2);
    assert.strictEqual(dup2.isDuplicate, true);
    assert.strictEqual(dup2.clusterSize, 2);
    assert.ok(dup2.effectiveIndependenceWeight < 1.0); // 1 / sqrt(2) ≈ 0.707

    // Repost 2
    const item3 = ContentItemNormalizer.normalize({ content: text, authorId: "user_03" });
    const dup3 = SocialDuplicationDetector.processItem(item3);
    assert.strictEqual(dup3.clusterSize, 3);
    assert.ok(dup3.effectiveIndependenceWeight < dup2.effectiveIndependenceWeight);
  });

  it("should flag coordinated campaign posts in tight timeframes as POTENTIAL_COORDINATION", () => {
    const campaignText = "Mọi người cùng vote 1 sao cho app trường đi anh em ơi!";
    const baseTime = Date.now();

    // 3 distinct users post identical text within 2 minutes
    const item1 = ContentItemNormalizer.normalize({ content: campaignText, authorId: "bot_1", publishedAt: new Date(baseTime).toISOString() });
    const item2 = ContentItemNormalizer.normalize({ content: campaignText, authorId: "bot_2", publishedAt: new Date(baseTime + 30000).toISOString() });
    const item3 = ContentItemNormalizer.normalize({ content: campaignText, authorId: "bot_3", publishedAt: new Date(baseTime + 60000).toISOString() });

    CoordinationDetector.evaluateCoordination(item1);
    CoordinationDetector.evaluateCoordination(item2);
    const coord3 = CoordinationDetector.evaluateCoordination(item3);

    assert.strictEqual(coord3.isCoordinated, true);
    assert.strictEqual(coord3.status, "POTENTIAL_COORDINATION");
    assert.strictEqual(coord3.clusterAuthors.length, 3);
    assert.ok(coord3.confidence >= 0.80);
  });
});
