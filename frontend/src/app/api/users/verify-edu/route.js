import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";

// Comprehensive Vietnamese & Global Higher-Education Domain Mapping
const KNOWN_EDU_DOMAINS = [
  { domain: "hust.edu.vn", name: "Đại học Bách Khoa Hà Nội (HUST)" },
  { domain: "sis.hust.edu.vn", name: "Đại học Bách Khoa Hà Nội (HUST)" },
  { domain: "vnu.edu.vn", name: "Đại học Quốc gia Hà Nội (VNU)" },
  { domain: "vnuhcm.edu.vn", name: "Đại học Quốc gia TP.HCM (VNU-HCM)" },
  { domain: "hcmut.edu.vn", name: "Đại học Bách Khoa TP.HCM (HCMUT)" },
  { domain: "uit.edu.vn", name: "Đại học Công nghệ Thông tin (UIT)" },
  { domain: "hcmus.edu.vn", name: "Đại học Khoa học Tự nhiên TP.HCM (HCMUS)" },
  { domain: "hus.edu.vn", name: "Đại học Khoa học Tự nhiên Hà Nội (HUS)" },
  { domain: "neu.edu.vn", name: "Đại học Kinh tế Quốc dân (NEU)" },
  { domain: "ftu.edu.vn", name: "Đại học Ngoại Thương (FTU)" },
  { domain: "ptit.edu.vn", name: "Học viện Công nghệ Bưu chính Viễn thông (PTIT)" },
  { domain: "fpt.edu.vn", name: "Đại học FPT (FPT University)" },
  { domain: "rmit.edu.vn", name: "Đại học RMIT Việt Nam" },
  { domain: "hcmute.edu.vn", name: "Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)" },
  { domain: "tdtu.edu.vn", name: "Đại học Tôn Đức Thắng (TDTU)" },
  { domain: "ctu.edu.vn", name: "Đại học Cần Thơ (CTU)" },
  { domain: "udn.vn", name: "Đại học Đà Nẵng (UD)" },
  { domain: "ueh.edu.vn", name: "Đại học Kinh tế TP.HCM (UEH)" },
  { domain: "dut.udn.vn", name: "Trường ĐH Bách Khoa - ĐH Đà Nẵng (DUT)" },
  { domain: "pku.edu.cn", name: "Peking University" },
  { domain: "stanford.edu", name: "Stanford University" },
  { domain: "mit.edu", name: "Massachusetts Institute of Technology" },
];

/**
 * POST /api/users/verify-edu
 * Confirms an already mailbox-verified institutional identity.
 * Domain syntax never grants reputation or expert authority by itself.
 */
export const POST = SecurityFabric.wrapHandler(
  {
    action: "VERIFY_INSTITUTIONAL_EMAIL",
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: "Request body must be valid JSON.", correlationId: secContext.correlationId } },
        { status: 400 }
      );
    }

    const principalEmail = String(principal.email || "").trim().toLowerCase();
    const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : principalEmail;

    if (!principalEmail) {
      throw SecurityError.forbidden(
        "Authenticated identity does not contain an email claim.",
        secContext.correlationId
      );
    }

    if (requestedEmail !== principalEmail) {
      throw SecurityError.forbidden(
        "You can only verify the email bound to your authenticated identity.",
        secContext.correlationId,
        "OBJECT_NOT_OWNED"
      );
    }

    const domainMatch = principalEmail.split("@")[1] || "";

    const isEduDomain = /(\.edu$|\.edu\.\w+$|\.ac\.\w+$|\.edu\.vn$|\.ac\.vn$)/i.test(domainMatch);

    if (!isEduDomain) {
      return Response.json({
        success: false,
        isEdu: false,
        verificationStatus: "NOT_INSTITUTIONAL_DOMAIN",
        error: "Email không thuộc danh mục tên miền giáo dục được hỗ trợ."
      }, { status: 422 });
    }

    if (principal.attributes?.emailVerified !== true) {
      return Response.json({
        success: false,
        isEdu: false,
        verificationStatus: "MAILBOX_VERIFICATION_REQUIRED",
        error: "Hãy xác thực quyền sở hữu hộp thư với nhà cung cấp danh tính trước."
      }, { status: 409 });
    }

    const foundSchool = KNOWN_EDU_DOMAINS.find((item) => domainMatch === item.domain || domainMatch.endsWith(`.${item.domain}`));
    const universityName = foundSchool ? foundSchool.name : `Cơ sở giáo dục (${domainMatch})`;

    return Response.json({
      success: true,
      isEdu: true,
      university: universityName,
      verificationStatus: "VERIFIED_INSTITUTION_EMAIL",
      verifiedBy: "IDENTITY_PROVIDER_EMAIL_PROOF",
      message: "Email tổ chức đã được đối chiếu với danh tính đăng nhập. Trạng thái này không tự cấp vai trò chuyên gia hoặc điểm uy tín."
    });
  }
);
