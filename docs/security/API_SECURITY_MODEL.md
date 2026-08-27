# 🛡️ StudentHub AI — API Security Model V1

> **Document Version**: `1.0.0` | **Status**: `PRODUCTION-READY LOCKED`  
> **API Contracts**: Authentication, Authorization, Roles, Permissions, Scopes, Capabilities, Purpose, Rate Limits, and Error Codes.

---

## 1. Authentication & Identity Flow

All API endpoints follow a Zero-Trust identity pattern:

```text
HTTP Request
  ↓
Extract Bearer Token / Session Cookie
  ↓
TokenValidator (Validate Signature, iss, aud, exp, nbf, alg)
  ↓
SessionManager (Validate Revocation, Absolute/Idle Timeout)
  ↓
Construct Immutable SecurityPrincipal
  ↓
SecurityContext Initialization (Correlation ID, IP, User-Agent)
```

Client-provided `studentId` or `role` parameters in request bodies or query parameters are **NEVER** used to establish identity.

---

## 2. Standard Security HTTP Headers

Every response processed through the Security Fabric contains:

| Header | Production Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Blocks MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects sensitive URL referrers |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | Restricts browser device APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS strictly |
| `Content-Security-Policy` | `default-src 'self' ...` | Prevents XSS / unauthorized asset loads |
| `x-correlation-id` | `sec_...` | Request tracing identifier |

---

## 3. Scopes & Permission Taxonomy

### 3.1 OAuth / Token Scopes
- `academic:read`: Read academic records, courses, transcripts, schedules, and roadmap.
- `academic:plan`: Generate What-If simulations, plan semesters, and update task progress.
- `academic:export`: Export certified student transcripts (requires AAL2 Step-Up).
- `trust:read`: Read epistemic trust verdicts, claim graphs, and citations.
- `trust:evaluate`: Run AI Trust engine evaluations.
- `expert:read`: Query expert knowledge graph and scopes.
- `community:read`: Read community posts, experience consensus, and friction heatmaps.
- `community:post`: Submit student experiences and forum comments.
- `admin:security`: Manage security policies, audit logs, and session revocations.

### 3.2 Granular RBAC Permissions
- `ACADEMIC.READ_OWN`: View own academic profile & records.
- `ACADEMIC.READ_ANY`: Administrative access across cohorts.
- `ACADEMIC.PLAN_OWN`: Create/adopt personalized semester plans.
- `ACADEMIC.EXPORT_OWN`: Request certified PDF export.
- `ACADEMIC.MODIFY_OFFICIAL`: Strictly prohibited for students & AI agents.
- `ADMIN.SECURITY`: Security administration operations.

---

## 4. Standard Error Envelopes & HTTP Codes

All endpoints emit standard RFC-7807 compatible error payloads with zero internal leakages:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource.",
    "correlationId": "sec_1787810261399_9b796zhp",
    "timestamp": "2026-08-27T05:57:41.401Z"
  }
}
```

### Step-Up Challenge (HTTP 403 / STEP_UP_REQUIRED)
```json
{
  "error": {
    "code": "STEP_UP_REQUIRED",
    "message": "High-risk operation requires step-up authentication challenge.",
    "correlationId": "sec_1787810261405_krkxv9eg",
    "stepUpChallenge": {
      "type": "STEP_UP_AUTHENTICATION",
      "requiredAssurance": "AAL2_STEP_UP",
      "challengeUrl": "/auth/step-up"
    },
    "timestamp": "2026-08-27T05:57:41.406Z"
  }
}
```
