# StudentHubAI Product Map

Updated: 2026-08-30. This map is an implementation map, not a promise that every external provider is live.

## Product spine

StudentHubAI answers **what is claimed, what supports it, who said it, what conflicts, what remains unknown, what changed, and what the student should do next**. The five locked pillars share one evidence/provenance vocabulary:

| Pillar | Canonical experience | Reused domain services | Primary route |
| --- | --- | --- | --- |
| Trust Engine | Multimodal screening, claims, source/evidence timeline, uncertainty | `ai-trust/layer1..4`, `trust`, `intelligence/trust` | `/trust` |
| Community Intelligence | Observation ledger, incidents, consensus, Reality Gap, moderation | `intelligence/community`, `forum`, `intelligence/social` | `/community`, `/forum` |
| Expert Trust Network | Credential provenance, scoped authority, matching, disagreement | `intelligence/expert` | `/expert` |
| Academic 360 | Versioned sources, deterministic rules, planner, what-if, execution | `intelligence/academic`, `scheduler`, `tuition` | `/academic` |
| Personal Command Center | Explicit priority factors and next clear moves | `personalization`, `home`, `academic` | `/dashboard` |

## Cross-system spine

`Trust → Community → Expert → Academic → Decision Twin → Evidence Passport → Command Center` is a handoff graph, not seven unrelated widgets. `/cases` is the competition case lab that renders all handoffs in one place. Evidence Triangle keeps Official, Community, and Expert evidence visibly distinct.

## Shared infrastructure

- Auth/session: `lib/auth`, `lib/security`, Supabase/OIDC boundary, `SecurityFabric`.
- Persistence: PostgreSQL repositories and migrations under `database/migrations`.
- AI: one server-side `lib/ai-gateway` with capability routing and explicit provider state.
- Retrieval: source registry, document snapshots, keyword/hybrid retrieval, provenance-preserving evidence.
- UI grammar: Margin rail/body/footnote primitives; bounded Reading Room and Trust-only Instrument states.

## User journeys

1. **Enter** — landing/Reading Room introduces the evidence grammar.
2. **Question** — Trust or Community accepts a claim, link, document, or observation.
3. **Verify** — deterministic signals, providers, official sources, and scoped experts are combined.
4. **Return** — Passport records result changes and unresolved uncertainty.
5. **Apply** — Decision Twin compares concrete options and consequences.
6. **Adapt** — Command Center exposes the next clear move and material updates.

## Explicit boundaries

The product is not a generic chat app, URL blacklist, rating directory, notebook UI, or sixth independent pillar. Marketplace/quests/legacy utilities remain compatibility surfaces until a demonstrated core dependency exists.
