import { BANK_EMERGENCY_HOTLINES } from "@/lib/legal/legalSosRegistry";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

/**
 * GET /api/sos/bank-hotlines
 * Lấy danh bạ hotline khẩn cấp và cú pháp khóa thẻ 24/7 của các ngân hàng tại Việt Nam
 */
export const GET = SecurityFabric.wrapHandler({
  action: "READ_BANK_HOTLINES",
  allowAnonymous: true,
  maxRequests: 120
}, async () => Response.json({
  success: true,
  count: BANK_EMERGENCY_HOTLINES.length,
  hotlines: BANK_EMERGENCY_HOTLINES,
  sourceState: "CURATED_STATIC_REGISTRY",
  isAuthoritative: false,
  dataNotice: "Số liên hệ tham khảo; hãy đối chiếu ứng dụng/trang chính thức của ngân hàng trước khi gọi."
}, { headers: { "Cache-Control": "no-store" } }));
