/**
 * StudentHub AI — EntityResolutionEngine V1
 * 
 * Canonical entity resolver for Vietnamese and English academic mentions.
 * Resolves course codes, professors, faculties, regulations, and topics
 * while preserving original text verbatim in the provenance record.
 */

export const ENTITY_TYPE = Object.freeze({
  COURSE: "COURSE",
  EXPERT: "EXPERT",
  FACULTY: "FACULTY",
  REGULATION: "REGULATION",
  TOPIC: "TOPIC",
  SYSTEM: "SYSTEM"
});

export class EntityResolutionEngine {
  // Knowledge dictionary of canonical entities and their aliases
  static #knowledgeDictionary = [
    // 1. Courses
    {
      entityId: "COURSE:MATH1401",
      type: ENTITY_TYPE.COURSE,
      canonicalName: "Giải tích 1",
      aliases: ["giải tích 1", "giai tich 1", "calculus 1", "math1401", "math140101", "toán cao cấp 1"]
    },
    {
      entityId: "COURSE:PRTE2303",
      type: ENTITY_TYPE.COURSE,
      canonicalName: "Kỹ thuật Lập trình",
      aliases: ["kỹ thuật lập trình", "ky thuat lap trinh", "programming techniques", "prte2303", "ktlt"]
    },
    {
      entityId: "COURSE:INPR1302",
      type: ENTITY_TYPE.COURSE,
      canonicalName: "Nhập môn Lập trình",
      aliases: ["nhập môn lập trình", "nhap mon lap trinh", "intro to programming", "inpr1302", "nmlt"]
    },
    {
      entityId: "COURSE:SOEN3305",
      type: ENTITY_TYPE.COURSE,
      canonicalName: "Kiến trúc & Thiết kế Phần mềm",
      aliases: ["kiến trúc phần mềm", "kien truc phan mem", "software architecture", "soen3305", "ktpm"]
    },

    // 2. Experts / Faculty Members
    {
      entityId: "EXPERT:prof_triet",
      type: ENTITY_TYPE.EXPERT,
      canonicalName: "TS. Nguyễn Thành Triết",
      aliases: ["thầy triết", "thay triet", "ts. nguyễn thành triết", "nguyen thanh triet", "dr. triet"]
    },
    {
      entityId: "EXPERT:prof_khoa",
      type: ENTITY_TYPE.EXPERT,
      canonicalName: "PGS.TS. Đỗ Văn Khoa",
      aliases: ["thầy khoa", "thay khoa", "pgs.ts. đỗ văn khoa", "do van khoa"]
    },

    // 3. Faculties
    {
      entityId: "FACULTY:fit_hcmute",
      type: ENTITY_TYPE.FACULTY,
      canonicalName: "Khoa Công Nghệ Thông Tin",
      aliases: ["khoa cntt", "khoa cong nghe thong tin", "fit", "fit-hcmute", "faculty of it"]
    },

    // 4. Regulations & Academic Processes
    {
      entityId: "REGULATION:course_registration",
      type: ENTITY_TYPE.REGULATION,
      canonicalName: "Quy chế Đăng ký Học phần",
      aliases: ["đkhp", "dkhp", "đăng ký học phần", "dang ky hoc phan", "course registration", "hủy môn", "rút môn"]
    },
    {
      entityId: "REGULATION:english_exit_standard",
      type: ENTITY_TYPE.REGULATION,
      canonicalName: "Chuẩn đầu ra Ngoại ngữ (TOEIC/IELTS)",
      aliases: ["chuẩn anh văn", "chuan anh van", "toeic", "ielts", "chuẩn ngoại ngữ", "miễn anh văn"]
    },

    // 5. Topics
    {
      entityId: "TOPIC:academic.ai",
      type: ENTITY_TYPE.TOPIC,
      canonicalName: "Trí Tuệ Nhân Tạo & Học Máy",
      aliases: ["ai", "trí tuệ nhân tạo", "tri tue nhan tao", "machine learning", "deep learning", "học máy"]
    },
    {
      entityId: "TOPIC:academic.registration",
      type: ENTITY_TYPE.TOPIC,
      canonicalName: "Thời khóa biểu & Đăng ký môn",
      aliases: ["thời khóa biểu", "thoi khoa bieu", "lịch học", "lich hoc", "xếp lịch", "trùng lịch"]
    },

    // 6. University Systems
    {
      entityId: "SYSTEM:online_portal",
      type: ENTITY_TYPE.SYSTEM,
      canonicalName: "Cổng Thông Tin Đào Tạo (online.hcmute.edu.vn)",
      aliases: ["cổng đào tạo", "cong dao tao", "online.hcmute.edu.vn", "web đk môn", "server trường"]
    }
  ];

  /**
   * Resolves text mentions into linked entities
   * @param {string} text - Raw content text
   * @returns {Array<{ entityId: string, type: string, canonicalName: string, matchedMention: string }>}
   */
  static resolveEntities(text = "") {
    if (!text || typeof text !== "string") return [];

    const lowerText = text.toLowerCase();
    const resolved = [];
    const seenIds = new Set();

    for (const entry of this.#knowledgeDictionary) {
      for (const alias of entry.aliases) {
        // Match word boundaries or substring
        const regex = new RegExp(`(^|[^a-zA-Z0-9_À-ỹ])${alias}([^a-zA-Z0-9_À-ỹ]|$)`, "i");
        if (regex.test(lowerText) && !seenIds.has(entry.entityId)) {
          seenIds.add(entry.entityId);
          resolved.push({
            entityId: entry.entityId,
            type: entry.type,
            canonicalName: entry.canonicalName,
            matchedMention: alias
          });
          break; // Stop checking other aliases for this entity
        }
      }
    }

    return resolved;
  }
}
