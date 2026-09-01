# StudentHub AI — Staging Incident Checklist

This checklist preserves fail-closed Trust semantics during staging assurance.
It is not a production incident runbook and does not authorize destructive
actions.

## First response for every incident

- Record the deployment SHA, environment name, route, safe request ID, and
  timestamp. Do not record tokens, screenshot bodies, raw message content, or
  provider response bodies.
- Stop promotion and label the dependency `UNAVAILABLE`, `PARTIAL`, or
  `ERROR` as appropriate. Never replace a missing dependency with `SAFE`, a
  fake success, or a demo result.
- Preserve the last known-good baseline and the smallest reproducible case.

## Database unavailable

- Confirm `/api/health/live` remains `LIVE` and `/api/health/ready` reports
  `NOT_READY`/503.
- Do not write partial Trust/Passport state.
- Check connection configuration and pooler health through the approved
  operator channel; do not print the database URL.
- Resume only after a controlled query and persistence test pass.

## Provider unavailable or contract failure

- Preserve completed stage data and expose `PARTIAL`/`UNAVAILABLE` with a next
  action.
- For HTTP 400, malformed JSON, schema mismatch, 401/403, 429, 500/503, or
  timeout, retain the typed error and request ID; do not reinterpret it as a
  finding.
- Disable the affected provider in staging if the owner cannot explain the
  contract. Do not edit the adapter from an undocumented response.

## Supabase Auth unavailable

- Stop session-exchange and protected-flow assurance.
- Keep public-safe routes available only if their data path is independently
  safe.
- Classify protected flows as `AUTH_REQUIRED` or `UNAVAILABLE`; do not use
  browser-only state as authorization.

## Storage unavailable or privacy failure

- Stop screenshot upload/retrieval immediately.
- If a bucket is public or a cross-user read succeeds, classify as a security
  incident, revoke the staging target, and obtain operator review before any
  further test.
- Do not place the screenshot body in logs or attach it to reports.

## Credential exposure

- Stop the affected staging environment and revoke/rotate the exposed secret
  through the owner-approved secret manager.
- Invalidate generated browser storage state and sessions.
- Search logs/reports/artifacts for the secret without copying it into a report.
- Record only the secret class, scope, timestamps, and remediation status.

## RLS misconfiguration

- Stop assurance and promotion.
- Preserve the failing identity/action/relationship tuple, not the credential.
- Revoke the affected staging target or role if needed, correct the migration
  through review, recreate the disposable database, and rerun all positive and
  negative harness cases.
- Never weaken a policy or remove a negative test to obtain a pass.
