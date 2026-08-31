# StudentHubAI Competition Technical Brief

## Product thesis

StudentHubAI is an evidence-first student operating system. It separates official information, community reality, scoped expert judgment, and model reasoning, then turns their intersection into a reviewable next move. The product is deliberately conservative: uncertainty is a valid result.

## Architecture at a glance

```text
Browser / competition cases
        |
        v
Next.js App Router + shared Margin shell
        |
        v
Security Fabric -> identity -> authorization -> rate/size limits -> safe error envelope
        |
        +--> canonical Trust facade (Layer 1 precheck -> Layer 2 semantics -> Layer 3 evidence -> Layer 4 verdict)
        +--> Community / Expert / Academic deterministic domain engines
        +--> AI Gateway (capability routing, provider health, schema validation, fallback)
        +--> Evidence Passport + Student Decision Twin repositories
        +--> authenticated Command Center / notifications
        |
        v
Postgres/Supabase repositories (service-authoritative writes, RLS in deployment)
```

## Authority and provenance model

- Official sources are registered, timestamped, freshness-aware, and kept separate from community reports.
- Community entries expose moderation and provenance metadata; popularity is never a truth score.
- Expert evidence is domain-scoped and credential-provenance-aware.
- Trust verdicts abstain when evidence is insufficient or contradictory. A browser cannot promote an input to official evidence.
- Passport and Decision Twin mutations derive ownership from the authenticated principal. Privileged provenance, status, and deterministic consequence labels are server-controlled.
- Demo fixtures are labeled `DEMO_FIXTURE`/`SYNTHETIC_FIXTURE`, use non-network references, and are rejected by live persistence boundaries.

## Security posture

All high-risk route boundaries use the Security Fabric. The audit hardened generic public error envelopes, correlation IDs, request bounds, rate-limit memory bounds, SSRF/DNS-rebinding/unsafe-redirect defenses, safe external-link handling, redacted logs, and owner-bound Trust detail reads. Public community projections exclude author identifiers and server-only trust scores; authenticated mutation responses return only the caller's own server-assigned reconciliation fields.

## AI Gateway and reliability

Provider adapters are capability-specific, schema-validated, size-limited, and fail into typed degraded states. API keys remain headers. The gateway supports deterministic fallback where the product contract allows it, never fabricates provider success, and exposes provider availability separately from answer confidence. The local Observatory is synthetic and non-authoritative.

## Competition strengths

1. One coherent narrative across Trust, Community, Expert, Academic 360, Passport, Decision Twin, and Command Center.
2. Evidence Triangle makes authority boundaries legible to judges.
3. Deterministic academic eligibility, planning, deadlines, and notification workflows are inspectable.
4. `/cases` provides a fast, repeatable, offline-safe superflow without disguising fixtures as production data.
5. Accessibility, reduced-motion, responsive, and browser tests are part of the release gate rather than visual afterthoughts.

## Release truth

The local candidate is suitable for a competition rehearsal and is `RC READY WITH EXTERNAL LIMITATIONS` only when the attached audit report is read with its environment blockers. Live database/RLS, fresh providers, staging deployment, and Firefox runtime proof are intentionally not claimed until supplied.
