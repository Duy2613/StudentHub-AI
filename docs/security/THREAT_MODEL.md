# 🛡️ StudentHub AI — Threat Model V1 (STRIDE & OWASP API 2023 / GenAI 2025)

> **Document Version**: `1.0.0` | **Status**: `PRODUCTION-READY LOCKED`  
> **Methodology**: STRIDE + OWASP API Security Top 10 + OWASP Top 10 for LLM Applications

---

## 1. Threat Actors & Attacker Profiles

| Attacker ID | Profile Description | Primary Vector | Mitigation in Security Fabric |
|---|---|---|---|
| **Attacker A** | Unauthenticated Internet Attacker | Endpoint probing, parameter pollution, DDoS | Fail-closed defaults, Next.js Edge Guard, RateLimiter, CSP/HSTS |
| **Attacker B** | Authenticated Malicious Student | Student ID swap, BOLA, BFLA, parameter tampering | `ObjectAuthorizer`, `ReBACPolicy`, server-side derived `SecurityPrincipal` |
| **Attacker C** | Compromised Student Account | Session hijacking, credential stuffing | Multi-tier session revocation, absolute/idle timeout, AAL2 Step-Up |
| **Attacker D** | Stolen Access Token | Token replay across services, audience confusion | Cryptographic audience/issuer validation, single-use capability tokens |
| **Attacker E** | Malicious AI Prompt / Jailbreak | Direct prompt injection via user input | `AdversarialTrustGuard` parameter sanitization, instruction isolation |
| **Attacker F** | Prompt-Injected AI Agent | Tool privilege escalation, indirect injection | `AiToolFirewall` schema checks, strict Tool Allowlist, output minimization |
| **Attacker G** | Compromised Internal Service | Service-to-service impersonation | Signed micro-tokens, audience pinning, zero implicit trust |
| **Attacker H** | Malicious Privileged User | Rogue admin action, data exfiltration | Immutable structured audit telemetry (`SecurityAuditLogger`), AAL3 |
| **Attacker I** | Replay Attacker | Intercepting and re-submitting capabilities | `CapabilityManager` with nonce, max-uses tracking (`usedCount >= maxUses`) |
| **Attacker J** | Enumeration Attacker | Student ID / Email probing | Constant-time string matching, uniform non-disclosing error envelopes |

---

## 2. STRIDE Threat Analysis Matrix

| STRIDE Category | Specific Threat in StudentHub AI | Impact | Security Fabric Countermeasure |
|---|---|---|---|
| **Spoofing** | Forging JWT token or studentId in query string | High | Cryptographic signature validation with pinned algorithms; client-provided IDs ignored. |
| **Tampering** | Mutating task state machine or modifying official transcript | Critical | Hard safety rules (`ACADEMIC.MODIFY_OFFICIAL` blocked); task revision locks. |
| **Repudiation** | Denying sensitive operations (e.g. transcript export) | Medium | Immutable structured security audit telemetry (`SecurityAuditLogger`) with correlation IDs. |
| **Information Disclosure**| Exposing another student's transcript or admin notes | High | `ObjectAuthorizer` (BOLA guard) & `PropertyFilter` data minimization. |
| **Denial of Service** | Resource exhaustion via expensive What-If queries or spam | High | Sliding window `RateLimiter` and query bounds. |
| **Elevation of Privilege**| AI agent requesting administrative or database access | Critical | `AiDelegationEngine` & `AiToolFirewall` restricting capabilities to bounded student scopes. |

---

## 3. Residual Risks & Ongoing Hardening
1. **Client-Side Physical Key Compromise**: Mitigated by short-lived session lifetimes (30 min idle, 24h absolute) and immediate global revocation hooks.
2. **Third-Party Identity Provider Outages**: Mitigated by graceful cold-start handling and fallback diagnostic logging.
