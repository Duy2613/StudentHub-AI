import { SecurityContext } from "../core/SecurityContext.js";
import { SecurityError } from "../core/SecurityErrorEnvelope.js";
import { RateLimiter } from "./RateLimiter.js";
import { getDemoAcceptanceRateLimitKey } from "../../server/auth/demoAcceptanceMode.js";

export class AuthRouteGuard {
  static assertRequestBodySize(request, { maxBodyBytes = 0 } = {}) {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
      throw new SecurityError({ code: "REQUEST_TOO_LARGE", message: "Authentication request is too large.", statusCode: 413 });
    }
  }

  static assertRequest(request, { action, maxRequests, maxBodyBytes = 0, verifiedIdentity = null }) {
    const context = SecurityContext.fromRequest(request);
    this.assertRequestBodySize(request, { maxBodyBytes });
    const acceptanceKey = getDemoAcceptanceRateLimitKey(verifiedIdentity, action);
    const rateLimitKey = acceptanceKey || `ip:${context.clientIp}:action:${action}`;
    RateLimiter.assertRateLimit(rateLimitKey, maxRequests, 60);
  }
}
