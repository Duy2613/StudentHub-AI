# StudentHub AI — Frozen Superflows

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Flow contract

These are product and state-transition contracts. They are not a claim that every live provider, persistence path, or final visual composition already exists. Current implementation coverage and environment limits are recorded in `docs/recon/EVIDENCE-CLEANUP.md`.

Shared rules:

- `UNKNOWN` means the system does not know; it is never `SAFE`.
- `INSUFFICIENT_EVIDENCE` means a conclusion cannot be responsibly supported.
- `CONFLICTING_EVIDENCE` preserves disagreement; it is not averaged into certainty.
- `UNAVAILABLE` means a provider or dependency could not be reached; it is not a finding.
- `PARTIAL` means some stages/providers completed and the missing scope is visible.
- Demo output is explicit and carries `DEMO_FIXTURE` provenance.
- No UI progress stage is shown unless the provider/application actually entered it.
- A Community observation or Expert assessment creates a typed event; only Trust reconciliation may change the Trust case report.

## A. URL → Investigation → Report → Action

### ENTRY

The user enters `/trust` in URL mode, pastes a URL, or arrives through `/scam-check`, `/contract-check`, `/ai`, or `/intelligence/*` compatibility navigation. Compatibility entry resolves to `/trust` with validated source context. A URL is not fetched by the browser as part of input validation.

### INTENT

Determine whether a URL or linked claim requires caution, explain the evidence and uncertainty, and provide a safer next action before the user clicks, pays, signs in, uploads, or shares.

### STATES

| State | Meaning | User-visible rule |
| --- | --- | --- |
| `IDLE` | No submitted input | Show input affordance only |
| `VALIDATING` | Format, size, policy, and abuse checks | Do not call deep providers yet |
| `INVALID_INPUT` | Input cannot be accepted | Explain correction; no verdict |
| `NORMALIZED` | Canonical case input created | Show normalized target without inventing facts |
| `L1_RUNNING` | Decision-stage providers are running | Show truthful bounded status |
| `EARLY_BLOCK` | A blocking safety result allows safe early action | Show action and evidence basis; do not imply every deep stage ran |
| `L2_RUNNING` | Explanation evidence is being collected | Keep prior result labelled provisional if present |
| `L3_RUNNING` | Technical evidence is being collected | Do not expose fabricated telemetry |
| `L4_RUNNING` | Reconciliation/policy stage is running | Preserve provider disagreement |
| `PARTIAL` | Some required stages/providers completed | State completed/missing scope explicitly |
| `COMPLETE` | Contract-valid report is available | Show report with evidence and action |
| `UNKNOWN` | No reliable conclusion | Do not render SAFE reassurance |
| `INSUFFICIENT_EVIDENCE` | Evidence is too sparse to conclude | Recommend containment or more evidence |
| `CONFLICTING_EVIDENCE` | Reliable observations disagree | Surface conflict and cautious action |
| `CANCELLED` | User or lifecycle cancelled the run | Preserve no stale result as current |
| `UNAVAILABLE` | Provider/dependency unavailable | Explain unavailable scope; no inferred finding |
| `ERROR` | Request/contract/runtime failure | Give retry/support path and trace id when safe |
| `OFFLINE` | Network unavailable locally | Offer retry when online; no new verdict |

### TRANSITIONS

| From | Trigger | To | Invariant |
| --- | --- | --- | --- |
| `IDLE` | submit | `VALIDATING` | Assign request/run correlation without claiming a case result |
| `VALIDATING` | invalid | `INVALID_INPUT` | No provider call and no verdict |
| `VALIDATING` | valid | `NORMALIZED` | Canonical input/entity schema passes |
| `NORMALIZED` | start | `L1_RUNNING` | Provider mode is explicit: live or demo |
| `L1_RUNNING` | early policy result | `EARLY_BLOCK` | Mark deep stages not run |
| `L1_RUNNING` | continue | `L2_RUNNING` | Preserve stage status |
| `L2_RUNNING` | success/continue | `L3_RUNNING` | Attach evidence provenance |
| `L3_RUNNING` | success/continue | `L4_RUNNING` | Do not collapse unknowns |
| `L4_RUNNING` | valid reconciliation | `COMPLETE` | Report schema and state are valid |
| any running state | some providers fail | `PARTIAL` | Missing providers are listed |
| any running state | no supportable conclusion | `UNKNOWN` or `INSUFFICIENT_EVIDENCE` | No safe-by-default conclusion |
| any running state | disagreement | `CONFLICTING_EVIDENCE` | Keep competing observations |
| any running state | abort | `CANCELLED` | Ignore late response by run identity |
| any running state | unavailable/network | `UNAVAILABLE` or `OFFLINE` | Do not silently switch provider mode |
| any running state | contract/runtime failure | `ERROR` | Show retry/support boundary |

### FAILURE

Validation error, payload limit, unauthorized/forbidden, rate limit, timeout, abort, network error, upstream error, invalid JSON, schema mismatch, and provider partial failure are distinct error causes. The UI shows a safe human message plus retry/support behavior; it does not turn an error into a low-risk result.

### UNKNOWN

If the URL has no reliable identity/evidence or the available signals cannot support a decision, return `UNKNOWN` or `INSUFFICIENT_EVIDENCE`. The report must identify missing evidence and recommend not clicking, paying, signing in, or sharing until corroborated.

### UNAVAILABLE

If the Trust provider, upstream reputation source, or backend is unavailable, show `UNAVAILABLE` with the affected source/stage and retry path. A demo result may be used only when the user/configuration explicitly selected DemoProvider and the result is labelled; live failure must not silently fall back to demo.

### EXIT

The flow exits to a contract-valid Trust report, a safe terminal state, or cancellation. A successful report has a `caseId`, `runId`, revision/state metadata, evidence/provenance, and allowed action set. No result is treated as current if it belongs to an older run.

### NEXT ACTION

Choose one explicit action: avoid/contain, inspect evidence, add Community corroboration, request Expert escalation, create/open Evidence Passport, or retry with more evidence. The action is tied to the report state and must remain safe when evidence is incomplete.

## B. Screenshot → Entities → Evidence → Report

### ENTRY

The user selects an accepted screenshot/image in `/trust` image mode or opens a deterministic Case Lab fixture. Input is validated locally before upload/analysis.

### INTENT

Extract visible entities such as URLs, domains, payment requests, OTP language, QR payloads, and claims; connect those entities to evidence; produce a Trust report without inventing text, coordinates, or identity.

### STATES

| State | Meaning | User-visible rule |
| --- | --- | --- |
| `IDLE` | No image selected | Show accepted types/size |
| `VALIDATING` | File type/size/content policy check | Reject safely before analysis |
| `OCR_RUNNING` | Local or provider OCR active | Show truthful OCR stage |
| `OCR_PARTIAL` | Some text or regions extracted | Mark omissions; allow manual correction |
| `ENTITY_REVIEW` | Candidate entities await confirmation | Label candidates, not facts |
| `EVIDENCE_RUNNING` | Confirmed/accepted entities are investigated | Preserve entity provenance |
| `REPORT_READY` | Contract-valid Trust report exists | Link report evidence to source entity |
| `INSUFFICIENT_EVIDENCE` | Image/entity signal too sparse | Request clearer image or safer containment |
| `UNKNOWN` | Entity meaning cannot be resolved | No implied safe interpretation |
| `UNAVAILABLE` | OCR/entity/evidence service unavailable | Identify missing stage; no silent fixture |
| `ERROR` | File/API/contract failure | Retry or replace input |
| `OFFLINE` | Network unavailable | Keep local preview only; no new live conclusion |
| `CANCELLED` | User cancels | Discard late analysis for this run |

### TRANSITIONS

| From | Trigger | To | Invariant |
| --- | --- | --- | --- |
| `IDLE` | select | `VALIDATING` | File metadata is bounded |
| `VALIDATING` | invalid | `ERROR` | No fabricated entity/report |
| `VALIDATING` | valid | `OCR_RUNNING` | Create run identity |
| `OCR_RUNNING` | text/regions found | `ENTITY_REVIEW` | Candidate provenance retained |
| `OCR_RUNNING` | partial | `OCR_PARTIAL` | Missing text/regions stated |
| `OCR_RUNNING` | no usable result | `UNKNOWN` or `INSUFFICIENT_EVIDENCE` | No guessed entities |
| `ENTITY_REVIEW` | confirm/edit | `EVIDENCE_RUNNING` | User edits are distinguished from OCR output |
| `ENTITY_REVIEW` | no entity accepted | `INSUFFICIENT_EVIDENCE` | Offer clearer image/manual URL/text |
| `EVIDENCE_RUNNING` | valid result | `REPORT_READY` | Entity-to-evidence links are typed |
| `EVIDENCE_RUNNING` | partial/conflict | `PARTIAL` or `CONFLICTING_EVIDENCE` | Preserve missing/disagreeing sources |
| any active state | unavailable | `UNAVAILABLE` | No live-to-demo fallback |
| any active state | abort | `CANCELLED` | Late result ignored |

### FAILURE

Reject unsupported type, oversized file, decode failure, OCR timeout, unsafe upload, malformed QR/entity payload, unauthorized request, provider timeout, invalid response, or schema mismatch distinctly. The preview may remain available, but the report cannot claim analysis that did not complete.

### UNKNOWN

Unreadable text, ambiguous QR/entity content, or an unresolved claim is `UNKNOWN`/`INSUFFICIENT_EVIDENCE`. The user can manually confirm a candidate or supply a URL/text input; the system must not generate bounding boxes or entity labels without provider coordinates/data.

### UNAVAILABLE

If OCR, QR decoding, entity extraction, or Trust evidence is unavailable, show the exact unavailable stage. A local OCR hint is not a substitute for production evidence, and a demo fixture is available only by explicit selection.

### EXIT

Exit to a Trust report linked to the image input and entity identifiers, to a safe insufficient-evidence state, or to a cancelled input. Raw sensitive image retention follows Settings/Privacy and Passport policy.

### NEXT ACTION

Confirm/edit an entity, provide a clearer image, investigate the extracted URL/text, inspect evidence, add Community context, escalate to a scoped Expert, or save a Passport revision. Never encourage action on an unresolved entity.

## C. Trust → Community corroboration

### ENTRY

From a Trust report, the user opens related Community observations or selects “request community context,” arriving at `/community` with a validated `caseId` and permitted context. A Community user may also choose “investigate in Trust,” which starts Flow A.

### INTENT

Inspect or add time-bound student observations that corroborate, qualify, or dispute a Trust case without treating community volume as proof.

### STATES

| State | Meaning | User-visible rule |
| --- | --- | --- |
| `LINKING` | Validate case/context and authorization | Do not expose unauthorized case data |
| `LOADING` | Fetch observations | Show scope/time window |
| `EMPTY` | No observations found | State no corroboration, not safe |
| `OBSERVATIONS_READY` | Observations are available | Show source/context/time/evidence/freshness |
| `CONFLICTING_EVIDENCE` | Observations disagree | Preserve disagreement and dates |
| `SUBMITTING` | New observation is being validated | No duplicate submission |
| `SUBMITTED` | Observation persisted/accepted | Show moderation/provenance state |
| `PARTIAL` | Some observation sources unavailable | Identify missing scope |
| `UNAVAILABLE` | Community service unavailable | No inferred community consensus |
| `AUTH_REQUIRED` | Contribution requires a session | Offer login without losing safe context |
| `ERROR` / `OFFLINE` | Request failed or client offline | Retry; do not claim persistence |

### TRANSITIONS

| From | Trigger | To | Invariant |
| --- | --- | --- | --- |
| `LINKING` | valid context | `LOADING` | Case access is checked |
| `LINKING` | invalid/forbidden | `ERROR` or `AUTH_REQUIRED` | No case leakage |
| `LOADING` | none | `EMPTY` | Empty is not positive evidence |
| `LOADING` | results | `OBSERVATIONS_READY` | Observation provenance remains attached |
| `LOADING` | disagreements | `CONFLICTING_EVIDENCE` | Do not collapse conflict |
| `OBSERVATIONS_READY` | contribute | `SUBMITTING` | Auth and payload policy checked |
| `SUBMITTING` | accepted | `SUBMITTED` | Server result is canonical |
| `SUBMITTING` | validation/moderation failure | `ERROR` | No optimistic claim of publication |
| any load/submit | partial/unavailable/offline | respective state | Missing data is visible |
| `SUBMITTED` | Trust reconciliation requested | Trust case revision event | Community cannot directly set verdict |

### FAILURE

Invalid case context, unauthorized case access, anonymous contribution, attachment limit, moderation rejection, duplicate/idempotency conflict, rate limit, network failure, or backend unavailable are separate outcomes. Do not show a post as published until the contract confirms it.

### UNKNOWN

No observation, stale observation, missing source, or unresolved disagreement remains `UNKNOWN`/insufficient corroboration. It can guide further investigation but cannot be rendered as a Trust verdict.

### UNAVAILABLE

If Community data or contribution service is unavailable, show that community corroboration could not be checked. Trust retains its prior evidence state with an explicit missing-community signal; no safe/unsafe conclusion is invented.

### EXIT

Exit to Community observation detail, back to the Trust case, or to a typed submitted/pending state. A submitted observation becomes a case event only after server acceptance and Trust reconciliation.

### NEXT ACTION

Inspect evidence, add a sourced observation, report/correct an observation, return to Trust for reconciliation, or escalate to Expert. The UI must communicate freshness and moderation state.

## D. Trust → Expert escalation

### ENTRY

From a Trust report, the user chooses Expert escalation. The route opens `/expert` with validated `caseId`, current `caseRevision`, and required domain scope. No expert is presented as a match until scope/availability checks complete.

### INTENT

Request an accountable, scope-bound assessment for an uncertain, conflicting, or high-impact Trust case.

### STATES

| State | Meaning | User-visible rule |
| --- | --- | --- |
| `LINKING` | Validate case/revision and required scope | Bind review to exact revision |
| `SCOPE_SELECTION` | User chooses or confirms domain | No unbounded expert claim |
| `EXPERT_LOADING` | Search eligible experts | Show verification/availability state |
| `NO_SCOPED_MATCH` | No eligible expert found | Remain uncertain; offer other safe action |
| `EXPERT_SELECTED` | Candidate selected | Show scope, credentials, limitations |
| `SUBMITTING` | Review request submitted | Use idempotency key |
| `PENDING_REVIEW` | Request accepted, no assessment yet | No implied expert conclusion |
| `ASSESSMENT_READY` | Scoped assessment returned | Show evidence reviewed/confidence/time |
| `DISAGREEMENT` | Assessment conflicts with Trust/provider evidence | Preserve both and return to reconciliation |
| `PARTIAL` | Some expert data/review unavailable | Identify missing scope |
| `UNAVAILABLE` | Expert service/reviewer unavailable | No inferred authority |
| `AUTH_REQUIRED` | Request requires session | Offer login |
| `ERROR` / `OFFLINE` | Request failed or client offline | Retry without false pending state |

### TRANSITIONS

| From | Trigger | To | Invariant |
| --- | --- | --- | --- |
| `LINKING` | valid | `SCOPE_SELECTION` | Case revision captured |
| `LINKING` | invalid/forbidden | `ERROR` or `AUTH_REQUIRED` | No case leakage |
| `SCOPE_SELECTION` | scope confirmed | `EXPERT_LOADING` | Scope is typed |
| `EXPERT_LOADING` | no match | `NO_SCOPED_MATCH` | No popularity fallback |
| `EXPERT_LOADING` | eligible candidates | `EXPERT_SELECTED` | Verification and limitations visible |
| `EXPERT_SELECTED` | submit | `SUBMITTING` | Evidence/revision payload fixed |
| `SUBMITTING` | accepted | `PENDING_REVIEW` | Server request is canonical |
| `PENDING_REVIEW` | assessment returned | `ASSESSMENT_READY` | Assessment event is revision-bound |
| `ASSESSMENT_READY` | conflict | `DISAGREEMENT` | Expert opinion does not overwrite evidence |
| any active state | partial/unavailable/offline/error | respective state | Missing authority stays explicit |

### FAILURE

Out-of-scope request, no eligible reviewer, unverified credentials, stale case revision, unauthorized access, duplicate request, rate limit, moderation/review rejection, timeout, or invalid assessment contract must be shown distinctly. No review is marked complete without a valid assessment event.

### UNKNOWN

No scoped expert, unverified identity, no assessment yet, or an out-of-scope question is `UNKNOWN`/unresolved. The safe next action remains containment or evidence collection.

### UNAVAILABLE

If expert search or review is unavailable, show that escalation could not be completed. Do not substitute a seeded expert, generic model opinion, or popularity score for a missing reviewer.

### EXIT

Exit to Expert dossier, pending review, completed assessment attached to the case revision, disagreement state, or back to the Trust report. Expert data is an event; Trust reconciliation remains authoritative.

### NEXT ACTION

Wait for a pending review, inspect assessment evidence/limitations, request a different scoped expert, record disagreement, return to Trust reconciliation, or choose a safe containment action.

## E. Trust → Evidence Passport

### ENTRY

From a Trust report, the user selects create/open Passport, or enters a permitted case history from Dashboard/Profile. Passport operations require validated case ownership and privacy/retention policy.

### INTENT

Preserve an auditable, append-only record of case input, evidence provenance, decisions, Community events, Expert assessments, actions, and revisions.

### STATES

| State | Meaning | User-visible rule |
| --- | --- | --- |
| `IDLE` | No Passport action started | Explain what will be stored |
| `AUTH_REQUIRED` | Session/ownership required | Do not reveal private case history |
| `LOADING` | Check existing Passport | Show case/revision scope |
| `NO_PASSPORT` | No record exists | Offer create with retention disclosure |
| `CREATING` | Append initial revision | Idempotent write; no fake event |
| `CREATED` | Passport created | Show immutable revision identifier |
| `HISTORY_LOADING` | Load revision timeline | Preserve ordering and provenance |
| `HISTORY_READY` | Valid history available | Distinguish events from current verdict |
| `PARTIAL` | Some revisions/events unavailable | Show missing range/source |
| `CONFLICTING_EVIDENCE` | History contains disagreement | Preserve conflict across revisions |
| `UNAVAILABLE` | Persistence service unavailable | No claim that data was saved |
| `ERROR` / `OFFLINE` | Write/read failed or client offline | Retry; do not imply persistence |

### TRANSITIONS

| From | Trigger | To | Invariant |
| --- | --- | --- | --- |
| `IDLE` | open/create | `AUTH_REQUIRED` or `LOADING` | Ownership checked first |
| `LOADING` | none | `NO_PASSPORT` | Absence is explicit, not an error |
| `LOADING` | existing | `HISTORY_LOADING` | Case identity/revision validated |
| `NO_PASSPORT` | consent/create | `CREATING` | Retention/privacy acknowledged |
| `CREATING` | server accepted | `CREATED` | Server revision is canonical |
| `CREATING` | conflict/error/unavailable | `ERROR` or `UNAVAILABLE` | Never show unsaved as saved |
| `HISTORY_LOADING` | valid | `HISTORY_READY` | Revision order and provenance retained |
| `HISTORY_LOADING` | partial/conflict | `PARTIAL` or `CONFLICTING_EVIDENCE` | Missing/disagreeing events visible |
| any state | offline | `OFFLINE` | No write claim |

### FAILURE

Ownership failure, retention denial, sensitive-data policy rejection, duplicate create, stale revision, conflict, payload limit, rate limit, database/provider failure, timeout, invalid response, or offline write must be distinct. A UI optimistic card is not a Passport revision until the server confirms it.

### UNKNOWN

If a revision, evidence link, or event cannot be resolved, show it as unknown/missing and preserve the last known immutable history. Do not reconstruct or infer an event from a current screen.

### UNAVAILABLE

If Passport persistence is unavailable, tell the user that the record was not confirmed saved. Offer local retry/export only if the privacy contract permits it; do not silently store sensitive data in an unapproved fallback.

### EXIT

Exit to a created Passport, history detail, partial/conflicting history, an explicit unsaved state, or back to the Trust report. Dashboard/Profile may link to Passport according to ownership/privacy, but cannot rewrite revisions.

### NEXT ACTION

Inspect a revision, compare evidence, add a new Trust/Community/Expert event through its owning flow, adjust retention/privacy settings, or return to the current Trust action. Sharing/export is a later contract-gated capability.

## Implementation readout

The canonical local frontend now exposes the Trust-first entry and typed seams for all five flows. Browser coverage verifies URL/text investigation, invalid input fail-closed behavior, image/OCR hint disclosure, staged report rendering, related-case/TrustGraph behavior, Community/Expert route surfaces, Passport stale-revision protection, and cancellation/stale-run handling. Community/Expert persistence and live Passport integration remain dependent on the approved backend and are therefore `BLOCKED_BY_ENV`, not inferred as complete.
