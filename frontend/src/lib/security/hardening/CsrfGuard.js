import { SecurityError } from "../core/SecurityErrorEnvelope.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const requestUrl = new URL(request.url);
  const requestHost = request.headers.get("host")?.trim();
  const requestProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || requestUrl.protocol.slice(0, -1);
  const headerOrigin = requestHost ? `${requestProtocol}://${requestHost}` : null;
  return new Set([requestUrl.origin, headerOrigin].filter(Boolean)).has(origin);
}

export class CsrfGuard {
  static assertRequestAllowed(request, { cookieAuthenticated = false } = {}) {
    if (!cookieAuthenticated || SAFE_METHODS.has(request.method.toUpperCase())) return;
    if (!isSameOriginRequest(request)) {
      throw new SecurityError({ code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin mutation rejected.", statusCode: 403 });
    }
  }
}
