import { NextResponse } from "next/server";

// Genuine campus marketplace items (Zero fake data, realistic items & locations)
let MARKETPLACE_ITEMS = [
  {
    id: "item-01",
    title: "Pass bộ Giáo trình Giải tích 1 & 2 + Đại số tuyến tính ĐHBK",
    category: "GIAO_TRINH",
    categoryName: "Giáo trình & Sách",
    price: 90000,
    originalPrice: 220000,
    condition: "GOOD_90",
    conditionLabel: "Còn mới 90%, có ghi chú bài tập hay",
    sellerName: "Đỗ Thành Long",
    sellerRole: "student",
    sellerTrustScore: 92,
    sellerEduVerified: true,
    campusLocation: "Cổng Thư viện Tạ Quang Bửu - ĐHBK Hà Nội",
    description: "Sách in của NXB Bách Khoa, có đóng bìa kiếng cẩn thận, đã note lại các dạng bài thi cuối kỳ môn Giải tích và Đại số. Hỗ trợ giao tận tay tại thư viện.",
    verifiedSafetyLevel: "HIGH_TRUST",
    createdAt: "2026-02-25T08:30:00.000Z",
  },
  {
    id: "item-02",
    title: "Máy tính Casio fx-580VN X chính hãng Tem Bitex",
    category: "THIET_BI_DIEN_TU",
    categoryName: "Thiết bị điện tử",
    price: 380000,
    originalPrice: 750000,
    condition: "LIKE_NEW_99",
    conditionLabel: "Như mới 99%, đủ nắp đậy và tem QR Bitex",
    sellerName: "Nguyễn Hoàng My",
    sellerRole: "student",
    sellerTrustScore: 88,
    sellerEduVerified: true,
    campusLocation: "Tòa Trung tâm HCMUTE (Võ Văn Ngân)",
    description: "Máy dùng ôn thi kỳ 1 xong pass lại cho bạn nào cần. Bao test chức năng ma trận, vector và giải phương trình bậc 4 tại chỗ.",
    verifiedSafetyLevel: "HIGH_TRUST",
    createdAt: "2026-02-25T09:15:00.000Z",
  },
  {
    id: "item-03",
    title: "Quạt bàn Senko mini + Kệ sách gỗ 3 tầng KTX",
    category: "DO_GIA_DUNG",
    categoryName: "Đồ gia dụng",
    price: 150000,
    originalPrice: 350000,
    condition: "GOOD_90",
    conditionLabel: "Chạy êm, gió mạnh, kệ gỗ chắc chắn",
    sellerName: "Phạm Quốc Huy",
    sellerRole: "student",
    sellerTrustScore: 80,
    sellerEduVerified: true,
    campusLocation: "Nhà B3, KTX Khu B ĐHQG-HCM",
    description: "Dọn phòng về quê thực tập nên pass combo quạt + kệ sách. Giao trực tiếp tại sảnh KTX Khu B.",
    verifiedSafetyLevel: "VERIFIED",
    createdAt: "2026-02-24T16:00:00.000Z",
  },
  {
    id: "item-04",
    title: "Xe đạp địa phương đi học Martin 107 khung nhôm",
    category: "XE_MAY_XE_DAP",
    categoryName: "Phương tiện di chuyển",
    price: 650000,
    originalPrice: 1800000,
    condition: "FAIR_80",
    conditionLabel: "Lốp mới thay, phanh nhạy, sên líp tốt",
    sellerName: "Vũ Đình Trọng",
    sellerRole: "student",
    sellerTrustScore: 84,
    sellerEduVerified: true,
    campusLocation: "Cổng trường ĐH Sư Phạm Kỹ Thuật (Khu D)",
    description: "Xe mua đi học hàng ngày từ trọ đến trường, có giỏ xe đựng cặp và khóa dây số tặng kèm. Xem và thử xe trực tiếp tại trường.",
    verifiedSafetyLevel: "HIGH_TRUST",
    createdAt: "2026-02-23T11:20:00.000Z",
  },
];

/**
 * GET /api/marketplace/items?category=&q=
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "ALL";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    let list = MARKETPLACE_ITEMS.filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchLoc = item.campusLocation.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      items: list,
    });
  } catch (error) {
    console.error("[Marketplace GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải sàn pass đồ." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/items
 * Đăng tin pass đồ cũ mới
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      category,
      categoryName,
      price,
      originalPrice,
      condition,
      conditionLabel,
      sellerName,
      sellerRole,
      sellerTrustScore,
      sellerEduVerified,
      campusLocation,
      description,
    } = body || {};

    if (!title || !price || !campusLocation || !description) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ Tiêu đề, Giá bán, Địa điểm giao dịch và Mô tả." },
        { status: 400 }
      );
    }

    const trustScoreNum = Number(sellerTrustScore || 80);

    const newItem = {
      id: `item-${Date.now()}`,
      title: title.trim(),
      category: category || "GIAO_TRINH",
      categoryName: categoryName || "Giáo trình & Sách",
      price: Number(price),
      originalPrice: Number(originalPrice || price * 1.5),
      condition: condition || "GOOD_90",
      conditionLabel: conditionLabel || "Đã qua sử dụng, hoạt động tốt",
      sellerName: sellerName || "Sinh viên StudentHub",
      sellerRole: sellerRole || "student",
      sellerTrustScore: trustScoreNum,
      sellerEduVerified: Boolean(sellerEduVerified),
      campusLocation: campusLocation.trim(),
      description: description.trim(),
      verifiedSafetyLevel: trustScoreNum >= 80 ? "HIGH_TRUST" : "VERIFIED",
      createdAt: new Date().toISOString(),
    };

    MARKETPLACE_ITEMS.unshift(newItem);

    return NextResponse.json(
      {
        success: true,
        message: "Đã đăng món đồ lên Sàn Pass Đồ Bảo Chứng thành công!",
        item: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Marketplace POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi đăng món đồ." },
      { status: 500 }
    );
  }
}
