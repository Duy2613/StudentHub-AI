import crypto from "node:crypto";

/**
 * Canonical JSON profile shared by StudentHub and the Labbe reference client.
 *
 * The profile is deliberately small and deterministic:
 * - object keys are sorted using JavaScript/UTF-16 ordering;
 * - arrays retain their order;
 * - strings are emitted as UTF-8 JSON with non-ASCII code points preserved;
 * - numbers use ECMAScript JSON serialization (JSON.stringify);
 * - non-finite numbers, BigInts, undefined values, and lone surrogates are
 *   rejected instead of being silently converted.
 */

function assertUnicodeScalarString(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        index += 1;
        continue;
      }
      throw new TypeError("CANONICAL_JSON_LONE_SURROGATE");
    }
    if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError("CANONICAL_JSON_LONE_SURROGATE");
    }
  }
}

function normalize(value) {
  if (value === null) return null;

  if (typeof value === "string") {
    assertUnicodeScalarString(value);
    return value;
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("CANONICAL_JSON_NON_FINITE_NUMBER");
    return value;
  }

  if (typeof value === "undefined" || typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
    throw new TypeError("CANONICAL_JSON_UNSUPPORTED_VALUE");
  }

  if (Array.isArray(value)) return value.map(normalize);

  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("CANONICAL_JSON_PLAIN_OBJECT_REQUIRED");
    }
    const output = {};
    for (const key of Object.keys(value).sort()) {
      assertUnicodeScalarString(key);
      Object.defineProperty(output, key, {
        configurable: true,
        enumerable: true,
        value: normalize(value[key]),
        writable: true,
      });
    }
    return output;
  }

  throw new TypeError("CANONICAL_JSON_UNSUPPORTED_VALUE");
}

export function canonicalizeJsonValue(value) {
  return normalize(value);
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashCanonicalJson(value) {
  return sha256Hex(canonicalJson(value));
}
