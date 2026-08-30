# StudentHubAI Architecture

## Runtime shape

```text
Browser / PWA
  → Next.js App Router (server components + client surfaces)
  → SecurityFabric-wrapped route handlers (BFF/API)
  → domain/application services
  → repository + provider ports
  → PostgreSQL/Supabase, object storage, approved providers
```

This is a modular monolith. A worker is introduced only for document ingestion, deep verification, or scheduled source re-checks that exceed normal request time.

## Boundaries

- `src/app`: routes and thin composition.
- `src/components`: presentation and interaction; no vendor credentials.
- `src/lib/intelligence`: domain engines and cross-pillar services.
- `src/lib/ai-trust`: Trust pipeline layers 1–4.
- `src/lib/ai-gateway`: the single server-side AI adapter/router.
- `src/lib/security`: identity, authorization, purpose, rate, CSRF, audit, and safe error envelope.
- `src/lib/server/database` + `src/lib/intelligence/crossSystem`: durable repositories.
- `database/migrations`: versioned PostgreSQL schema/RLS.

## Authority rules

Authentication and authorization are server/database decisions. Deterministic Academic eligibility, Trust hard rules, role/Expert verification, and irreversible writes are never delegated to an LLM. Retrieved content is untrusted data and cannot override policy, schema, routing, or tool permissions.

## Request lifecycle

`request → size/rate → identity/session → CSRF → risk/purpose → RBAC/ownership → domain validation → repository/provider → normalized safe response + correlation id`.

Live provider absence returns an explicit unavailable/not-configured state. Demo fixtures are opt-in and carry `DEMO_FIXTURE` provenance.

## Visual architecture

The Margin is the shared presentation grammar: rail, document body, citations, and footnote provenance. Reading Room is limited to entry/transition moments. The Instrument is a Trust-only temporary state. Existing business logic remains intact while route shells are migrated incrementally.
