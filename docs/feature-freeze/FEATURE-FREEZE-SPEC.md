# StudentHub AI Feature-Freeze Integration Spec

Updated: 2026-08-29

This document translates the maximum-build brief into executable product contracts. The attached brief is treated as product input, while repository code, verified tests, and the permanent vault remain the implementation evidence.

## Scope boundary

The existing Trust, Community, Expert, Academic 360, and Command Center systems remain in place. This build closes the missing cross-system product boundary with:

1. Living Evidence Passport
2. Student Decision Twin
3. Three explicitly labeled deterministic competition superflows
4. A unified case experience that keeps Official, Community, Expert, Unknown, and Next Action provenance separate

No live provider result may be replaced by demo data. Demo records use `DEMO_FIXTURE` provenance and are never persisted as live evidence.

## Living Evidence Passport state matrix

| State | Trigger | System action | UI feedback | Boundary / error path |
| --- | --- | --- | --- | --- |
| Empty | User creates a case | Validate owner, subject, initial status, and title | New passport shell | Reject missing owner/title or invalid status |
| Active | Trust, Community, Expert, or Official evidence arrives | Append immutable event and increment revision | Timeline adds one provenance-coded event | Reject unknown provenance or non-monotonic revision |
| Changed | A material event changes the verdict | Preserve old status, store new status and change reason | Old result and new result shown together | Never overwrite the prior result |
| Watching | User follows a case | Create owner-bound follow record | Follow state visible | Duplicate follows are idempotent |
| Resolved | Authoritative resolution arrives | Append resolution event and update current status | Resolution and basis visible | A Community observation alone cannot claim official resolution |
| Provider unavailable | Durable database is unavailable | Fail closed with `DATABASE_UNAVAILABLE` | Honest unavailable state | Never fall back to process memory in production |

## Student Decision Twin state matrix

| State | Trigger | System action | UI feedback | Boundary / error path |
| --- | --- | --- | --- | --- |
| Idle | Scenario loads | Render current state, options, unknowns | Comparable option set | Require at least two options |
| Evaluating | User submits scenario | Validate every consequence and basis | Deterministic evaluation indicator | Reject opaque or missing consequence basis |
| Compared | All options valid | Compute explicit risk, deadline, dependency, importance, and uncertainty factors | Trade-off matrix | Never use an LLM score as a critical priority |
| Recommended | One option has the lowest deterministic action cost | Return option and reasons | Next clear move | Ties remain `REVIEW_REQUIRED` |
| Insufficient | Critical context is unknown | Preserve unknowns and reduce certainty | Unknown panel and verification action | Never invent missing rules or evidence |
| Adopted | Authenticated user adopts an option | Persist owner-bound scenario version | Adopted status and timestamp | Demo scenarios cannot be adopted into live state |

## Competition superflow matrix

| Flow | Trigger | Cross-system response | Honest fallback |
| --- | --- | --- | --- |
| Fake scholarship | Payment request plus suspicious link/document | Trust signals, official mismatch, incident cluster, scoped expert context, passport revision, verify-first Decision Twin | `INSUFFICIENT_EVIDENCE` when provider evidence is absent |
| Fake internship | Recruiter identity plus fee/credential request | Domain and payment signals, student observations, career/cyber scope, evolving passport, grounded next action | Expert state remains `REQUEST_AVAILABLE` when no verified review exists |
| Academic conflict | Community claim conflicts with a regulation | Official document provenance, deterministic eligibility rule, scoped clarification only when needed, academic consequence | Unknown program/cohort/version blocks eligibility conclusion |

## API contract

- `GET /api/v1/demo/superflows`: public deterministic fixtures, always marked `demo: true` and `provenance: DEMO_FIXTURE`.
- `POST /api/v1/decisions`: authenticated, server-authorized Decision Twin evaluation.
- `GET|POST /api/v1/passports`: authenticated, owner-derived passport list/create.
- `GET|PATCH /api/v1/passports/:passportId`: authenticated, owner-derived read/append.

Existing core namespaces continue through their verified compatibility routes until each caller is migrated. This phase does not duplicate Trust, Community, Expert, or Academic engines merely to create new URLs.

## Feature-freeze gate for this tranche

- Domain contracts reject fabricated certainty and unscoped provenance.
- Database schema is append-only for passport events and owner-bound by RLS.
- Demo data is unmistakably labeled and cannot silently enter live persistence.
- The case experience shows agreement, conflict, unknowns, evidence change, consequences, and next action.
- Unit, migration-contract, authorization, build, and browser gates pass.
