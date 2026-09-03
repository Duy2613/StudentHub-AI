/**
 * Cross-runtime opaque identifier helpers.
 *
 * Security, correlation, and persistence identifiers must not depend on
 * non-cryptographic pseudo-random APIs. Prefer the platform CSPRNG in both Node and browser/Edge
 * runtimes.  The last-resort fallback is intentionally marked as
 * non-authoritative and must never be used as a credential, proof, or
 * authorization key.
 */

let fallbackSequence = 0;

function normalizePrefix(prefix) {
  const normalized = String(prefix || "id")
    .replace(/[^A-Za-z0-9_.:-]/g, "_")
    .slice(0, 32);
  return normalized || "id";
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates an opaque bounded identifier.
 * @param {string} prefix
 * @returns {string}
 */
export function createSecureId(prefix = "id") {
  const cleanPrefix = normalizePrefix(prefix);
  const runtimeCrypto = globalThis.crypto;

  if (typeof runtimeCrypto?.randomUUID === "function") {
    return `${cleanPrefix}_${runtimeCrypto.randomUUID()}`;
  }

  if (typeof runtimeCrypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    runtimeCrypto.getRandomValues(bytes);
    return `${cleanPrefix}_${bytesToHex(bytes)}`;
  }

  fallbackSequence = (fallbackSequence + 1) % Number.MAX_SAFE_INTEGER;
  return `${cleanPrefix}_fallback_${Date.now().toString(36)}_${fallbackSequence.toString(36)}`;
}

/**
 * Creates a request correlation identifier safe for response headers.
 * @param {string} prefix
 * @returns {string}
 */
export function createCorrelationId(prefix = "sec") {
  return createSecureId(prefix).slice(0, 128);
}
