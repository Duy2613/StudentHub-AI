# StudentHub Expert Authenticated Local E2E — 2026-09-10

## Final local verdict

`FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED`

The complete synthetic authenticated Community → Expert → Trust journey passed against the disposable local Supabase runtime after Docker recovered. The earlier Docker outage is retained below as historical evidence and does not downgrade this later verified run.

Required semantic correction:

- `APPLICATION_SCHEMA_RESTORE_VERIFIED` is used for the existing backup/restore proof. Full Supabase platform restore is not claimed.
- `LOCAL_BROWSER_SMOKE_VERIFIED` describes the prior anonymous smoke. The current authenticated browser verdict is recorded separately as `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED`.
- Live child tests that self-skipped for missing acknowledgement are reported as skipped, not as fully executed in that regression run.

## Recovery closure — current authenticated run

Artifact: [local-authenticated-e2e-2026-09-10.json](../../artifacts/local-authenticated-e2e-2026-09-10.json)

- Result: `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED`; Playwright exit code `0`.
- Local API: `http://127.0.0.1:56021`; local Postgres: `127.0.0.1:55432`; local Auth probe: `HTTP_200_LOCAL_LOOPBACK`.
- Synthetic fixture: `9` Auth users (`candidate`, `reviewer`, `reactor`, and helpers); all synthetic data and Auth users were cleaned up.
- Durable run summary: `6` Trust cases, `6` contributions, `8` reactions, `1` application, `1` verification, `1` practice submission, `2` assignments, `1` assessment, and `3` passports.
- Server-owned lifecycle passed: contribution → independent reaction → `100` points/`5★` → candidate qualification → quiz → supervised practice → reviewer activation → domain Expert assignment → COI/revision checks → assessment → typed Trust evidence → Passport lineage replay.
- Negative boundaries passed: self-reaction, self-review, wrong-domain assignment, missing assignment, wrong-domain assessment, COI false declaration, stale revision, and expired assignment.
- Network isolation passed: server `LOOPBACK_ONLY`, browser `CLOUD_SUPABASE_REJECTED`, violations `[]`.
- Main Cloud writes: Auth `0`, database `0`, Storage `0`. No Main migration, seed, reset, or deployment was performed.
- Evidence replay returned a stable artifact hash. The reviewer fixture exercised the privileged human-activation gate in the backend; it is not a claim of an external human attestation.
- Preserved historical evidence: `G1_LOCAL_CLEAN_MIGRATION_VERIFIED`, `RLS_LOCAL_LIVE_VERIFIED`, `CONCURRENCY_IDEMPOTENCY_VERIFIED`, `APPLICATION_SCHEMA_RESTORE_VERIFIED`, `LOCAL_PRIVATE_STORAGE_VERIFIED`, `PROMAX_LOCAL_PERSISTENCE_VERIFIED`.

## Candidate and environment

- Candidate: `STUDENTHUB_EXPERT_HYBRID_RC`.
- Branch: `implementation/academic-cinematic-v1-f00`.
- HEAD: `3435dea2f594651fdb91a5695ca06aec7a9d965d`.
- Dirty fingerprint: `sha256:a45155f4dc80d6aba9adfbcfd621551763cdf51c0bab2fa4a21f10e5dda01c98`.
- Next.js: `16.3.0`; React: `19.2.8`.
- Local Postgres evidence: `17.6`.
- Main Supabase remained cloud/non-disposable and was inspected read-only only.

## Current authenticated journey matrix

| Journey boundary | Result in this pass | Truthful evidence |
|---|---|---|
| Synthetic Auth accounts | VERIFIED | Nine disposable local Auth users were created, used, and cleaned up. |
| Community contribution through real authenticated UI | VERIFIED | Candidate completed the real browser contribution flow. |
| Independent quality event → score/star projection | VERIFIED | Reactor identity was independent; score/star projection reached the qualification threshold. |
| `5★ → HUMAN_QUALIFICATION_REQUIRED` | VERIFIED | Direct promotion was not used; the server-owned qualification gate opened. |
| Application/profile/identity stage | VERIFIED | Candidate application and identity/qualification transition persisted locally. |
| Domain quiz start/submit/server scoring | VERIFIED | Browser quiz answers were submitted and accepted by the server. |
| Practice submission/supervised review | VERIFIED | Practice was submitted through the browser and reviewed by the reviewer fixture. |
| Human activation → domain ACTIVE | VERIFIED | Privileged reviewer activation moved the domain to active; reviewer was synthetic/admin. |
| Assignment + exact case revision | VERIFIED | Valid assignment succeeded and the exact case revision was enforced. |
| COI declaration and enforcement | VERIFIED | Valid COI path succeeded; false COI and related negative paths failed closed. |
| Assessment persistence and Trust typed evidence | VERIFIED | Assessment persisted and entered Trust as typed evidence. |
| Revocation/expiry/stale boundaries | VERIFIED | Stale revision, expired assignment, missing assignment, and wrong-domain paths failed closed. |
| Private evidence file | HISTORICAL VERIFIED | `LOCAL_PRIVATE_STORAGE_VERIFIED` remains preserved; this authenticated run used no identity document. |

## Inherited local evidence

The closure from the prior local disposable run established:

- ten canonical migrations applied to a clean local app schema;
- local RLS phase 3 `9/9`;
- Promax concurrency/idempotency `1/1`;
- durable Trust/report/passport/session gates pass;
- private Storage owner/non-owner/anonymous checks pass;
- application-schema backup/restore passes with `restorePass=true`;
- local Community and Expert persistence passes;
- browser smoke `5/5` with honest empty/unavailable states;
- full discovered regression `350/350` files, with explicitly noted live-child skips where the acknowledgement was not inherited.

Those results remain evidence for the local implementation and are now complemented by the current authenticated browser artifact above.

## Historical Docker blocker evidence (resolved)

Docker Desktop `4.88.1` was restarted without factory reset or volume deletion. The backend repeatedly crashed while removing stale AF_UNIX sockets under the user Docker runtime, including:

- `C:\Users\Duy\AppData\Local\Docker\run\sailor-ingest.sock`;
- `C:\Users\Duy\AppData\Local\Docker\run\dockerInference`;
- `C:\Users\Duy\AppData\Local\docker-secrets-engine\engine.sock`.

The Docker API never returned a usable engine after the bounded retries in that earlier window. No container, volume, database, migration, or test fixture was mutated during those recovery attempts. Docker later recovered; the authenticated closure was then executed against the disposable local runtime described in the recovery section.

## Current browser status

`FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED` is the current browser status. The earlier anonymous `5/5` smoke remains separately recorded as `LOCAL_BROWSER_SMOKE_VERIFIED`. The current Chromium run exercised the authenticated Member, contributor, candidate, qualification, verified Expert, assignment, assessment, and Trust evidence transitions with durable local readback.

## Negative/security journeys

The following boundaries were exercised in the authenticated local run and remain server-owned:

- 5★ cannot directly activate an Expert;
- client score/star/quality-event mutation is rejected;
- qualification is server-owned;
- domain, assignment, COI, revision, replay, and cross-user boundaries fail closed;
- historical assessment/passport lineage is append-only and survives verification revocation;
- Expert assessment enters Trust as typed evidence and cannot directly set verdict/confidence/source sufficiency.

## Remaining boundary

No Main Cloud migration rehearsal is claimed here. Any future Main migration remains a separate, explicitly authorized read-only preflight or controlled migration operation. No Main migration or production deploy was performed; Git branch release is tracked separately by the final release-candidate audit and does not change the Main Supabase evidence boundary.
