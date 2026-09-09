# StudentHub VNext — Principal Release Audit

Date: 2026-09-08 (Asia/Bangkok)  
Branch: `design/academic-cinematic-product-evolution`  
HEAD at audit start: `4b8f9fd12667bd727ebd59578902720c2e560c6c`  
Scope: R5.1 through R9 local release-audit closure, existing StudentHub
VNext frontend, existing StudentHub → Labbe bridge contracts, and existing
assurance evidence.

## Executive verdict

| Decision | Verdict |
| --- | --- |
| Labbe local bridge | `LABBE_SHADOW_VERIFIED` |
| Labbe real staging transport | `LABBE_STAGING_BLOCKED_BY_ENV` |
| Principal release audit | `STUDENTHUB_VNEXT_RELEASE_AUDIT_CONTINUE` |

The local bridge is verified at `VERIFIED_SHADOW`. The real Labbe staging gate
was not executed because the required non-production endpoint, workload
credentials, scope, and disposable test database are absent. This report is
not a production-readiness claim.

The audit labels are:

- `DESIGN_FREEZE_ACCEPTED`
- `FRONTEND_CORE_V2_ACCEPTED`
- `PERFORMANCE_REMEDIATION_REQUIRED`
- `W13_CONDITIONALLY_AUTHORIZED`
- `BACKEND_AI_ASSURANCE_NOT_YET_COMPLETE`
- `STUDENTHUB_VNEXT_RELEASE_AUDIT_CONTINUE`

No commit, push, merge, production deployment, automatic writeback, or
destructive worktree operation was performed.

## Constraints and authority boundary

The pass preserved the existing design freeze and did not add a new UI kit,
course product, graph surface, motion framework, media pillar, or Labbe
authority. Existing dirty files outside the audit scope were preserved.

Labbe remains observation-only. It may observe, detect, correlate, and assure.
It cannot:

- change a Trust verdict;
- activate or revoke experts;
- moderate Community;
- ban users through this bridge.

The bridge has no automatic writeback path. Trust remains authoritative and
independent of Labbe availability.

## R5.1 — bundle and boundary remediation

The prior P0 route transfer issue was remediated without redesigning the
product:

1. Community presentation aggregation moved to a client-safe projection. The
   server-owned `CanonicalAnnouncementService` is no longer imported by the
   browser view.
2. Community and Expert browser lanes use scoped runtime modules. Server-only
   provider, database, and validation dependencies do not enter those live
   route bundles.
3. Deferred settings navigation is explicitly `prefetch={false}` so settings
   validation code is not pulled into every route.
4. The route bundle audit now measures active VNext routes rather than retired
   learning/roadmap routes.

`npm run audit:bundle` result:

| Route | Initial JS across measured chunks | Budget | Result |
| --- | ---: | ---: | --- |
| `/` | 94,405 B | 500,000 B | PASS |
| `/trust` | 126,205 B | 500,000 B | PASS |
| `/community` | 111,116 B | 500,000 B | PASS |
| `/expert` | 111,110 B | 500,000 B | PASS |
| `/cases` | 252,086 B | 500,000 B | PASS |

Post-prefetch browser route-graph snapshot at 1440px:

| Route | Script transfer | Chunk transfer | Notes |
| --- | ---: | ---: | --- |
| `/` | 341,106 B | 409,964 B | under 512 KB route chunk target |
| `/trust` | 394,637 B | 463,495 B | Trust still carries legacy validation dependency |
| `/community` | 290,279 B | 359,137 B | server provider/zod absent |
| `/expert` | 289,833 B | 358,691 B | server provider/zod absent |
| `/cases` | 279,725 B | 351,738 B | static case route |

The browser snapshot includes shared runtime and is not a replacement for a
staging Lighthouse/Core Web Vitals run. Performance therefore remains a
release follow-up even though the active route budget passes.

## R5.2 — CUT-2 legacy route retirement

Legacy learning/product routes were retired through redirects only. No shared
data or backend record was deleted.

| Legacy route | Destination |
| --- | --- |
| `/learn` | `/` |
| `/learn/[courseId]/[lessonId]` | `/` |
| `/practice` | `/trust` |
| `/projects` | `/cases` |
| `/quests` | `/dashboard` |
| `/roadmap` | `/dashboard` |

The VNext contract suite confirms the redirects and confirms that the route
retirement is not a data-deletion operation.

## R5.3 — lint and accessibility

| Gate | Result |
| --- | --- |
| Targeted ESLint for audit-touched source/tests | `0 errors, 0 warnings` |
| Full repository lint | exit 0; `0 errors, 412 warnings` |
| Axe on `/`, `/trust`, `/community`, `/expert`, `/cases` | `5/5`, zero violations |
| `git diff --check` | exit 0 |

The full-lint warnings are repository-wide legacy warnings, not errors in the
targeted VNext audit files. The one lifecycle warning found in the touched
Expert qualification panel was closed by scheduling the existing read with a
cleanup-safe tick; no API, authorization, or UX contract changed.

## R5.4 — static regression

| Gate | Result |
| --- | --- |
| Next production build | `135/135` generated pages |
| VNext contract suite | `13/13` pass |
| Responsive route matrix | `25/25` pass across 320, 390, 768, 1024, and 1440px |
| Accessibility route matrix | `5/5` pass, zero Axe violations |
| WebKit active-route smoke | `5/5` pass, HTTP 200, heading visible, no overflow |
| Chromium W13 media smoke | `8/8` pass |

The landing hero remains statically legible before any optional ambient video.
Trust composition and reasoning hierarchy remain the primary product surface;
cinematic media is an enhancement layer and does not carry a Trust decision.

## R5.5 — W13 controlled cinematic activation

W13 is conditionally authorized under the existing registry and poster-first
policy. It is not an invitation to redesign the experience.

| Route/state | Allowed media policy | Verified result |
| --- | --- | --- |
| Landing desktop | `VID-PRISM-01`; poster first, idle-gated video | one playing video, one MP4 request |
| Landing transition | `VID-PRISM-03` metadata only; maximum 2 planned plays; automatic transition disabled | no automatic transition |
| Trust idle | `VID-OPTIC-01`; one video maximum | one playing video |
| Trust result | `VID-OPTIC-02` selected by result state; presentation only | registry/contract verified; no Trust mutation |
| Community | `VID-HUMAN-02` primary, `VID-PRISM-02` alternate | one playing video; never both full layers |
| Expert | poster/static first; continuous video not enabled | poster only, no MP4 request |
| Static routes | no ambient media | no media atmosphere/video |
| Mobile | poster-only | no MP4 request |
| Reduced motion | poster/static; no decorative video fetch | no MP4 request |

The final Chromium smoke was executed on the final production build:

```text
landing-desktop   video, 1 video, readyState=4, playing, 1 MP4 request  PASS
trust-desktop     video, 1 video, readyState=4, playing, 1 MP4 request  PASS
community-desktop video, 1 video, readyState=4, playing, 1 MP4 request  PASS
expert-desktop    poster, 0 video, 0 MP4 requests                    PASS
cases-static      none,   0 video, 0 MP4 requests                    PASS
landing-mobile    poster, 0 video, 0 MP4 requests                    PASS
trust-mobile      poster, 0 video, 0 MP4 requests                    PASS
landing-reduced   poster, 0 video, 0 MP4 requests                    PASS
```

## R5.6 — media and performance evidence

The media registry is verified-pack-only. The browser uses desktop posters as
the first visual state, lazy idle enhancement on eligible desktop routes, and
the mobile/reduced-motion poster fallback. Offscreen and hidden-tab pause
behavior remains enabled.

The current local gates prove route bundle size, media policy, overflow, and
accessibility. They do not prove production Core Web Vitals, device thermal
behavior, low-power GPU behavior, CDN cache behavior, or staging bandwidth.
Those remain covered by `PERFORMANCE_REMEDIATION_REQUIRED`.

## R5.7 — browser availability

| Browser | Result |
| --- | --- |
| Chromium | active-route and W13 checks pass |
| WebKit | `5/5` active-route smoke pass |
| Firefox | `BLOCKED_BY_ENV`: Playwright `spawn UNKNOWN` for `firefox-1538` |

Firefox was not converted into a false pass. The missing executable/runtime is
an environment blocker.

## R6 — Labbe bridge, outbox, and authority closure

### Mode semantics

| Mode | Canonical event/hash | Outbox | Network/side effect | Result |
| --- | --- | --- | --- | --- |
| `DISABLED` | no delivery event path | no delivery | none | locally verified |
| `SHADOW` | construct and hash | persist, lease, retry/idempotency exercise | no production side effect | locally verified |
| `STAGING` | construct and hash | real catch-up delivery | real HTTPS only | blocked by environment |
| `CONTROLLED` | not enabled | not enabled | not enabled | explicit `CONTROLLED_DISABLED` |

`npm run test:labbe` passed `19/19`. The tests cover:

- server-owned Expert qualification migration;
- durable leased/retriable Labbe handoff;
- Trust case/run/stage/immutable revision separation;
- Shadow persistence and no-network behavior;
- staging catch-up state behavior;
- same event ID/hash deduplication;
- same event ID/different hash conflict;
- receiver-commit timeout retry without a second business effect;
- retry backoff, permanent conflict, lease expiry, dead worker recovery;
- `FOR UPDATE SKIP LOCKED`, multiple workers, and lease-token protection;
- Trust transaction/outbox ordering before `COMMIT`;
- observation-only authority and freshness-gated assurance;
- minimal hashed Trust signal and payload rejection;
- HTTPS/scope/classification transport requirements;
- Node/Python canonical JSON parity.

### Golden vectors

The shared vector file is
[`docs/integrations/labbe-canonical-json-vectors.json`](../integrations/labbe-canonical-json-vectors.json).
StudentHub uses
[`CanonicalJson.js`](../../frontend/src/lib/server/integrations/CanonicalJson.js);
the dependency-free Python reference is
[`canonical_json.py`](../../scripts/labbe_reference/canonical_json.py).
Canonical bytes are compact UTF-8 JSON with deterministic object-key ordering.

| Vector | SHA-256 |
| --- | --- |
| `null` | `74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b` |
| `booleans` | `b458395c03ca5e7da62530eed20b8acd9f36ab530bed7dec763ce79162f6ad0f` |
| `unicode-vietnamese` | `284f66e250cf22b46b530cc5979ce41e0b486bf7cac1831cc9589b82e12dbc26` |
| `numbers` | `d239d2bd735cd01ab95348a639deefec851a34bf4e1b650a02960481aa9cf937` |
| `nested-objects` | `f52b8ad8c1daffae20b80acc0fb14ae90e0d9d49f9e8a61bf787cd468564677c` |
| `arrays` | `ae9f3b0fe239c715e3b47420cf4c2ffc95381aeb49c1bbb0cf4d64a0d67274ee` |
| `different-key-order-a/b` | `0784831444382aa3a9fd79ebf1b04f2d32e9d136bf57b75973b737fef40bbcf4` |

Node checks: `8/8`. Python reference checks: `8/8`. Equivalent objects with
different insertion order produce the same canonical bytes and hash.

### Deterministic outbox evidence

These are local closure fixtures, not production events.

| Fixture | Event ID | Payload hash |
| --- | --- | --- |
| `closure-shadow` | `sh-trust-c48849ac15afa7e748cbfdd648d86f541fb44783` | `607b324c58947b43146c7114b9d0a6e3fba476afcf15a084c6330b88f9b51511` |
| `closure-identity` | `sh-trust-da94928eacd2f7681cfae97bda43fe45ce2367a3` | `4fbf93acb0be837108474dd479a1f60cd752457418a178fa2c5f1307be1e91f6` |
| `closure-timeout` | `sh-trust-ed04095c89bbde81735c7fa2ce6f8745343b5c89` | `9f57e1ee784065f45fec6522d448cf76ccb40d54ff8636e771d3070d7037197a` |
| `closure-backoff` | `sh-trust-30bd4b58afce5c89c3ffe5a1d7c84c0300d97f9c` | `8800cf02b6823760c3366d2949fe324b9e5d8f71b2a98413af47a76bcc26ef6c` |
| `closure-conflict` | `sh-trust-ff246c5b8ee7b229d8deaffd850907488caebafe` | `5292b1aa62a9b75d1c842288f6def35836d39b48c36d1d76325f5e441c90f52a` |
| `closure-expired` | `sh-trust-48107bc0f476900f69395f1eff3b1db5db221b64` | `3259a12255a58a37454319ee23a7706cdb63a6150b00c090a650cd199f86ae98` |
| `closure-worker-a` | `sh-trust-21db80b2114eef0a88f3c3587cfe0040e7828dc0` | `d426461c3360036658cea5865c54650dca6832baaef6476216d881ef706d18f1` |
| `closure-worker-b` | `sh-trust-f4df026d3fc1d28459b020aa185a3932135f3cd1` | `098236fbc4dee6183ad50345f942138c2a2dd285a131fb2550fd8e67f03cd5ab` |

Observed state and invariant evidence:

| Scenario | Observed result |
| --- | --- |
| Shadow lease | `PENDING → IN_FLIGHT → SHADOW`; no fetch; no production side effect |
| Staging catch-up model | `SHADOW → IN_FLIGHT → DELIVERED` |
| Same ID + same hash | `DEDUPLICATED` |
| Same ID + different hash | typed `CONFLICT`, terminal, no retry |
| Timeout after receiver commit | `PENDING → FAILED → DELIVERED`; receiver effect count remains `1` |
| HTTP 503 | bounded retry backoff, then delivery success |
| Expired/dead worker | new worker recovers expired lease, including max prior attempts fixture |
| Multiple workers | `SKIP LOCKED` selects once; stale lease token cannot complete newer lease |
| Trust transaction crash/restart model | Trust graph and outbox insert occur before `COMMIT`; rollback removes both |

The executable PostgreSQL crash/restart proof remains part of the staging gate
and cannot be promoted from a local contract into a real database result.

### Event minimization

The minimal hashed Trust signal rejects and never sends:

- raw screenshots;
- OCR text;
- private evidence;
- provider tokens;
- session tokens;
- credentials.

The workload bearer token is server-only and is not part of the event body,
hash, report payload, or client bundle. Classification and scope are explicit
transport headers.

### Read-only assurance projection

The projection is allowed only after authorization and freshness are defined:

- authorization: `ADMIN.SECURITY`;
- freshness window: five minutes;
- output states: `CURRENT`, `STALE`, `UNAVAILABLE`;
- mutation: none;
- Trust verdict: never changed or carried as a writeback command.

Labbe availability therefore cannot turn a successful Trust decision into a
failed Trust result.

Detailed bridge evidence remains in
[`LABBE-STAGING-ASSURANCE-CLOSURE-2026-09-06.md`](LABBE-STAGING-ASSURANCE-CLOSURE-2026-09-06.md).

## R7 — AI holdout status

| Gate | Result |
| --- | --- |
| Scientific TEVV contract suite | `10/10` pass |
| AI Gateway router suite | `13/13` pass |
| Gemini trusted-instruction boundary | `1/1` pass |
| Locked real holdout/generalization evidence | `HOLDOUT_VERIFICATION_BLOCKED_BY_EVIDENCE` |

The passing suites prove model-registry, router, OOD, evidence-graph,
observability, schema, fallback, and trusted-instruction contracts. They do
not prove a blind real-world holdout because this worktree does not contain a
locked dataset artifact, dataset hash, reproducible split, model artifact
binding, or blind-evaluation report. No AI quality claim is promoted from
contract tests alone.

## R8 — environment-backed staging

### Labbe staging runner

`npm run test:labbe:staging` returned:

```text
LABBE_STAGING_BLOCKED_BY_ENV: missing STUDENTHUB_LABBE_BASE_URL,
STUDENTHUB_LABBE_TOKEN, STUDENTHUB_LABBE_SCOPE,
STUDENTHUB_LABBE_TEST_DATABASE_URL; STUDENTHUB_LABBE_MODE must be exactly STAGING
No remote call, database write, migration, deployment, or production action was attempted.
```

Therefore the following remain unverified rather than assumed:

- TLS certificate and hostname validation against the real receiver;
- valid workload token and wrong-token rejection;
- valid scope and wrong-scope rejection;
- receiver classification enforcement;
- receiver timeout/outage and catch-up;
- real Unicode hash, duplicate, and conflict behavior;
- disposable PostgreSQL commit/restart, worker, and rollback proof.

### Frontend staging E2E

`npm run test:e2e:staging` returned:

```text
STAGING_E2E_BLOCKED_BY_ENV: missing STUDENTHUB_STAGING_BASE_URL, STUDENTHUB_STAGING_CASES_PATH
Provide a non-secret staging base URL and an external JSON case file.
```

### Repository integration blockers

- `npm run test:phase3-contract`: `5/5` pass.
- `npm run test:security`: pass.
- Intelligence-fabric contract suites: pass.
- Realtime transport/durable event-log checks: pass.
- Full discovered suite stops at the live phase with
  `DatabaseUnavailableError: DATABASE_URL is required for durable production state.`
- Passport durable live check has the same missing `DATABASE_URL` blocker.

The missing database and staging targets are environment blockers, not evidence
of a failed production integration. They must remain visibly blocked.

## R9 — evidence matrix and known blockers

| Workstream | Evidence | Status |
| --- | --- | --- |
| Static landing and VNext shell | contracts, build, responsive, Axe | VERIFIED locally |
| Trust reading hierarchy | Trust contract, browser routes, no authority change | VERIFIED locally |
| Community/Expert boundary | scoped provider contract, bundle audit, client-safe aggregation | VERIFIED locally |
| W13 cinematic policy | registry, poster/mobile/reduced smoke, WebKit | CONDITIONALLY AUTHORIZED |
| Labbe mode/outbox/idempotency | `19/19` local bridge tests, vectors, deterministic fixtures | `LABBE_SHADOW_VERIFIED` |
| Labbe real staging | staging runner | `LABBE_STAGING_BLOCKED_BY_ENV` |
| Durable production DB | phase/live tests | BLOCKED_BY_ENV |
| Firefox | Playwright executable | BLOCKED_BY_ENV |
| AI contracts | TEVV/router/Gemini suites | PASS as contracts |
| AI real holdout | locked evidence artifacts | BLOCKED_BY_EVIDENCE |
| Production performance | Lighthouse/CWV/device/CDN | NOT YET VERIFIED |

Known blockers, in controlled order:

1. Supply a non-production Labbe HTTPS URL, workload token, scope, and
   disposable `STUDENTHUB_LABBE_TEST_DATABASE_URL`.
2. Set `STUDENTHUB_LABBE_MODE=STAGING` and execute the real staging gate,
   including timeout/outage probes.
3. Supply `STUDENTHUB_STAGING_BASE_URL` and an external
   `STUDENTHUB_STAGING_CASES_PATH` for frontend staging E2E.
4. Provide durable `DATABASE_URL` for the full live repository suite and
   crash/restart proof.
5. Provide or approve the locked AI holdout dataset/model artifact/hash/split.
6. Install/repair the Playwright Firefox executable and run the same browser
   matrix.
7. Run staging Lighthouse/Core Web Vitals and real device/performance checks.

No blocker is silently downgraded to PASS.

## Files and worktree safety

This pass added this report and the audit-scope changes around scoped browser
providers, VNext media policy, bundle measurement, route retirement, and
contract tests. The main audit-scope files include:

- `frontend/src/lib/backend/scopedRuntimeProvider.js`;
- `frontend/src/lib/api/runtimeClient.js` and `runtimeError.js`;
- `frontend/src/lib/ui-state/clientModel.js`;
- `frontend/src/lib/community/observationAggregation.js`;
- `frontend/src/lib/media/vnextMediaRegistry.js`;
- `frontend/src/components/providers/BackgroundContext.jsx`;
- `frontend/src/components/providers/UniversalCinematicBackground.jsx`;
- `frontend/src/components/trust/AiTrustStudioView.jsx`;
- `frontend/src/components/community/CommunityIntelligenceView.jsx`;
- `frontend/src/components/expert/ExpertIntelligenceView.jsx` and
  `ExpertQualificationPanel.jsx`;
- `frontend/src/components/layout/UnifiedAppShell.jsx` and
  `frontend/src/components/margin/MarginRail.jsx`;
- the six CUT-2 redirect route files;
- VNext contract tests under `frontend/tests/vnext_*`;
- `scripts/check-bundle-budget.mjs`.

No backend, Trust persistence, auth, realtime, Labbe bridge, or database source
was edited as part of this Principal Audit closure. Existing dirty backend and
frontend work from the shared worktree was not reset, checked out, overwritten,
stashed, deleted, committed, pushed, merged, or deployed.

## Next allowed step

Only after the environment blockers are supplied: run the real non-production
Labbe staging gate and frontend staging E2E, then repeat R6–R9. Keep
`CONTROLLED` disabled and keep automatic writeback disabled. Until then, retain
`LABBE_STAGING_BLOCKED_BY_ENV` and
`STUDENTHUB_VNEXT_RELEASE_AUDIT_CONTINUE`.
