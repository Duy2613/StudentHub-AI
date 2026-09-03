/**
 * Bounded investigation accounting for Trust v5.
 *
 * The ledger is deliberately process-local and request-scoped. It limits the
 * work a single investigation may request; it is not a replacement for a
 * distributed identity/IP rate limiter or provider billing controls.
 */

export const INVESTIGATION_BUDGET_DEFAULTS = Object.freeze({
  maxElapsedMs: 30_000,
  maxProviderCalls: 12,
  maxSearchRequests: 8,
  maxResults: 80,
  maxEvidenceBytes: 1_048_576,
  maxAiTokens: 4_096,
  maxRetries: 4,
  maxEstimatedCostCents: 25,
});

const COUNTER_KEYS = Object.freeze({
  providerCalls: "maxProviderCalls",
  searchRequests: "maxSearchRequests",
  results: "maxResults",
  evidenceBytes: "maxEvidenceBytes",
  aiTokens: "maxAiTokens",
  retries: "maxRetries",
  estimatedCostCents: "maxEstimatedCostCents",
});

const TELEMETRY_KEYS = Object.freeze([
  "aiCalls",
  "legacyCalls",
  "googleThreatCalls",
  "tavilyCalls",
]);

function positiveLimit(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function codeForLimit(key) {
  return String(key).replace(/[A-Z]/g, (character) => `_${character}`).toUpperCase();
}

function safeLimits(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  return Object.freeze(Object.fromEntries(Object.entries(INVESTIGATION_BUDGET_DEFAULTS).map(([key, fallback]) => [
    key,
    positiveLimit(source[key], fallback),
  ])));
}

export class InvestigationBudgetExceededError extends Error {
  constructor(code, snapshot) {
    super("Investigation budget was exceeded.");
    this.name = "InvestigationBudgetExceededError";
    this.code = code;
    this.snapshot = snapshot;
  }
}

export function createInvestigationBudget({ limits = {}, clock = () => Date.now(), startedAt = null } = {}) {
  const resolvedLimits = safeLimits(limits);
  const now = typeof clock === "function" ? clock : () => Date.now();
  const startedClock = startedAt !== null && startedAt !== undefined && Number.isFinite(Number(startedAt))
    ? Number(startedAt)
    : Number(now());
  const counters = Object.fromEntries(Object.keys(COUNTER_KEYS).map((key) => [key, 0]));
  const telemetry = Object.fromEntries(TELEMETRY_KEYS.map((key) => [key, 0]));
  let blockedBy = null;

  const snapshot = () => Object.freeze({
    limits: resolvedLimits,
    usage: Object.freeze({ ...counters, ...telemetry }),
    elapsedMs: Math.max(0, Math.round(Number(now()) - startedClock)),
    blockedBy,
  });

  const checkElapsed = () => {
    if (Math.max(0, Number(now()) - startedClock) <= resolvedLimits.maxElapsedMs) return null;
    return "MAX_ELAPSED_MS";
  };

  const tryConsumeMany = (operations = []) => {
    if (!Array.isArray(operations) || operations.length === 0) {
      blockedBy = "INVALID_BUDGET_OPERATION";
      return { allowed: false, code: blockedBy, snapshot: snapshot() };
    }
    if (blockedBy) return { allowed: false, code: blockedBy, snapshot: snapshot() };
    const elapsedCode = checkElapsed();
    if (elapsedCode) {
      blockedBy = elapsedCode;
      return { allowed: false, code: blockedBy, snapshot: snapshot() };
    }
    const normalized = [];
    for (const operation of operations) {
      const kind = operation?.kind;
      const limitKey = COUNTER_KEYS[kind];
      const increment = Number(operation?.amount ?? 1);
      if (!limitKey || !Number.isFinite(increment) || increment < 0) {
        blockedBy = "INVALID_BUDGET_OPERATION";
        return { allowed: false, code: blockedBy, snapshot: snapshot() };
      }
      normalized.push({ kind, limitKey, increment });
    }
    const nextValues = { ...counters };
    for (const { kind, limitKey, increment } of normalized) {
      nextValues[kind] += increment;
      if (nextValues[kind] > resolvedLimits[limitKey]) {
        blockedBy = codeForLimit(limitKey);
        return { allowed: false, code: blockedBy, snapshot: snapshot() };
      }
    }
    for (const [kind, value] of Object.entries(nextValues)) counters[kind] = value;
    return { allowed: true, code: null, snapshot: snapshot() };
  };

  const tryConsume = (kind, amount = 1) => {
    const limitKey = COUNTER_KEYS[kind];
    const increment = Number(amount);
    if (!limitKey || !Number.isFinite(increment) || increment < 0) {
      blockedBy = "INVALID_BUDGET_OPERATION";
      return { allowed: false, code: blockedBy, snapshot: snapshot() };
    }
    if (blockedBy) return { allowed: false, code: blockedBy, snapshot: snapshot() };
    const elapsedCode = checkElapsed();
    if (elapsedCode) {
      blockedBy = elapsedCode;
      return { allowed: false, code: blockedBy, snapshot: snapshot() };
    }
    const next = counters[kind] + increment;
    if (next > resolvedLimits[limitKey]) {
      blockedBy = codeForLimit(limitKey);
      return { allowed: false, code: blockedBy, snapshot: snapshot() };
    }
    counters[kind] = next;
    return { allowed: true, code: null, snapshot: snapshot() };
  };

  const recordUsage = (kind, amount = 1) => {
    const increment = Number(amount);
    if (!TELEMETRY_KEYS.includes(kind) || !Number.isFinite(increment) || increment < 0) {
      return { recorded: false, code: "INVALID_USAGE_OPERATION", snapshot: snapshot() };
    }
    telemetry[kind] = Math.min(1_000_000, telemetry[kind] + increment);
    return { recorded: true, code: null, snapshot: snapshot() };
  };

  return Object.freeze({
    limits: resolvedLimits,
    tryConsume,
    tryConsumeMany,
    recordUsage,
    snapshot,
    isExhausted: () => Boolean(blockedBy),
    assertCanConsume: (kind, amount = 1) => {
      const result = tryConsume(kind, amount);
      if (!result.allowed) throw new InvestigationBudgetExceededError(result.code, result.snapshot);
      return result.snapshot;
    },
  });
}
