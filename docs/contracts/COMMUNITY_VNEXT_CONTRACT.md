# Community VNext Contract

Contract version: `community-vnext.v1`.

Community contributions are revision-bound, claim-aware, privacy-scanned
signals. A contribution may state a direct experience, found source, need for
verification, supporting or contradicting evidence, context, or critique.
Every public statement carries publication, evidence, review, source, and
freshness state. Uncertainty is preserved instead of being converted to a
truth label.

The existing `community_contributions` and
`community_contribution_revisions` tables are canonical. New Max projections
are additive and are not alternative post, vote, reaction, or evidence
systems. Trust cases, claims, evidence, Passports, profiles, and Expert
authority remain owned by their existing contracts.

Publishing requires the existing privacy preview digest, a stable
`Idempotency-Key`, and an immutable case/revision scope. Discussion, source,
campus, correction, and request writes are server-authoritative and fail closed
on scope, privacy, or idempotency conflicts.
