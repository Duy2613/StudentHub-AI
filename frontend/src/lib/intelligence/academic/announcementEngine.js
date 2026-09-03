/**
 * StudentHub AI — Announcement Engine & Document Version Change Diff
 * 
 * Enforces Constitution Articles 7 & 8:
 * Parses university announcements, extracts metadata, deadlines, and requirements,
 * and performs exact version diffing (ADDED, REMOVED, MODIFIED, UNCHANGED)
 * so students explicitly see critical deadline shifts and policy changes.
 */

export class AnnouncementEngine {
  /**
   * Compares two versions of an announcement or university policy document
   * @param {object} v1 - Previous version object
   * @param {object} v2 - Updated version object
   * @returns {object} Structured Version Diff
   */
  static computeAnnouncementDiff(v1, v2) {
    if (!v1 || !v2) {
      return {
        has_changed: true,
        diff_status: "INITIAL_VERSION",
        changes: []
      };
    }

    const changes = [];

    // 1. Deadline Change Detection
    if (v1.deadline !== v2.deadline) {
      changes.push({
        field: "deadline",
        type: "MODIFIED",
        oldValue: v1.deadline || "Chưa có",
        newValue: v2.deadline || "Chưa có",
        description: `Hạn chót thay đổi từ [${v1.deadline}] sang [${v2.deadline}]`,
        severity: "HIGH"
      });
    }

    // 2. Title / Topic Change
    if (v1.title !== v2.title) {
      changes.push({
        field: "title",
        type: "MODIFIED",
        oldValue: v1.title,
        newValue: v2.title,
        description: "Tiêu đề thông báo đã được cập nhật nội dung mới.",
        severity: "INFO"
      });
    }

    // 3. Location / Room Change
    if (v1.location !== v2.location) {
      changes.push({
        field: "location",
        type: "MODIFIED",
        oldValue: v1.location || "Chưa xác định",
        newValue: v2.location || "Chưa xác định",
        description: `Địa điểm / Phòng học thay đổi: [${v1.location}] ➔ [${v2.location}]`,
        severity: "HIGH"
      });
    }

    // 4. Required Forms / Attachments (Array Diff)
    const oldForms = v1.requiredForms || [];
    const newForms = v2.requiredForms || [];

    const addedForms = newForms.filter(f => !oldForms.includes(f));
    const removedForms = oldForms.filter(f => !newForms.includes(f));

    for (const f of addedForms) {
      changes.push({
        field: "requiredForms",
        type: "ADDED",
        value: f,
        description: `Bổ sung mẫu biểu / biểu mẫu bắt buộc: [${f}]`,
        severity: "MEDIUM"
      });
    }

    for (const f of removedForms) {
      changes.push({
        field: "requiredForms",
        type: "REMOVED",
        value: f,
        description: `Hủy bỏ yêu cầu biểu mẫu: [${f}]`,
        severity: "INFO"
      });
    }

    // 5. Tuition / Fee Changes
    if (v1.feeAmount !== v2.feeAmount) {
      changes.push({
        field: "feeAmount",
        type: "MODIFIED",
        oldValue: v1.feeAmount,
        newValue: v2.feeAmount,
        description: `Mức phí điều chỉnh: ${v1.feeAmount || 0}đ ➔ ${v2.feeAmount || 0}đ`,
        severity: "HIGH"
      });
    }

    const hasChanged = changes.length > 0;

    return {
      documentId: v2.documentId || v1.documentId || "ANNOUNCEMENT_DOC",
      oldVersion: v1.version || "1.0",
      newVersion: v2.version || "2.0",
      has_changed: hasChanged,
      diff_status: hasChanged ? "MODIFIED" : "UNCHANGED",
      total_changes_count: changes.length,
      critical_changes_count: changes.filter(c => c.severity === "HIGH").length,
      changes,
      summary: hasChanged
        ? `Phát hiện ${changes.length} thay đổi giữa phiên bản v${v1.version || "1"} và v${v2.version || "2"}.`
        : "Nội dung thông báo giữ nguyên, không có sự thay đổi."
    };
  }
}
