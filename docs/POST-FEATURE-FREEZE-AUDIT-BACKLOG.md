# Post-Feature-Freeze Audit Backlog

Feature freeze entered: 2026-08-29

The audit order is deliberate. A later stage must not hide a failure in an earlier authority or correctness boundary.

1. Security: live session, CSRF, RLS, BOLA/IDOR, SSRF, upload, secret, privilege, and audit-log proof.
2. Correctness: domain invariants, state transitions, revision conflicts, idempotency, and error paths.
3. API contracts: finish canonical `/api/v1` caller migration, schemas, compatibility telemetry, timeout, retry, and trace contracts.
4. AI grounding: live provider provenance, citation entailment, temporal validity, calibration, and abstention.
5. Prompt injection: input, retrieved document, tool output, image OCR hint, and indirect injection scenarios.
6. Database integrity: apply migrations to clean database, foreign keys, constraints, indexes, rollback, backup, and RLS matrix.
7. Concurrency: simultaneous Passport append, Decision adoption, notification deduplication, forum writes, and session revocation.
8. Performance: bundle budgets, route waterfalls, database query plans, worker isolation, Core Web Vitals, and memory/GPU lifecycle.
9. Accessibility: full axe and manual keyboard/screen-reader/contrast/reduced-motion verification.
10. Responsive: 360, 390, 430, 768, 1024, 1280, 1440, and 1920 layout proofs.
11. Browser: Chromium, Firefox, WebKit, iOS Safari behavior, upload, clipboard, print, and WebGL/CSS fallback.
12. Visual polish: copy consistency, design tokens, focus/hover/active states, empty/loading/error states, and demo labels.
13. Dead code: archive candidate routes, duplicate Trust paths, unused shells, obsolete components, and stale fixtures.
14. Dependencies: production audit, lockfile integrity, license review, version drift, and supply-chain policy.
15. CI/CD: build, test, RLS, browser, bundle, accessibility, migration, and audit gates.
16. Deployment: environment contract, secret rotation, database migration plan, rollback, observability, and alerting.
17. Competition rehearsal: offline/provider-failure mode, deterministic fixtures, timing, reset procedure, and judge narrative.

Current external blockers:

- `STUDENTHUB_RLS_TEST_DATABASE_URL` is not configured.
- Live provider credentials and approved integrations are not configured.
- Staging deployment target is not available in this workspace.
