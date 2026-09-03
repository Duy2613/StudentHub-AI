import { SecurityError } from "../core/SecurityErrorEnvelope.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class CsrfGuard {
  static assertRequestAllowed(request, { cookieAuthenticated = false } = {}) {
    if (!cookieAuthenticated || SAFE_METHODS.has(request.method.toUpperCase())) return;
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      throw new SecurityError({ code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin mutation rejected.", statusCode: 403 });
    }
  }
}
