// Administrative/internal event publication endpoint.
// Domain services should publish only after their durable commit succeeds.

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { realtimeHub } from "@/lib/realtime/RealtimeHub.js";
import {
  getDurableRealtimeRepository,
  isDurableRealtimeConfigured,
  isRealtimeLocalFallbackAllowed,
} from "@/lib/server/realtime/DurableRealtimeRepository.js";

export const runtime = "nodejs";

const ALLOWED_CHANNELS = new Set(["system", "presence", "trust", "audit", "telemetry", "community", "expert"]);
const CHANNEL_PATTERN = /^[a-z][a-z0-9._:-]{0,63}$/;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9._:-]{0,95}$/;
const EVENT_TYPES = Object.freeze({
  system: new Set(["system:ping", "system:notice"]),
  presence: new Set(["presence:update"]),
  trust: new Set(["trust:stage", "trust:revision", "trust:state"]),
  audit: new Set(["audit:claim_evaluated", "audit:revision"]),
  telemetry: new Set(["telemetry:tick"]),
  community: new Set(["community:revision", "community:moderation"]),
  expert: new Set(["expert:assignment", "expert:revision"]),
});

export const POST = SecurityFabric.wrapHandler(
  {
    action: "PUBLISH_REALTIME_EVENT",
    requiredPermission: "ADMIN.SECURITY",
    allowAnonymous: false,
    maxRequests: 60,
    maxBodyBytes: 64 * 1024,
  },
  async (request, _routeContext, principal, securityContext) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "A JSON event envelope is required." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ success: false, error: "A JSON event envelope is required." }, { status: 400 });
    }

    const channel = String(body.channel || "").trim().toLowerCase();
    const eventType = String(body.eventType || "").trim().toLowerCase();
    if (!ALLOWED_CHANNELS.has(channel) || !CHANNEL_PATTERN.test(channel)) {
      return Response.json({ success: false, error: "Realtime channel is invalid or unsupported." }, { status: 400 });
    }
    if (!EVENT_TYPE_PATTERN.test(eventType)) {
      return Response.json({ success: false, error: "Realtime event type is invalid." }, { status: 400 });
    }
    if (!EVENT_TYPES[channel]?.has(eventType)) {
      return Response.json({ success: false, error: "Realtime event type is not allowed for this channel." }, { status: 400 });
    }
    if (!Object.hasOwn(body, "data")) {
      return Response.json({ success: false, error: "Realtime event data is required." }, { status: 400 });
    }

    try {
      const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey || null;
      const subjectId = body.subjectId ?? body.subject_id ?? null;
      const classification = body.classification || "INTERNAL";
      let event;
      let runtime;
      if (isDurableRealtimeConfigured()) {
        event = await getDurableRealtimeRepository().append({
          channel,
          eventType,
          data: body.data,
          subjectId,
          classification,
          producer: "StudentHub-AI",
          environment: process.env.NODE_ENV || "development",
          correlationId: securityContext?.correlationId || "realtime",
          idempotencyKey,
        });
        runtime = "POSTGRES_EVENT_LOG_SSE";
      } else {
        if (!isRealtimeLocalFallbackAllowed()) {
          return Response.json({
            success: false,
            error: {
              code: "REALTIME_DURABLE_REQUIRED",
              message: "A shared realtime event log is required in production.",
            },
          }, { status: 503 });
        }
        // Development/test fallback is intentionally explicit in its result;
        // it must never be mistaken for cross-instance durability.
        event = realtimeHub.broadcast(channel, eventType, body.data, {
          idempotencyKey,
          subjectId,
          classification,
        });
        runtime = "PROCESS_LOCAL_SSE";
      }
      return Response.json({
        success: true,
        broadcastedAt: new Date().toISOString(),
        runtime,
        authoritative: runtime === "POSTGRES_EVENT_LOG_SSE",
        actor: principal?.subjectId || null,
        event,
      });
    } catch (error) {
      const status = Number.isInteger(error?.statusCode) ? error.statusCode : 503;
      return Response.json({
        success: false,
        error: {
          code: error?.code || "REALTIME_PUBLISH_FAILED",
          message: status >= 500 ? "Realtime publication is temporarily unavailable." : "Realtime event was rejected.",
        },
      }, { status });
    }
  },
);
