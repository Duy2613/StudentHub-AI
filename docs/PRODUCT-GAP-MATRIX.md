# StudentHubAI Product Gap Matrix

Updated: 2026-08-30. Status is based on the current worktree, focused tests, and available environments.

| Master batch | Current evidence | Status | Build action / honest boundary |
| --- | --- | --- | --- |
| A Product map | Product map, this matrix, checkpoint, branch comparison | COMPLETE | Keep map synchronized after major batch. |
| B DB/auth | V2 authority + feature-freeze migrations, Security Fabric, contract tests | FOUNDATION | Live clean migration/RLS/session restart require external DB env. |
| C Evidence/Passport | Immutable model, append-only migration/repository, `/api/v1/passports` | COMPLETE | Do not mix demo events into live records. |
| D Trust URL/text | Layer 1–4 engines, compatibility APIs, `POST /api/v1/trust` | COMPLETE WITH CONSOLIDATION DEBT | Canonical façade now exists; preserve legacy clients during migration. |
| E Image/document/RAG | Browser OCR, document/source/retrieval modules, explicit unavailable states | PARTIAL | No server OCR/provider success is claimed without configured worker/provider. |
| F Scam/fraud | Risk engines, incident signals, competition fixtures | COMPLETE | Real provider corroboration remains external. |
| G Community/Reality Gap | Community Reality Graph, incident/observation models and UI | COMPLETE | Moderation is focused, not a large backoffice. |
| H Expert | Credential/scope/verification/matching models and UI | COMPLETE | Verified status is server-authoritative; fixtures are labeled. |
| I Academic | Versioned curricula, deterministic rule/eligibility/planner/execution | COMPLETE | Live source refresh and database proof are external. |
| J Decision Twin | Explicit factors/bases, tie/unknown abstention, persisted API | COMPLETE | AI can explain, never choose hard rules. |
| K Command Center | Action-first dashboard, authenticated `dashboard.v1`, explicit unauthenticated/demo/snapshot states | COMPLETE | Keep priority ranking explainable and never replace unavailable data with fixture values. |
| L Evidence Triangle | Case lab keeps Official/Community/Expert separate | COMPLETE | Never flatten into a magic score. |
| M Superflows | Exactly three deterministic, labeled end-to-end fixtures | COMPLETE | Demo fixture sources are not real evidence. |
| N The Margin migration | Shared Margin primitives + 240px rail + responsive top strip in `UnifiedAppShell` | COMPLETE FOR SHELL / BODY FOLLOW-UP | Continue route-local body/footnote adoption only where it closes a real interaction gap. |
| O Demo mode | `/cases`, `/api/v1/demo/superflows`, explicit fixture provenance | COMPLETE FOR CORE | Add categories only when backed by a real demo scenario. |
| P Providers | AI Gateway adapters and env contracts | COMPLETE AS ADAPTERS | Live calls blocked by missing fresh keys/terms. |
| Q Freeze | Feature Freeze definition gates, final local audit, `250/250` discovered tests, canonical runtime smoke, `115/115` production routes, and Chromium/WebKit evidence | LOCAL RC READY WITH EXTERNAL LIMITATIONS | Stop feature work. Durable PostgreSQL/RLS/session proof, live-provider proof, staging E2E, rollback rehearsal, and Firefox host coverage remain external. |

## Non-blocking debt deferred by instruction

The historical backlog remains available for traceability. The final local audit results and remaining external gates are now in `FINAL-AUDIT-REPORT.md`, `docs/KNOWN-LIMITATIONS.md`, and `docs/RELEASE-CHECKLIST.md`.
