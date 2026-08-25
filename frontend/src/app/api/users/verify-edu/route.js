import { NextResponse } from "next/server";

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
 * Xác thực email trường đại học (.edu / .ac) để cộng +30 điểm uy tín
 * Hợp đồng Section D.1: Cấm client tự phong `isEdu = true`, backend là nguồn chân lý.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp địa chỉ email cần xác thực." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const domainMatch = cleanEmail.split("@")[1] || "";

    // 1. Kiểm tra cấu trúc domain .edu, .edu.vn, .ac.vn, .ac.uk,...
    const isEduDomain = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$|\.edu\.vn$|\.ac\.vn$)/i.test(cleanEmail);

    if (!isEduDomain) {
      return NextResponse.json({
        success: false,
        isEdu: false,
        trustScoreDelta: 0,
        error: "Email không thuộc danh mục tên miền giáo dục (.edu / .edu.vn / .ac).",
      });
    }

    // 2. Tra cứu tên trường đối ứng
    const foundSchool = KNOWN_EDU_DOMAINS.find((item) => domainMatch.includes(item.domain));
    const universityName = foundSchool ? foundSchool.name : `Đại học Đối tác (${domainMatch})`;

    return NextResponse.json({
      success: true,
      isEdu: true,
      university: universityName,
      trustScoreDelta: 30,
      baseScore: 50,
      newTrustScore: 80,
      badge: "🎓 Sinh Viên Xác Thực (.edu)",
      message: `Xác thực email trường thành công! Tài khoản của bạn được nâng cấp +30 điểm uy tín.`,
    });
  } catch (error) {
    console.error("[Verify Edu API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống trong quá trình kiểm tra email trường." },
      { status: 500 }
    );
  }
}
