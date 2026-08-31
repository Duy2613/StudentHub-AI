import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";
import { createSecureId } from "@/lib/security/secureId.js";

// Deterministic marketplace UI fixture.  It is intentionally not presented as
// a live durable marketplace until a reviewed persistence/identity adapter is
// configured.
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
const toPublicItem = (item) => {
  const safeItem = { ...item };
  delete safeItem.sellerId;
  delete safeItem.sellerName;
  return {
    ...safeItem,
    sellerName: "Người bán trong cộng đồng",
    sellerTrustScore: null,
    sellerEduVerified: false,
    verifiedSafetyLevel: item.verifiedSafetyLevel === "UNASSESSED" ? "UNASSESSED" : "FIXTURE_UNASSESSED",
    sourceState: item.sourceState || "SYNTHETIC_FIXTURE",
    isAuthoritative: false
  };
};

export const GET = SecurityFabric.wrapHandler({
  action: "READ_MARKETPLACE_ITEMS",
  allowAnonymous: true,
  maxRequests: 90
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "ALL").slice(0, 40);
  const q = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 120);

  const list = MARKETPLACE_ITEMS.filter((item) => {
    if (category !== "ALL" && item.category !== category) return false;
    if (q) {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.campusLocation.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  }).map(toPublicItem);

  return Response.json({
    success: true,
    count: list.length,
    items: list,
    sourceState: "SYNTHETIC_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Danh sách minh họa; người bán, giá và trạng thái an toàn chưa được xác minh production."
  }, { headers: { "Cache-Control": "no-store" } });
});

/**
 * POST /api/marketplace/items
 * Đăng tin pass đồ cũ mới
 */
async function createMarketplaceItem(request, _routeContext, principal) {
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
      campusLocation,
      description,
    } = body || {};

    if (typeof title !== "string" || typeof campusLocation !== "string" || typeof description !== "string" ||
        !title.trim() || !campusLocation.trim() || !description.trim() ||
        title.trim().length > 180 || campusLocation.trim().length > 180 || description.trim().length > 4000) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_MARKETPLACE_ITEM", userMessage: "Vui lòng nhập tiêu đề, giá, địa điểm và mô tả hợp lệ." } },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    const numericOriginalPrice = originalPrice === undefined || originalPrice === null || originalPrice === ""
      ? numericPrice * 1.5
      : Number(originalPrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 1_000_000_000 ||
        !Number.isFinite(numericOriginalPrice) || numericOriginalPrice <= 0 || numericOriginalPrice > 2_000_000_000) {
      return NextResponse.json({ success: false, error: { code: "INVALID_MARKETPLACE_PRICE", userMessage: "Giá bán không hợp lệ." } }, { status: 400 });
    }

    const sellerName = principal.attributes?.fullName
      || principal.email?.split("@")[0]
      || "Thành viên StudentHub";

    const newItem = {
      id: createSecureId("item"),
      title: title.trim(),
      category: category || "GIAO_TRINH",
      categoryName: categoryName || "Giáo trình & Sách",
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      condition: condition || "GOOD_90",
      conditionLabel: conditionLabel || "Đã qua sử dụng, hoạt động tốt",
      sellerName: sellerName || "Sinh viên StudentHub",
      sellerId: principal.subjectId,
      sellerRole: principal.principalType.toLowerCase(),
      sellerTrustScore: null,
      sellerEduVerified: principal.attributes?.emailVerified === true,
      campusLocation: campusLocation.trim(),
      description: description.trim(),
      verifiedSafetyLevel: "UNASSESSED",
      sourceState: "USER_SUBMITTED_PENDING_REVIEW",
      isAuthoritative: false,
      createdAt: new Date().toISOString(),
    };

    MARKETPLACE_ITEMS.unshift(newItem);

    return NextResponse.json(
      {
        success: true,
        message: "Đã đăng món đồ lên Sàn Pass Đồ Bảo Chứng thành công!",
        // Return only the authenticated submitter's own server-assigned
        // subject for client reconciliation; anonymous list reads stay
        // redacted by toPublicItem.
        item: {
          ...toPublicItem(newItem),
          sellerId: principal.subjectId,
          sellerRole: principal.principalType.toLowerCase()
        },
      },
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_MARKETPLACE_ITEM",
  requiredPermission: "COMMUNITY.POST",
  maxRequests: 20,
  maxBodyBytes: 64 * 1024,
}, createMarketplaceItem);
