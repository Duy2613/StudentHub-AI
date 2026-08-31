# 🛡️ Security Authority Matrix

> **Core Audit Question**: Do security checks occur on the Server, or does the Frontend client hold authority?

---

## 1. Authority Decision Map

```text
CLIENT (Browser)
   │
   ├── UI State Checks (e.g. show/hide buttons based on role) -> PRESENTATION ONLY
   │
   ▼ (HTTP Network Call)
   │
SERVER (Next.js Node.js Serverless Route Handlers)
   │
   ├── 1. Rate Limiting Check (RateLimiter.assertRateLimit) -> SERVER AUTHORITY (Enforced)
   ├── 2. Cryptographic JWT Verification (TokenValidator.validateToken) -> SERVER AUTHORITY (Enforced)
   ├── 3. Principal Identity Mapping (IdentityResolver.resolvePrincipal) -> SERVER AUTHORITY (Enforced)
   ├── 4. Operational Risk Engine (RiskEngine.assertAcceptableRisk) -> SERVER AUTHORITY (Enforced)
   ├── 5. Purpose Binding (PurposeValidator.assertPurposeValid) -> SERVER AUTHORITY (Enforced)
   ├── 6. Authorization (AuthorizationEngine.authorize RBAC/ABAC) -> SERVER AUTHORITY (Enforced)
   ├── 7. Object-Level Ownership (ObjectAuthorizer.assertAccess) -> SERVER AUTHORITY (Enforced*)
   └── 8. AI Tool Execution (AiToolFirewall.executeWithFirewall) -> SERVER AUTHORITY (Enforced)
```

---

## 2. Detailed Security Vector Audit

| Security Vector | Implementation Mechanism | Authority Layer | Tested & Verified? | Forensic Status |
|---|---|---|---|---|
| **Cryptographic Token Verification** | HMAC-SHA256 / RS256 signature, expiry, audience, issuer validation in `TokenValidator.js` | **SERVER** | Yes (`security_token_session.test.mjs`) | **SECURE** |
| **Role / Claim Tampering** | Server derives roles strictly from cryptographically signed JWT payload; ignores client JSON body roles | **SERVER** | Yes (`Attack 2` simulation) | **SECURE** |
| **Permission Injection** | Server evaluates required permission against internal role-permission matrix; rejects arbitrary client claims | **SERVER** | Yes (`Attack 3` simulation) | **SECURE** |
| **BOLA / IDOR Defense (Authenticated)** | `ObjectAuthorizer.assertAccess` enforces `principal.subjectId === resource.ownerId` | **SERVER** | Yes (`Attack 1` simulation) | **SECURE** |
| **BOLA / IDOR Defense (Anonymous Mode)** | Route handlers with `allowAnonymous: true` permit querying `?studentId=<OTHER_MSSV>` when no token is sent | **SERVER** | Failed in audit review | **VULNERABLE (P0)** |
| **AI Tool Firewall** | `AiToolFirewall` validates agent scope, purpose, and capability before tool execution; blocks direct DB/shell | **SERVER** | Yes (`security_ai_tool_firewall.test.mjs`) | **SECURE** |
| **Prompt Injection Quarantine** | `SocialContentFirewall` quarantines malicious payloads and wraps content in passive tags | **SERVER** | Yes (`social_ai_safety_firewall.test.mjs`) | **SECURE** |
| **Sensitive PII Exposure** | `GET /api/intelligence/experts/[expertId]` returns unmasked `privateContact` object from disk | **SERVER** | Failed in audit review | **VULNERABLE (P0)** |
| **Token Storage in Client** | Session tokens stored in `sessionStorage` / HTTP-only cookies; refresh token in Secure Cookie | **CLIENT/BROWSER** | Yes | **ACCEPTABLE** |
| **Data Retention Enforcement** | `DataRetentionManager` has rule methods, but lacks scheduled background deletion daemon | **SERVER** | Incomplete | **PARTIAL (P2)** |
