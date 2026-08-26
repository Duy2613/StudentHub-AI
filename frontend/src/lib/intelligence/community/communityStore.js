/**
 * StudentHub AI — Durable Community Intelligence Store V1
 * 
 * Persistent storage and indexing for real-world student experiences,
 * community posts, and consensus graphs.
 */

import fs from "node:fs";
import path from "node:path";
import {
  CommunityIntelligenceModel,
  CONTENT_TYPE
} from "./communityIntelligenceModel.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "community_intelligence_store.json");

export class CommunityStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #postsById = new Map();
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#postsById.clear();
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
    const seed1 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_EXP_01",
      authorId: "STU_21110001",
      authorCohort: "K21",
      topic: "TOEIC_SUBMISSION",
      contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
      content: "Kinh nghiệm của mình: Nộp chứng chỉ TOEIC trực tiếp tại Phòng Đào Tạo (bàn số 3) mất đúng 7 ngày làm việc để cập nhật lên trang daotao.hcmute.edu.vn.",
      procedureDurationDays: 7,
      upvotes: 42
    });

    const seed2 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_EXP_02",
      authorId: "STU_21110045",
      authorCohort: "K21",
      topic: "TOEIC_SUBMISSION",
      contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
      content: "Hôm qua mình lên phòng đào tạo nộp chứng chỉ IIG, thầy tiếp nhận và hẹn 7 ngày sau kiểm tra lại cổng sinh viên.",
      procedureDurationDays: 7,
      upvotes: 28
    });

    const seed3 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_TOEIC_EXP_03",
      authorId: "STU_22110088",
      authorCohort: "K22",
      topic: "TOEIC_SUBMISSION",
      contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
      content: "Mình vừa làm xong thủ tục hậu kiểm chứng chỉ tiếng Anh tuần trước, quy trình mất khoảng 8 ngày là có tích xanh trên hệ thống.",
      procedureDurationDays: 8,
      upvotes: 19
    });

    const seed4 = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_GRAD_DEFENSE_01",
      authorId: "STU_20110012",
      authorCohort: "K20",
      topic: "GRADUATION_PROJECT",
      contentType: CONTENT_TYPE.GUIDE,
      content: "Hướng dẫn bảo vệ đồ án: Cần chuẩn bị 3 cuốn báo cáo bìa mềm nộp cho bộ môn trước ngày hội đồng 5 ngày. Đừng nộp sát giờ vì có thể bị trừ điểm chuyên cần.",
      procedureDurationDays: 5,
      upvotes: 65
    });

    this.#postsById.set(seed1.postId, seed1);
    this.#postsById.set(seed2.postId, seed2);
    this.#postsById.set(seed3.postId, seed3);
    this.#postsById.set(seed4.postId, seed4);
  }

  static flushToDisk() {
    try {
      this.#ensureStorageDir();
      const payload = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        posts: Array.from(this.#postsById.values())
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

  static getPost(postId) {
    this.#ensureHydrated();
    if (!postId) return null;
    return this.#postsById.get(String(postId).trim()) || null;
  }

  static getPostsByTopic(topic) {
    this.#ensureHydrated();
    const target = (topic || "GENERAL").toUpperCase();
    return Array.from(this.#postsById.values()).filter(p => p.topic === target);
  }

  static getAllPosts() {
    this.#ensureHydrated();
    return Array.from(this.#postsById.values());
  }
}
