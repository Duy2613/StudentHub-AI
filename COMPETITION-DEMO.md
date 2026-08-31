# StudentHub AI — Competition Demo Runbook

Verified: 2026-08-30

## Pre-demo gate

From the repository root:

```bash
npm run build
npm run audit:bundle
npm run test:all-discovered
cd frontend && npx playwright test --project=chromium
```

Expected local evidence: 115 generated routes, core route bundles below 500 KB, 250/250 discovered regression files passing, and the Chromium Evidence Case Lab/browser gate passing. Live provider, staging, RLS, and Firefox proof are separate gates and must not be implied.

## Seven-minute judge flow

1. Open `/cases`. State the thesis: “Một case. Toàn bộ mạng lưới bằng chứng.” Point to the `COMPETITION DEMO` and `DEMO FIXTURE` labels before discussing any result.
2. Select the fake scholarship flow. Show Official, Community, and Expert as separate provenance classes, then show conflicts and unknowns.
3. Follow the Living Evidence Passport timeline. Explain that old and new results remain visible and material changes create a new revision.
4. Compare “Chuyển tiền ngay” with “Xác minh trước” in Student Decision Twin. Explain the explicit risk/deadline/dependency/uncertainty factors and the next clear move.
5. Switch to the academic conflict flow. Show that the deterministic cohort rule stays authoritative while the Community Reality Gap remains valuable operational context.
6. Open `/trust`. Paste a suspicious message or URL. Explain `CLIENT_OCR_HINT`, the four-step pipeline, distinct risk/confidence/evidence/source-agreement signals, and fail-closed provider states.
7. Continue to `/community`, `/expert`, and `/academic` to show the deep pillar views behind the shared case.

## Degraded-state talking points

- Provider unavailable: StudentHub preserves valid provider evidence, marks the pipeline `PARTIAL`, and says there is not enough data to conclude clean.
- 401/403/429/503: the UI gives distinct, recoverable guidance; rate limits preserve `Retry-After`, and support references preserve correlation IDs.
- Invalid JSON or schema mismatch: the frontend fails closed and never renders raw server payloads.
- New scan/reset: the old AbortController is cancelled and sequence ownership prevents Scan A from overwriting Scan B.
- Empty related intelligence: the page says “Không tìm thấy case liên quan,” without fabricated examples.

## Offline-safe demo preparation

- Keep one pre-approved text example available; do not depend on OCR language downloads for the main judged path.
- Keep `/cases` as the primary offline-safe route. Its three fixtures do not call live providers and are visibly labeled.
- Verify provider credentials and staging health before the event. The repository E2E suite uses deterministic intercepted contracts, not live third-party services.
- Do not describe fixture payloads as production evidence or quote unverified model metrics.
