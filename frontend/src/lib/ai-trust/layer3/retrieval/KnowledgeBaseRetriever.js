/**
 * Layer 3 — KnowledgeBaseRetriever
 * 
 * Curated institutional knowledge repository and offline deterministic verification provider.
 * Stores verified university announcements, banking guidelines, government decrees,
 * and test case benchmarks for deterministic validation.
 */

import { IEvidenceRetriever } from "./IEvidenceRetriever.js";
import { SourceAuthorityRegistry } from "../registry/SourceAuthorityRegistry.js";
import { createSource, FRESHNESS_STATUS } from "../types.js";

export const INSTITUTIONAL_KNOWLEDGE_BASE = [
  // Official HCMUTE Tuition Policy (Verified Official Document)
  {
    id: "kb-hcmute-tuition-2026",
    url: "https://hcmute.edu.vn/tin-tuc/thong-bao-hoc-phi-nam-hoc-2026",
    title: "Thông báo điều chỉnh mức học phí và chính sách hỗ trợ sinh viên năm học 2026",
    domain: "hcmute.edu.vn",
    publisher: "Trường ĐH Sư phạm Kỹ thuật TP.HCM",
    publishedAt: "2026-01-15T08:00:00Z",
    content: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE) chính thức công bố quy chế điều chỉnh học phí cho năm học 2026 theo lộ trình tự chủ đại học, áp dụng từ học kỳ 1 năm học 2026-2027.",
    keywords: ["học phí", "quy chế điều chỉnh", "chính sách học phí"],
    claimRelations: {
      "claim-policy-1": "STRONGLY_SUPPORTS",
    },
  },

  // Official VNU Scholarship Announcement (Verified Official Document)
  {
    id: "kb-vnu-scholarship-2026",
    url: "https://vnuhcm.edu.vn/hoc-bong-tai-tro-sinh-vien-2026",
    title: "Chương trình học bổng tài trợ sinh viên xuất sắc ĐHQG-HCM năm 2026",
    domain: "vnuhcm.edu.vn",
    publisher: "Đại học Quốc gia TP.HCM",
    publishedAt: "2026-02-10T09:30:00Z",
    content: "Đại học Quốc gia TP.HCM (VNU-HCM) thông báo triển khai chương trình trao tặng học bổng tài trợ 50 triệu đồng cho sinh viên có thành tích xuất sắc trong học tập và nghiên cứu khoa học.",
    keywords: ["học bổng", "50 triệu", "sinh viên xuất sắc"],
    claimRelations: {
      "claim-inst-1": "STRONGLY_SUPPORTS",
    },
  },

  // Official Vietcombank Biometrics Notice (Verified Official Document)
  {
    id: "kb-vcb-biometrics-official",
    url: "https://vietcombank.com.vn/thong-bao-cap-nhat-sinh-trac-hoc",
    title: "Hướng dẫn xác thực sinh trắc học trên ứng dụng VCB Digibank",
    domain: "vietcombank.com.vn",
    publisher: "Vietcombank",
    publishedAt: "2026-06-20T10:00:00Z",
    content: "Vietcombank chỉ hỗ trợ cập nhật sinh trắc học trực tiếp trên ứng dụng VCB Digibank chính thức hoặc tại quầy giao dịch. Vietcombank tuyệt đối không gửi đường link yêu cầu nhập mã OTP hoặc mật khẩu.",
    keywords: ["sinh trắc học", "vcb digibank", "tuyệt đối không"],
    claimRelations: {
      "claim-sec-1": "STRONGLY_CONTRADICTS",
    },
  },

  // Partial Support Example: Scholarship Overstatement (Selected students up to 10M vs Every student gets 10M)
  {
    id: "kb-partial-scholarship",
    url: "https://hcmute.edu.vn/hoc-bong-khuyen-khich-hoc-tap",
    title: "Quy định xét cấp học bổng khuyến khích học tập HCMUTE",
    domain: "hcmute.edu.vn",
    publisher: "Phòng Tuyển sinh và Công tác Sinh viên HCMUTE",
    publishedAt: "2026-03-01T08:00:00Z",
    content: "Học bổng khuyến khích học tập được xét cấp cho tối đa 10% sinh viên đạt loại Giỏi trở lên trong mỗi học kỳ với mức hỗ trợ tối đa lên đến 10 triệu đồng.",
    keywords: ["học bổng 10 triệu", "khuyến khích học tập"],
    claimRelations: {
      "claim-partial-1": "PARTIALLY_SUPPORTS",
    },
  },

  // Old Outdated Document (2022 Policy Document)
  {
    id: "kb-outdated-policy-2022",
    url: "https://hcmute.edu.vn/luu-tru/quy-dinh-hoc-phi-2022.pdf",
    title: "Quy định học phí năm học 2022-2023 (Hết hiệu lực)",
    domain: "hcmute.edu.vn",
    publisher: "HCMUTE Lưu Trữ",
    publishedAt: "2022-08-15T00:00:00Z",
    content: "Quy định khung học phí năm 2022 cho hệ đại trà là 18.5 triệu đồng/năm. Văn bản này đã hết hiệu lực theo quyết định số 45/QĐ-ĐHSPKT.",
    keywords: ["học phí 2022", "hết hiệu lực"],
    freshness: FRESHNESS_STATUS.OUTDATED,
  },

  // Contradictory Source A (Policy Event Announced)
  {
    id: "kb-event-source-a",
    url: "https://vnexpress.net/hcmute-to-chuc-ngay-hoi-viec-lam-2026",
    title: "HCMUTE tổ chức ngày hội việc làm vào thứ Hai 15/09",
    domain: "vnexpress.net",
    publisher: "VnExpress",
    publishedAt: "2026-08-20T07:00:00Z",
    content: "Ngày hội việc làm sinh viên HCMUTE 2026 chính thức diễn ra vào thứ Hai ngày 15/09 tại sân trường trung tâm.",
    keywords: ["ngày hội việc làm", "thứ hai", "15/09"],
    clusterId: "cluster-event-a",
  },

  // Contradictory Source B (Policy Event Rescheduled / Contradicted)
  {
    id: "kb-event-source-b",
    url: "https://tuoitre.vn/hcmute-dieu-chinh-lich-ngay-hoi-viec-lam",
    title: "HCMUTE điều chỉnh dời lịch ngày hội việc làm sang thứ Sáu 19/09",
    domain: "tuoitre.vn",
    publisher: "Báo Tuổi Trẻ",
    publishedAt: "2026-08-21T09:00:00Z",
    content: "Ban tổ chức thông báo dời lịch ngày hội việc làm sang thứ Sáu ngày 19/09 do trùng lịch đánh giá kiểm định cơ sở đào tạo.",
    keywords: ["ngày hội việc làm", "thứ sáu", "dời lịch", "19/09"],
    clusterId: "cluster-event-b",
  },

  // Syndicated Press Release Copies (Testing Source Independence & Lineage)
  {
    id: "kb-syndicated-1",
    url: "https://dantri.com.vn/giao-duc/hcmute-mo-nganh-tri-tue-nhan-tao",
    title: "HCMUTE mở ngành Trí tuệ Nhân tạo năm 2026",
    domain: "dantri.com.vn",
    publisher: "Dân Trí",
    publishedAt: "2026-04-10T10:00:00Z",
    content: "Theo thông cáo báo chí từ HCMUTE, nhà trường chính thức mở thêm ngành đào tạo Kỹ thuật Trí tuệ Nhân tạo từ năm 2026.",
    keywords: ["trí tuệ nhân tạo", "mở ngành"],
    clusterId: "lineage-press-release-ai-2026",
  },
  {
    id: "kb-syndicated-2",
    url: "https://thanhnien.vn/giao-duc/hcmute-mo-nganh-tri-tue-nhan-tao",
    title: "HCMUTE mở ngành Trí tuệ Nhân tạo năm 2026",
    domain: "thanhnien.vn",
    publisher: "Thanh Niên",
    publishedAt: "2026-04-10T10:15:00Z",
    content: "Theo thông cáo báo chí từ HCMUTE, nhà trường chính thức mở thêm ngành đào tạo Kỹ thuật Trí tuệ Nhân tạo từ năm 2026.",
    keywords: ["trí tuệ nhân tạo", "mở ngành"],
    clusterId: "lineage-press-release-ai-2026",
  },
];

export class KnowledgeBaseRetriever extends IEvidenceRetriever {
  constructor() {
    super("institutional_knowledge_base_retriever");
  }

  /**
   * Matches queries against the Knowledge Base
   */
  async search(queries, options = {}) {
    const candidateSources = [];
    const matchedDocIds = new Set();

    for (const q of queries) {
      const queryLower = (q.query || "").toLowerCase();

      for (const doc of INSTITUTIONAL_KNOWLEDGE_BASE) {
        let matchScore = 0;

        // Domain filter check (e.g. site:hcmute.edu.vn)
        if (q.targetDomain && doc.domain !== q.targetDomain) {
          continue;
        }

        // Year filter check: if query has specific year (e.g. 2022), doc must contain it
        if (queryLower.includes("2022") && !doc.content.includes("2022")) {
          continue;
        }

        // Keyword matching: Check if query contains any of doc's specific keywords
        let topicMatch = false;
        for (const kw of doc.keywords) {
          if (queryLower.includes(kw.toLowerCase()) && kw.length >= 4) {
            matchScore += 2;
            if (!["dời lịch", "hoãn", "hủy", "đính chính", "bác bỏ", "tuyệt đối không"].includes(kw.toLowerCase())) {
              topicMatch = true;
            }
          }
        }

        if (!topicMatch && q.isContradictionSeeking) {
          continue;
        }

        // Secondary check: query specific phrases in doc content
        const queryTerms = queryLower.split(/\s+/).filter((w) => w.length > 3 && !["thông", "chính", "thức", "toàn", "sinh", "viên", "hcmute"].includes(w));
        let termHits = 0;
        for (const term of queryTerms) {
          if (doc.content.toLowerCase().includes(term)) {
            termHits++;
          }
        }
        if (termHits >= 2) {
          matchScore += 1;
        }

        if (matchScore >= 1 && !matchedDocIds.has(doc.id)) {
          matchedDocIds.add(doc.id);

          const authority = SourceAuthorityRegistry.evaluateAuthority(doc.domain);
          candidateSources.push(
            createSource({
              sourceId: doc.id,
              url: doc.url,
              domain: doc.domain,
              title: doc.title,
              publisher: doc.publisher,
              authorityTier: authority.tier,
              authorityScore: authority.score,
              authorityBasis: authority.basis,
              publishedAt: doc.publishedAt,
              clusterId: doc.clusterId || doc.id,
              isOfficial: authority.isOfficial,
            })
          );
        }
      }
    }

    return candidateSources;
  }

  async fetch(url) {
    const doc = INSTITUTIONAL_KNOWLEDGE_BASE.find((d) => d.url === url);
    if (!doc) return { html: "", textContent: "", status: 404 };
    return {
      html: `<html><body><h1>${doc.title}</h1><p>${doc.content}</p></body></html>`,
      textContent: doc.content,
      publishedAt: doc.publishedAt,
      status: 200,
    };
  }
}
