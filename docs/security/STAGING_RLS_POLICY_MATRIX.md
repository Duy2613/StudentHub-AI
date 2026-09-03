# StudentHub AI — Staging RLS Policy Matrix

This matrix describes the intended boundary for the three prepared migrations.
It separates database policy evidence from API projection behavior. It is not
an assertion that the remote project has already applied the migrations.

| Domain | Anonymous | User A/B | Expert | Moderator/Admin | Service context |
| --- | --- | --- | --- | --- | --- |
| Profiles | Denied direct table access | Own permitted fields only | Same owner boundary | No implicit bypass | Controlled read/write |
| Trust cases | Denied | Owner only; private by default | No implicit access | No implicit access | Server-controlled persistence |
| Case inputs/evidence | Denied | Follows owned Trust case | No implicit access | No implicit access | Server-controlled persistence |
| Entities/claims/sources | Denied direct table access | No direct grant in current migration; API projection only | No direct grant | No direct grant | Controlled normalization/read |
| Evidence Passport | Denied | Owner read/append path; no arbitrary history update | No implicit access | No implicit access | Controlled create/read/append |
| Community posts/comments | Public redacted projection | Published read; owner mutation | Same public boundary | Moderation only when an explicit policy is added | Controlled moderation/read |
| Votes | No direct read | Own row mutation | Same | No implicit bypass | Aggregate/read management |
| Expert profile | No direct table grant; redacted API projection | Own permitted fields if exposed | Verified public projection; private verification service-only | Explicit role operation only | Controlled verification |
| Expert assessment | Denied direct table access | Denied | Explicit authorized expert scope | Explicit role operation only | Controlled persistence |
| Audit/session/roles | Denied | Denied | Denied | Denied | Service-only |
| Screenshot metadata | Denied | Owner read; server-controlled writes | Denied unless explicitly added | Denied unless explicitly added | Full controlled operation |
| Screenshot objects | Denied | Owner-keyed insert/read/delete | Denied unless explicitly added | Denied unless explicitly added | Controlled signed access |

The executable harness is the authority for the applied disposable database. A
static policy match is not a pass.
