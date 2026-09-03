# StudentHub AI — Canonical UI State Model

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Purpose

This is the shared state vocabulary for Trust, Community, Expert, Passport, navigation, and provider adapters. A UI state is a semantic contract, not a color, animation, HTTP status, or guessed fallback.

Runtime implementation: `frontend/src/lib/ui-state/model.ts`. Provider results use the same envelope through `frontend/src/lib/backend/ports.ts`; safe error values are validated by `frontend/src/lib/api/errors.ts`.

## State envelope

Every asynchronous feature result is represented conceptually as:

    {
      state,
      phase,
      data,
      error,
      unknowns,
      unavailable,
      provenance,
      requestId,
      runId,
      updatedAt,
      retryable,
      nextActions
    }

Rules:

- `state` is required and is one of the canonical states below.
- `data` is absent or partial when state semantics require it; a report cannot be fabricated to satisfy a loading layout.
- `error` contains a typed error code and safe message; secrets/raw provider output never reach the UI.
- `unknowns` identify unresolved questions or missing evidence, not failures.
- `unavailable` identifies a dependency/provider/stage that could not be reached; it is not a finding.
- `provenance` identifies live, demo, user-supplied, community, expert, or derived origin.
- `requestId`/`runId` prevent stale responses from overwriting newer work.
- `nextActions` are state-safe actions, not generic calls to action.

## Canonical states

| State | Meaning | Data rule | Action rule |
| --- | --- | --- | --- |
| `IDLE` | No request or user action has started | No result required | Start or provide input |
| `VALIDATING` | Client/server boundary checks are active | No unvalidated result | Wait or correct input |
| `LOADING` | A dependency is actively being read | Existing data may remain labelled stale | Wait/cancel |
| `SUBMITTING` | A mutation is being sent | Do not imply persistence | Wait/cancel safely |
| `SUCCESS` | Resource/result is contract-valid | Full data for requested scope | Inspect/continue |
| `EMPTY` | Valid request returned no items | Empty collection, not failure | Add context/change filter |
| `PARTIAL` | Some requested scope completed | Completed and missing scope explicit | Inspect gaps/retry |
| `UNKNOWN` | Meaning/conclusion cannot be determined | Do not infer positive or safe data | Gather evidence/contain |
| `INSUFFICIENT_EVIDENCE` | Evidence is too sparse for responsible conclusion | Evidence gaps required | Contain/corroborate |
| `CONFLICTING_EVIDENCE` | Relevant observations disagree | Preserve competing values/provenance | Inspect conflict/escalate |
| `UNAVAILABLE` | Dependency/provider is unreachable or disabled | No substitute finding | Retry later/alternate safe action |
| `ERROR` | Request, schema, auth boundary, or runtime failure | No invalid result | Retry/support/correct |
| `OFFLINE` | Client cannot reach network | Keep local safe state only | Retry when online |
| `CANCELLED` | User/lifecycle cancelled active work | Ignore late response | Restart if desired |
| `AUTH_REQUIRED` | Session required | Do not expose protected data | Sign in |
| `FORBIDDEN` | Session exists but access is denied | Do not leak existence/details | Request access/back |

`SUCCESS` is not synonymous with `SAFE`. A successful Trust response can contain a `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, or `CONFLICTING_EVIDENCE` decision. `UNAVAILABLE` is never silently represented as `SUCCESS`.

The runtime guard rejects malformed envelopes, requires data for `SUCCESS`/`EMPTY`/`PARTIAL`, requires missing scope for `PARTIAL`, requires unresolved facts for `UNKNOWN`/`INSUFFICIENT_EVIDENCE`, requires an unavailable dependency for `UNAVAILABLE`, requires a safe error for `ERROR`/`AUTH_REQUIRED`/`FORBIDDEN`, and rejects `SAFE` Trust semantics on uncertain states.

Feature-specific labels such as `INVALID_INPUT`, `NORMALIZED`, `OCR_RUNNING`, `OCR_PARTIAL`, `ENTITY_REVIEW`, `L1_RUNNING`, `L2_RUNNING`, `L3_RUNNING`, `L4_RUNNING`, `RECONCILING`, `COMPLETE`, `REPORT_READY`, `NO_PASSPORT`, and `PENDING_REVIEW` are phase/substate values, not additional top-level meanings. Their envelope mapping is:

| Feature phase/substate | Envelope state |
| --- | --- |
| `INVALID_INPUT` | `ERROR` |
| `NORMALIZED`, `OCR_RUNNING`, `L1_RUNNING`, `L2_RUNNING`, `L3_RUNNING`, `L4_RUNNING`, `RECONCILING`, `ENTITY_REVIEW` | `LOADING` or `VALIDATING` as appropriate |
| `OCR_PARTIAL` | `PARTIAL` |
| `COMPLETE`, `REPORT_READY`, `PENDING_REVIEW`, `CREATED`, `HISTORY_READY` | `SUCCESS` with the phase retained |
| `NO_PASSPORT` | `EMPTY` |

An error, unavailable, unknown, insufficient, conflict, offline, or cancellation state always takes precedence over a descriptive phase when that condition is active.

## Base transition matrix

| Trigger | From | To | Action | Boundary/error rule |
| --- | --- | --- | --- | --- |
| User submits valid input | `IDLE` | `VALIDATING` | Create request/run identity | Enforce type/size/format/policy |
| User submits invalid input | `IDLE` or `VALIDATING` | `ERROR` | Show field correction | Do not call provider |
| Boundary accepted | `VALIDATING` | `LOADING` or `SUBMITTING` | Call approved adapter | Keep provider mode explicit |
| Request completes with valid data | active | `SUCCESS` or `EMPTY` | Publish parsed data | Schema must pass |
| Some providers/stages fail | active | `PARTIAL` | Keep completed data and missing scope | No silent omission |
| Evidence cannot support meaning | active | `UNKNOWN` or `INSUFFICIENT_EVIDENCE` | Show uncertainty | Never infer `SAFE` |
| Relevant values disagree | active | `CONFLICTING_EVIDENCE` | Show conflict/provenance | Do not average away conflict |
| Provider cannot be reached | active | `UNAVAILABLE` | Identify dependency/stage | No demo fallback unless explicit mode |
| Client loses network | active | `OFFLINE` | Preserve safe local state | No write/persistence claim |
| Auth absent | active | `AUTH_REQUIRED` | Preserve safe return context | Do not leak private data |
| Auth denied | active | `FORBIDDEN` | Explain access boundary | Do not reveal resource existence |
| Timeout/network/upstream failure | active | `ERROR`, `UNAVAILABLE`, or `OFFLINE` | Map typed error | Do not convert to domain evidence |
| User cancels or newer run starts | active | `CANCELLED` for old run | Abort/ignore stale work | `runId` check required |

## Trust state machine

`Trust` may use the existing detailed phase vocabulary under the shared state envelope:

    IDLE
      → VALIDATING
      → OCR_RUNNING (image only)
      → NORMALIZED
      → L1_RUNNING
      → EARLY_BLOCK or L2_RUNNING
      → L3_RUNNING
      → L4_RUNNING / RECONCILING
      → COMPLETE

Any active phase may transition to `PARTIAL`, `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, or `CANCELLED` according to the cause. An early block records which deeper phases did not run. An image flow may pass through `OCR_PARTIAL` and `ENTITY_REVIEW`; user edits are separate from OCR provenance.

Trust result semantics:

- `verdict` is a domain result, not the UI `state`.
- `risk`, `confidence`, `evidenceCoverage`, `sourceAgreement`, and `unresolvedSignals` are separate fields with documented units/meaning.
- `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, and `CONFLICTING_EVIDENCE` cannot be mapped to a safe verdict by presentation code.
- provider statuses (`clean`, `finding`, `unknown`, `error`, `unavailable`) remain attached to their provider/source.
- a demo result carries explicit demo provenance and cannot be labelled live.

## Community state model

Community resources use:

    IDLE → LINKING → LOADING → EMPTY or SUCCESS
                         └────→ PARTIAL / CONFLICTING_EVIDENCE / UNAVAILABLE

Contribution uses:

    AUTH_REQUIRED → VALIDATING → SUBMITTING → SUCCESS
                                      └──────→ ERROR / OFFLINE / UNAVAILABLE

An observation has its own moderation/publication state. `SUCCESS` means the observation write was accepted, not that the observation is true. No observation count is a Trust verdict.

## Expert state model

Expert discovery/evaluation uses:

    LINKING → SCOPE_SELECTION → LOADING → EMPTY or SUCCESS
                                      └→ UNKNOWN / UNAVAILABLE / ERROR

Review mutation uses:

    AUTH_REQUIRED → VALIDATING → SUBMITTING → PENDING_REVIEW
                                      └──────→ ERROR / OFFLINE / UNAVAILABLE

An assessment can be `SUCCESS` as a persisted event while its content is out-of-scope, uncertain, or in disagreement. The event must carry case revision, evidence reviewed, scope, confidence, limitations, reviewer identity, and timestamp.

## Passport state model

    IDLE → AUTH_REQUIRED or LOADING
                 ├→ EMPTY (NO_PASSPORT)
                 └→ LOADING_HISTORY → SUCCESS / PARTIAL / CONFLICTING_EVIDENCE

Create uses:

    NO_PASSPORT → VALIDATING → SUBMITTING → SUCCESS (CREATED)
                                           └──────→ ERROR / UNAVAILABLE / OFFLINE

No optimistic UI card is a Passport revision until persistence confirms it. An unavailable write must say “not confirmed saved.”

## Stale response and concurrency rules

- Each investigation/mutation gets a unique `requestId`; each Trust scan gets a unique `runId`.
- Only the current request/run may commit to feature state.
- Abort is best effort; ignoring a late response is mandatory.
- Repeated submit actions use idempotency keys where the contract supports mutation.
- A route change unmount may cancel work, but it must not erase an already confirmed Passport event.
- Cached data is labelled stale when revalidation is active.

## Rendering and accessibility rules

- Every non-idle state has a text label and a programmatically determinable status; color alone is never semantic.
- Loading/partial/error/unavailable changes use appropriate live-region announcements without noisy provider telemetry.
- Focus moves to the new result/error heading only when the interaction warrants it and returns predictably on dismissal.
- Dialogs, drawers, tabs, graph/list fallback, and menus have keyboard and screen-reader semantics.
- A disabled action explains why it is unavailable; it is not silently removed when the user needs to understand a boundary.

## Test matrix requirement

Each feature reducer/adapter must test at minimum: idle, valid success, empty, invalid input, partial, unknown, insufficient evidence, conflict, unavailable, timeout, network/offline, unauthorized, forbidden, schema mismatch, abort/stale response, and explicit demo mode. Live integration tests are `BLOCKED_BY_ENV` when the required environment is missing; they must not be reported as passing.

## Continuous program implementation evidence

- `createStateEnvelope` and feature constructors provide the canonical envelope without introducing a competing state vocabulary.
- `UI_STATE_TRANSITIONS` and `transitionState` reject invalid semantic transitions; `createWorkIdentity`, `isCurrentWork`, and `commitIfCurrent` prevent stale request/run commits.
- `uiStateForApiError` maps transport codes to `AUTH_REQUIRED`, `FORBIDDEN`, `CONFLICTING_EVIDENCE`, `OFFLINE`, `UNAVAILABLE`, `CANCELLED`, `PARTIAL`, or `ERROR` without creating a Trust verdict.
- Foundation suite: `4/4 files PASS`, including `18` adapter assertions; full discovered suite: `265/265 PASS`.
- Chromium browser suite: `67 passed`, `3 skipped`; invalid/unknown/partial/unavailable/stale-run behavior is covered locally. Live integration is `BLOCKED_BY_ENV`.
- TypeScript and production build pass (`117/117` static pages); full ESLint has `0` errors and `332` warnings.
