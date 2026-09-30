# STUDENTHUB AI — COMMUNITY V4.2 EXECUTION REPORT

**Date:** 2026-09-27  
**Authority:** Master Frontend Constitution v4.0 Three-Core; Community V4.2 Human-First Directive.  
**Branch:** `frontend/v4-three-core-redesign`  
**Evidence mode:** local production build + Playwright API fixtures (`DEMO_FIXTURE`); no durable database connected.

## 1. COMMUNITY_V4_2_VERDICT

**PARTIAL.** The scoped UI, demo gate, human-first fixture flow, contextual rails, Expert Sheet, responsive screenshots, and serious/critical Axe checks pass. Do not mark Community release-cleared: no approved database target was available for migration readback or `ORPHAN_CASE_CHECK`; screen-reader/zoom/reduced-motion checks also remain incomplete.

## 2. PATCH SUMMARY

- Added ordinary Discussion/Question and Source modes to the existing composer shell; normal publishing does not request or create a Trust case.
- Preserved the canonical Trust preview, privacy confirmation, case ownership, and revision-bound publish path as Verify mode.
- Rebalanced post cards around author, context, human statement, compact citation/Trust state, and supported actions.
- Kept Intelligence Rail data-driven, moved the lexicon to the `Chú giải` utility, reduced duplicate mobile chrome, and retained the primary global navigation.
- Connected generic Community writes to metadata-only realtime invalidations and refreshed open generic comment threads on matching invalidations.
- Kept media upload and unsupported social actions unavailable rather than simulating persistence.

## 3. IDENTITY POLICY RESULT

| Identity contract | Status | Result |
|---|---|---|
| Public display name and avatar | EXISTS | Generic posts/comments use the configured public profile projection; email/legal identity is not rendered. The composer discloses the selected public name. |
| Anonymous post/comment | MISSING | No server contract or per-post anonymity control. No anonymity toggle was added. |
| Verified-school identity | PARTIAL | Profile verification data exists, but the Community author projection does not present a verified-school identity. |
| Trust-thread pseudonym | EXISTS | Server HMAC pseudonyms are stable within a thread and separated across threads; production fails closed without the required server secret. |
| Public Expert identity/adjudication | PARTIAL | Expert request eligibility/workflow is separate and authorized; no public Expert verdict projection is claimed. |

## 4. COMPOSER ROUTER

- **Discussion / Question →** `POST /api/community/social`, persisted as the existing `GENERAL` public-post category.
- **Source →** the same endpoint with existing `ACADEMIC` category and the validated URL stored in `public.posts.links`; shown as a compact citation.
- **Verify →** canonical `/api/intelligence/community/posts` preview then digest-bound confirmation, bound to the authenticated owner's Trust case revision and selected evidence references.
- **Media →** disabled and labeled “Sắp có”; no upload is simulated.

Normal Discussion/Question uses direct server publication after server-side PII scanning; flagged content is blocked. No approved claim detector exists for the optional Trust nudge. Existing normal posts cannot be soft-linked to Trust yet.

## 5. HUMAN_FIRST_CHECK

**PASS — fixture only.** Playwright creates a normal `GENERAL` question, confirms no Trust case request or revision is included, publishes it, adds a comment, receives a matching `community:comment` invalidation, refetches the committed fixture comment, and opens the discussion deep link. This is not a live database write/readback.

## 6. TRUST OPTIONAL FLOW

**PARTIAL.** Verify mode preserves the canonical Trust preview and revision-aware path. Static Verify composer capture passed. The end-to-end run did not prove a live publish/readback or linking an already-published generic post to a Trust case; no duplicate Trust model was introduced.

## 7. POST VISUAL HIERARCHY

Author and context precede the human statement. Source citations are compact rows. Trust state remains inspectable as a concise semantic revision/freshness row (for example, `Trust · rev 4 · cần cập nhật · rev 4/5`) without a persistent tinted panel. Supported social actions sit above secondary evidence actions.

## 8. SHARE / SAVE CONTRACT

- **Share: EXISTS.** Label is “Chia sẻ liên kết”; uses the system share sheet where available, otherwise copies the deep link or presents it. No repost semantics are implied.
- **Save: MISSING.** No bookmark contract was found; no local-only save state or dead button is displayed.

## 9. LEFT RAIL

Persistent Annotation Lexicon is removed from ordinary Community navigation. Desktop keeps the Three-Core navigation and Community filters; mobile uses the global menu button to reveal navigation without a second persistent navigation summary. `Chú giải` remains an accessible utility.

## 10. RIGHT INTELLIGENCE RAIL

**Contextual.** Appears only for a selected post with real source, Trust, or Expert-request context. Fixture screenshots verify both populated values and absence when the selected post has none.

## 11. EXPERT SHEET

**PASS — fixture interaction.** The same authorized request sheet opens from feed and detail; it reuses the existing review-request endpoint and case/revision scope. Escape closes it and restores focus. No public adjudication result is fabricated.

## 12. COMMENT CAPABILITY MATRIX

| Capability | Status | Scope / limitation |
|---|---|---|
| Composer | EXISTS | Discussion, Source, Verify; Media disabled. |
| Post | EXISTS | Generic public post and canonical Trust contribution. |
| Comment | EXISTS | Generic flat comments and Trust-scoped comments. |
| Reply | PARTIAL | Bounded nested replies for Trust contributions; generic social comments are flat. |
| Reaction | PARTIAL | Generic “Hữu ích”; canonical Trust evidence reactions. |
| Share | EXISTS | Link sharing only. |
| Save | MISSING | No bookmark contract. |
| Menu | MISSING | No post action menu contract exposed. |
| Edit | PARTIAL | Trust owner revision API exists, but no active edit UI; generic edit absent. |
| Delete | MISSING | No supported Community deletion flow exposed. |
| Report | PARTIAL | Trust `REPORT_ABUSE` reaction only; it does not moderate or change a verdict. |
| Mention | MISSING | No mention contract. |
| Media | MISSING | No safe public derivative/upload path. |
| Link | EXISTS | Validated external HTTP(S) links. |
| Source | EXISTS | Existing `ACADEMIC` mapping or canonical Trust reference. |
| Notification | MISSING | No follow-discussion notification contract. |
| Deep link | EXISTS | Generic discussion and Trust contribution detail routes. |
| Realtime update | PARTIAL | Local event mapping/subscription and fixture refetch pass; live durable replay unverified. |
| Moderation | MISSING | No ordinary-user moderation endpoint/control. |
| Follow discussion | MISSING | No follow/subscription contract. |

## 13. THREAD IDENTITY

The fixture deep thread displays three distinct server-projected participant labels. Trust comment pseudonyms are thread-scoped HMAC values, not client hashes. Generic comments use public profile display names under the current public identity policy.

## 14. MEDIA

**MISSING.** Upload, derivative generation, preview, retry, and public serving are not backed by a verified Community contract. The composer states this and disables upload; links and saved Trust evidence remain separate.

## 15. DEMO GATE

**PASS.** `communityDemoMode` is the canonical demo source. The production build runs `DEMO_GATE_CHECK` and passed with demo disabled; focused tests verify production + demo fails deterministically. Screenshot and Playwright fixture data are labeled `DEMO_FIXTURE`.

## 16. MOBILE CHROME

The 390px first view retains the sticky global header and reaches the Community heading, composer, filters, and beginning of the feed. The duplicate mobile navigation summary is hidden until the global menu button opens navigation. Menu open/close and Axe checks pass.

## 17. REALTIME REGRESSION

**PARTIAL PASS.** Generic post/comment/reaction writes publish metadata-only Community invalidations; open generic and Trust comment views refetch canonical API data for matching events. E2E verifies the generic comment refresh against a fixture stream. Existing durable replay/dedupe contract tests pass. A live database stream, reconnect, multi-session convergence, and preservation under live competing edits were not exercised.

## 18. TRUST REGRESSION

**Scoped PASS.** Current/stale revision semantics remain in the feed; screenshot shows the stale `rev 4/5` state. Authority-staleness, migration-contract, and PII/privacy suites pass. No live database migration/readback or end-to-end Trust publish was possible.

## 19. ORPHAN_CASE_CHECK

**NOT RUN — BLOCKED BY ENVIRONMENT.** No approved/disposable database target was configured; the local Community/Expert migrations are not applied. Static code and fixture tests cannot establish the historical orphan inventory. Do not mark this PASS.

## 20. PRIVACY

**Scoped PASS.** Public profile projection excludes email/legal identity. Generic post/comment content receives server-side PII scanning; Trust publishing remains redacted-preview and digest-confirmation bound. Public realtime invalidations contain identifiers/action metadata only, no authored text or account identity. The 1,300-sample PII benchmark reported 1,100 true positives, 0 false positives, 0 false negatives; post-redaction verification passed and storage authorization checks passed 13/13. Live database policy/readback remains pending.

## 21. ACCESSIBILITY

Serious/critical Axe checks pass on home, composer, and Expert sheet at 390/768/1440px, plus the mobile navigation state. Keyboard Escape/focus restoration is covered for composer, glossary, and Expert sheet. Full screen-reader, zoom, text-spacing, and reduced-motion manual checks remain incomplete. Scoped ESLint: 0 errors, 6 warnings (four `<img>` warnings, one existing shell theme state-in-effect warning, and one additional shell `<img>` warning).

## 22. PERFORMANCE

Community remains React/CSS L1; no WebGL, Three.js, R3F, particles, custom cursor, or cinematic canvas was added. Build and screenshots pass. No Lighthouse or live performance benchmark was run.

## 23. SCREENSHOT EVIDENCE

Artifact directory: `artifacts/community-v4.2-review-20260927/` — 35 PNGs; [`verification.json`](../../artifacts/community-v4.2-review-20260927/verification.json) identifies `DEMO_FIXTURE` and `connectedToDurableDatabase: false`.

The run captured 11 states at each viewport (home, collapsed/general/Verify composer, normal/Trust post, populated/absent rail, thread, Expert sheet, glossary); also 390px mobile chrome and a 1440px Expert sheet from detail. Core preview links:

- 390: [Home](../../artifacts/community-v4.2-review-20260927/390-01-home.png), [Composer](../../artifacts/community-v4.2-review-20260927/390-03-general-composer.png), [Post thường](../../artifacts/community-v4.2-review-20260927/390-05-post-normal.png), [Post + Trust](../../artifacts/community-v4.2-review-20260927/390-06-post-trust.png), [Thread sâu](../../artifacts/community-v4.2-review-20260927/390-08-thread.png), [Expert sheet](../../artifacts/community-v4.2-review-20260927/390-09-expert-sheet.png), [Mobile chrome](../../artifacts/community-v4.2-review-20260927/390-12-mobile-chrome.png).
- 768: [Home](../../artifacts/community-v4.2-review-20260927/768-01-home.png), [Composer](../../artifacts/community-v4.2-review-20260927/768-03-general-composer.png), [Post thường](../../artifacts/community-v4.2-review-20260927/768-05-post-normal.png), [Post + Trust](../../artifacts/community-v4.2-review-20260927/768-06-post-trust.png), [Thread sâu](../../artifacts/community-v4.2-review-20260927/768-08-thread.png), [Expert sheet](../../artifacts/community-v4.2-review-20260927/768-09-expert-sheet.png).
- 1440: [Home](../../artifacts/community-v4.2-review-20260927/1440-01-home.png), [Composer](../../artifacts/community-v4.2-review-20260927/1440-03-general-composer.png), [Post thường](../../artifacts/community-v4.2-review-20260927/1440-05-post-normal.png), [Post + Trust](../../artifacts/community-v4.2-review-20260927/1440-06-post-trust.png), [Thread sâu](../../artifacts/community-v4.2-review-20260927/1440-08-thread.png), [Expert sheet](../../artifacts/community-v4.2-review-20260927/1440-09-expert-sheet.png), [Expert sheet từ Detail](../../artifacts/community-v4.2-review-20260927/1440-13-expert-detail-sheet.png).

## 24. DOMAIN GAPS

- Approved claim detector/nudge and soft Trust linkage from an existing generic post.
- Save/bookmark, follow discussion, notification subscriptions, generic post edit/delete/menu, and mentions.
- Generic nested replies and a public moderation workflow; `REPORT_ABUSE` is a signal only.
- Safe Community media upload/public derivative pipeline.
- Live migration/RLS/readback, durable realtime session checks, and historical `ORPHAN_CASE_CHECK`.
- Community Search/filter/domain contract limits for legacy public social content; no durable Community Spaces membership.
- Explicit anonymity and verified-school public identity projection.
- Server PII detection blocks risky general text but does not provide an edit-in-preview/redaction review step.

## 25. FILES CHANGED

Task-scoped files include the Community composer/feed/detail components and route, `community-v4.module.css`, global Community/shell styling, mobile `margin.css`, `UnifiedAppShell.jsx`, `RealtimeContext.jsx`, generic social and canonical Trust comment/reaction routes/repositories, `communitySocialRealtime.js`, `communityDemoMode.js`, the production demo-gate script, focused Community/realtime/privacy tests, the Playwright V4.2 spec, screenshots, and this report. The shared worktree also contains unrelated pre-existing modifications/deletions; those were preserved.

## 26. PHASE COMMITS

**None.** The worktree was already dirty. No files were staged, committed, cleaned, or reverted.

## 27. REMAINING ISSUES

- Live database migrations and policy/readback are unverified.
- `ORPHAN_CASE_CHECK` remains a release blocker until run read-only against an approved isolated database.
- Trust optional publish/readback and realtime cross-session behavior need live environment verification.
- Manual screen-reader, zoom, text-spacing, and reduced-motion checks are outstanding.
- Six scoped lint warnings remain as itemized above.

## 28. NEXT STEP

Not executed. Review the static Community evidence first; Community is not locked and Expert Adjudication V4 has not started.
