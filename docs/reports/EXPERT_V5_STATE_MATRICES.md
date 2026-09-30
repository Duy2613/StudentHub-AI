# Expert V5 State and Authority Matrices

These matrices are the implementation contract after the read-only capability audit. The database and server service are authoritative. Realtime payloads are invalidation/status hints; clients re-fetch authorized state. No AI output, host vote, expert majority, browser timer, or client reward mutation is authoritative.

## Source and question lifecycle

| Current state | Event / guard | Next state | Server authority |
|---|---|---|---|
| SOURCE_REGISTERED | registry enabled; URL passes canonical HTTP(S), DNS/IP and redirect safety; policy/rate limit allows fetch | FETCHING | source ingestion worker |
| FETCHING | successful public retrieval with non-empty readable source | SNAPSHOTTED | bounded fetcher; retain metadata, hash and permitted small evidence excerpts only |
| FETCHING | auth/login/paywall/robots/anti-bot/rate-limit/unsupported/timeout/SSRF denial | BLOCKED or UNAVAILABLE | fetcher emits reason; no bypass/retry-through-browser; no question generated |
| SNAPSHOTTED | editor submits proposed item and each answer maps to source evidence | DRAFT | question authoring service |
| DRAFT | source still available, evidence supports answer, distractors reviewed, domain/difficulty assigned, editorial reviewer approves | ACTIVE | validator + authorized reviewer |
| ACTIVE | hash changed, source unavailable/withdrawn, or validity expires | REVALIDATION_REQUIRED | revalidation job; existing attempts remain readable |
| REVALIDATION_REQUIRED | revalidated and approved against new immutable source revision | ACTIVE with new version | authorized reviewer |
| any non-terminal | retirement decision | RETIRED | authorized reviewer; no new serving |

Invariant: `BLOCKED`, `UNAVAILABLE`, empty extraction, and unsupported source types never become a question or a Trust conclusion. No snippet/AI summary is adequate evidence by itself.

## Daily mission lifecycle

| Current state | Event / guard | Next state | Authority |
|---|---|---|---|
| absent | authenticated active Expert requests today; server day/timezone, verified domains, server-owned level policy, freshness and prior assignments pass | AVAILABLE | mission assignment transaction |
| AVAILABLE | owner opens the assigned item | IN_PROGRESS | mission service |
| IN_PROGRESS | evaluation is durably accepted for the assigned current question version | COMPLETED | server evaluator / adjudication service |
| AVAILABLE or IN_PROGRESS | server day boundary passes without completion | EXPIRED | server clock on read or scheduled reconciliation |
| any | duplicate assignment request for same owner/day/mission key | unchanged existing row | unique key + idempotent readback |

Client-provided date, timezone, question ID, level, reward, score, and completion flag cannot create or settle a mission. The server selects a question only from current `ACTIVE` source-backed items in the verified domain and permitted difficulty band.

## Quiz attempt lifecycle

| Current state | Event / guard | Next state | Authority |
|---|---|---|---|
| none | begin an assigned mission; item remains ACTIVE and source current | IN_PROGRESS | mission transaction; DB timestamp |
| IN_PROGRESS | owner submits an answer before server deadline | IN_PROGRESS with immutable answer revision | answer service; owner and round lock |
| IN_PROGRESS | owner submits final answer / mission deadline reached | SUBMITTED / EXPIRED | DB server time; no client clock |
| SUBMITTED | deterministic evaluator has a supported evaluator for question type | EVALUATED | server evaluator; answer key stays private until this state |
| SUBMITTED | unsupported or insufficient rubric/evidence | REVIEW_REQUIRED | no score/reward; honest status |

Answers are private to their owner until evaluation/authorized review. Correct option/rubric is omitted from all in-progress DTOs. Retries cannot alter a submitted answer.

## Verification room lifecycle

| Current state | Event / guard | Next state | Authority |
|---|---|---|---|
| none | authenticated Host submits supported Trust input and context | WAITING_FOR_SUPERVISOR or LOBBY | room create transaction; owner is authenticated principal |
| WAITING_FOR_SUPERVISOR | eligible independent, online, matching-domain Expert joins and is assigned by server | LOBBY | server eligibility and join transaction |
| LOBBY | Host starts; supervisor bound; participant set frozen | QUESTION_ACTIVE | room service |
| QUESTION_ACTIVE | DB clock reaches `answer_deadline_at` or all eligible answers are submitted | ANSWER_LOCKED | DB transaction/clock |
| ANSWER_LOCKED | exact original Trust payload and host identity still match; one canonical Trust invocation starts | TRUST_ANALYZING | canonical Trust pipeline |
| TRUST_ANALYZING | canonical pipeline persists case and returns usable real evidence | ADJUDICATION | Trust output projection; Trust itself is not ground truth |
| TRUST_ANALYZING | provider/retrieval fails, blocked, or insufficient evidence | ADJUDICATION_BLOCKED / TRUST_UNAVAILABLE | server; answers retained; score and reward withheld |
| ADJUDICATION | system rubric proposes supported per-answer score | SUPERVISOR_CONFIRMATION | deterministic evaluator; proposal is not settlement |
| SUPERVISOR_CONFIRMATION | assigned independent supervisor confirms or rejects proposal | HOST_ACKNOWLEDGEMENT or DISPUTED | supervisor principal, immutable decision |
| HOST_ACKNOWLEDGEMENT | Host acknowledges same proposal and Supervisor decision | SETTLED | server transaction; score policy and reputation event are calculated server-side |
| ADJUDICATION or HOST_ACKNOWLEDGEMENT | Host and Supervisor disagree or evidence conflicts | DISPUTED | server; no reputation event |
| any pre-settlement state | Host cancels or server expiry policy applies | CANCELLED / CLOSED | server; preserve immutable answers and audit lineage |

`LOBBY`, `WAITING_FOR_SUPERVISOR`, `QUESTION_ACTIVE`, `ANSWER_LOCKED`, `TRUST_ANALYZING`, `ADJUDICATION`, `DISPUTED`, `SETTLED`, `CLOSED`, `CANCELLED`, `TRUST_UNAVAILABLE`, and `ADJUDICATION_BLOCKED` are the semantic states. A backend may store a normalized subset plus explicit outcome codes, but cannot skip these authority boundaries.

## Room round and answer privacy

| Phase | Host | Participant Experts | Supervisor | Public / non-member |
|---|---|---|---|---|
| lobby | sees members and room status | sees lobby and own join state | sees only if assigned/joined | no access |
| question active | sees challenge and aggregate submitted count only | sees challenge and own answer status; never another answer | sees deadline/status, not answer contents | no access |
| answer locked | may see answer set only when adjudication policy opens it | may see own answer; other answers released only after lock | may inspect locked answer set | no access |
| Trust / evidence | sees canonical returned Trust package | sees authorized package after privacy gate | sees package for adjudication | no access |
| adjudication | can acknowledge/dispute proposal; cannot set delta | sees own proposal/result after policy gate | confirms/rejects rubric proposal, cannot alter original answers/delta | no access |
| settled | sees final scores, reason, non-private event summary | sees own score/reason/reputation event | sees decision lineage | no private participant information |

The existing generic `expert` SSE channel is not a room authorization mechanism. Every read/mutation checks current room membership and role server-side. Before answer lock no event payload may include answer text, option, correctness, score, or supervisor rationale.

## Adjudication, score, and reputation

1. Objective question evaluation is deterministic and tied to the active question version and evidence references.
2. Nuanced evaluation requires an explicit evidence-based rubric and supervisor review. If no supported evaluator exists, mark `REVIEW_REQUIRED`; do not let an LLM invent a correctness score.
3. Host and Supervisor decisions are immutable, principal-bound and idempotent. Disagreement yields `DISPUTED`.
4. A settlement transaction requires the same room, round, Trust case/revision, question version, locked answer set, source evidence and both confirmations.
5. Score-to-reputation mapping is server-configured: `<70 => +0`, `70..<95 => +1`, `95..100 => +2`. Negative reputation is never applied for ordinary incorrect answers.
6. Append into the existing `private.reputation_events` ledger with a unique room/round/expert idempotency key and auditable room/round/Trust lineage metadata. No client can choose event type, score, delta, reason, actor or recipient.
7. Daily caps and mission rewards remain policy-controlled; if no configured cap/reward is approved, do not grant additional rewards.

## Time, presence, and reconnect

- Server/database time owns mission day, attempt deadline, room deadline, expiry and settlement timestamp.
- UI countdown is derived from `answer_deadline_at`; screen readers receive only the agreed checkpoints (30, 10, 5 seconds, ended), never a one-second announcement loop.
- Room join, leave and online state must derive from authenticated, room-authorized server state. Last-seen alone is not online presence.
- Reconnect and duplicate SSE events cause an authorized state read; the server's current state wins. Timer deadline and answers are not restarted or replayed from client state.
- Late joining after question reveal is denied for that round. Host loss or supervisor departure pauses progression or requires an explicitly authorized reassignment; no silent settlement.
