/**
 * StudentHub AI — Universal Search & Knowledge Retrieval Engine V1
 * Semantic entity classification and cross-domain retrieval protected by Security Fabric.
 */

import { ExpertDiscoveryEngine } from "../intelligence/expert/ExpertDiscoveryEngine.js";
import { PersonalDigitalTwin } from "./PersonalDigitalTwin.js";

export const SEARCH_ENTITY_TYPE = Object.freeze({
  COURSE: "COURSE",
  EXPERT: "EXPERT",
  COMMUNITY_CLAIM: "COMMUNITY_CLAIM",
  OFFICIAL_REGULATION: "OFFICIAL_REGULATION",
  SAVED_KNOWLEDGE: "SAVED_KNOWLEDGE"
});

export class UniversalSearchEngine {
  /**
   * Executes multi-entity universal search across academic domains
   * @param {object} params
   * @param {string} params.query - Search keywords
   * @param {string} [params.subjectId] - Optional subjectId for personal saved knowledge
   * @param {number} [params.limit] - Max items per category
   * @returns {object} Categorized search results
   */
  static search({ query = "", subjectId = "student:24110001", limit = 5 }) {
    const cleanQuery = (query || "").trim().toLowerCase();
    if (!cleanQuery) {
      return { totalMatches: 0, categories: {} };
    }

    // 1. Search Courses
    const coursesCatalog = [
      { id: "MATH141701", name: "Giải tích 1", credits: 4, faculty: "Khoa KHCB", type: "BẮT BUỘC" },
      { id: "MATH141801", name: "Giải tích 2", credits: 4, faculty: "Khoa KHCB", type: "BẮT BUỘC" },
      { id: "INTR130101", name: "Nhập môn Lập trình", credits: 3, faculty: "Khoa CNTT", type: "CƠ SỞ NGÀNH" },
      { id: "COMP230201", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 4, faculty: "Khoa CNTT", type: "CHUYÊN NGÀNH" },
      { id: "AI430101", name: "Trí tuệ Nhân tạo & Học máy", credits: 3, faculty: "Khoa CNTT", type: "CHUYÊN SÂU" }
    ];

    const matchedCourses = coursesCatalog.filter(c =>
      c.id.toLowerCase().includes(cleanQuery) || c.name.toLowerCase().includes(cleanQuery) || c.faculty.toLowerCase().includes(cleanQuery)
    ).slice(0, limit).map(c => ({
      entityType: SEARCH_ENTITY_TYPE.COURSE,
      id: c.id,
      title: `${c.id} - ${c.name}`,
      subtitle: `${c.credits} Tín chỉ • ${c.faculty} • ${c.type}`,
      sourceLabel: "SỔ TAY ĐÀO TẠO CHÍNH THỨC"
    }));

    // 2. Search Experts via ExpertDiscoveryEngine
    const expertResults = ExpertDiscoveryEngine.discoverExperts({
      topic: cleanQuery,
      limit
    });

    const matchedExperts = (expertResults.topMatches || []).map(exp => ({
      entityType: SEARCH_ENTITY_TYPE.EXPERT,
      id: exp.expertId,
      title: exp.fullName,
      subtitle: `${exp.title} • ${exp.department} (${exp.signals.domainMatchPercentage}% khớp)`,
      sourceLabel: "GIẢNG VIÊN & CHUYÊN GIA KIỂM ĐỊNH"
    }));

    // 3. Search Official Regulations
    const regulations = [
      { id: "reg_3116", title: "Quy chế Học vụ Đào tạo Đại học theo Hệ thống Tín chỉ (QĐ 3116)", scope: "Toàn trường", year: "2026" },
      { id: "reg_toeic", title: "Chuẩn đầu ra Ngoại ngữ và Quy trình Xét Tốt nghiệp", scope: "Khóa 2022 - 2026", year: "2026" }
    ];

    const matchedRegulations = regulations.filter(r =>
      r.title.toLowerCase().includes(cleanQuery) || r.scope.toLowerCase().includes(cleanQuery)
    ).map(r => ({
      entityType: SEARCH_ENTITY_TYPE.OFFICIAL_REGULATION,
      id: r.id,
      title: r.title,
      subtitle: `Phạm vi: ${r.scope} • Năm ban hành: ${r.year}`,
      sourceLabel: "VĂN BẢN QUY CHẾ HIỆU TRƯỞNG"
    }));

    // 4. Search Personal Saved Knowledge
    let matchedSaved = [];
    if (subjectId) {
      const savedItems = PersonalDigitalTwin.getSavedKnowledge(subjectId);
      matchedSaved = savedItems.filter(s =>
        (s.statement || s.title || "").toLowerCase().includes(cleanQuery)
      ).slice(0, limit).map(s => ({
        entityType: SEARCH_ENTITY_TYPE.SAVED_KNOWLEDGE,
        id: s.savedId,
        title: s.statement || s.title,
        subtitle: `Lưu ngày ${new Date(s.savedAt).toLocaleDateString("vi-VN")}`,
        sourceLabel: "KHO DỮ LIỆU CÁ NHÂN"
      }));
    }

    const totalMatches = matchedCourses.length + matchedExperts.length + matchedRegulations.length + matchedSaved.length;

    return {
      query,
      totalMatches,
      categories: {
        courses: matchedCourses,
        experts: matchedExperts,
        regulations: matchedRegulations,
        savedKnowledge: matchedSaved
      }
    };
  }
}
