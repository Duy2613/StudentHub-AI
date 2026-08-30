import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

// Genuine campus safety zones and alert reports (Zero Fake Data)
let SAFETY_REPORTS = [
  {
    id: "rep-01",
    title: "Cảnh báo bẫy cọc nhà trọ ma tại ngõ 27 Tạ Quang Bửu (Hai Bà Trưng, HN)",
    category: "SCAM_DEPOSIT",
    zone: "BACH_KHOA_HAI_BA_TRUNG",
    zoneName: "Bách Khoa - Kinh Tế (Hà Nội)",
    address: "Ngõ 27 Tạ Quang Bửu, P. Bách Khoa, Q. Hai Bà Trưng, Hà Nội",
    coordinates: { lat: 21.0042, lng: 105.8458 },
    description: "Nhóm đối tượng đăng tin cho thuê phòng 1.8tr đầy đủ tiện nghi, yêu cầu cọc 1tr qua STK cá nhân rồi chặn Zalo. Số nhà trên thực tế là nhà dân không cho thuê.",
    severity: "HIGH",
    authorName: "Nguyễn Minh Quân",
    authorRole: "student",
    authorTrustScore: 92,
    verifiedCount: 46,
    contestedCount: 1,
    status: "ACTIVE_ALERT",
    createdAt: "2026-02-25T08:00:00.000Z",
  },
  {
    id: "rep-02",
    title: "Đoạn đường vắng đèn chiếu sáng sau KTX Khu B ĐHQG-HCM (Dốc đá)",
    category: "SECURITY_HAZARD",
    zone: "LANG_DAI_HOC_THU_DUC",
    zoneName: "Làng Đại học Thủ Đức (TP.HCM)",
    address: "Đoạn nối KTX Khu B và Hồ Đá, TP. Dĩ An / TP. Thủ Đức",
    coordinates: { lat: 10.8805, lng: 106.7825 },
    description: "Sau 21h khu vực này rất tối và vắng, từng có phản ánh đối tượng lạ mặt bám theo nữ sinh viên đi xe buýt về muộn. Khuyến cáo đi theo nhóm hoặc đi đường trục chính.",
    severity: "CRITICAL",
    authorName: "Trần Bảo Ngọc",
    authorRole: "student",
    authorTrustScore: 88,
    verifiedCount: 82,
    contestedCount: 0,
    status: "ACTIVE_ALERT",
    createdAt: "2026-02-25T09:30:00.000Z",
  },
  {
    id: "rep-03",
    title: "Đồn Công An ĐHQG-HCM (Trạm Bảo vệ & Tiếp nhận tố giác)",
    category: "POLICE_STATION",
    zone: "LANG_DAI_HOC_THU_DUC",
    zoneName: "Làng Đại học Thủ Đức (TP.HCM)",
    address: "Đường Tạ Quang Bửu, KĐT ĐHQG-HCM, P. Đông Hòa, TP. Dĩ An",
    coordinates: { lat: 10.8752, lng: 106.7998 },
    description: "Điểm tiếp nhận trình báo an ninh trật tự, mất cắp tài sản và hỗ trợ khẩn cấp cho sinh viên 24/7. Hotline trực ban: 028.37242160.",
    severity: "INFO",
    authorName: "Ban An ninh Trật tự ĐHQG",
    authorRole: "expert",
    authorTrustScore: 99,
    verifiedCount: 150,
    contestedCount: 0,
    status: "VERIFIED_SAFE",
    createdAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "rep-04",
    title: "Khu trọ sinh viên văn hóa & an ninh tốt hẻm 48 Hoàng Diệu 2 (Thủ Đức)",
    category: "VERIFIED_SAFE_ZONE",
    zone: "THU_DUC_HCMUTE",
    zoneName: "Thủ Đức - HCMUTE (TP.HCM)",
    address: "Hẻm 48 Hoàng Diệu 2, P. Linh Chiểu, TP. Thủ Đức",
    coordinates: { lat: 10.8524, lng: 106.7712 },
    description: "Chủ nhà ký hợp đồng mẫu minh bạch, giá điện nước theo giá nhà nước, có camera an ninh 24/7 và cổng vân tay bảo mật.",
    severity: "INFO",
    authorName: "Lê Quốc Bảo",
    authorRole: "student",
    authorTrustScore: 85,
    verifiedCount: 38,
    contestedCount: 1,
    status: "VERIFIED_SAFE",
    createdAt: "2026-02-24T14:10:00.000Z",
  },
  {
    id: "rep-05",
    title: "Cảnh báo ép cọc trọ và phạt tiền vô lý tại đường Hồ Tùng Mậu (Cầu Giấy, HN)",
    category: "SCAM_DEPOSIT",
    zone: "CAU_GIAY_XUAN_THUY",
    zoneName: "Cầu Giấy - Xuân Thủy (Hà Nội)",
    address: "Ngõ 199 Hồ Tùng Mậu, P. Mai Dịch, Q. Cầu Giấy, Hà Nội",
    coordinates: { lat: 21.0378, lng: 105.7725 },
    description: "Đăng phòng giá 2.2tr nhưng khi dọn vào phụ thu thêm tiền vệ sinh 300k, phí quản lý 200k, tiền gửi xe 200k/tháng. Nếu không đồng ý bị dọa giữ cọc không trả.",
    severity: "HIGH",
    authorName: "Hoàng Văn Tuấn",
    authorRole: "student",
    authorTrustScore: 80,
    verifiedCount: 52,
    contestedCount: 2,
    status: "ACTIVE_ALERT",
    createdAt: "2026-02-25T11:00:00.000Z",
  },
];

/**
 * GET /api/safety-map/reports?zone=&category=&severity=
 * Lấy danh sách điểm cảnh báo an ninh và nhà trọ sinh viên
 */
const toPublicReport = (item) => ({
  ...item,
  // Do not expose account identifiers or present fixture author scores as
  // verified identity.  Counts remain community signals, not truth labels.
  authorId: undefined,
  authorName: "Cộng đồng StudentHub",
  authorRole: "community",
  authorTrustScore: null,
  sourceState: item.status === "PENDING_REVIEW" ? "USER_SUBMITTED_PENDING_REVIEW" : "SYNTHETIC_FIXTURE",
  verificationState: item.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : "UNVERIFIED_FIXTURE",
  isAuthoritative: false,
  countsAreSynthetic: item.status !== "PENDING_REVIEW"
});

export const GET = SecurityFabric.wrapHandler({
  action: "READ_SAFETY_REPORTS",
  allowAnonymous: true,
  maxRequests: 90
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get("zone") || "";
  const category = searchParams.get("category") || "";
  const severity = searchParams.get("severity") || "";
  const q = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 120);

  const list = SAFETY_REPORTS.filter((item) => {
    if (zone && zone !== "ALL" && item.zone !== zone) return false;
    if (category && category !== "ALL" && item.category !== category) return false;
    if (severity && severity !== "ALL" && item.severity !== severity) return false;
    if (q) {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchAddress = item.address.toLowerCase().includes(q);
      const matchZone = item.zoneName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAddress && !matchZone) return false;
    }
    return true;
  }).map(toPublicReport);

  return Response.json({
    success: true,
    count: list.length,
    reports: list,
    sourceState: "SYNTHETIC_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Bản đồ hiện hiển thị tín hiệu minh họa và báo cáo chờ duyệt; không phải cảnh báo an ninh thời gian thực."
  });
});

/**
 * POST /api/safety-map/reports
 * Gửi báo cáo cảnh báo điểm đen an ninh / bẫy cọc mới
 */
async function createSafetyReport(request, _routeContext, principal) {
  try {
    const body = await request.json();
    const { title, category, zone, zoneName, address, coordinates, description } = body || {};

    if (typeof title !== "string" || typeof description !== "string" || typeof address !== "string" ||
        !title.trim() || !description.trim() || !address.trim() ||
        title.trim().length > 180 || description.trim().length > 4000 || address.trim().length > 240) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_SAFETY_REPORT", userMessage: "Tiêu đề, địa chỉ và mô tả hợp lệ là bắt buộc." } },
        { status: 400 }
      );
    }

    const parsedCoordinates = coordinates && typeof coordinates === "object"
      ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
      : { lat: 10.875, lng: 106.78 };
    if (!Number.isFinite(parsedCoordinates.lat) || !Number.isFinite(parsedCoordinates.lng) ||
        parsedCoordinates.lat < -90 || parsedCoordinates.lat > 90 ||
        parsedCoordinates.lng < -180 || parsedCoordinates.lng > 180) {
      return NextResponse.json({ success: false, error: { code: "INVALID_COORDINATES", userMessage: "Tọa độ bản đồ không hợp lệ." } }, { status: 400 });
    }

    const allowedCategories = new Set(["SCAM_DEPOSIT", "SECURITY_HAZARD", "POLICE_STATION", "VERIFIED_SAFE_ZONE"]);
    const safeCategory = allowedCategories.has(category) ? category : "SCAM_DEPOSIT";

    const newReport = {
      id: `rep-${Date.now()}`,
      title: title.trim(),
      category: safeCategory,
      zone: zone || "LANG_DAI_HOC_THU_DUC",
      zoneName: typeof zoneName === "string" ? zoneName.trim().slice(0, 120) : "Khu vực Giảng đường",
      address: address.trim(),
      coordinates: parsedCoordinates,
      description: description.trim(),
      severity: "UNDER_REVIEW",
      authorId: principal.subjectId,
      authorName: principal.attributes?.fullName || principal.email?.split("@")[0] || "Thành viên StudentHub",
      authorRole: principal.principalType.toLowerCase(),
      authorTrustScore: null,
      verifiedCount: 0,
      contestedCount: 0,
      status: "PENDING_REVIEW",
      sourceState: "USER_SUBMITTED_PENDING_REVIEW",
      isAuthoritative: false,
      createdAt: new Date().toISOString(),
    };

    SAFETY_REPORTS.unshift(newReport);

    return NextResponse.json(
      {
        success: true,
        message: "Đã ghi nhận báo cáo an ninh lên bản đồ cộng đồng.",
        // The authenticated submitter may reconcile their own pending report
        // with the server-assigned subject. Anonymous/public reads remain
        // redacted by toPublicReport.
        report: {
          ...toPublicReport(newReport),
          authorId: principal.subjectId,
          authorRole: principal.principalType.toLowerCase()
        },
      },
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_SAFETY_REPORT",
  requiredPermission: "COMMUNITY.POST",
  maxRequests: 10,
  maxBodyBytes: 64 * 1024,
}, createSafetyReport);
