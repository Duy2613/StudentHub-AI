import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

export const LEGACY_VERIFICATION_CONFIG = Object.freeze({
  VERSION: "legacy-verification-adapter-v1",
  BASE_URL_ENV: "STUDENTHUB_LEGACY_VERIFICATION_BASE_URL",
  FALLBACK_BASE_URL_ENV: "LEGACY_VERIFICATION_BASE_URL",
  TIMEOUT_ENV: "STUDENTHUB_LEGACY_VERIFICATION_TIMEOUT_MS",
  RESOLVE_DNS_ENV: "STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS",
  MAX_REQUEST_BYTES: 512 * 1024,
  MAX_RESPONSE_BYTES: 384 * 1024,
  MAX_CONTENT_CHARS: 160_000,
  MAX_CLAIMS: 40,
  MAX_SOURCES: 80,
  MAX_EVIDENCE: 160,
  TIMEOUT_MS: 8_000,
  DNS_TIMEOUT_MS: 1_200,
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
  return Number.isFinite(parsed)
    ? Math.min(15_000, Math.max(300, Math.floor(parsed)))
    : LEGACY_VERIFICATION_CONFIG.TIMEOUT_MS;
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
  const preferred = envString(env, LEGACY_VERIFICATION_CONFIG.BASE_URL_ENV);
  const fallback = envString(env, LEGACY_VERIFICATION_CONFIG.FALLBACK_BASE_URL_ENV);
  const rawBaseUrl = preferred || fallback;
  const base = normalizedBaseUrl(rawBaseUrl);
  const timeoutMs = boundedTimeout(envString(env, LEGACY_VERIFICATION_CONFIG.TIMEOUT_ENV));
  const resolveDnsValue = envString(env, LEGACY_VERIFICATION_CONFIG.RESOLVE_DNS_ENV).toLowerCase();

  return Object.freeze({
    ...LEGACY_VERIFICATION_CONFIG,
    baseUrl: base.url,
    configured: Boolean(rawBaseUrl),
    enabled: base.ok,
    configError: base.ok ? null : base.code,
    timeoutMs,
    resolveDns: resolveDnsValue !== "false",
  });
}
