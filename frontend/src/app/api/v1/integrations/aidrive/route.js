import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  AIDriveIntegrationError,
  GenSparkAIDriveClient,
  getAIDriveIntegrationStatus,
} from "@/lib/integrations/aidrive/GenSparkAIDriveClient.js";

function failure(error) {
  if (error instanceof AIDriveIntegrationError) {
    const messages = {
      AIDRIVE_NOT_CONFIGURED: "AI Drive chưa được cấu hình trên máy chủ.",
      INVALID_REMOTE_PATH: "Đường dẫn AI Drive không hợp lệ.",
      UNAPPROVED_PROVIDER_ORIGIN: "Nguồn AI Drive chưa được phê duyệt.",
      INVALID_PROVIDER_CONFIGURATION: "Cấu hình AI Drive không hợp lệ.",
      PROVIDER_UNAVAILABLE: "AI Drive hiện tạm thời không khả dụng.",
      AIDRIVE_AUTHENTICATION_FAILED: "AI Drive không xác thực được kết nối.",
      AIDRIVE_RATE_LIMITED: "AI Drive đang giới hạn yêu cầu.",
      AIDRIVE_PATH_NOT_FOUND: "Đường dẫn AI Drive không tồn tại.",
      AIDRIVE_PROVIDER_UNAVAILABLE: "AI Drive hiện tạm thời không khả dụng.",
      AIDRIVE_RESPONSE_TOO_LARGE: "Phản hồi AI Drive vượt giới hạn an toàn.",
      AIDRIVE_INVALID_RESPONSE: "Phản hồi AI Drive không hợp lệ.",
    };
    return NextResponse.json({ success: false, error: { code: messages[error.code] ? error.code : "AIDRIVE_OPERATION_FAILED", message: messages[error.code] || "AI Drive operation could not be completed." } }, { status: error.status });
  }
  return NextResponse.json({ success: false, error: { code: "AIDRIVE_OPERATION_FAILED", message: "AI Drive operation could not be completed." } }, { status: 500 });
}

async function readAIDrive(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "status";

  if (mode === "status") {
    return NextResponse.json({ success: true, data: getAIDriveIntegrationStatus() });
  }

  try {
    const client = new GenSparkAIDriveClient();
    if (mode === "list") {
      const data = await client.listFiles(url.searchParams.get("path") || "/", url.searchParams.get("limit") || 100);
      return NextResponse.json({ success: true, data });
    }
    if (mode === "usage") {
      return NextResponse.json({ success: true, data: await client.getStorageUsage() });
    }
    return NextResponse.json({ success: false, error: { code: "INVALID_AIDRIVE_MODE", message: "Supported modes are status, list, and usage." } }, { status: 422 });
  } catch (error) {
    return failure(error);
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_AIDRIVE_SOURCE",
  requiredPermission: "INTEGRATION.READ",
  allowAnonymous: false,
  maxRequests: 40,
}, readAIDrive);
