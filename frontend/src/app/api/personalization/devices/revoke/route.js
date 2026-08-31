/**
 * StudentHub AI — API Route: POST /api/personalization/devices/revoke
 * Secure device and session revocation
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { DeviceSyncEngine } from "@/lib/personalization/DeviceSyncEngine.js";

export const POST = SecurityFabric.wrapHandler(
  {
    action: "REVOKE_DEVICE",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.subjectId;
    const body = await request.json();
    const { deviceId, revokeAllOthers, currentDeviceId } = body;

    if (revokeAllOthers && currentDeviceId) {
      const res = DeviceSyncEngine.revokeAllOtherDevices(subjectId, currentDeviceId);
      return Response.json({
        success: true,
        data: res,
        meta: { correlationId: secContext.correlationId }
      });
    }

    if (!deviceId) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "Yêu cầu cung cấp deviceId cần thu hồi." } },
        { status: 400 }
      );
    }

    const success = DeviceSyncEngine.revokeDevice(subjectId, deviceId, "USER_REVOKED_REMOTE_DEVICE");

    return Response.json({
      success,
      data: { deviceId, status: "REVOKED" },
      meta: { correlationId: secContext.correlationId }
    });
  }
);
