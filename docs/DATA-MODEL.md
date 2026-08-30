# StudentHubAI Data Model

PostgreSQL is the durable source for privileged and cross-user state. Core concepts remain relational; JSON is reserved for bounded metadata and provider payloads that do not drive authority.

## Shared evidence graph

`claims → evidence → sources/source_snapshots → provenance → evidence_relations → conflicts/uncertainty → trust_results`.

Supported relation vocabulary includes `SUPPORTS`, `CONTRADICTS`, `PARTIALLY_SUPPORTS`, `CONTEXTUALIZES`, `CITES`, `DERIVED_FROM`, `AUTHORED_BY`, `VERIFIED_BY`, `OBSERVED_BY`, `APPLIES_TO`, `DEPENDS_ON`, and `SUPERSEDES`.

## Cross-system tables

The feature-freeze migration adds owner-bound `evidence_passports`, append-only `passport_events`, `decision_scenarios`, `decision_options`, `case_follows`, and material-change `notifications`. Existing V2 migrations cover profile/authority/session/audit/forum/Trust/expert/reputation foundations.

Each Passport revision stores prior/current status, event time, provenance class, change reason, and references. A live Passport cannot contain `DEMO_FIXTURE`; events are chronological and append-only. Decision options carry explicit risk/deadline/dependency/importance/uncertainty factors and consequence basis/certainty.

## Academic data

Institutions, programs, cohorts, courses, prerequisites/corequisites, regulations, source snapshots, academic plans/items, execution snapshots, and notifications are version-aware. Every deterministic rule points to institution/program/cohort, source/version, effective date, and section/page when available.

## Ownership and retention

User-owned records derive the owner from the verified principal; RLS and repository predicates enforce the same boundary. Privileged changes emit safe audit events. Sensitive provider secrets never enter this model or client bundles.
