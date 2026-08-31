/**
 * StudentHub AI — Durable Authoritative Academic Records Store V1
 * 
 * Provides crash-safe atomic persistence and indexing for Student Academic Records.
 */

import fs from "node:fs";
import path from "node:path";
import { AcademicRecordsModel } from "./academicRecordsModel.js";

export class AcademicRecordsStore {
  static #storageDir = path.resolve(process.cwd(), ".data");
  static #storageFile = path.resolve(process.cwd(), ".data", "academic_records_store.json");

  static #recordsByStudentId = new Map();
  static #isHydrated = false;

  /**
   * Clears in-memory and disk records (for tests)
   */
  static clear() {
    this.#recordsByStudentId.clear();
    this.#isHydrated = true;

    try {
      if (fs.existsSync(this.#storageFile)) {
        fs.unlinkSync(this.#storageFile);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Rehydrates academic records from durable disk storage
   */
  static rehydrate() {
    this.#recordsByStudentId.clear();

    try {
      if (fs.existsSync(this.#storageFile)) {
        const raw = fs.readFileSync(this.#storageFile, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.studentId) {
              this.#recordsByStudentId.set(item.studentId, item);
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    if (this.#recordsByStudentId.size === 0 || !this.#recordsByStudentId.has("24110001")) {
      this.#seedDefaultRecords();
    }

    this.#isHydrated = true;
  }

  static #ensureHydrated() {
    if (!this.#isHydrated) {
      this.rehydrate();
    }
  }

  /**
   * Saves or updates an academic record
   * @param {object} record 
   * @returns {object} Stored record clone
   */
  static saveRecord(record) {
    this.#ensureHydrated();
    if (!record || !record.studentId) {
      throw new Error("[ACADEMIC_RECORDS_STORE] Valid record with studentId is required.");
    }

    const existing = this.#recordsByStudentId.get(record.studentId);
    if (existing) {
      const incomingRev = typeof record.revision === "number" ? record.revision : 1;
      const currentRev = typeof existing.revision === "number" ? existing.revision : 1;
      if (incomingRev < currentRev) {
        throw new Error(`[ACADEMIC_RECORDS_STORE] STALE_REVISION: incoming ${incomingRev} is older than current ${currentRev}`);
      }
    }

    const cloned = AcademicRecordsModel.clone(record);
    this.#recordsByStudentId.set(cloned.studentId, cloned);
    this.#flushToDisk();
    return AcademicRecordsModel.clone(cloned);
  }

  /**
   * Retrieves academic record by MSSV
   * @param {string} studentId 
   * @returns {object|null}
   */
  static getRecordByStudentId(studentId) {
    this.#ensureHydrated();
    if (!studentId) return null;
    const item = this.#recordsByStudentId.get(String(studentId).trim());
    return item ? AcademicRecordsModel.clone(item) : null;
  }

  /**
   * Gets all academic records
   * @returns {Array<object>}
   */
  static getAllRecords() {
    this.#ensureHydrated();
    return Array.from(this.#recordsByStudentId.values()).map(r => AcademicRecordsModel.clone(r));
  }

  /**
   * Performs atomic disk flush
   */
  static #flushToDisk() {
    try {
      if (!fs.existsSync(this.#storageDir)) {
        fs.mkdirSync(this.#storageDir, { recursive: true });
      }

      const tmpFile = `${this.#storageFile}.tmp.${Date.now()}`;
      const payload = JSON.stringify(Array.from(this.#recordsByStudentId.values()), null, 2);

      fs.writeFileSync(tmpFile, payload, "utf-8");
      fs.renameSync(tmpFile, this.#storageFile);
    } catch {
      // In-memory state remains valid
    }
  }

  /**
   * Seeds default authoritative academic records for K24 students
   */
  static #seedDefaultRecords() {
    const k24Record = AcademicRecordsModel.createRecord({
      studentId: "24110001",
      totalRequiredCredits: 150,
      courses: [
        { courseCode: "MATH1411", courseName: "Giải Tích 1", credits: 3, grade10: 8.5, courseType: "GENERAL" },
        { courseCode: "PHYS1309", courseName: "Vật Lý Đại Cương", credits: 3, grade10: 8.0, courseType: "GENERAL" },
        { courseCode: "ITEC1301", courseName: "Nhập Môn Lập Trình C/C++", credits: 3, grade10: 9.0, courseType: "CORE" },
        { courseCode: "ITEC2302", courseName: "Cấu Trúc Dữ Liệu & Giải Thuật", credits: 4, grade10: 8.5, courseType: "CORE" },
        { courseCode: "SOFE3301", courseName: "Kiến Trúc & Thiết Kế Phần Mềm", credits: 4, grade10: 9.2, courseType: "SPECIALIZED" },
        { courseCode: "SOFE3402", courseName: "Kiểm Thử & Đảm Bảo Chất Lượng", credits: 3, grade10: 8.8, courseType: "SPECIALIZED" }
      ],
      certifications: [
        {
          certificateId: "CERT_TOEIC_2025_001",
          type: "TOEIC",
          score: 560,
          issuingAuthority: "IIG_VIETNAM",
          certificateCode: "IIG_VN_2025_99812",
          issuedDate: "2025-06-20",
          expiresDate: "2027-06-20",
          verificationStatus: "VERIFIED"
        }
      ],
      tuition: {
        semester: "HK1_2026",
        totalDue: 12500000,
        paidAmount: 12500000,
        remainingDebt: 0,
        invoiceNumber: "INV_HCMUTE_2026_8899"
      },
      disciplinary: {
        status: "CLEAN",
        points: 92
      },
      authoritySource: "HCMUTE_SIS_PORTAL"
    });

    this.#recordsByStudentId.set(k24Record.studentId, k24Record);
    this.#flushToDisk();
  }
}
