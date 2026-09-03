# Staging E2E contract

This suite sends real browser requests to a configured staging deployment. It never intercepts Trust APIs and does not measure model accuracy.

Required environment:

- `STUDENTHUB_STAGING_BASE_URL`: frontend staging origin.
- `STUDENTHUB_STAGING_CASES_PATH`: absolute path to an operator-owned JSON file with `suspicious`, `benign`, `invalid`, `partial`, `insufficient`, and `failure` cases.
- `STUDENTHUB_STAGING_STORAGE_STATE`: optional absolute Playwright storage-state path when staging requires authentication. Do not commit it.

Each case contains `type` (`text` or `url`) and `value`. Optional assertions are `expected`, `expectedProviderStatuses`, and `expectedErrorFragment`. The `invalid` case must be rejected before provider execution. The staging operator/backend test controls must make the failure case produce a real 429/502/503/timeout; the frontend suite does not fake it.

Run `npm run test:e2e:staging`. Missing inputs deliberately exit with code 2 and `STAGING_E2E_BLOCKED_BY_ENV`.
