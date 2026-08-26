/**
 * StudentHub AI — Academic Command Center View Model Adapter
 * 
 * Enforces Zero Business Logic Mutation in UI:
 * - Pure formatting of timestamps, relative time, badges, and icon keys.
 * - Never modifies impact levels, provenance, eligibility, or rules.
 */

export const IMPACT_BADGE_MAP = {
  CRITICAL: {
    label: "Khẩn cấp",
    colorClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
    icon: "AlertOctagon"
  },
  HIGH: {
    label: "Cần xử lý",
    colorClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
    icon: "AlertTriangle"
  },
  MEDIUM: {
    label: "Cần chú ý",
    colorClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-500",
    icon: "Info"
  },
  LOW: {
    label: "Theo dõi",
    colorClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
    icon: "CheckCircle2"
  },
  NONE: {
    label: "Không ảnh hưởng",
    colorClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    dotClass: "bg-slate-500",
    icon: "Minus"
  }
};

export const CATEGORY_LABEL_MAP = {
  DEADLINE_CHANGE: "Thay Đổi Thời Hạn",
  DATE_CHANGE: "Lịch Trình Học Vụ",
  FEE_CHANGE: "Biểu Mức Học Phí",
  REQUIREMENT_CHANGE: "Yêu Cầu Chuẩn Đầu Ra",
  ELIGIBILITY_CHANGE: "Điều Kiện Xét Điểm",
  PROCEDURE_CHANGE: "Quy Trình Thủ Tục",
  POLICY_CHANGE: "Quy Chế Đào Tạo",
  GENERAL_TEXT_CHANGE: "Cập Nhật Văn Bản",
  DEADLINE_ALERT: "Hạn Chót Học Vụ",
  FEE_REMINDER: "Học Phí Học Kỳ",
  GENERAL_ANNOUNCEMENT: "Thông Báo Chung"
};

export class AcademicCommandCenterViewModel {
  /**
   * Formats ISO timestamp or date string to Vietnamese DD/MM/YYYY format
   * @param {string} dateStr 
   * @returns {string}
   */
  static formatDate(dateStr) {
    if (!dateStr) return "N/A";
    try {
      if (dateStr.includes("/")) return dateStr;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Formats a human-readable relative deadline countdown
   * @param {string} deadlineIso 
   * @returns {string}
   */
  static formatRelativeDeadline(deadlineIso) {
    if (!deadlineIso) return "";
    try {
      const parts = deadlineIso.split(/[-/]/);
      let targetDate;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          targetDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T23:59:59`);
        } else {
          targetDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
        }
      } else {
        targetDate = new Date(deadlineIso);
      }

      if (isNaN(targetDate.getTime())) return "";

      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "Đã hết hạn";
      if (diffDays === 0) return "Hết hạn hôm nay";
      if (diffDays === 1) return "Còn 1 ngày";
      return `Còn ${diffDays} ngày`;
    } catch {
      return "";
    }
  }

  /**
   * Maps impact level to badge styling tokens
   * @param {string} impactLevel 
   * @returns {object}
   */
  static getImpactBadge(impactLevel) {
    return IMPACT_BADGE_MAP[impactLevel] || IMPACT_BADGE_MAP.MEDIUM;
  }

  /**
   * Maps category key to Vietnamese label
   * @param {string} category 
   * @returns {string}
   */
  static getCategoryLabel(category) {
    return CATEGORY_LABEL_MAP[category] || category || "Học Vụ";
  }
}
