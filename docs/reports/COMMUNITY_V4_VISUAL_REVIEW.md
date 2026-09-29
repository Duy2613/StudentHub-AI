# Community V4 — Seven-Screen Visual Review

**Review state:** Preview delivered; awaiting the user's visual acceptance. Community has not been locked, and Expert Adjudication V4 has not started.

**Branch:** `frontend/v4-three-core-redesign`  
**Base / rollback ref:** `80351be4a57111d6d1ac1f518827fd5b2e81d550`  
**Captured:** 2026-09-26 (Asia/Bangkok)

## Preview method

The seven screens were rendered with local Playwright in Chromium against the local frontend at `127.0.0.1:3100`. Community API responses were intercepted in the browser and populated with synthetic fixture records. No database, external Community content, or live realtime transport was used. The Community Home and Detail views show the in-product demo-fixture notice; this review is visual evidence, not production-data verification.

## Requested seven screens

| # | Screen | Evidence | Capture |
|---:|---|---|---|
| 1 | Community Home | [01-community-home.png](../../artifacts/community-v4-review-20260926/01-community-home.png) | 1440 × 1100 |
| 2 | Composer open | [02-composer-open.png](../../artifacts/community-v4-review-20260926/02-composer-open.png) | 1440 × 1100 |
| 3 | Post thường | [03-post-normal.png](../../artifacts/community-v4-review-20260926/03-post-normal.png) | 1440 × 1100 |
| 4 | Post + Trust stale | [04-post-trust.png](../../artifacts/community-v4-review-20260926/04-post-trust.png) | 1440 × 1100 |
| 5 | Post + Expert request | [05-post-expert.png](../../artifacts/community-v4-review-20260926/05-post-expert.png) | 1440 px wide, full page |
| 6 | Thread sâu | [06-thread-deep.png](../../artifacts/community-v4-review-20260926/06-thread-deep.png) | 1440 px wide, full page |
| 7 | Mobile 390 | [07-mobile-390.png](../../artifacts/community-v4-review-20260926/07-mobile-390.png) | 390 × 844 |

The detail route now carries the same visible demo-fixture notice as the feed when the API marks its content `DEMO_FIXTURE`.

## Responsive and browser probe

Home, Composer, Expert request panel, and deep-thread layouts were measured at widths 360, 390, 768, 1024, 1280, 1440, and 1920 px. At every width, document and body scroll width matched the viewport. Composer dialog widths remained within the viewport; Expert panel remained within the page. Playwright recorded no page or console errors.

Machine-readable results: [verification.json](../../artifacts/community-v4-review-20260926/verification.json).

## Scope limits

- This evidence covers only the seven requested preview groups. Media-post and completed Expert-verdict screens are not represented as working states because the safe media-derivative contract and public Expert verdict projection do not exist.
- Browser fixtures do not prove database authorization, migrations, live replay, reconnect recovery, multi-tab convergence, or session isolation.
- This visual pass does not establish WCAG 2.2 AA conformance or provide Lighthouse/Web Vitals measurements.
- The preview is not the Community release gate. User visual acceptance and the external/data-dependent blockers in the Domain Gap Log remain outstanding.
