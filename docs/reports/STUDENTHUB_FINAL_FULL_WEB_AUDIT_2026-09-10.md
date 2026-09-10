# StudentHub AI — Final Full Web Audi

Date: 2026-09-10
Candidate: `STUDENTHUB_EXPERT_HYBRID_RC`
Branch: `implementation/academic-cinematic-v1-f00`

## Decision

`STUDENTHUB_FULL_WEB_RC_PARTIAL`

The release-critical web surface is buildable, typed, browser-tested, and free of the discovered landing runtime crash. The word `PARTIAL` is intentional: the evidence does not claim a fresh browser crawl of every dynamic/legacy page or an external preview deployment.

## Discovery

- Next App Router source discovery: `47` page route entries.
- Production build output: `150` generated static pages.
- API discovery: `141` route files and `174` HTTP handlers.
- Redirect configuration: `17` user-facing redirects, including retired Learning routes and canonical `/contract-check`, `/prof-rating`, `/forum`, `/scam-check`, `/ai`, and `/ultra` mappings.
- Machine-readable inventory: `artifacts/manifests/route-inventory-2026-09-10.json`.

The build route manifest was used as a second inventory source. Removed LMS scope was not resurrected; legacy paths remain redirects or honest retired surfaces according to repository configuration.

## Core web evidence

The landing, Trust, Community, Expert, Cases, dashboard/settings route entries, canonical redirects, and API route presence all compile in the production build. The active browser matrix covers the release-critical landing, Trust, Community, Expert, Cases, responsive, accessibility, navigation, and authority-boundary journeys. Full route-by-route HTTP/visual crawling of all `47` source entries is not claimed.

`agent-browser` verification passed on the local landing surface:

- content and evidence chapter present;
- command palette opened and rendered its dialog;
- captured `console.error` list was empty;
- screenshot: `artifacts/release-candidate-home-agent-browser.png`.

The browser crash found during the pass was a missing `Compass` import in `frontend/src/components/command/AcademicCommandPalette.jsx`; the import was added and the landing smoke then passed.

## Product truth boundaries

The current UI uses honest empty/unavailable states for live Community/Expert projections. Trust result surfaces preserve conclusion, why, evidence, contradictions, unknowns, limitations, and next action without inventing sources, experts, counts, or confidence. Expert assessments enter Trust as typed `EXPERT_ASSESSMENT`; they do not directly set the verdict or source authority.

## Non-claims

This audit does not claim production deployment, Main Supabase migration, live-provider metrics, final independent retrieval generalization, or final independent AI evaluation. The external preview QA target was not treated as a local green result.

\n