/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SecurityHeaders V1
 * 
 * HTTP Security Headers & Origin Restriction:
 * - Injects enterprise-grade CSP, HSTS, X-Content-Type-Options, Referrer-Policy
 * - Strictly rejects wildcard Access-Control-Allow-Origin on authenticated endpoints
 */

export const TRUSTED_ORIGINS = Object.freeze([
  "http://localhost:3000",
  "https://studenthub-ai.vercel.app",
  "https://studenthub.ai"
]);

function configuredConnectOrigins() {
  const values = [
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : "",
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "",
    typeof process !== "undefined" ? process.env.STUDENTHUB_ALLOWED_ORIGINS : "",
    typeof process !== "undefined" ? process.env.STUDENTHUB_LEGACY_VERIFICATION_BASE_URL : "",
    typeof process !== "undefined" ? process.env.LEGACY_VERIFICATION_BASE_URL : ""
  ];
  const origins = new Set(["'self'"]);
  for (const rawValue of values) {
    for (const rawOrigin of String(rawValue || "").split(",")) {
      try {
        const parsed = new URL(rawOrigin.trim());
        if (parsed.protocol === "http:" || parsed.protocol === "https:") origins.add(parsed.origin);
      } catch {
        // Invalid or empty configuration is not added to the browser policy.
      }
    }
  }
  return [...origins].join(" ");
}

export function getContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src " + configuredConnectOrigins()
  ].join("; ") + ";";
}

export class SecurityHeaders {
  /**
   * Applies standard security headers to a response
   * @param {Headers} headers 
   * @param {string} [requestOrigin]
   * @returns {Headers}
   */
  static applySecurityHeaders(headers, requestOrigin = null) {
    if (!headers) return headers;

    // 1. Content Security Policy (CSP)
    headers.set("Content-Security-Policy", getContentSecurityPolicy());

    // 2. Strict Transport Security (HSTS)
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    // 3. MIME Sniffing Protection
    headers.set("X-Content-Type-Options", "nosniff");

    // 4. Clickjacking Frame Protection
    headers.set("X-Frame-Options", "DENY");

    // 5. Referrer Policy
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // 6. Permissions Policy
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

    // 7. Strict CORS Origin Matching (Never wildcard * for credentials)
    const configuredOrigins = String(process.env.STUDENTHUB_ALLOWED_ORIGINS || "")
      .split(",")
      .map(origin => origin.trim())
      .filter(Boolean);
    const isPreviewOrigin = /^https:\/\/studenthub-ai(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(requestOrigin || "");
    if (requestOrigin && (TRUSTED_ORIGINS.includes(requestOrigin) || configuredOrigins.includes(requestOrigin) || isPreviewOrigin)) {
      headers.set("Access-Control-Allow-Origin", requestOrigin);
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Correlation-ID, X-Security-Purpose");
    }

    return headers;
  }
}
