# StudentHub OSS / external-reference ledger

Audit scope: Community × Expert Promax closure, run 2026-09-10. This ledger records
reference usage and compatibility boundaries. It is not a dependency manifest.

| Reference | Pattern consulted | License / terms boundary | StudentHub decision |
| --- | --- | --- | --- |
| Discourse | Trust levels, badges, permissions, moderation and abuse handling | GPL-2.0 | Conceptual pattern only. No Discourse source or implementation code is copied. |
| Forem | Reactions, community participation, profiles, moderation and content lifecycle | AGPL-3.0 | Conceptual pattern only. No Forem source or implementation code is copied. |
| OpenReview | Reviewer profiles, invitations, matching / affinity and conflict handling | OpenReview Python client: MIT; upstream terms still apply to any future reuse | Workflow and data-model reference only. StudentHub keeps its own Supabase/Postgres implementation. |
| Supabase agent skills | PostgreSQL, RLS, indexes and performance review patterns | Documentation / agent guidance; no runtime code vendored | Guidance only. No new backend or paid infrastructure dependency. |
| Vercel React best practices | React data-fetching, rendering, accessibility and bundle boundaries | Documentation / best-practice guidance; no runtime code vendored | Review guidance only. Server-only repositories remain outside client bundles. |
| 21st / Magic MCP | Component discovery and UI workflow inspiration | Reference workflow only; no component source copied | Inspiration only. No MCP dependency is required by Promax runtime. |
| Convex agent skills | Auth, reviewer and testing patterns | Guidance only; no Convex code or SDK dependency | Pattern reference only. StudentHub remains locked to Supabase/Postgres. |
| `public-apis/public-apis` | Candidate API discovery | Directory is not authority, freshness, license, rate-limit or privacy proof | Discovery list only. Every selected provider is audited before use. |

## Implemented public API boundary

The repository does contain server-side adapters for OpenAlex, Crossref REST,
Open-Meteo and GDELT. They are GET-only, allowlisted, bounded by timeout and
response size, and return typed degradation. Academic/public metadata is
discovery or context only; it is not promoted to official policy evidence or
Trust authority. The adapters are not sourced from the references above.

## Compatibility decision

No GPL-2.0 or AGPL-3.0 implementation code has been copied into StudentHub.
The Promax schema, repositories, UI and tests are original project code. Any
future source vendoring requires a separate license review and explicit record
here before it enters the runtime.
