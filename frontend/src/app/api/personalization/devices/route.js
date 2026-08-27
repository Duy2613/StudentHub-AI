/**
 * StudentHub AI — API Route: /api/personalization/devices
 * Multi-device management and active session tracking
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { DeviceSyncEngine, DEVICE_PLATFORM } from "@/lib/personalization/DeviceSyncEngine.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_DEVICES",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.isAuthenticated ? principal.subjectId : "student:24110001";
    const devices = DeviceSyncEngine.getDevicesForSubject(subjectId);

    // If no devices exist, auto-register default desktop
    if (devices.length === 0) {
      DeviceSyncEngine.registerDevice({
        subjectId,
        platform: DEVICE_PLATFORM.DESKTOP_WEB,
        deviceName: "Chrome on Windows (Thiết bị hiện tại)",
        ipAddress: secContext.clientIp
      });
    }

    const updatedList = DeviceSyncEngine.getDevicesForSubject(subjectId);

    return Response.json({
      success: true,
      total: updatedList.length,
      data: updatedList,
      meta: { correlationId: secContext.correlationId }
    });
  }
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "REGISTER_DEVICE",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.isAuthenticated ? principal.subjectId : "student:24110001";
    const body = await request.json();

    const device = DeviceSyncEngine.registerDevice({
      subjectId,
      deviceId: body.deviceId,
      platform: body.platform || DEVICE_PLATFORM.DESKTOP_WEB,
      deviceName: body.deviceName || "Thiết bị mới",
      userAgent: request.headers.get("user-agent") || "Unknown Client",
      ipAddress: secContext.clientIp
    });

    return Response.json({
      success: true,
      data: device,
      meta: { correlationId: secContext.correlationId }
    });
  }
);
