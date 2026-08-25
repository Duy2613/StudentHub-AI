import { NextResponse } from "next/server";
import {
  UNIVERSITY_TUITION_REGISTRY,
  verifyTuitionPayment,
} from "@/lib/tuition/universityTuitionRegistry";

/**
 * GET /api/tuition-radar/verify?q=
 * Lấy danh bạ hoặc tìm kiếm trường trong hệ sinh thái học phí
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    let list = UNIVERSITY_TUITION_REGISTRY;
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.shortName.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q) ||
          u.primaryDomain.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      universities: list,
    });
  } catch (error) {
    console.error("[Tuition Radar GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải danh bạ học phí." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tuition-radar/verify
 * Đối soát thông tin tài khoản / link đóng học phí
 * Body: { universityQuery?: string, accountNumber?: string, bankCode?: string, paymentUrl?: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { universityQuery, accountNumber, bankCode, paymentUrl } = body || {};

    if (!universityQuery && !accountNumber && !paymentUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng cung cấp Tên Trường / Mã Trường, Số Tài Khoản hoặc Link Cổng đóng học phí để đối soát.",
        },
        { status: 400 }
      );
    }

    const verificationResult = verifyTuitionPayment({
      universityQuery,
      accountNumber,
      bankCode,
      paymentUrl,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...verificationResult,
    });
  } catch (error) {
    console.error("[Tuition Radar POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi đối soát thông tin học phí." },
      { status: 500 }
    );
  }
}
