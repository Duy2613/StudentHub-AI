import { ExpertQualificationError } from "./ExpertQualificationService.js";

export function qualificationErrorResponse(error, correlationId) {
  if (!(error instanceof ExpertQualificationError)) {
    return Response.json(
      {
        success: false,
        error: {
          code: error?.code || "EXPERT_PROFILE_STORAGE_UNAVAILABLE",
          userMessage: "Hồ sơ chuyên gia chưa khả dụng từ Owner backend; không có dữ liệu thay thế.",
          correlationId,
        },
      },
      { status: Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 500 ? Number(error.statusCode) : 503 }
    );
  }
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        userMessage: error.message,
        correlationId,
      },
    },
    { status: error.statusCode }
  );
}
