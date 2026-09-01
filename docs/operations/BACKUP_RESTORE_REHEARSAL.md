# StudentHub AI — Staging Backup and Restore Rehearsal

Status: **PLAN PREPARED / NOT EXECUTED**

This is a staging rehearsal plan. It does not assert an RPO or RTO. No verified
time or recovery objective is claimed until an operator records a real run on an
approved disposable target.

## Approval boundary

The rehearsal may run only against a disposable staging database and its
private screenshot bucket. Any remote snapshot, restore, bucket copy, or policy
change requires explicit human authorization and an operator-owned audit trail.

## Rehearsal sequence

1. Record project reference, database/schema migration revision, deployment SHA,
   and the rehearsal timestamp without recording secrets.
2. Create a controlled dataset containing a User A Trust case, case input,
   evidence, verdict projection, Passport, multiple Passport events, and one
   private screenshot object with metadata.
3. Capture the approved snapshot/export and calculate an operator-side checksum
   of the non-secret export artifact.
4. Restore into a separate disposable target. Never restore over the source.
5. Apply only the migration revisions approved for the restored target.
6. Validate row counts, foreign-key relationships, ownership boundaries, and
   checksums for the controlled records.
7. Validate that Passport history remains append-only and that the previous
   event is retained after a new revision is appended.
8. Validate screenshot metadata, bucket privacy, owner access, User B denial,
   anonymous denial, and controlled deletion/retention behavior.
9. Run the executable RLS harness and the bounded staging assurance cases.
10. Record elapsed restore time, failures, remediation, and a signed operator
    decision. Only then may measured recovery objectives be documented.

## Pass conditions

- Restored data is complete and checksum/relationship validation passes.
- Passport event history and provenance are unchanged.
- Screenshot metadata and object access remain private and owner-scoped.
- RLS positive and negative assertions pass.
- No secret or raw screenshot body appears in evidence.

## Stop conditions

Stop immediately on an unknown target, public bucket, cross-user read, missing
Passport event, checksum mismatch, unauthorized role escalation, or any request
to restore over an existing environment. Preserve the evidence and classify the
run as failed; do not lower the baseline.
