# StudentHubAI Evaluation Plan

Status: post-feature-freeze evaluation plan
Owner: StudentHubAI release owner
Evaluation mode: deterministic offline-safe fixtures first, authenticated live integrations only when explicitly configured

## Evaluation objective

Demonstrate that StudentHubAI turns uncertain student information into a traceable next action without presenting community volume, model output, or a user assertion as official truth. The judged path must show the relationship between Trust, Community, Expert, Academic 360, Evidence Passport, Student Decision Twin, and the personal Command Center.

## Five-to-seven minute judged path

| Time | Surface | What to show | Proof standard |
| --- | --- | --- | --- |
| 0:00–0:40 | `/cases` | Select a labeled competition case and point out the `DEMO_FIXTURE`/synthetic notice | Fixture data is visibly separated from live authority; no silent provider claim |
| 0:40–1:45 | `/trust` | Submit a URL or use the prepared case; show verdict, evidence layers, abstention, source independence, and related case | `SAFE` is never emitted without sufficient evidence; `UNKNOWN`/insufficient evidence stays visible |
| 1:45–2:35 | `/community` | Filter/search a reality-gap report and open provenance | Community is context, not truth; recency, volume, and moderation state remain explicit |
| 2:35–3:20 | `/expert` | Open a scoped expert and compare a claim or disagreement | Authority is domain-scoped; credentials and evidence are distinct from endorsement |
| 3:20–4:25 | `/academic` or `/academic/command-center` | Show source status, deterministic eligibility/planner output, deadline, and action center | Official source, cohort/version, freshness, and deterministic basis are visible |
| 4:25–5:20 | Passport + Decision Twin | Open the evidence packet and run one “what changes if…” decision scenario | Each factor has a basis; user assumptions cannot become official evidence or a deterministic consequence |
| 5:20–6:10 | `/dashboard` | Show the cross-pillar Next Clear Move and notification state | The dashboard is authenticated; demo fixtures require explicit Demo Mode |
| 6:10–7:00 | failure proof | Trigger insufficient evidence, provider outage, or invalid input | Recovery is typed, correlation-safe, and honest; no fabricated live success |

## Evidence map

| Capability | Primary UI | Contract/engine proof | Authority boundary |
| --- | --- | --- | --- |
| Trust | `/trust` | canonical Trust facade, Layer 1→4 tests | server composes evidence; browser cannot assign authority |
| Community | `/community` | community query and moderation contracts | community signals are labeled non-official |
| Expert | `/expert` | expert discovery, scope, evidence DTO tests | scope/credentials are not universal trust |
| Academic 360 | `/academic`, `/academic/command-center` | deterministic academic and workflow suites | source/cohort/version/freshness are required |
| Evidence Passport | authenticated Passport flow | owner, revision, provenance, concurrency tests | privileged provenance is server-assigned |
| Student Decision Twin | decision studio | factor/basis/review-state tests | assumptions remain assumptions; review is required |
| Command Center | `/dashboard` | authenticated dashboard contract and personalized briefing | no unauthenticated silent fallback |

## Repeatable evaluation commands

Run from the repository root unless noted otherwise:

```text
npm run test:all-discovered
npm run test:final-audit
npm run test:security
npm run test:phase2-auth
npm run test:phase3-contract
npm run lint
npm run build
npm run audit:api-auth
npm run audit:bundle
```

Browser coverage is executed from `frontend/`:

```text
npx playwright test --project=chromium
npx playwright test --project=webkit --grep-invert visual
npx playwright test --project=mobile-chromium
```

Firefox and staging commands are evidence-producing checks, but remain environment-dependent. Their blocked state must be reported rather than converted into a pass.

## Evaluation controls

- Use only the approved fixture cases for the offline demo. Do not imply that fixture counts, timestamps, percentages, or provider health are live.
- Keep the browser network panel closed during the judged flow unless demonstrating a failure; the visible product contract is the source of truth for the demo.
- Record route, build revision, fixture identifier, provider state, and timestamp with any screenshot or score sheet.
- Treat an unavailable provider as a typed degraded state. Never edit a fixture to look like a live result.
- A release can be recommended only after all non-external P0/P1 gates pass and external blockers are named with a reproducible command.
