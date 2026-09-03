# StudentHubAI Known Limitations

This document is intentionally explicit about what was not provable in the current local environment. A limitation is not a hidden feature request; it is a release condition, operational dependency, or bounded residual risk.

## External verification blockers

| Limitation | What is blocked | Required input | Reproduction/proof | Risk |
| --- | --- | --- | --- | --- |
| Live PostgreSQL/Supabase proof | Migration, RLS, restart, and durable concurrency certification | Disposable `STUDENTHUB_RLS_TEST_DATABASE_URL` with approved schema | `npm run test:phase3-live` currently reports `BLOCKED_BY_DATABASE_ENV` | Production data isolation is not locally certified against a real database |
| Staging E2E | Operator-owned case matrix, auth cookies, rollback rehearsal | `STUDENTHUB_STAGING_BASE_URL` plus external `STUDENTHUB_STAGING_CASES_PATH` (and optional storage state) | The approved Vercel preview is smoke-verified; `npm run test:e2e:staging` still reports missing `STUDENTHUB_STAGING_CASES_PATH` | Deployment and network policy remain only partially verified |
| Live AI/search/OCR/provider evidence | Provider latency, quotas, terms, grounding, and cost measurement | Fresh approved secrets, provider allowlists, and terms review; never historical archives | Run the provider-specific live/staging suites after secrets are provisioned | Offline fallbacks prove contracts, not third-party service quality |
| Firefox on this Windows host | Local Firefox assertions and snapshots | Repair/reinstall the Playwright Firefox runtime; Linux CI is already green | `npx playwright test --project=firefox --grep "canonical product navigation"` fails at launch with `spawn UNKNOWN` | Linux Firefox CI passes; Windows parity remains environment-blocked |

## Product and operational residuals

## Lint warning classification

The final lint run reports 359 warnings and 0 errors. No warning in the audited Security Fabric, Trust ownership, outbound URL, or public DTO hardening files is release-blocking.

- **A — release-blocking correctness/security:** 0 confirmed warnings. Any future warning in an auth, ownership, SSRF, secret-handling, or provider-boundary file must be escalated to A.
- **B — maintainability debt:** 286 `@typescript-eslint/no-unused-vars` warnings, plus 4 `react-hooks/exhaustive-deps` and 2 `react-hooks/immutability` warnings where a surgical owner can safely remove the debt.
- **C — stylistic/non-blocking:** 31 `react-hooks/set-state-in-effect`, 28 `react/no-unescaped-entities`, 5 `react-hooks/purity`, and 2 `@next/next/no-img-element` warnings.
- **D — generated/legacy compatibility:** warnings in test/fixture/legacy compatibility surfaces and one rule-id-less parser-compatible warning; retain until the owning surface is migrated, without global suppression.

The warning total is tracked as debt; no broad cleanup or deletion was performed during RC closure.

- The AI Observatory is a `LOCAL_SYNTHETIC_BENCHMARK` and is explicitly non-authoritative. It does not report live provider quality or measured cost.
- In-memory stores/adapters remain suitable for deterministic local tests and demo mode only. Durable production behavior requires the configured database and repository implementations.
- The current Content Security Policy still contains `unsafe-inline` for compatibility with existing framework/runtime surfaces. Removing it requires a nonce/hash migration and a separate browser audit.
- The legacy client-side auth error translator retains a generic raw fallback for backward compatibility with an existing contract test. Server envelopes and security logs are sanitized; this fallback must not be used as an API error payload.
- The lint command exits successfully but reports legacy warnings. Warnings are tracked debt, not a reason to suppress the rule globally.
- Configured institutional RSS and GitHub connectors are provider-controlled. They are guarded and bounded, but their freshness, terms, and correctness still require live source review.
- Custom test transports can bypass the production network path by design. Production uses the guarded fetcher; tests must not be interpreted as proof that an arbitrary injected transport is safe.
- Demo fixtures are useful for deterministic judging but do not establish real-world prevalence, current prices, current deadlines, or provider uptime.
- GenSpark AI Drive is an optional, server-only compatibility bridge and is disabled by default (`GENSPARK_AIDRIVE_ENABLED=false`); normal competition workflows do not require its token or provider.

## Not limitations

- No credentials, FUSE archives, or historical configuration bundles were copied into the product.
- No feature work is pending as a prerequisite for the local feature-freeze gates. Remaining work is verification, environment provisioning, or the bounded residuals above.
