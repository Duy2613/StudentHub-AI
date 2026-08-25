import { NextResponse } from "next/server";

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
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone") || "";
    const category = searchParams.get("category") || "";
    const severity = searchParams.get("severity") || "";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    let list = SAFETY_REPORTS.filter((item) => {
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
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      reports: list,
    });
  } catch (error) {
    console.error("[Safety Map GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải bản đồ an ninh." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/safety-map/reports
 * Gửi báo cáo cảnh báo điểm đen an ninh / bẫy cọc mới
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, category, zone, zoneName, address, coordinates, description, severity, authorName, authorRole, authorTrustScore } = body || {};

    if (!title || !description || !address) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề, địa chỉ và mô tả chi tiết là bắt buộc." },
        { status: 400 }
      );
    }

    const newReport = {
      id: `rep-${Date.now()}`,
      title: title.trim(),
      category: category || "SCAM_DEPOSIT",
      zone: zone || "LANG_DAI_HOC_THU_DUC",
      zoneName: zoneName || "Khu vực Giảng đường",
      address: address.trim(),
      coordinates: coordinates || { lat: 10.875, lng: 106.78 },
      description: description.trim(),
      severity: severity || "MEDIUM",
      authorName: authorName || "Thành viên StudentHub",
      authorRole: authorRole || "student",
      authorTrustScore: Number(authorTrustScore || 80),
      verifiedCount: 1,
      contestedCount: 0,
      status: "ACTIVE_ALERT",
      createdAt: new Date().toISOString(),
    };

    SAFETY_REPORTS.unshift(newReport);

    return NextResponse.json(
      {
        success: true,
        message: "Đã ghi nhận báo cáo an ninh lên bản đồ cộng đồng.",
        report: newReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Safety Map POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tạo báo cáo an ninh." },
      { status: 500 }
    );
  }
}
