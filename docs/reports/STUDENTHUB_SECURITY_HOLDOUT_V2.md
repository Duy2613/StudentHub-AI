# StudentHub AI — Security V2 Evidence

**N:** 105 bounded local vectors  
**Classification:** `SECURITY_VALIDATION_V1` (local property validation; external fuzz/staging holdout not established)

The harness now records only actual boundary outcomes. It calls the SSRF URL validator, PromptInjectionGuard/normalization, FileUploadSecurityBoundary, AuthorizationEngine/ObjectAuthorizer and CsrfGuard. No vector flag is used as a pass result.

| Category | Result |
|---|---:|
| SSRF / URL parsing | 25/25 neutralized |
| Prompt injection | 25/25 neutralized |
| HTML/SVG sanitization | 20/20 neutralized |
| File/upload invariants | 20/20 neutralized |
| Authorization/BOLA | 15/15 neutralized |
| Overall | 105/105 (100.0%) |

The exact CP 95% interval for the observed breach rate is 0.00%–3.45%. **Status:** `SECURITY_VALIDATION_V2_VERIFIED`. This does not substitute for unseen external fuzzing, real authentication/session infrastructure or staging deployment evidence.

