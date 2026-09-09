// Server-Sent Events transport for server-committed StudentHub events.

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { realtimeHub } from "@/lib/realtime/RealtimeHub.js";
import { createSecureId } from "@/lib/security/secureId.js";
import {
  getDurableRealtimeRepository,
  isDurableRealtimeConfigured,
  isRealtimeLocalFallbackAllowed,
} from "@/lib/server/realtime/DurableRealtimeRepository.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNEL_SCOPES = Object.freeze({
  system: [],
  presence: ["community:read"],
  trust: ["trust:read"],
  audit: ["trust:read"],
  telemetry: ["trust:read"],
  community: ["community:read"],
  expert: ["expert:read"],
});

const PUBLIC_CHANNELS = new Set(["system"]);
const ALL_CHANNELS = Object.freeze(Object.keys(CHANNEL_SCOPES));
const CHANNEL_PATTERN = /^[a-z][a-z0-9._:-]{0,63}$/;
const SUBJECT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DURABLE_POLL_MS = 1000;

function parseChannels(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("channels") || "system";
  const requested = [...new Set(raw.split(",").map((channel) => channel.trim().toLowerCase()).filter(Boolean))];
  const expanded = requested.includes("all") ? ALL_CHANNELS : requested;
  if (!expanded.length || expanded.some((channel) => !CHANNEL_PATTERN.test(channel) || !Object.hasOwn(CHANNEL_SCOPES, channel))) {
    return { error: "Realtime channel is invalid or unsupported." };
  }
  return { channels: expanded, usedAll: requested.includes("all") };
}

function scopeAllows(principal, channel) {
  if (PUBLIC_CHANNELS.has(channel)) return true;
  if (!principal?.isAuthenticated) return false;
  const scopes = CHANNEL_SCOPES[channel] || [];
  return scopes.length === 0 || principal.hasScope(scopes);
}

function resolveChannels(principal, parsed) {
  const allowed = parsed.channels.filter((channel) => scopeAllows(principal, channel));
  if (parsed.usedAll && !principal?.isAuthenticated) return ["system"];
  if (!allowed.length) return null;
  return allowed;
}

function parseCursor(request) {
  const { searchParams } = new URL(request.url);
  const raw = request.headers.get("last-event-id") || searchParams.get("cursor") || "0";
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) return 0;
  const cursor = Number(text);
  return Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : 0;
}

function encodeDurableEvent(event) {
  const id = event.sequence ?? event.id;
  return `id: ${id}\nevent: ${event.eventType}\ndata: ${JSON.stringify(event)}\n\n`;
}

function durableErrorFrame(code) {
  return `event: system:error\ndata: ${JSON.stringify({
    code,
    retryable: true,
    observedAt: new Date().toISOString(),
  })}\n\n`;
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_REALTIME_STREAM",
    allowAnonymous: true,
    maxRequests: 60,
    maxBodyBytes: 0,
  },
  async (request, _routeContext, principal) => {
    const parsed = parseChannels(request);
    if (parsed.error) return Response.json({ success: false, error: parsed.error }, { status: 400 });

    const channels = resolveChannels(principal, parsed);
    if (!channels) {
      return Response.json({ success: false, error: "The requested realtime scope is not available for this session." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get("clientId");
    const clientId = requestedClientId && /^client_[A-Za-z0-9_.:-]{1,120}$/.test(requestedClientId)
      ? requestedClientId
      : createSecureId("client");

    if (isDurableRealtimeConfigured()) {
      // Durable private events are keyed to a canonical auth.users UUID. A
      // fixture/legacy subject must not silently widen into a shared stream.
      if (channels.some((channel) => !PUBLIC_CHANNELS.has(channel))
        && !SUBJECT_PATTERN.test(String(principal?.subjectId || ""))) {
        return Response.json(
          { success: false, error: "The authenticated identity is not eligible for durable realtime." },
          { status: 403 },
        );
      }

      const repository = getDurableRealtimeRepository();
      let initialRuntime;
      try {
        initialRuntime = await repository.runtimeSnapshot();
      } catch {
        return Response.json(
          {
            success: false,
            error: {
              code: "REALTIME_DURABLE_UNAVAILABLE",
              message: "The realtime event log is temporarily unavailable.",
            },
          },
          { status: 503, headers: { "cache-control": "no-store" } },
        );
      }

      let stopped = false;
      let pollTimer = null;
      let lastSequence = parseCursor(request);
      let lastHeartbeatAt = Date.now();
      const stop = () => {
        stopped = true;
        if (pollTimer) clearTimeout(pollTimer);
      };
      const stream = new ReadableStream({
        start(controller) {
          const enqueue = (value) => {
            if (!stopped) controller.enqueue(new TextEncoder().encode(value));
          };
          enqueue(`event: system:connected\ndata: ${JSON.stringify({
            type: "HANDSHAKE",
            clientId,
            channels,
            runtime: initialRuntime,
            cursor: lastSequence,
          })}\n\n`);

          const poll = async () => {
            if (stopped) return;
            try {
              const events = await repository.replay({
                channels,
                subjectId: principal?.subjectId || null,
                afterSequence: lastSequence,
                limit: 100,
              });
              for (const event of events) {
                if (stopped) return;
                enqueue(encodeDurableEvent(event));
                if (Number.isSafeInteger(event.sequence) && event.sequence > lastSequence) {
                  lastSequence = event.sequence;
                }
              }
              if (Date.now() - lastHeartbeatAt >= 15_000) {
                enqueue(": heartbeat\n\n");
                lastHeartbeatAt = Date.now();
              }
            } catch {
              enqueue(durableErrorFrame("REALTIME_DURABLE_UNAVAILABLE"));
              stop();
              try { controller.close(); } catch { /* already closed */ }
              return;
            }
            if (!stopped) pollTimer = setTimeout(poll, DURABLE_POLL_MS);
          };
          request.signal?.addEventListener("abort", stop, { once: true });
          poll();
        },
        cancel: stop,
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform, must-revalidate",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          "X-Realtime-Transport": "POSTGRES_EVENT_LOG_SSE",
        },
      });
    }

    if (!isRealtimeLocalFallbackAllowed()) {
      return Response.json(
        {
          success: false,
          error: {
            code: "REALTIME_DURABLE_REQUIRED",
            message: "A shared realtime event log is required in production.",
          },
        },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }

    let registeredClientId = null;
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp || !registeredClientId) return;
      cleanedUp = true;
      realtimeHub.unregisterClient(registeredClientId);
    };

    const stream = new ReadableStream({
      start(controller) {
        registeredClientId = realtimeHub.registerClient(clientId, controller, channels, { subjectId: principal?.subjectId });
        request.signal?.addEventListener("abort", cleanup, { once: true });
      },
      cancel: cleanup,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Realtime-Transport": "PROCESS_LOCAL_SSE",
      },
    });
  },
);
