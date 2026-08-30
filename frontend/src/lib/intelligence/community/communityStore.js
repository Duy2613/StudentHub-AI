/**
 * StudentHub AI — Durable Community Intelligence Store V2
 * 
 * Provides persistent storage, indexing, querying, corrections, retractions,
 * and privacy redaction for student experience reports and reality metrics.
 */

import fs from "node:fs";
import path from "node:path";
import {
  CommunityIntelligenceModel,
  CONTENT_TYPE,
  VERIFICATION_BADGE
} from "./communityIntelligenceModel.js";
import { CommunityExperienceEngine } from "./communityExperienceEngine.js";
import { CommunityFrictionEngine } from "./communityFrictionEngine.js";
import { CommunityRealityGapEngine } from "./communityRealityGapEngine.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "community_intelligence_store_v2.json");

export class CommunityStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #postsById = new Map();
  static #claimsById = new Map();
  static #experiencesById = new Map();
  static #feedbackList = [];
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#postsById.clear();
    this.#claimsById.clear();
    this.#experiencesById.clear();
    this.#feedbackList = [];
    this.#seedDefaults();
    this.#isHydrated = true;
    try {
      if (fs.existsSync(this.#storageFilePath)) {
        fs.unlinkSync(this.#storageFilePath);
      }
    } catch {
      // ignore
    }
  }

  static #ensureStorageDir() {
    const dir = path.dirname(this.#storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static #seedDefaults() {
    // 1. Topic: TOEIC_SUBMISSION_TIME (7 days median)
    const p1 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_01",
      authorId: "SV21110001",
      authorCohort: "K21",
      topic: "TOEIC_SUBMISSION_TIME",
      content: "Mình vừa nộp chứng chỉ TOEIC IIG qua cổng online sinhvien.hcmute.edu.vn, mất 7 ngày để Phòng Đào Tạo duyệt.",
      contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
      procedureDurationDays: 7,
      badge: VERIFICATION_BADGE.VERIFIED_STUDENT,
      upvotes: 15
    });

    const p2 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_02",
      authorId: "SV21110002",
      authorCohort: "K21",
      topic: "TOEIC_SUBMISSION_TIME",
      content: "Xác nhận nộp đợt tốt nghiệp tháng 6 mất đúng 6 ngày làm việc là có điểm chuẩn ngoại ngữ trên hệ thống.",
      contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
      procedureDurationDays: 6,
      badge: VERIFICATION_BADGE.VERIFIED_STUDENT,
      upvotes: 12
    });

    const p3 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_03",
      authorId: "SV21110003",
      authorCohort: "K21",
      topic: "TOEIC_SUBMISSION_TIME",
      content: "Kinh nghiệm của mình: nộp vào thứ 2 thì thứ 6 tuần sau được duyệt (tầm 8 ngày tính cả cuối tuần).",
      contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
      procedureDurationDays: 8,
      badge: VERIFICATION_BADGE.VERIFIED_STUDENT,
      upvotes: 19
    });

    const p4 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_EDGE",
      authorId: "SV21110004",
      authorCohort: "K21",
      topic: "TOEIC_SUBMISSION_TIME",
      content: "Lưu ý: Nếu scan chứng chỉ bị mờ mã QR kiểm tra của IIG thì hệ thống sẽ từ chối và phải nộp lại từ đầu.",
      contentType: CONTENT_TYPE.EDGE_CASE_WARNING,
      badge: VERIFICATION_BADGE.VERIFIED_STUDENT,
      upvotes: 28
    });

    // 2. Topic: GRADUATION_DOSSIER_REVIEW (K24 graduation dossier delays: 27 reports of 6-8 days)
    for (let i = 1; i <= 27; i++) {
      const days = 6 + (i % 3); // 6, 7, 8 days
      const post = CommunityIntelligenceModel.createCommunityPost({
        postId: `POST_GRAD_DOSSIER_${i}`,
        authorId: `SV2411000${i}`,
        authorCohort: "K24",
        topic: "GRADUATION_DOSSIER_REVIEW",
        title: "Nộp hồ sơ xét tốt nghiệp K24",
        content: `Tôi nộp hồ sơ xét tốt nghiệp ngày 12/08 tại Phòng Đào Tạo, mất đúng ${days} ngày làm việc mới có thông báo thẩm định đạt.`,
        contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
        procedureDurationDays: days,
        publishedAt: "2026-08-18T10:00:00Z"
      });
      this.#postsById.set(post.postId, post);
    }

    // 3. Topic: COURSE_REGISTRATION (Portal timeout friction: 11 reports)
    for (let j = 1; j <= 11; j++) {
      const post = CommunityIntelligenceModel.createCommunityPost({
        postId: `POST_REG_TIMEOUT_${j}`,
        authorId: `SV2411010${j}`,
        authorCohort: "K24",
        topic: "COURSE_REGISTRATION",
        title: "Lỗi nghẽn cổng đăng ký học phần",
        content: "Hệ thống đăng ký môn học bị timeout liên tục trong khung giờ 08:00 - 09:00 sáng, không bấm lưu thời khóa biểu được.",
        contentType: CONTENT_TYPE.WARNING,
        publishedAt: "2026-08-20T08:30:00Z"
      });
      this.#postsById.set(post.postId, post);
    }

    this.#postsById.set(p1.postId, p1);
    this.#postsById.set(p2.postId, p2);
    this.#postsById.set(p3.postId, p3);
    this.#postsById.set(p4.postId, p4);
  }

  static flushToDisk() {
    try {
      this.#ensureStorageDir();
      const payload = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        posts: Array.from(this.#postsById.values()),
        claims: Array.from(this.#claimsById.values()),
        feedback: this.#feedbackList
      };
      const serialized = JSON.stringify(payload, null, 2);
      const tempPath = `${this.#storageFilePath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tempPath, serialized, "utf-8");
      fs.renameSync(tempPath, this.#storageFilePath);
    } catch {
      // fallback
    }
  }

  static rehydrate() {
    try {
      if (!fs.existsSync(this.#storageFilePath)) {
        this.#postsById.clear();
        this.#seedDefaults();
        this.#isHydrated = true;
        return false;
      }
      const raw = fs.readFileSync(this.#storageFilePath, "utf-8");
      if (!raw || !raw.trim()) {
        this.#postsById.clear();
        this.#seedDefaults();
        this.#isHydrated = true;
        return false;
      }
      const parsed = JSON.parse(raw);
      this.#postsById.clear();

      if (Array.isArray(parsed.posts)) {
        for (const item of parsed.posts) {
          if (item && item.postId) {
            this.#postsById.set(item.postId, item);
          }
        }
      }
      if (this.#postsById.size === 0) {
        this.#seedDefaults();
      }
      this.#isHydrated = true;
      return true;
    } catch {
      this.#postsById.clear();
      this.#seedDefaults();
      this.#isHydrated = true;
      return false;
    }
  }

  static #ensureHydrated() {
    if (!this.#isHydrated) {
      this.rehydrate();
    }
  }

  static savePost(post) {
    this.#ensureHydrated();
    if (!post || !post.postId) {
      throw new Error("[COMMUNITY_STORE] Valid post with postId is required.");
    }
    const validated = CommunityIntelligenceModel.createCommunityPost(post);
    this.#postsById.set(validated.postId, validated);
    this.flushToDisk();
    return validated;
  }

  static getPost(postId, options = { redactPrivate: true }) {
    this.#ensureHydrated();
    if (!postId) return null;
    const post = this.#postsById.get(String(postId).trim()) || null;
    if (!post) return null;
    return options.redactPrivate ? CommunityIntelligenceModel.redactForPublic(post) : post;
  }

  static getPostsByTopic(topic, options = { redactPrivate: true }) {
    this.#ensureHydrated();
    const targetTopic = String(topic || "GENERAL").toUpperCase();
    const list = Array.from(this.#postsById.values()).filter(p => p.topic === targetTopic);
    return options.redactPrivate
      ? list.map(p => CommunityIntelligenceModel.redactForPublic(p))
      : list;
  }

  static getAllPosts(options = { redactPrivate: true }) {
    this.#ensureHydrated();
    const list = Array.from(this.#postsById.values());
    return options.redactPrivate
      ? list.map(p => CommunityIntelligenceModel.redactForPublic(p))
      : list;
  }

  static getConsensus(topic) {
    this.#ensureHydrated();
    const targetTopic = String(topic || "GENERAL").toUpperCase();
    const posts = Array.from(this.#postsById.values()).filter(p => p.topic === targetTopic);
    return CommunityExperienceEngine.evaluateConsensus(targetTopic, posts);
  }

  static getRealityGaps() {
    this.#ensureHydrated();
    const topics = this.getAllTopics();
    return topics.map(top => {
      const posts = this.getPostsByTopic(top, { redactPrivate: false });
      return CommunityRealityGapEngine.evaluateRealityGap({ topic: top, posts });
    });
  }

  static getFrictionSignals() {
    this.#ensureHydrated();
    const allPosts = Array.from(this.#postsById.values());
    return CommunityFrictionEngine.extractFrictionSignals(allPosts);
  }

  static getFrictionHeatmap() {
    this.#ensureHydrated();
    const signals = this.getFrictionSignals();
    return CommunityFrictionEngine.buildFrictionHeatmap(signals);
  }

  static registerFeedback(feedback = {}) {
    this.#ensureHydrated();
    const record = {
      feedbackId: `FB_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      reporterId: feedback.reporterId || null,
      postId: feedback.postId || null,
      topic: feedback.topic || "GENERAL",
      action: feedback.action || "SAME_EXPERIENCE", // SAME_EXPERIENCE, OUTDATED, WRONG, CONTEXT_DIFFERENT
      cohort: feedback.cohort || "K24",
      timestamp: new Date().toISOString()
    };
    this.#feedbackList.push(record);
    this.flushToDisk();
    return record;
  }

  static retractPost(postId, reason = "") {
    this.#ensureHydrated();
    const post = this.#postsById.get(postId);
    if (!post) return null;

    const retractedPost = CommunityIntelligenceModel.createCommunityPost({
      ...post,
      isRetracted: true,
      retractionReason: reason
    });
    this.#postsById.set(postId, retractedPost);
    this.flushToDisk();
    return retractedPost;
  }

  static getAllTopics() {
    this.#ensureHydrated();
    const topics = new Set(Array.from(this.#postsById.values()).map(p => p.topic));
    return Array.from(topics);
  }
}
