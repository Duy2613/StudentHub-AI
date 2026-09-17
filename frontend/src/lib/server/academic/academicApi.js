import { NextResponse } from "next/server";

import { DatabaseUnavailableError } from "../database/PostgresPool.js";
import { normalizeTimetableOwnerId } from "../database/AcademicTimetableRepository.js";
import { TimetableValidationError } from "../../intelligence/academic/academicTimetableModel.js";

export function authenticatedOwnerId(principal) {
  return normalizeTimetableOwnerId(principal?.subjectId);
}

export async function readJson(request) {
  return request.json().catch(() => ({}));
}

export async function routeParams(routeContext) {
  const value = routeContext?.params;
  return value && typeof value.then === "function" ? value : (value || {});
}

export function requestId(request, securityContext) {
  return String(
    securityContext?.correlationId
      || request.headers.get("x-request-id")
      || "academic",
  ).slice(0, 160);
}

export function idempotencyKey(request, body = null) {
  return String(
    request.headers.get("idempotency-key")
      || body?.idempotencyKey
      || "",
  ).trim().slice(0, 180) || null;
}

export function academicErrorResponse(error, correlationId = "academic") {
  const status = error instanceof DatabaseUnavailableError
    ? 503
    : Number.isInteger(error?.statusCode) ? error.statusCode
      : error?.code === "IDEMPOTENCY_CONFLICT" ? 409
        : error?.code === "TIMETABLE_NOT_FOUND" || error?.code === "ENTRY_NOT_FOUND" || error?.code === "REMINDER_NOT_FOUND" || error?.code === "REMINDER_TARGET_NOT_FOUND" ? 404
          : 500;
  const code = error instanceof DatabaseUnavailableError
    ? "DATABASE_UNAVAILABLE"
    : String(error?.code || "ACADEMIC_TIMETABLE_OPERATION_FAILED").slice(0, 80);
  const messages = {
    DATABASE_UNAVAILABLE: "Học vụ chưa kết nối được với kho dữ liệu bền vững.",
    DURABLE_IDENTITY_REQUIRED: "Phiên đăng nhập bền vững là bắt buộc.",
    ENTRIES_REQUIRED: "Thời khóa biểu cần ít nhất một học phần.",
    ENTRIES_INVALID: "Danh sách học phần chưa hợp lệ.",
    IDEMPOTENCY_CONFLICT: "Yêu cầu lặp lại không khớp với dữ liệu đã xác nhận.",
    TIMETABLE_NOT_FOUND: "Không tìm thấy thời khóa biểu của bạn.",
    ENTRY_NOT_FOUND: "Không tìm thấy học phần của bạn.",
    REMINDER_NOT_FOUND: "Không tìm thấy nhắc nhở của bạn.",
    REMINDER_TARGET_NOT_FOUND: "Mục tiêu nhắc nhở không thuộc thời khóa biểu của bạn.",
    TIME_RANGE_INVALID: "Khoảng giờ học chưa hợp lệ.",
    PERIOD_RANGE_INVALID: "Khoảng tiết học chưa hợp lệ.",
    REMINDER_INVALID: "Nhắc nhở chưa hợp lệ.",
  };
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: messages[code] || (error instanceof TimetableValidationError ? "Dữ liệu thời khóa biểu chưa hợp lệ." : "Không thể hoàn tất thao tác học vụ."),
        correlationId,
      },
    },
    { status },
  );
}

