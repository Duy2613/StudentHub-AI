import { NextResponse } from "next/server";
import { BANK_EMERGENCY_HOTLINES } from "@/lib/legal/legalSosRegistry";

/**
 * GET /api/sos/bank-hotlines
 * Lấy danh bạ hotline khẩn cấp và cú pháp khóa thẻ 24/7 của các ngân hàng tại Việt Nam
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      count: BANK_EMERGENCY_HOTLINES.length,
      hotlines: BANK_EMERGENCY_HOTLINES,
    });
  } catch (error) {
    console.error("[Bank Hotlines API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải danh bạ ngân hàng." },
      { status: 500 }
    );
  }
}
