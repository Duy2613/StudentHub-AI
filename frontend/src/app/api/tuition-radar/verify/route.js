import { NextResponse } from "next/server";
import {
  UNIVERSITY_TUITION_REGISTRY,
  verifyTuitionPayment,
} from "@/lib/tuition/universityTuitionRegistry";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * GET /api/tuition-radar/verify?q=
 * Lấy danh bạ hoặc tìm kiếm trường trong hệ sinh thái học phí
 */
export const GET = SecurityFabric.wrapHandler({
  action: "READ_TUITION_REGISTRY",
  allowAnonymous: true,
  maxRequests: 90
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 120);
  const list = UNIVERSITY_TUITION_REGISTRY.filter((u) => {
    if (!q) return true;
    return u.name.toLowerCase().includes(q) ||
      u.shortName.toLowerCase().includes(q) ||
      u.code.toLowerCase().includes(q) ||
      u.primaryDomain.toLowerCase().includes(q);
  });

  return Response.json({
    success: true,
    count: list.length,
    universities: list,
    sourceState: "CURATED_STATIC_REGISTRY",
    isAuthoritative: false,
    dataNotice: "Thông tin thanh toán tham khảo; luôn xác nhận lại trên cổng chính thức của trường trước khi chuyển tiền."
  }, { headers: { "Cache-Control": "no-store" } });
});

/**
 * POST /api/tuition-radar/verify
 * Đối soát thông tin tài khoản / link đóng học phí
 * Body: { universityQuery?: string, accountNumber?: string, bankCode?: string, paymentUrl?: string }
 */
async function verifyTuitionDestination(request, _routeContext, _principal, secContext) {
  try {
    const body = await request.json().catch(() => ({}));
    const { universityQuery, accountNumber, bankCode, paymentUrl } = body || {};

    if ([universityQuery, accountNumber, bankCode, paymentUrl].some(value => value !== undefined && typeof value !== "string")) {
      return Response.json({ success: false, error: {
        code: "TUITION_INPUT_INVALID",
        userMessage: "Dữ liệu đối soát học phí không hợp lệ.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }
    if ([universityQuery, accountNumber, bankCode, paymentUrl].some(value => typeof value === "string" && value.length > 512)) {
      return Response.json({ success: false, error: {
        code: "TUITION_INPUT_TOO_LARGE",
        userMessage: "Dữ liệu đối soát học phí vượt giới hạn.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 413 });
    }

    if (!universityQuery && !accountNumber && !paymentUrl) {
      return Response.json({ success: false, error: {
        code: "TUITION_INPUT_REQUIRED",
        userMessage: "Vui lòng cung cấp tên trường, số tài khoản hoặc link cổng thanh toán.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }

    const verificationResult = verifyTuitionPayment({
      universityQuery,
      accountNumber,
      bankCode,
      paymentUrl,
    });

    return NextResponse.json({
      success: true,
      ...verificationResult,
      // A local registry match is not a live bank/university verification.
      // Keep the legacy field but force it to the safe value and expose the
      // deterministic match explicitly so callers cannot mistake the result
      // for an authoritative external assertion.
      isOfficial: false,
      registryMatch: Boolean(verificationResult.isOfficial),
      verificationState: verificationResult.isOfficial ? "CURATED_REGISTRY_MATCH" : "CURATED_REGISTRY_NO_MATCH",
      timestamp: new Date().toISOString(),
      sourceState: "CURATED_STATIC_REGISTRY",
      isAuthoritative: false,
      dataNotice: "Kết quả chỉ là đối sánh với registry tĩnh; không phải xác minh trực tiếp với ngân hàng/trường. Hãy xác nhận lại trước giao dịch.",
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "VERIFY_TUITION_DESTINATION",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 32 * 1024,
}, verifyTuitionDestination);
