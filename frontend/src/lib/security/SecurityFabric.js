/**
 * StudentHub AI — Zero-Trust Security Fabric
 * Master SecurityFabric V1
 * 
 * Central Security Gateway & Orchestrator:
 * Integrates Identity, Session, Authorization (RBAC+ABAC+ReBAC), Capability,
 * Purpose, Risk, AI Firewall, Rate Limiting, Audit Telemetry, and Safe Responses.
 */

import { SecurityContext } from "./core/SecurityContext.js";

import { SecurityError } from "./core/SecurityErrorEnvelope.js";
import { IdentityResolver } from "./identity/IdentityResolver.js";
import { AuthorizationEngine, DECISION } from "./authorization/AuthorizationEngine.js";
import { PurposeValidator } from "./purpose/PurposeValidator.js";
import { RiskEngine } from "./risk/RiskEngine.js";
import { RateLimiter } from "./hardening/RateLimiter.js";
import { SecurityHeaders } from "./hardening/SecurityHeaders.js";
import { SecurityAuditLogger, SECURITY_EVENT_TYPE } from "./audit/SecurityAuditLogger.js";
import { CsrfGuard } from "./hardening/CsrfGuard.js";

export class SecurityFabric {
  /**
   * Wraps an HTTP route handler with the complete Zero-Trust Security Fabric pipeline
   * @param {object} policyConfig
   * @param {string} policyConfig.action - e.g. "READ_TRANSCRIPT", "PLAN_SEMESTER"
   * @param {string} [policyConfig.requiredPermission] - e.g. "ACADEMIC.READ_OWN"
   * @param {string[]} [policyConfig.requiredScopes] - e.g. ["academic:read"]
   * @param {boolean} [policyConfig.allowAnonymous] - default false
   * @param {boolean} [policyConfig.rateLimit] - default true
   * @param {number} [policyConfig.maxRequests] - default 100
   * @param {Function} [handler] - async (request, routeContext, principal, secContext) => Response
   * @param {Function} [policyConfig.handler] - compatibility form receiving a named context object
   * @returns {Function} Next.js Route Handler
   */
  static wrapHandler(policyConfig = {}, handler) {
    const embeddedHandler = policyConfig.handler;
    const routeHandler = typeof handler === "function" ? handler : embeddedHandler;

    if (typeof routeHandler !== "function") {
      throw new TypeError("SecurityFabric.wrapHandler requires a route handler function.");
    }

    const usesEmbeddedHandler = typeof handler !== "function" && typeof embeddedHandler === "function";
    const {
      action = "GENERAL_OPERATION",
      requiredPermission = null,
      requiredScopes = [],
      allowAnonymous = false,
      rateLimit = true,
      maxRequests = 120,
      maxBodyBytes = 256 * 1024
    } = policyConfig;

    return async (request, routeParams) => {
      const secContext = SecurityContext.fromRequest(request);
      const correlationId = secContext.correlationId;
      const clientIp = secContext.clientIp;
      const origin = request.headers.get("origin");

      try {
        const requestHasBody = !["GET", "HEAD", "OPTIONS"].includes(request.method);
        const declaredLength = Number(request.headers.get("content-length") || 0);
        if (requestHasBody && Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
          throw new SecurityError({
            code: "REQUEST_TOO_LARGE",
            message: `Request body exceeds the ${maxBodyBytes}-byte limit.`,
            statusCode: 413,
            correlationId
          });
        }

        // 1. Rate Limiting Check
        if (rateLimit) {
          RateLimiter.assertRateLimit(`ip:${clientIp}:action:${action}`, maxRequests, 60);
        }

        // 2. Authentication & Identity Resolution
        const principal = await IdentityResolver.resolvePrincipal(request, { allowAnonymous });
        const usesBearer = request.headers.get("authorization")?.startsWith("Bearer ");
        // Treat both the durable StudentHub session and the Supabase access
        // cookie as browser credentials.  Mutations authenticated by either
        // cookie must pass the same-origin CSRF check; bearer-only API calls
        // remain stateless and are not subject to cookie CSRF.
        const usesSessionCookie = /(?:^|;\s*)(?:studenthub_session|sb-access-token)=/.test(request.headers.get("cookie") || "");
        CsrfGuard.assertRequestAllowed(request, { cookieAuthenticated: usesSessionCookie && !usesBearer });

        // 3. Operational Risk Evaluation
        const riskResult = RiskEngine.evaluateRisk({
          principal,
          action,
          context: secContext
        });
        RiskEngine.assertAcceptableRisk(riskResult, correlationId);

        // 4. Purpose Binding Check
        if (secContext.purpose && secContext.purpose !== "GENERAL_OPERATION") {
          PurposeValidator.assertPurposeValid(action, secContext.purpose);
        }

        // 5. Authorization Evaluation (RBAC + ABAC + ReBAC + Scopes)
        const authzDecision = AuthorizationEngine.authorize({
          principal,
          action,
          requiredPermission,
          requiredScopes,
          purpose: secContext.purpose,
          context: secContext,
          allowAnonymous
        });

        if (!authzDecision.allowed) {
          if (authzDecision.decision === DECISION.STEP_UP) {
            SecurityAuditLogger.logEvent({
              eventType: SECURITY_EVENT_TYPE.AUTHZ_STEP_UP,
              subject: principal.subjectId,
              action,
              decision: "STEP_UP",
              reason: authzDecision.reason,
              correlationId,
              clientIp
            });
            throw SecurityError.stepUpRequired(authzDecision.reason, correlationId);
          }

          SecurityAuditLogger.logEvent({
            eventType: SECURITY_EVENT_TYPE.AUTHZ_DENY,
            subject: principal.subjectId,
            action,
            decision: "DENY",
            reason: authzDecision.reason,
            correlationId,
            clientIp
          });

          throw SecurityError.forbidden(authzDecision.reason, correlationId);
        }

        // Log successful authorization
        SecurityAuditLogger.logEvent({
          eventType: SECURITY_EVENT_TYPE.AUTHZ_ALLOW,
          subject: principal.subjectId,
          action,
          decision: "ALLOW",
          correlationId,
          clientIp
        });

        // 6. Execute Route Handler inside Security Context
        const response = await secContext.run(() => usesEmbeddedHandler
          ? routeHandler({
              request,
              routeParams,
              principal,
              securityContext: secContext,
              correlationId
            })
          : routeHandler(request, routeParams, principal, secContext));

        // 7. Inject Security Headers & Correlation ID
        if (response instanceof Response) {
          response.headers.set("x-correlation-id", correlationId);
          SecurityHeaders.applySecurityHeaders(response.headers, origin);
          return response;
        }

        return response;
      } catch (err) {
        // Handle Security & Domain Exceptions cleanly
        const isSecError = err instanceof SecurityError;
        const statusCode = isSecError ? err.statusCode : 500;
        const payload = isSecError
          ? err.toResponsePayload()
          : {
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while processing your request.",
                userMessage: "An error occurred while processing your request.",
                correlationId,
                requestId: correlationId,
                retryable: false,
                timestamp: new Date().toISOString()
              }
            };

        // Telemetry logging for failures
        SecurityAuditLogger.logEvent({
          eventType: isSecError && statusCode === 401
            ? SECURITY_EVENT_TYPE.AUTH_TOKEN_REJECTED
            : SECURITY_EVENT_TYPE.SECURITY_POLICY_VIOLATION,
          subject: "unknown",
          action,
          decision: "DENY",
          reason: err.code || err.name || "REQUEST_FAILED",
          correlationId,
          clientIp,
          details: { errorName: err.name, statusCode }
        });

        const errorResponse = Response.json(payload, { status: statusCode });
        errorResponse.headers.set("x-correlation-id", correlationId);
        SecurityHeaders.applySecurityHeaders(errorResponse.headers, origin);
        return errorResponse;
      }
    };
  }
}
