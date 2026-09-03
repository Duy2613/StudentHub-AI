import { SecurityContext } from "../core/SecurityContext.js";
import { SecurityError } from "../core/SecurityErrorEnvelope.js";
import { RateLimiter } from "./RateLimiter.js";

export class AuthRouteGuard {
  static assertRequest(request, { action, maxRequests, maxBodyBytes = 0 }) {
    const context = SecurityContext.fromRequest(request);
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
      throw new SecurityError({ code: "REQUEST_TOO_LARGE", message: "Authentication request is too large.", statusCode: 413 });
    }
    RateLimiter.assertRateLimit(`ip:${context.clientIp}:action:${action}`, maxRequests, 60);
  }
}
