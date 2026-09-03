# Human Action Required

This file lists external actions that require the project owner or an explicitly authorized operator. It is intentionally separate from normal repository engineering work.

**Current overall status:** `MAXIMUM_PLATFORM_EVOLUTION_PARTIAL_HUMAN_ACTION_REQUIRED`

## P0 security incident

- [ ] Revoke/rotate the PostgreSQL credential documented in [`FRIEND_BACKEND_SECRET_INCIDENT.md`](../security/FRIEND_BACKEND_SECRET_INCIDENT.md).
- [ ] Verify the old credential fails and the replacement works from the approved secret store.
- [ ] Inspect deployments, forks/caches, history, and access logs for exposure or misuse.
- [ ] Confirm whether public history remediation is required; authorize any history rewrite separately.

## Environment and release authorization

- [ ] Provide an approved non-production Supabase/PostgreSQL staging project and confirm project identity.
- [ ] Authorize any staging Supabase migration, test identity creation, private bucket creation, or RLS harness execution.
- [ ] Supply staging-only provider secrets for Layer 2, Layer 3, Layer 4, and approved AI gateway routes.
- [ ] Authorize staging deployment and provide the target URL, project/environment identity, and release SHA.
- [ ] Authorize disposable staging backup/restore rehearsal.
- [ ] Authorize live deployment only after all security/data/provider gates pass.

## Not a human blocker

The following remain ordinary repository engineering tasks and may proceed without external authorization: contract fixtures, adapter validation, provider-state mapping, local tests, documentation, deterministic policy tests, provenance tests, and native-provider shadow scaffolding that does not call remote production systems.
