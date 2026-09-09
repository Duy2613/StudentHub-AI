import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { getTopicDefinition, STUDENTHUB_TOPIC_TAXONOMY } from "@/lib/server/public-api/PublicApiRegistry.js";
import { publicSourceHub } from "@/lib/server/public-api/PublicSourceHub.js";

export const runtime = "nodejs";

function textParam(searchParams, key, max) {
  return String(searchParams.get(key) || "").trim().slice(0, max);
}

function invalid(message, correlationId) {
  return Response.json({
    success: false,
    contractVersion: "public-source.v1",
    sourceState: "NOT_CALLED",
    error: { code: "PUBLIC_DISCOVERY_INPUT_INVALID", userMessage: message, correlationId },
    isAuthoritative: false,
    correlationId,
  }, { status: 422 });
}

async function discoverPublicSources(request, _routeParams, _principal, securityContext) {
  const correlationId = securityContext.correlationId;
  const searchParams = new URL(request.url).searchParams;
  const query = textParam(searchParams, "q", 180);
  const topic = textParam(searchParams, "topic", 80).toUpperCase();
  const timespan = textParam(searchParams, "timespan", 40) || "1week";
  const limitValue = searchParams.get("limit");
  const limit = limitValue ? Number(limitValue) : 10;
  const includeOfficialContent = searchParams.get("official") === "1";

  if (query.length < 2 && !getTopicDefinition(topic)) {
    return invalid("Nhập q hoặc chọn một topic StudentHub hợp lệ để discovery.", correlationId);
  }
  if (limitValue && (!Number.isInteger(limit) || limit < 1 || limit > 20)) {
    return invalid("limit phải là số nguyên từ 1 đến 20.", correlationId);
  }

  const result = await publicSourceHub.discoverNews({ query, topic, timespan, limit, includeOfficialContent });
  const status = result.ok ? 200 : 503;
  return Response.json({
    success: result.ok,
    contractVersion: "public-source.v1",
    ...result,
    topicCatalog: STUDENTHUB_TOPIC_TAXONOMY.map(({ id, label }) => ({ id, label })),
    isAuthoritative: false,
    correlationId,
  }, { status, headers: { "cache-control": "private, no-store" } });
}

export const GET = SecurityFabric.wrapHandler({
  action: "DISCOVER_PUBLIC_SOURCES",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 0,
}, discoverPublicSources);
