import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { publicSourceHub } from "@/lib/server/public-api/PublicSourceHub.js";

export const runtime = "nodejs";

const RESEARCH_TYPES = new Set(["works", "institutions", "topics"]);

function textParam(searchParams, key, max) {
  return String(searchParams.get(key) || "").trim().slice(0, max);
}

function optionalYear(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2200 ? parsed : undefined;
}

function optionalLimit(value) {
  if (!value) return 10;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 20 ? parsed : undefined;
}

function invalid(message, correlationId) {
  return Response.json({
    success: false,
    contractVersion: "public-source.v1",
    sourceState: "NOT_CALLED",
    error: { code: "PUBLIC_RESEARCH_INPUT_INVALID", userMessage: message, correlationId },
    isAuthoritative: false,
    correlationId,
  }, { status: 422 });
}

async function searchPublicResearch(request, _routeParams, _principal, securityContext) {
  const correlationId = securityContext.correlationId;
  const searchParams = new URL(request.url).searchParams;
  const query = textParam(searchParams, "q", 180);
  const type = textParam(searchParams, "type", 20).toLowerCase() || "works";
  const fromYear = optionalYear(searchParams.get("fromYear"));
  const toYear = optionalYear(searchParams.get("toYear"));
  const limit = optionalLimit(searchParams.get("limit"));

  if (query.length < 2) return invalid("Nhập ít nhất 2 ký tự để tìm metadata nghiên cứu.", correlationId);
  if (!RESEARCH_TYPES.has(type)) return invalid("type phải là works, institutions hoặc topics.", correlationId);
  if (fromYear === undefined || toYear === undefined || limit === undefined || (fromYear && toYear && fromYear > toYear)) {
    return invalid("Khoảng năm hoặc limit không hợp lệ.", correlationId);
  }

  const result = await publicSourceHub.searchResearch({
    query,
    type,
    institution: textParam(searchParams, "institution", 160),
    topic: textParam(searchParams, "topic", 160),
    fromYear,
    toYear,
    limit,
  });
  const status = result.ok ? 200 : 503;
  return Response.json({
    success: result.ok,
    contractVersion: "public-source.v1",
    ...result,
    isAuthoritative: false,
    correlationId,
  }, { status, headers: { "cache-control": "private, no-store" } });
}

export const GET = SecurityFabric.wrapHandler({
  action: "SEARCH_PUBLIC_RESEARCH_METADATA",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 0,
}, searchPublicResearch);

