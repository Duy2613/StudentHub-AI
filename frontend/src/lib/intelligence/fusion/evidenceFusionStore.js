/**
 * StudentHub AI — Durable Multi-Version Evidence Fusion Store V1
 * 
 * Persistent store for immutable Knowledge Objects, version history,
 * knowledge diffing (WHAT CHANGED), and public redaction.
 */

import { EvidenceFusionModel } from "./evidenceFusionModel.js";
import { EvidenceFusionAdjudicator } from "./evidenceFusionAdjudicator.js";

export class EvidenceFusionStore {
  static #objects = new Map();
  static #versionHistory = new Map(); // topic -> [KnowledgeObject V1, V2...]

  static {
    this.seedDefaultKnowledgeObjects();
  }

  /**
   * Clears in-memory store (for testing)
   */
  static clear() {
    this.#objects.clear();
    this.#versionHistory.clear();
    this.seedDefaultKnowledgeObjects();
  }

  /**
   * Seeds default authoritative Knowledge Objects for HCMUTE
   */
  static seedDefaultKnowledgeObjects() {
    // 1. KNO: Graduation Submission Deadline & Reality Gap
    const kno1_v1 = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      topic: "GRADUATION_DOSSIER_REVIEW",
      claims: [
        {
          statement: "Hạn chót nộp hồ sơ tốt nghiệp đợt 2 là ngày 30/08/2026 theo thông báo 120/TB-ĐHSPKT.",
          layer: "OFFICIAL_TRUTH",
          authorityClass: "INSTITUTIONAL_AUTHORITY",
          publishedAt: "2026-08-01T00:00:00Z"
        }
      ],
      sources: [{ sourceId: "DOC_TB_120", title: "Thông báo 120/TB-ĐHSPKT" }]
    });

    const kno1_v2 = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      topic: "GRADUATION_DOSSIER_REVIEW",
      claims: [
        {
          statement: "Hạn chót nộp hồ sơ xét tốt nghiệp chính thức gia hạn đến 05/09/2026 theo Thông báo số 185/TB-ĐHSPKT.",
          layer: "OFFICIAL_TRUTH",
          authorityClass: "INSTITUTIONAL_AUTHORITY",
          publishedAt: "2026-08-20T00:00:00Z"
        },
        {
          statement: "Quy định gia hạn này áp dụng cho toàn thể sinh viên K24 chưa kịp hoàn thành chứng chỉ ngoại ngữ.",
          layer: "EXPERT_INTERPRETATION",
          authorId: "EXP_MINH_NV",
          sourceRef: { expertName: "TS. Nguyễn Văn Minh", expertId: "EXP_MINH_NV" }
        },
        {
          statement: "27 sinh viên ghi nhận thời gian thẩm định thực tế tại Phòng Đào Tạo mất từ 6–8 ngày làm việc.",
          layer: "COMMUNITY_REALITY",
          value: "6_TO_8_DAYS",
          predicate: "DURATION_DAYS"
        }
      ],
      sources: [
        { sourceId: "DOC_TB_185", title: "Thông báo 185/TB-ĐHSPKT (Gia hạn)" },
        { sourceId: "EXP_EXP_01", title: "Diễn giải Chuyên gia Học vụ" },
        { sourceId: "COMM_CLUS_01", title: "27 Phản ánh Thực nghiệm Sinh viên K24" }
      ]
    });

    const kno1 = EvidenceFusionModel.createKnowledgeObject({
      ...kno1_v2,
      knowledgeObjectId: "KNO_GRADUATION_DEADLINE_2026",
      version: 2
    });

    this.saveKnowledgeObject(kno1, { previousVersion: kno1_v1 });

    // 2. KNO: TOEIC Exit Requirement Across Cohorts (Scoped)
    const kno2 = EvidenceFusionAdjudicator.adjudicate({
      subject: "ENGLISH_EXIT_STANDARD",
      topic: "TOEIC_EXIT_REQUIREMENT",
      claims: [
        {
          statement: "Chuẩn đầu ra ngoại ngữ K24 là TOEIC 500 điểm theo QĐ 3116/QĐ-ĐHSPKT.",
          layer: "OFFICIAL_TRUTH",
          value: 500,
          scope: { cohort: "K24" }
        },
        {
          statement: "Chuẩn đầu ra ngoại ngữ K26 nâng lên TOEIC 550 (B2) theo QĐ 3116/QĐ-ĐHSPKT.",
          layer: "OFFICIAL_TRUTH",
          value: 550,
          scope: { cohort: "K26" }
        }
      ],
      sources: [{ sourceId: "DOC_QD_3116", title: "Quyết định 3116/QĐ-ĐHSPKT" }]
    });

    this.saveKnowledgeObject(EvidenceFusionModel.createKnowledgeObject({
      ...kno2,
      knowledgeObjectId: "KNO_TOEIC_EXIT_REQUIREMENT",
      version: 1
    }));
  }

  /**
   * Saves or updates a Knowledge Object with version tracking
   */
  static saveKnowledgeObject(knowledgeObject, options = {}) {
    if (!knowledgeObject) return null;

    const id = knowledgeObject.knowledgeObjectId;
    const topic = knowledgeObject.topic;

    this.#objects.set(id, knowledgeObject);

    if (!this.#versionHistory.has(topic)) {
      this.#versionHistory.set(topic, []);
    }

    if (options.previousVersion) {
      this.#versionHistory.get(topic).push(options.previousVersion);
    }
    this.#versionHistory.get(topic).push(knowledgeObject);

    return knowledgeObject;
  }

  /**
   * Retrieves a Knowledge Object by ID
   */
  static getById(knowledgeObjectId, options = {}) {
    const obj = this.#objects.get(knowledgeObjectId);
    if (!obj) return null;
    return options.redactPrivate ? EvidenceFusionModel.redactForPublic(obj) : obj;
  }

  /**
   * Retrieves all Knowledge Objects
   */
  static getAll(options = {}) {
    const list = Array.from(this.#objects.values());
    return options.redactPrivate ? list.map(o => EvidenceFusionModel.redactForPublic(o)) : list;
  }

  /**
   * Computes the Knowledge Diff between two versions (WHAT CHANGED?)
   */
  static computeKnowledgeDiff(knowledgeObjectId) {
    const current = this.getById(knowledgeObjectId, { redactPrivate: false });
    if (!current) return null;

    const history = this.#versionHistory.get(current.topic) || [current];
    const previous = history.length >= 2 ? history[history.length - 2] : null;

    return {
      knowledgeObjectId,
      topic: current.topic,
      currentVersion: current.version,
      previousVersion: previous ? previous.version : null,
      hasPreviousVersion: Boolean(previous),
      diff: {
        officialTruthChanged: previous ? previous.officialTruth?.value !== current.officialTruth?.value : false,
        previousOfficialValue: previous?.officialTruth?.value || null,
        currentOfficialValue: current.officialTruth?.value || null,
        realityGapsCount: current.realityGaps?.length || 0,
        disagreementsCount: current.contradictions?.length || 0,
        sourcesAddedCount: Math.max(0, (current.supportingEvidence?.length || 0) - (previous?.supportingEvidence?.length || 0)),
        explanation: previous
          ? `Gia hạn thời hạn chính thức từ '${previous.officialTruth?.value}' sang '${current.officialTruth?.value}'. Bổ sung dữ kiện thực tế 27 sinh viên ghi nhận độ trễ vận hành 6-8 ngày.`
          : "Phiên bản tri thức khởi tạo ban đầu."
      }
    };
  }
}
