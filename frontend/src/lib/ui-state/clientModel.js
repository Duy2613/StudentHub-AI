let identityCounter = 0;

export function createWorkIdentity(prefix = "work") {
  const random = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${identityCounter += 1}`;
  return Object.freeze({ requestId: `${prefix}:request:${random}`, runId: `${prefix}:run:${random}` });
}

export function createStateEnvelope(options) {
  return Object.freeze({
    state: options.state,
    phase: options.phase || options.state,
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.error ? { error: options.error } : {}),
    unknowns: Object.freeze([...(options.unknowns || [])]),
    missing: Object.freeze([...(options.missing || [])]),
    ...(options.unavailable ? { unavailable: options.unavailable } : {}),
    ...(options.provenance ? { provenance: options.provenance } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.runId ? { runId: options.runId } : {}),
    retryable: options.retryable ?? options.error?.retryable ?? false,
    nextActions: Object.freeze([...(options.nextActions || [])]),
  });
}

export function createErrorState(error, options = {}) {
  return createStateEnvelope({ ...options, state: "ERROR", error });
}
