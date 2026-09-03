# StudentHub AI Data Classification

Status: `POLICY_DEFINED_REPOSITORY_CONTROLS_PARTIAL`

Classification is applied before persistence, provider dispatch, logging,
telemetry, support access, export, retention, and deletion. A lower class may
not be inferred from a UI route or from the fact that a value was supplied by a
provider.

| Class | Examples | Persistence | Provider/AI use | Logs/telemetry |
| --- | --- | --- | --- | --- |
| `PUBLIC` | Published institution page URL, public product copy, public schema version | May persist with source metadata | May be sent when scope and terms permit | Safe as bounded values; no raw URL as a metric label without review |
| `INTERNAL` | Non-public runtime state, aggregate health, provider status, deployment metadata | Internal operational stores | Provider dispatch only when approved | Bounded IDs, status, duration, outcome, error category |
| `USER_PRIVATE` | Student profile, Trust case/input, Passport history, Community draft, Expert review scope | Owner-bound canonical tables; RLS required | Minimize; send only the fields required for the approved capability | Use fingerprints/opaque IDs; do not log raw content |
| `HIGHLY_SENSITIVE` | OCR/image content, private screenshots, identity evidence, auth/session material, cross-user security events | Restricted storage/table and explicit retention/deletion policy | Default deny; provider processing requires explicit approval and minimization | Never raw; no screenshots or tokens |
| `SECRET` | API keys, service-role keys, DB connection strings, session pepper, bearer tokens | Secret manager only; never application data | Server-side header/config only | Never log, persist, expose, or include in fixtures |

## Provider decision rules

1. `PUBLIC` does not mean authoritative. A public source still becomes an
   observation only after retrieval/provenance normalization.
2. `USER_PRIVATE` and `HIGHLY_SENSITIVE` inputs require purpose, ownership,
   minimization, and an approved provider/data-location decision before any
   external dispatch.
3. `SECRET` values are not valid evidence, model input, user-visible detail,
   telemetry, or retry metadata.
4. Provider explanations, Community observations, Expert text, and AI output
   remain untrusted content regardless of their source class.

## Retention and deletion

Canonical tables must define owner, created/observed time, supersession,
deletion, and retention policy. Passport events and decision revisions are
append-oriented; correction is represented by a new event/revision rather than
silent overwrite. Private screenshot objects require private-bucket access,
owner prefix/metadata checks, signed access expiry, deletion, orphan cleanup,
and metadata/object consistency. Exact production retention periods remain an
owner/legal decision and are not invented by this repository record.

