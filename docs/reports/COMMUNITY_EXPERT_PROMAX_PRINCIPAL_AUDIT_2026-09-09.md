# StudentHub AI — Community × Expert Promax principal audit

**Ngày audit:** 09/09/2026  
**Audit mode:** feature work stopped before this pass; review of the changed source, migration, contracts, route inventory, build/lint logs and failure gates.  
**Release decision:** `NO-GO_PRODUCTION`; `GO_LOCAL_REVIEW_WITH_DISCLOSURE`.  
**Overall verdict:** `STUDENTHUB_COMMUNITY_EXPERT_PROMAX_LOCAL_PARTIAL`.

The audit treats the user brief, existing Trust architecture and security/privacy boundaries as authority. A passing contract test proves the tested invariant in local code; it does not prove PostgreSQL durability, real file isolation, human reviewer availability, WCAG conformance, measured AI quality or a competition result.

## Requirement-to-evidence matrix

| Area / phase | Evidence inspected or run | Status | Finding |
| --- | --- | --- | --- |
| P00 baseline | Branch/HEAD, dirty worktree, environment inventory, route/API/migration inventory | PASS | Baseline recorded; owner dirty work preserved |
| P01 domain contract | `promaxDomain.js`, golden fixture, 10 domain tests | PASS | Independent state machines, claim binding, source/reaction/assessment contracts exist |
| P02 durable consolidation | `202609090001_community_expert_promax.sql`, repositories, 5 migration/RLS contract tests | `BLOCKED_BY_ENV` | Schema and repositories are present; no live PostgreSQL/read-after-commit proof |
| P03 privacy/file pipeline | text/OCR/QR/meta detector, magic/MIME/dimension checks, safe preview response | `PARTIAL` | Original is not returned or published; storage/OCR/redacted derivative worker is not configured |
| P04 claim-level Community | contribution types, claim/revision scope, reactions, Community UI/routes | `PARTIAL` | Contract and route behavior pass; live database and complete publish/readback are unavailable |
| P05 source clustering | canonical URL/original/syndication/digest logic and contract test | PASS | Copies are grouped conservatively; content similarity beyond supplied digest is not implemented |
| P06 ranking/search | versioned weighted ranking and explanation reasons | `PARTIAL` | Formula is testable and no star/like boost is in Promax ranking; NDCG/fairness evaluation has no locked data |
| P07 qualification | profile, identity, quiz, practice, human activation service and route contracts | `PARTIAL` | Server blocks self activation and requires practice; live human reviewer lifecycle is unproven |
| P08 assignment | coordinator/domain/COI/revision/expiry/idempotency checks | `PARTIAL` | Static contracts pass; concurrent revoke/assignment behavior needs PostgreSQL |
| P09 assessment/disagreement | structured assessment, dual review, conflict and third-review resolver | `PARTIAL` | Majority is explicitly disabled; reviewer queue and live dual review are not exercised |
| P10 reputation ledger | Bayesian quality score, sample threshold, cluster cap, reversal, event idempotency | `PARTIAL` | Code and domain tests cover invariants; no real adjudication dataset or measured reliability |
| P11 appeals/corrections | immutable contribution revisions, appeal/review tables, independent resolver | `PARTIAL` | Self-review is blocked and history is preserved; UI/admin queue and live DB are incomplete |
| P12 Trust integration | read-only community bridge, exact scope checks, `trustVerdictMutation:false` | PASS (local) | Community/Expert signals remain non-authoritative in tested route contracts; live readback pending |
| P13 realtime/outbox | transaction outbox writes and Labbe bridge/vector contracts (19/19) | `PARTIAL` | Internal outbox contract passes; multi-instance DB worker and staging evidence absent |
| P14 UI | Community composer/detail, expert directory/qualification/practice history, semantic status copy | `PARTIAL` | Core surfaces exist; reviewer queue, appeal/correction history and manual a11y review remain |
| P15 security/privacy | 26 Promax contracts, 7 hardening tests, static negative scan, authorization inventory | `PARTIAL` | Local fail-closed checks pass; RLS/private object isolation cannot run without database/storage |
| P16 evaluation | starter fixtures and evaluation specification | `BLOCKED_BY_EVIDENCE` | Dataset is explicitly `DATASET_NOT_YET_LOCKED`; no quality metric is claimed |
| P17 failure injection | deterministic unavailable/preview/idempotency/stale-state contracts | `PARTIAL` | Dependency errors return typed states; no live DB restart, worker restart or revoked race |
| P18 performance | Next build and bundle budget | `PARTIAL` | Bundle budgets pass; no p50/p95 API/query/OCR/queue measurements |
| P19 regression | full discovered runner and non-DB loop | `BLOCKED_BY_ENV` | Full runner stops at four `DATABASE_UNAVAILABLE` beta proof tests; non-DB loop has six DB/live gate files |
| P20 principal audit | this document plus implementation report and artifacts | PASS | Audit completed with explicit partial verdicts and blockers |

## Local verification record

| Check | Result |
| --- | --- |
| Promax/domain/route/migration/expert/security targeted suite | **26/26 pass** |
| Foundation backend adapter | **18/18 pass** |
| Foundation UI state model | **4/4 pass** |
| Foundation architecture boundary | **2/2 pass** |
| `npm run lint` | exit 0; 0 errors, 442 repository warnings |
| `npm run build` | exit 0; Next route manifest includes Community, Expert, Trust and case bridge routes |
| `npm run audit:api-auth` | exit 0; 169 handlers inventoried |
| `npm run audit:bundle` | PASS; all measured routes under 500,000 B |
| `npm run test:final-audit` | 7/7 pass |
| `npm run test:phase3-contract` | 5/5 pass |
| `npm run test:labbe` | 19/19 pass |
| Scoped `git diff --check` | PASS |
| `npm run test:phase3-live` | `BLOCKED_BY_DATABASE_ENV: STUDENTHUB_RLS_TEST_DATABASE_URL is required` |
| `npm run test:labbe:staging` | `STAGING_BLOCKED_BY_ENV` with exact missing variables listed below |

Evidence logs are retained under `artifacts/community-expert-promax-*.log`. The full discovered run ends at `frontend/tests/db/beta_user_database_proof.test.mjs`; its four tests fail before any database operation because `DATABASE_URL` is absent. The non-DB run reports six files whose live/database dependency is unavailable: phase 5 live gate, Trust case passport binding, phase 7 live gate, P0 BOLA/PII regression, phase 6 live gate and PostgreSQL session repository.

## Negative questions

| Question | Audit result | Evidence / remaining limit |
| --- | --- | --- |
| Can likes become truth? | **PASS — blocked in Promax** | Typed reactions carry `trustMutation:false`; Community bridge is non-authoritative. Legacy forum remains explicitly demo/memory compatibility. |
| Can expert stars become authority? | **PASS — blocked in Promax** | No global star-to-role path; verified domains and server activation are separate. Legacy fields are removed from public reads. |
| Can an outside-domain expert approve? | **PASS locally** | Assignment and verification query require the same domain; live race proof is blocked. |
| Can a revoked expert race-write assessment? | `PARTIAL` | Verification is locked and checked before assessment; no two-instance PostgreSQL test ran. |
| Can original PII leak? | `PARTIAL` | Text/OCR/QR/meta scans and safe file response never return original; no private object store/derivative deployment to probe. |
| Can duplicated source inflate corroboration? | **PASS locally** | Canonical source/content digest clustering and independence contract pass; production cluster readback is pending. |
| Can retry inflate reputation? | **PASS locally** | Idempotency digest, append-only quality event and reversal contracts pass; no live transaction retry proof. |
| Can a stale tab overwrite a revision? | **PASS locally** | Expected revision checks return `STALE_REVISION`; database concurrency gate is pending. |
| Can a reviewer close their own appeal? | **PASS locally** | Requester/challenged expert/self resolver checks and independent admin requirement are explicit. |
| Can Community overwrite Trust? | **PASS locally** | Trust bridge sets `authoritative:false` and `trustVerdictMutation:false`. |
| Can Labbe mutate business truth? | **PASS locally** | Labbe contracts model observer/assurance only; 19/19 bridge/vector tests pass. |
| Can a model fabricate a source? | `NOT_TESTED` for this Promax slice | Source refs are caller/verified evidence inputs; a locked AI citation-evaluation set is not available. |
| Can a demo fixture look live? | **PASS locally** | Demo providers require explicit mode and return provenance/data notices; provider contracts pass. |
| Can DB failure return success? | **PASS locally** | Routes map unavailable storage to 503/typed unavailable state; live DB remains absent. |

## Security, privacy and data handling findings

The Promax migration enables RLS on the public compatibility assessment table, revokes browser grants, and grants service-role access. Private practice, assignment, quality, review, appeal and file tables are service-owned and history triggers reject update/delete where immutability is required. Repository checks add owner, case visibility, claim, evidence, domain, assignment, expiry, COI and coordinator scope checks.

The file route validates binary magic bytes in addition to declared MIME and extension. It bounds byte size and image dimensions and returns `PRIVACY_SCAN_PENDING`/`BLOCKED` when a derivative worker is unavailable. This is the safe behavior, but it means the flagship screenshot flow is not complete: there is no evidence in this worktree of a real private bucket, OCR/QR worker, redacted derivative object, signed access path or cross-user object read test.

The API inventory has 169 handlers. Static scans found no `majorityApplied:true` or Promax author-trust/score mutation; the only Promax majority marker is `majorityApplied:false`. Repository-wide legacy forum/safety fixtures still contain trust-score fields, so those paths must remain clearly labelled demo/community signals until retired or migrated.

## Expert and reputation findings

Qualification is server-owned and now requires a practice response with evidence references before `ACTIVATE` can reach `DOMAIN_VERIFIED`. Practice responses are private and sanitized; the applicant UI exposes status without reviewer identity. Assignment and review are bound to a claim/revision/domain and use idempotency/advisory locks. Assessment submission returns `qualityMutation: NONE_ON_SUBMISSION`; only independent adjudication events affect the Bayesian quality profile.

The quality model starts with a neutral prior and shows insufficient data below 20 independent units. Incident-cluster weight is capped and reversal is represented as a compensating event. These are controlled experimental rules, not proof that an expert's next assessment has a measured probability of correctness. No adjudication corpus, calibration curve or human reviewer SLA was collected in this pass.

## Evaluation and AI governance findings

`docs/evaluation/COMMUNITY-EXPERT-PROMAX-EVALUATION-SPEC-2026-09-09.md` defines the proposed 180/60/120 split, independent annotators, third-review disagreement path, A/B/C comparison, ablations and metrics. `promax_starter_cases.json` contains three synthetic, revision-bound cases. The dataset is not locked, and no NDCG, PII precision/recall, manipulation distortion, user-value uplift, latency/cost or AI grounding metric is reported. NIST AI RMF/GenAI Profile and OWASP ASVS are used as governance references; no certification is implied.

## Accessibility and performance findings

The UI has semantic form labels, status roles, explicit uncertainty copy and responsive layout rules. There is no recorded keyboard-only walkthrough, screen-reader run, reflow matrix, manual focus audit or assistive technology result. Therefore `A11Y_PARTIAL` is the only supportable verdict. Bundle checks pass for `/`, `/trust`, `/community`, `/expert` and `/cases`; API/query/OCR/queue p50/p95 and storage cost were not measured, so performance is `PERFORMANCE_PARTIAL`.

## Environment blockers and exit criteria

The following values are required before a stronger release decision:

1. `DATABASE_URL` for repository readback, transaction/idempotency, two-user isolation, restart and concurrency tests;
2. `STUDENTHUB_RLS_TEST_DATABASE_URL` for the live RLS gate;
3. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the configured auth/storage integration;
4. a private object-storage bucket plus OCR/QR/EXIF/redaction worker and access-policy test credentials;
5. `STUDENTHUB_LABBE_MODE=STAGING`, `STUDENTHUB_LABBE_BASE_URL`, `STUDENTHUB_LABBE_TOKEN`, `STUDENTHUB_LABBE_SCOPE`, `STUDENTHUB_LABBE_TEST_DATABASE_URL`, and controlled timeout/outage endpoints for Labbe staging assurance;
6. a permissioned, locked, source-backed evaluation set and human annotators;
7. manual accessibility participants and a performance test environment.

`npm run test:labbe:staging` confirmed the first five Labbe values are missing and explicitly made no remote call, database write, migration, deployment or production action.

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Community | `COMMUNITY_PROMAX_PARTIAL` |
| Expert | `EXPERT_PROMAX_PARTIAL` |
| Privacy | `PII_PROTECTION_PARTIAL` |
| Database | `DURABLE_DATA_PATH_BLOCKED_BY_ENV` |
| Reputation | `REPUTATION_LEDGER_PARTIAL` |
| Security | `COMMUNITY_EXPERT_SECURITY_PARTIAL` |
| AI grounding/evaluation | `AI_GROUNDING_VERIFIED` for the tested authority boundaries; `AI_EVALUATION_BLOCKED_BY_EVIDENCE` |
| Accessibility | `A11Y_PARTIAL` |
| Performance | `PERFORMANCE_PARTIAL` |
| Staging | `STAGING_BLOCKED_BY_ENV` |
| Overall | `STUDENTHUB_COMMUNITY_EXPERT_PROMAX_LOCAL_PARTIAL` |

The implementation is suitable for a local, clearly labelled review/demo slice with synthetic data. It is not cleared for production, nationwide use, a WCAG claim, a measured privacy/AI accuracy claim or a claim of winning a competition. The next engineering gate is environment provisioning and evidence collection, not additional feature breadth.
