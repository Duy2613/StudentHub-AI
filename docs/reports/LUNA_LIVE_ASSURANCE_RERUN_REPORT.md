# Luna Live Assurance Rerun Report

Status: `BLOCKED_BY_SECURITY_AND_ENV`

This is the required rerun artifact, currently recording that the live gates
have not been executed. It must be updated with actual operator evidence after
the approved staging environment exists; it must not be relabeled from this
repository alone.

## Scope

Required rerun gates are Auth/session, cross-user RLS, Passport ownership,
private screenshot storage, provider failure semantics, Demo/Live isolation,
secret protection, migration integrity, and the current build/test baseline.

## Execution record

| Gate | Evidence required | Current result |
| --- | --- | --- |
| Auth/session | User A/B login, logout, expiry, restart, cookie and issuer/audience checks | `BLOCKED_BY_ENV` |
| RLS/ownership | Anonymous/User A/User B/Expert/Moderator/Admin matrix against disposable Supabase | `BLOCKED_BY_DATABASE_ENV` |
| Passport | Append, revision, reload/restart, cross-user denial | `BLOCKED_BY_DATABASE_ENV` |
| Private screenshots | Private bucket, MIME/size/ownership, signed expiry, deletion/orphan checks | `BLOCKED_BY_STORAGE_ENV` |
| Providers | L2/L3/L4 and AI success/failure/timeout/400/401/429/5xx/malformed matrix | `BLOCKED_BY_PROVIDER_ENV` |
| Demo/Live isolation | Explicit mode and no fallback/promotion | Local contract coverage; live `NOT_VERIFIED` |
| Secret protection | Rotation, old-credential rejection, deployment/history review | `BLOCKED_BY_HUMAN` |
| Migration integrity | Clean target checksum, forward-fix/backup evidence | `BLOCKED_BY_DATABASE_ENV` |
| Build/test baseline | Local commands recorded in final report | `PARTIALLY_VERIFIED`; live/staging portion remains `BLOCKED_BY_ENV` |

## Local repository evidence

The current working-tree closure run recorded:

- root `npm test`: `272/272` discovered test files passed;
- `npm run lint`: 0 errors and 332 warnings;
- `npm run build`: passed with TypeScript validation and `119/119` static
  pages generated;
- security suite `37/37`, final audit `7/7`, Phase 2 auth `10/10`, and Phase 3
  contract `5/5` passed;
- bundle budget audit passed and high-severity npm audit reported 0
  vulnerabilities;
- current WebKit fallback browser assurance: `64/70` passed, `6` intentionally
  skipped; Windows Firefox remains an executable-host limitation;
- the live Phase 3 database command is blocked because
  `STUDENTHUB_RLS_TEST_DATABASE_URL` is absent.

These are local repository/browser results only. They do not establish the
approved staging identity, remote database/RLS/auth/storage behavior, provider
success, credential rotation, or production readiness.

## Required operator attachments

Attach target identity, exact SHA/build ID, timestamps, sanitized logs,
request IDs, migration output, RLS results, storage object metadata, provider
matrix results, rollback IDs, and backup/restore evidence. Do not attach keys,
connection strings, raw private content, or user tokens.

## Release decision

Until all mandatory security/data/provider gates pass, this report supports
`FINAL_RC_BLOCKED_BY_SECURITY` and `FINAL_RC_BLOCKED_BY_ENVIRONMENT`, not live
assurance completion.
