import { NextResponse } from "next/server";
import { Layer2AReputationService } from "@/lib/ai-trust/layer2a/Layer2AReputationService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const runtime = "nodejs";

const MAX_URL_LENGTH = 2048;

async function verifyUrlReputation(request, _routeParams, _principal, securityContext) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      success: false,
      error: { code: "INVALID_JSON", userMessage: "Payload phải là JSON hợp lệ." },
    }, { status: 400 });
  }

  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url || url.length > MAX_URL_LENGTH) {
    return NextResponse.json({
      success: false,
      error: { code: "URL_INPUT_INVALID", userMessage: "URL không hợp lệ hoặc vượt giới hạn cho phép." },
    }, { status: 422 });
  }

  const result = await Layer2AReputationService.verify({
    url,
    requestId: securityContext.correlationId,
  });

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-AI-Trust-Layer": "2A-URL-Reputation",
      "X-AI-Trust-Request-Id": result.requestId,
    },
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "LOOKUP_TRUST_URL_REPUTATION",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 32 * 1024,
}, verifyUrlReputation);
