/**
 * Layer 2A reputation disclosure policy.
 *
 * This is a local, synchronous classification boundary. It decides whether
 * a URL may be disclosed to a reputation provider; it never fetches, renders,
 * or executes the target. Private/metadata/SSRF-sensitive destinations are
 * never sent to an external provider, even when Layer 1 already produced a
 * hard negative.
 */

import {
  isBlockedHostname,
  isPrivateAddress,
  normalizeHostname,
  validateRemoteUrlSync,
} from "../../security/hardening/SafeRemoteUrl.js";

export const REPUTATION_LOOKUP_POLICY = Object.freeze({
  ALLOW: "ALLOW",
  REDACT: "REDACT",
  SKIP: "SKIP",
});

export const REPUTATION_LOOKUP_REASON = Object.freeze({
  PUBLIC_SECURITY_TARGET: "PUBLIC_SECURITY_TARGET",
  PRIVATE_NETWORK_TARGET: "PRIVATE_NETWORK_TARGET",
  SSRF_TARGET: "SSRF_TARGET",
  METADATA_TARGET: "METADATA_TARGET",
  SENSITIVE_URL: "SENSITIVE_URL",
  INVALID_URL: "INVALID_URL",
  OTHER: "OTHER",
});

export const REPUTATION_LOOKUP_STATUS = Object.freeze({
  LOOKUP_PERFORMED: "LOOKUP_PERFORMED",
  LOOKUP_REDACTED: "LOOKUP_REDACTED",
  SKIPPED_PRIVACY_SAFETY: "SKIPPED_PRIVACY_SAFETY",
});

const METADATA_HOSTNAMES = new Set([
  "169.254.169.254",
  "100.100.100.200",
  "metadata.google.internal",
  "metadata.google",
]);

const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "api_key",
  "apikey",
  "auth",
  "code",
  "cookie",
  "jwt",
  "key",
  "otp",
  "pass",
  "password",
  "secret",
  "session",
  "signature",
  "sig",
  "token",
]);

function parsedUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function safeDecision(policy, reason, targetClass, lookupUrl = null) {
  return Object.freeze({
    policy,
    reason,
    targetClass,
    // This field is internal-only. Callers must never expose it in a DTO or
    // stage response; it exists solely for the provider invocation boundary.
    lookupUrl,
    disclosed: policy !== REPUTATION_LOOKUP_POLICY.SKIP,
    redacted: policy === REPUTATION_LOOKUP_POLICY.REDACT,
  });
}

function hasSensitiveQuery(parsed) {
  for (const key of parsed.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(String(key).toLowerCase())) return true;
  }
  // Fragments are not sent by an HTTP client to the destination, but they are
  // still disclosure material when the complete URL is handed to a provider.
  // Redact them so client-side tokens, document anchors, and opaque state are
  // never treated as safe-to-disclose URL content.
  return Boolean(parsed.hash);
}

function redactedUrl(parsed) {
  const clone = new URL(parsed.toString());
  clone.search = "";
  clone.hash = "";
  return clone.toString();
}

export function decideReputationLookup(value) {
  if (typeof value !== "string" || !value.trim()) {
    return safeDecision(
      REPUTATION_LOOKUP_POLICY.SKIP,
      REPUTATION_LOOKUP_REASON.INVALID_URL,
      "INVALID_URL",
    );
  }

  const staticResult = validateRemoteUrlSync(value);
  const parsed = parsedUrl(value);
  if (!parsed || !staticResult.ok) {
    const hostname = normalizeHostname(parsed?.hostname);
    if (hostname && METADATA_HOSTNAMES.has(hostname)) {
      return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.METADATA_TARGET, "METADATA_TARGET");
    }
    if (hostname && isPrivateAddress(hostname)) {
      return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.PRIVATE_NETWORK_TARGET, "PRIVATE_NETWORK_TARGET");
    }
    if (hostname && isBlockedHostname(hostname)) {
      return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.SSRF_TARGET, "SSRF_TARGET");
    }
    if (parsed?.username || parsed?.password) {
      return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.SENSITIVE_URL, "URL_CREDENTIALS");
    }
    return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.INVALID_URL, "INVALID_URL");
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (METADATA_HOSTNAMES.has(hostname)) {
    return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.METADATA_TARGET, "METADATA_TARGET");
  }
  if (isPrivateAddress(hostname)) {
    return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.PRIVATE_NETWORK_TARGET, "PRIVATE_NETWORK_TARGET");
  }
  if (isBlockedHostname(hostname)) {
    return safeDecision(REPUTATION_LOOKUP_POLICY.SKIP, REPUTATION_LOOKUP_REASON.SSRF_TARGET, "SSRF_TARGET");
  }
  if (hasSensitiveQuery(parsed)) {
    return safeDecision(
      REPUTATION_LOOKUP_POLICY.REDACT,
      REPUTATION_LOOKUP_REASON.SENSITIVE_URL,
      "SENSITIVE_URL",
      redactedUrl(parsed),
    );
  }

  return safeDecision(
    REPUTATION_LOOKUP_POLICY.ALLOW,
    REPUTATION_LOOKUP_REASON.PUBLIC_SECURITY_TARGET,
    "PUBLIC_SECURITY_TARGET",
    staticResult.url,
  );
}
