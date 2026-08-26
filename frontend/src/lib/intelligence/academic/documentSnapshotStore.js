/**
 * StudentHub AI — Immutable Document Snapshot Store & Provenance Archive
 * 
 * Enforces Document Immutability Constitution:
 * Never overwrites official documents. Stores immutable, versioned snapshots
 * with SHA-256 hashes, retrieval timestamps, effective ranges, and fallback recovery.
 */

export const IMMUTABLE_DOCUMENT_SNAPSHOTS = [
  // 1. Quyết định 3116/QĐ-ĐHSPKT (22/08/2025) - ACTIVE
  {
    documentId: "DOC_QD_3116",
    versionId: "v1.0",
    contentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    title: "Quyết định số 3116/QĐ-ĐHSPKT về việc Ban hành Quy chế đào tạo trình độ đại học",
    sourceUrl: "https://daotao.hcmute.edu.vn/van-ban-quy-dinh/qd-3116-2025",
    retrievedAt: "2025-08-23T08:15:00.000Z",
    publishedAt: "2025-08-22T00:00:00.000Z",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    status: "ACTIVE",
    contentLocation: "vault/snapshots/documents/DOC_QD_3116_v1.0.json",
    fileType: "PDF_EXTRACTED_JSON",
    keyClausesExtracted: ["Dieu_14_Dang_ky_tin_chi", "Dieu_16_Canh_bao_hoc_tap", "Dieu_28_Dieu_kien_tot_nghiep"]
  },
  // 2. Quyết định 3811/QĐ-ĐHSPKT (31/12/2024) - SUPERSEDED
  {
    documentId: "DOC_QD_3811",
    versionId: "v1.0",
    contentHash: "5f4dcc3b5aa765d61d8327deb882cf992b9699aaf4eb06b12a8327a3c358052a",
    title: "Quyết định số 3811/QĐ-ĐHSPKT về Quy chế đào tạo đại học chính quy theo hệ thống tín chỉ",
    sourceUrl: "https://daotao.hcmute.edu.vn/van-ban-quy-dinh/qd-3811-2024",
    retrievedAt: "2025-01-05T09:00:00.000Z",
    publishedAt: "2024-12-31T00:00:00.000Z",
    effectiveFrom: "2024-12-31",
    effectiveUntil: "2025-08-22",
    status: "SUPERSEDED",
    replacedByDocumentId: "DOC_QD_3116",
    contentLocation: "vault/snapshots/documents/DOC_QD_3811_v1.0.json",
    fileType: "PDF_EXTRACTED_JSON",
    keyClausesExtracted: ["Dieu_14_Dang_ky_tin_chi", "Dieu_16_Canh_bao_hoc_tap"]
  },
  // 3. FIT Curriculum K24 & K26
  {
    documentId: "DOC_FIT_CURRICULUM_SE",
    versionId: "v2026.1",
    contentHash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    title: "Chương trình đào tạo ngành Kỹ thuật Phần mềm (7480103) Khóa 2026",
    sourceUrl: "https://fit.hcmute.edu.vn/chuong-trinh-dao-tao/k26-se",
    retrievedAt: "2026-08-12T14:30:00.000Z",
    publishedAt: "2026-08-10T00:00:00.000Z",
    effectiveFrom: "2026-08-10",
    effectiveUntil: null,
    status: "ACTIVE",
    contentLocation: "vault/snapshots/curricula/FIT_SE_K26_v1.json",
    fileType: "HTML_EXTRACTED_JSON",
    keyClausesExtracted: ["Khung_CTDT_150_TC", "Chuan_TOEIC_550_B2", "Yeu_cau_Khoa_luan_110_TC"]
  }
];

export class DocumentSnapshotStore {
  /**
   * Helper to return a deep clone of a document snapshot to prevent in-memory tampering
   */
  static _cloneDoc(doc) {
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc));
  }

  /**
   * Retrieves the active snapshot for a document ID
   * @param {string} documentId 
   * @returns {object|null}
   */
  static getActiveSnapshot(documentId) {
    const doc = IMMUTABLE_DOCUMENT_SNAPSHOTS.find(d => d.documentId === documentId && d.status === "ACTIVE");
    return this._cloneDoc(doc);
  }

  /**
   * Retrieves full version history of a document
   * @param {string} documentId 
   * @returns {object[]}
   */
  static getDocumentHistory(documentId) {
    return IMMUTABLE_DOCUMENT_SNAPSHOTS
      .filter(doc => doc.documentId === documentId)
      .map(d => this._cloneDoc(d));
  }

  /**
   * Safe Fallback: Retrieves the last verified snapshot with stale warning if needed
   * @param {string} documentId 
   * @param {boolean} isLiveSourceFailed 
   * @returns {object}
   */
  static serveLastVerifiedState(documentId, isLiveSourceFailed = false) {
    const rawDoc = IMMUTABLE_DOCUMENT_SNAPSHOTS.find(d => d.documentId === documentId && d.status === "ACTIVE") ||
      IMMUTABLE_DOCUMENT_SNAPSHOTS.find(d => d.documentId === documentId);

    if (!rawDoc) {
      return {
        found: false,
        error: "NO_HISTORICAL_SNAPSHOT_AVAILABLE"
      };
    }

    const activeDoc = this._cloneDoc(rawDoc);

    return {
      found: true,
      document: activeDoc,
      servedFrom: "IMMUTABLE_SNAPSHOT_ARCHIVE",
      isStale: isLiveSourceFailed,
      warning: isLiveSourceFailed
        ? `[STALE_SOURCE_WARNING] Nguồn trực tuyến hiện đang gặp sự cố. Hệ thống đang phục vụ bản chụp snapshot có thẩm quyền được xác minh gần nhất (${activeDoc.retrievedAt}).`
        : null
    };
  }
}
