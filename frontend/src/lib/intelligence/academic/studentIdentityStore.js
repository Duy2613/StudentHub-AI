/**
 * StudentHub AI — Durable Authoritative Student Identity Store V1
 * 
 * Provides crash-safe atomic persistence and multi-index lookup for Student Identities.
 * Indices:
 * - studentId (MSSV: "24110001")
 * - authUserId (Supabase UUID)
 * - institutionalEmail ("24110001@student.hcmute.edu.vn")
 */

import fs from "node:fs";
import path from "node:path";
import { StudentIdentityModel, ACADEMIC_STATUSES, EDUCATION_LEVELS } from "./studentIdentityModel.js";

export class StudentIdentityStore {
  static #storageDir = path.resolve(process.cwd(), ".data");
  static #storageFile = path.resolve(process.cwd(), ".data", "student_identity_store.json");

  static #identitiesByStudentId = new Map();
  static #identitiesByAuthUserId = new Map();
  static #identitiesByEmail = new Map();
  static #isHydrated = false;

  /**
   * Clears all in-memory and disk records (for tests)
   */
  static clear() {
    this.#identitiesByStudentId.clear();
    this.#identitiesByAuthUserId.clear();
    this.#identitiesByEmail.clear();
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
   * Rehydrates identity state from durable disk file
   */
  static rehydrate() {
    this.#identitiesByStudentId.clear();
    this.#identitiesByAuthUserId.clear();
    this.#identitiesByEmail.clear();

    try {
      if (fs.existsSync(this.#storageFile)) {
        const raw = fs.readFileSync(this.#storageFile, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            this.#indexIdentity(item);
          }
        }
      }
    } catch {
      // In case of parse error, initialize cleanly
    }

    // If empty, populate canonical seed identity
    if (this.#identitiesByStudentId.size === 0) {
      this.#seedDefaultIdentities();
    }

    this.#isHydrated = true;
  }

  static #ensureHydrated() {
    if (!this.#isHydrated) {
      this.rehydrate();
    }
  }

  static #indexIdentity(identity) {
    if (!identity || !identity.studentId) return;
    this.#identitiesByStudentId.set(identity.studentId, identity);

    if (identity.authUserId) {
      this.#identitiesByAuthUserId.set(identity.authUserId, identity);
    }
    if (identity.institutionalEmail) {
      this.#identitiesByEmail.set(identity.institutionalEmail.toLowerCase(), identity);
    }
  }

  /**
   * Saves or updates a student identity with atomic file journaling
   * @param {object} identity 
   * @returns {object} Stored identity clone
   */
  static saveIdentity(identity) {
    this.#ensureHydrated();
    if (!identity || !identity.studentId) {
      throw new Error("[IDENTITY_STORE_ERROR] Valid identity with studentId is required.");
    }

    const existing = this.#identitiesByStudentId.get(identity.studentId);
    if (existing) {
      const incomingRev = typeof identity.revision === "number" ? identity.revision : 1;
      const currentRev = typeof existing.revision === "number" ? existing.revision : 1;
      if (incomingRev < currentRev) {
        throw new Error(`[IDENTITY_STORE_ERROR] STALE_REVISION: incoming ${incomingRev} is older than current ${currentRev}`);
      }
    }

    const cloned = StudentIdentityModel.clone(identity);
    this.#indexIdentity(cloned);
    this.#flushToDisk();
    return StudentIdentityModel.clone(cloned);
  }

  /**
   * Retrieves student identity by MSSV
   * @param {string} studentId 
   * @returns {object|null}
   */
  static getIdentityByStudentId(studentId) {
    this.#ensureHydrated();
    if (!studentId) return null;
    const item = this.#identitiesByStudentId.get(String(studentId).trim());
    return item ? StudentIdentityModel.clone(item) : null;
  }

  /**
   * Retrieves student identity by Supabase Auth User ID
   * @param {string} authUserId 
   * @returns {object|null}
   */
  static getIdentityByAuthUserId(authUserId) {
    this.#ensureHydrated();
    if (!authUserId) return null;
    const item = this.#identitiesByAuthUserId.get(String(authUserId).trim());
    return item ? StudentIdentityModel.clone(item) : null;
  }

  /**
   * Retrieves student identity by institutional email
   * @param {string} email 
   * @returns {object|null}
   */
  static getIdentityByEmail(email) {
    this.#ensureHydrated();
    if (!email) return null;
    const item = this.#identitiesByEmail.get(String(email).trim().toLowerCase());
    return item ? StudentIdentityModel.clone(item) : null;
  }

  /**
   * Gets all stored identities
   * @returns {Array<object>}
   */
  static getAllIdentities() {
    this.#ensureHydrated();
    return Array.from(this.#identitiesByStudentId.values()).map(id => StudentIdentityModel.clone(id));
  }

  /**
   * Performs atomic file flush via .tmp -> renameSync
   */
  static #flushToDisk() {
    try {
      if (!fs.existsSync(this.#storageDir)) {
        fs.mkdirSync(this.#storageDir, { recursive: true });
      }

      const tmpFile = `${this.#storageFile}.tmp.${Date.now()}`;
      const payload = JSON.stringify(Array.from(this.#identitiesByStudentId.values()), null, 2);

      fs.writeFileSync(tmpFile, payload, "utf-8");
      fs.renameSync(tmpFile, this.#storageFile);
    } catch {
      // In-memory state remains valid
    }
  }

  /**
   * Seeds default authoritative identities for K24 students
   */
  static #seedDefaultIdentities() {
    const k24Student = StudentIdentityModel.createIdentity({
      studentId: "24110001",
      authUserId: "user_supabase_demo_24110001",
      fullName: "Nguyễn Văn Duy",
      institutionalEmail: "24110001@student.hcmute.edu.vn",
      personalEmail: "duy.dev@gmail.com",
      phoneNumber: "0901234567",
      nationalId: "079204001234",
      gender: "MALE",
      birthDate: "2006-03-15",
      cohort: 2024,
      classCode: "24110CLA",
      faculty: "Khoa Công Nghệ Thông Tin",
      programCode: "7480103",
      programName: "Kỹ thuật Phần mềm",
      curriculumVersion: "CTĐT-2024",
      educationLevel: EDUCATION_LEVELS.ENGINEER,
      academicStatus: ACADEMIC_STATUSES.ACTIVE,
      academicAdvisor: {
        name: "TS. Lê Hoàng Anh",
        email: "lhanh@hcmute.edu.vn",
        department: "Bộ môn Kỹ thuật Phần mềm"
      },
      authoritySource: "HCMUTE_DAOTAO_PORTAL"
    });

    this.#indexIdentity(k24Student);
    this.#flushToDisk();
  }
}
