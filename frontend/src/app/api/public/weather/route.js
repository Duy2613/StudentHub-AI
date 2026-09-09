import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { publicSourceHub } from "@/lib/server/public-api/PublicSourceHub.js";

export const runtime = "nodejs";

function textParam(searchParams, key, max) {
  return String(searchParams.get(key) || "").trim().slice(0, max);
}

function optionalCoordinate(value, min, max) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : undefined;
}

function optionalDays(value) {
  if (!value) return 3;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 16 ? parsed : undefined;
}

function invalid(message, correlationId) {
  return Response.json({
    success: false,
    contractVersion: "public-source.v1",
    sourceState: "NOT_CALLED",
    error: { code: "PUBLIC_WEATHER_INPUT_INVALID", userMessage: message, correlationId },
    isAuthoritative: false,
    correlationId,
  }, { status: 422 });
}

async function readPublicWeather(request, _routeParams, _principal, securityContext) {
  const correlationId = securityContext.correlationId;
  const searchParams = new URL(request.url).searchParams;
  const place = textParam(searchParams, "place", 160);
  const latitude = optionalCoordinate(searchParams.get("lat") || "", -90, 90);
  const longitude = optionalCoordinate(searchParams.get("lon") || "", -180, 180);
  const forecastDays = optionalDays(searchParams.get("days"));

  if (latitude === undefined || longitude === undefined || forecastDays === undefined) {
    return invalid("Tọa độ hoặc số ngày dự báo không hợp lệ.", correlationId);
  }
  const hasCoordinates = latitude !== null || longitude !== null;
  if (hasCoordinates && (latitude === null || longitude === null)) {
    return invalid("lat và lon phải được gửi cùng nhau.", correlationId);
  }
  if (!hasCoordinates && place.length < 2) {
    return invalid("Cần place hoặc cặp lat/lon.", correlationId);
  }

  const result = await publicSourceHub.weather({
    place,
    countryCode: textParam(searchParams, "country", 2).toUpperCase(),
    latitude,
    longitude,
    forecastDays,
    timezone: textParam(searchParams, "timezone", 80) || "auto",
  });
  const status = result.ok ? 200 : result.code === "PLACE_NOT_FOUND" ? 404 : 503;
  return Response.json({
    success: result.ok,
    contractVersion: "public-source.v1",
    ...result,
    isAuthoritative: false,
    correlationId,
  }, { status, headers: { "cache-control": "private, no-store" } });
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_PUBLIC_WEATHER_CONTEXT",
  allowAnonymous: true,
  maxRequests: 45,
  maxBodyBytes: 0,
}, readPublicWeather);

