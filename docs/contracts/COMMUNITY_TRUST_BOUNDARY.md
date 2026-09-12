# Community ↔ Trust Boundary

Community may read public Trust case/revision/claim scope and may request a
verification/review projection. It may attach a contribution to a canonical
case revision and expose a read-only Evidence Passport timeline when the
existing owner scope permits it.

Community must not call the Trust mutation route, write `trust_cases`,
`trust_case_revisions`, `evidence`, `claims`, `trust_verdict_revisions`,
`evidence_passports`, or `evidence_passport_events`, and must not translate
BELIEVE/DOUBT, reactions, ranking, moderation, or Expert answers into a Trust
verdict. A `PENDING` verification projection means “a canonical Trust flow may
be requested”; it is not `VERIFIED`.

Every bridge DTO includes `isAuthoritative: false` and
`authorityOwner: "TRUST_V5"` where a Trust object is referenced.
