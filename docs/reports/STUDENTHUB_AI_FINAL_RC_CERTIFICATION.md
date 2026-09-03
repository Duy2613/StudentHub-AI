# StudentHub AI Final RC Certification

Final status: `FINAL_RC_BLOCKED_BY_SECURITY`

Environment status: `FINAL_RC_BLOCKED_BY_ENVIRONMENT`

This is a release-gate record, not a claim that production or live staging is
ready. The current working tree contains uncommitted repository changes. The
base `HEAD` observed for this record is
`958b99210b2e0f4ddb9ce6eb412e819d5549f4f3`; it is not a release artifact SHA.

## 1. Final status

Repository engineering is materially advanced, but the P0 friend-backend
credential incident is not externally confirmed resolved and live environment
evidence is absent. Production release is blocked.

## 2. Release SHA

Base HEAD: `958b99210b2e0f4ddb9ce6eb412e819d5549f4f3`. A clean release SHA must
be established after review and before staging/RC.

## 3. Architecture

Canonical flow is `Canonical Trust API -> TrustOrchestrator -> ProviderGateway
-> normalized observations -> deterministic policy -> Report/TrustGraph/
Passport`. The friend backend is compatibility-only.

## 4. Product scope

Frozen scope remains `/trust`, `/community`, `/expert`, `/cases`, and required
dashboard/profile/settings/auth surfaces. No feature-sprawl or visual redesign
is certified here.

## 5. Trust semantics

`UNKNOWN`, `UNAVAILABLE`, `PARTIAL`, and `NO_KNOWN_THREAT` never become proof of
safety. AI/provider confidence cannot override hard negatives or deterministic
policy.

## 6. Golden baseline

Historical reports remain immutable evidence. Current local baseline must be
recorded against the current identifiable working revision; no live/RC claim
is made from historical numbers alone. The working tree remains dirty, so the
current evidence is repository evidence rather than a release-SHA claim.

## 7. Test matrix

Verified locally on the current working tree:

- Full discovered regression: `272/272` test files passed via root `npm test`.
- Focused legacy adapter: `26/26`; gateway: `4/4`; provenance: `2/2`; evidence
  bindings: `3/3`; investigation budget: `3/3`; sequential/orchestrator
  Trust family: `67/67`.
- `npm run lint`: 0 errors, 332 warnings.
- `npm run build`: passed with Next `16.3.0`; TypeScript validation passed and
  `119/119` static pages were generated.
- Security suite: `37/37`; final audit: `7/7`; Phase 2 auth: `10/10`; Phase 3
  contract: `5/5`.
- Bundle budget audit passed; the `/trust`, `/community`, and `/expert` route
  groups each remained below the configured 500,000-byte budget.
- `npm audit --omit=optional --audit-level=high`: 0 vulnerabilities.

The Phase 3 live database gate remains `BLOCKED_BY_DATABASE_ENV` because
`STUDENTHUB_RLS_TEST_DATABASE_URL` is not configured. This is not a test pass
or a live-release claim.

## 8. Browser matrix

No staging/live browser assurance is claimed. The previous full local matrix
recorded `158 passed`, `67 failed`, and `12 skipped` out of `237`: Chromium and
Mobile Chromium were green, while Windows Firefox had `66` executable launch
failures (`spawn UNKNOWN`) and one WebKit selector failure. After correcting
that test selector, the current WebKit rerun passed `64/70` with `6` existing
demo/visual-baseline skips. Firefox still requires a supported CI/Linux
runner; its launch failures must not be labeled as product passes.

## 9. Accessibility

Existing accessibility contracts remain in scope. Serious/critical Axe status
for the current repository revision passed in the local Playwright Chromium and
WebKit coverage where executable, including the current WebKit accessibility
suite. Existing visual baselines are intentionally skipped by configuration.
Staging/device accessibility remains `NOT_VERIFIED`.

## 10. Performance

Bundle budget verification passed locally as recorded in Section 7. Current
staging LCP, CLS, TBT, responsiveness, memory, field CWV, and device/GPU
telemetry remain `NOT_VERIFIED`.

## 11. Database

StudentHub-owned Supabase remains canonical. Friend EF migrations/models are
not copied or applied. Clean migration/checksum/backup evidence is pending.

## 12. RLS

Default-deny, owner-bound policy and the required identity matrix are
documented. Live cross-user execution is `BLOCKED_BY_DATABASE_ENV`.

## 13. Auth/session

Identity is server-derived with durable-session safeguards in the repository.
Live issuer/audience/JWKS/revocation/restart proof is pending approved staging.

## 14. Storage/privacy

Private screenshot bucket, bounded object rules, signed access, deletion, and
orphan consistency are required. Live object-level proof is unavailable.

## 15. Passport

Passport events are append-oriented; idempotent retries do not duplicate a
logical event, and decision revisions preserve history. Durable cross-user
execution remains pending.

## 16. Providers

Capability ports and legacy adapter resilience are implemented. Native provider
success, current terms/quotas, shadow comparison, and live failure matrix are
not verified.

## 17. AI Gateway

Capability-based model routing, fallback, structured validation, prompt-injection
boundaries, and citation binding are implemented. No live AI provider success is
claimed without approved credentials and staging evidence.

## 18. Provenance

`SourceDocument`, `RetrievalRun`, `EvidenceObservation`, `ProviderObservation`,
`ClaimEvidenceLink`, and `DecisionRevision` are represented with origin-scoped
identities and bounded content fingerprints.

## 19. TrustGraph

The graph projects only normalized records and now represents claims, source
documents, retrieval runs, observations, providers, relationships, and decision
revisions. Graph failure must remain localized with list fallback.

## 20. Community

Community observations, corroboration, disagreement, and emerging patterns are
contextual signals; popularity does not set canonical truth.

## 21. Expert

Expert authority remains scoped to domain, credentials, verification, conflict,
reviewed evidence, and limitations. No global friend `TrustScore` is adopted.

## 22. Security

The P0 exposed friend-backend credential remains a release blocker until the
owner confirms rotation/revocation and old-credential rejection. Provider,
SSRF, prompt-injection, raw-error, and CORS controls are documented/covered
locally where applicable.

## 23. Supply chain

The canonical source-only secret scan found no production-source matches when
docs, synthetic tests, dependencies, and build output were excluded. The API
authorization inventory covers `112` route files and `139` handlers, with
`0` unprotected mutations requiring P0 review. `npm audit
--omit=optional --audit-level=high` found `0` vulnerabilities. The friend
dependency vulnerability remains an external risk unless a local owned copy
is maintained; it is not imported into the canonical app by this change.

## 24. Observability

Safe request/correlation IDs, layer, provider, duration, outcome, retry/error
category, circuit state, and budget dimensions are the allowed operational
shape. Raw URLs/content/tokens are excluded. The request-scoped budget ledger
is implemented and exposes bounded counters, but provider billing, exact model
token usage, and currency cost remain `NOT_VERIFIED` without approved
provider telemetry.

## 25. Health/readiness

`/api/health/live` reports process liveness and `/api/health/ready` checks
required configured dependencies. Live readiness is not asserted here.

## 26. Rate limiting

Security Fabric and provider adapter limits are bounded and Retry-After-aware.
Process-local controls are not represented as globally distributed limits.

## 27. Backup/restore

The procedure exists, but disposable staging snapshot/restore evidence is
`BLOCKED_BY_ENV`.

## 28. Incident readiness

The credential incident record, provider rollback procedure, staging gates, and
human action manifest exist. Contact/rotation execution remains owner work.

## 29. Rollback

Capability flag rollback is documented and repository-tested. A deployment and
database rollback rehearsal has not been executed against approved staging.

## 30. Known limitations

See `docs/KNOWN-LIMITATIONS.md`, `docs/ROLLBACK-REHEARSAL.md`, and the live
assurance rerun report. Missing security/data/provider evidence is a blocker,
not an accepted cosmetic limitation.

## 31. Human actions

See `docs/reports/HUMAN_ACTION_REQUIRED.md`: credential rotation/revocation,
approved staging Supabase/storage/provider configuration, authorized remote
migrations/users/deployment, and live assurance execution.

## 32. Release recommendation

Do not promote to production. Continue repository review and local regression;
after the P0 and environment gates are satisfied, rerun live assurance and
issue a new certification against a clean release SHA.
