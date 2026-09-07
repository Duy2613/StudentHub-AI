import {
  getDurableRealtimeRepository,
  isDurableRealtimeConfigured,
  normalizeRealtimeEvent,
} from "./DurableRealtimeRepository.js";

/**
 * Publishes a server-committed domain projection to the durable realtime log.
 * A realtime delivery failure never changes the already-committed business
 * result; the caller can retry this idempotent publication from its outbox.
 */
export async function publishRealtimeEvent(input, { logger = console } = {}) {
  if (!isDurableRealtimeConfigured()) {
    return { status: "NOT_CONFIGURED", authoritative: false, event: null };
  }
  try {
    const event = await getDurableRealtimeRepository().append(input);
    return { status: event.deduplicated ? "DEDUPLICATED" : "PERSISTED", authoritative: true, event };
  } catch (error) {
    // Validate before logging so malformed payloads are not accidentally
    // emitted as opaque object dumps.  The error code remains enough for an
    // operator to reconcile the event from the domain outbox.
    let code = error?.code || "REALTIME_PUBLISH_FAILED";
    try {
      normalizeRealtimeEvent(input);
    } catch (validationError) {
      code = validationError?.code || code;
    }
    logger?.warn?.(`[RealtimePublisher] ${code}`);
    return { status: "UNAVAILABLE", authoritative: true, event: null, code };
  }
}

