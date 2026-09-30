# Community V4 — Trust / Expert Trace

**State:** local code-path trace; database readback and historical orphan inventory are pending.

## Authorized path

1. The authenticated person selects a Trust case returned by the owner-only Trust case endpoint. The case can remain `PRIVATE`.
2. Composer references its immutable case revision, optional claim, and explicitly selected evidence revision IDs. It does not upload or publish the Trust case body.
3. The server scans the public statement, source URL, OCR/QR text, and supplied metadata. Preview returns a redacted public statement and digest. Publish requires explicit confirmation of that digest.
4. `CommunityRepository.createContribution` verifies the signed-in actor owns the Trust case/revision and persists a canonical Community contribution. The feed DTO excludes Trust owner and author IDs and returns only the public statement, allowed references, non-authoritative reaction state, and derived freshness.
5. `GET /api/v1/trust/cases/[caseId]/community-signals` checks case ownership before reading Community signals for that private case. The projection remains non-authoritative and omits author identity.
6. Only the Trust-case owner can request Expert adjudication from the linked Community card. The request binds case, revision, claim, and `community_contribution_id` in the private review-request record.
7. The server matcher selects only verified, domain-qualified, active experts in the requested exact domain. It excludes the case owner/Community author and reviewers who already assessed the case. Assignment rows and request events remain private.
8. The blind review dossier includes the already-published, redacted Community contribution. It does not use Community as a path to reveal the raw private case, Trust conclusions, private media, or other reviewer assessments.
9. If no eligible reviewer exists, the request remains `REQUESTED`; the UI says it is waiting for a qualified expert. There is no silent domain fallback.

## Staleness contract

Feed freshness is `CURRENT` only when the linked Trust revision is the latest case revision and a completed Trust run started at or after the latest published Community contribution update for that case. A newer case revision or Community signal after the run is `STALE`. Missing completed run or missing revision evidence is `UNKNOWN`. A Trust event prompts canonical refetch; the event itself is not treated as a verdict.

## Orphan-case gate

`ORPHAN_CASE_CHECK` was not run against a database because no approved/disposable database target was identified. The migrations are not applied, and no live record inventory can be asserted from source inspection. Do not mark this check PASS. Before release, run the orphan audit read-only against the designated isolated database and reconcile each applicable Community-origin case with its contribution, owner authorization, revision, and eligible Expert request path.
