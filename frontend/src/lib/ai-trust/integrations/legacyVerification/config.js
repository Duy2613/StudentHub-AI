import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

export const LEGACY_VERIFICATION_CONFIG = Object.freeze({
  VERSION: "legacy-verification-adapter-v2",
  FRIEND_BASE_URL_ENV: "FRIEND_BACKEND_API_URL",
  FRIEND_API_KEY_ENV: "FRIEND_BACKEND_API_KEY",
  BASE_URL_ENV: "STUDENTHUB_LEGACY_VERIFICATION_BASE_URL",
  FALLBACK_BASE_URL_ENV: "LEGACY_VERIFICATION_BASE_URL",
  TIMEOUT_ENV: "STUDENTHUB_LEGACY_VERIFICATION_TIMEOUT_MS",
  RESOLVE_DNS_ENV: "STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS",
  MAX_ATTEMPTS_ENV: "STUDENTHUB_LEGACY_VERIFICATION_MAX_ATTEMPTS",
  RETRY_BASE_DELAY_ENV: "STUDENTHUB_LEGACY_VERIFICATION_RETRY_BASE_DELAY_MS",
  RETRY_MAX_DELAY_ENV: "STUDENTHUB_LEGACY_VERIFICATION_RETRY_MAX_DELAY_MS",
  CIRCUIT_FAILURE_THRESHOLD_ENV: "STUDENTHUB_LEGACY_VERIFICATION_CIRCUIT_FAILURE_THRESHOLD",
  CIRCUIT_COOLDOWN_ENV: "STUDENTHUB_LEGACY_VERIFICATION_CIRCUIT_COOLDOWN_MS",
  BULKHEAD_MAX_CONCURRENCY_ENV: "STUDENTHUB_LEGACY_VERIFICATION_BULKHEAD_MAX_CONCURRENCY",
  MAX_REQUEST_BYTES: 512 * 1024,
  MAX_RESPONSE_BYTES: 384 * 1024,
  MAX_CONTENT_CHARS: 160_000,
  MAX_CLAIMS: 40,
  MAX_SOURCES: 80,
  MAX_EVIDENCE: 160,
  TIMEOUT_MS: 8_000,
  DNS_TIMEOUT_MS: 1_200,
  MAX_ATTEMPTS: 2,
  RETRY_BASE_DELAY_MS: 150,
  RETRY_MAX_DELAY_MS: 2_000,
  CIRCUIT_FAILURE_THRESHOLD: 3,
  CIRCUIT_COOLDOWN_MS: 5_000,
  BULKHEAD_MAX_CONCURRENCY: 8,
  ENDPOINTS: Object.freeze({
    layer2: "/api/verify/layer2",
    layer3: "/api/verify/layer3",
    layer4: "/api/verify/layer4",
  }),
});

function envString(env, key) {
  return typeof env?.[key] === "string" ? env[key].trim() : "";
}

function boundedTimeout(value) {
  const parsed = Number(value);
  return value !== "" && Number.isFinite(parsed)
    ? Math.min(15_000, Math.max(300, Math.floor(parsed)))
    : LEGACY_VERIFICATION_CONFIG.TIMEOUT_MS;
}

function boundedInteger(value, { min, max, fallback }) {
  const parsed = Number(value);
  return value !== "" && Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, Math.floor(parsed)))
    : fallback;
}

function normalizedBaseUrl(raw) {
  if (!raw) return { ok: false, code: "NOT_CONFIGURED", url: "" };
  const validation = validateRemoteUrlSync(raw);
  if (!validation.ok) return { ok: false, code: validation.code, url: "" };
  try {
    const parsed = new URL(validation.url);
    if (parsed.search || parsed.hash) return { ok: false, code: "LEGACY_BASE_URL_QUERY_OR_HASH", url: "" };
    return { ok: true, code: null, url: parsed.toString().replace(/\/+$/, "") };
  } catch {
    return { ok: false, code: "INVALID_REMOTE_URL", url: "" };
  }
}

export function getLegacyVerificationConfig(env = process.env) {
  const friendBaseUrl = envString(env, LEGACY_VERIFICATION_CONFIG.FRIEND_BASE_URL_ENV);
  const preferred = friendBaseUrl || envString(env, LEGACY_VERIFICATION_CONFIG.BASE_URL_ENV);
  const fallback = envString(env, LEGACY_VERIFICATION_CONFIG.FALLBACK_BASE_URL_ENV);
  const rawBaseUrl = preferred || fallback;
  const apiKey = envString(env, LEGACY_VERIFICATION_CONFIG.FRIEND_API_KEY_ENV) || null;
  const base = normalizedBaseUrl(rawBaseUrl);
  const timeoutMs = boundedTimeout(envString(env, LEGACY_VERIFICATION_CONFIG.TIMEOUT_ENV));
  const resolveDnsValue = envString(env, LEGACY_VERIFICATION_CONFIG.RESOLVE_DNS_ENV).toLowerCase();
  const maxAttempts = boundedInteger(envString(env, LEGACY_VERIFICATION_CONFIG.MAX_ATTEMPTS_ENV), {
    min: 1,
    max: 4,
    fallback: LEGACY_VERIFICATION_CONFIG.MAX_ATTEMPTS,
  });
  const retryBaseDelayMs = boundedInteger(envString(env, LEGACY_VERIFICATION_CONFIG.RETRY_BASE_DELAY_ENV), {
    min: 0,
    max: 10_000,
    fallback: LEGACY_VERIFICATION_CONFIG.RETRY_BASE_DELAY_MS,
  });
  const retryMaxDelayMs = Math.max(retryBaseDelayMs, boundedInteger(envString(env, LEGACY_VERIFICATION_CONFIG.RETRY_MAX_DELAY_ENV), {
    min: 0,
    max: 30_000,
    fallback: LEGACY_VERIFICATION_CONFIG.RETRY_MAX_DELAY_MS,
  }));
  const circuitFailureThreshold = boundedInteger(envString(env, LEGACY_VERIFICATION_CONFIG.CIRCUIT_FAILURE_THRESHOLD_ENV), {
    min: 1,
    max: 20,
    fallback: LEGACY_VERIFICATION_CONFIG.CIRCUIT_FAILURE_THRESHOLD,
  });
  const circuitCooldownMs = boundedInteger(envString(env, LEGACY_VERIFICATION_CONFIG.CIRCUIT_COOLDOWN_ENV), {
    min: 100,
    max: 300_000,
    fallback: LEGACY_VERIFICATION_CONFIG.CIRCUIT_COOLDOWN_MS,
  });
  const bulkheadMaxConcurrency = boundedInteger(envString(env, LEGACY_VERIFICATION_CONFIG.BULKHEAD_MAX_CONCURRENCY_ENV), {
    min: 1,
    max: 128,
    fallback: LEGACY_VERIFICATION_CONFIG.BULKHEAD_MAX_CONCURRENCY,
  });

  return Object.freeze({
    ...LEGACY_VERIFICATION_CONFIG,
    baseUrl: base.url,
    configured: Boolean(rawBaseUrl),
    enabled: base.ok,
    configError: base.ok ? null : base.code,
    timeoutMs,
    resolveDns: resolveDnsValue !== "false",
    maxAttempts,
    retryBaseDelayMs,
    retryMaxDelayMs,
    circuitFailureThreshold,
    circuitCooldownMs,
    bulkheadMaxConcurrency,
    apiKey,
  });
}
