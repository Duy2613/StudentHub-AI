# StudentHub Academic Timetable — Implementation Checkpoint

Date: 2026-09-17 (Asia/Bangkok)

This checkpoint is for the next agent. The user requested implementation, not another architecture-only audit. Do not reset, clean, or discard the existing dirty worktree; many unrelated remediation files were already modified before this pass.

## User scope

Implement the Owner-backend academic timetable workflow from the pasted request in `C:\Users\Duy\.codex\attachments\2dd17779-72e7-4e0c-81b0-895ecb3407d2\pasted-text.txt`:

- PostgreSQL is canonical; AI image import returns an editable DRAFT only.
- Confirmation is the only path that persists an image-derived timetable.
- Manual timetable editing, Today/Week/Next class, courses, durable tasks, durable notifications, explicit reminders, realtime projection, profile/dashboard summary.
- Remove the user-facing Contract/Hợp đồng product feature while preserving technical software-contract terminology.
- Preserve personal task/notification infrastructure; remove automatic official/university deadline behavior and inferred academic schedule data.
- No deploy.

## Completed implementation

### Database / Supabase

- Added `database/migrations/202609170004_academic_timetables.sql`.
- Migration creates `public.user_timetables`, `public.timetable_entries`, and `public.timetable_reminders` with owner UUIDs, composite ownership FKs, constraints, indexes, one-active-per-user, and owner-only authenticated RLS policies.
- Migration was applied through Supabase `apply_migration` to staging project `bniwtkjtramqaozrrtrk` under migration name `academic_timetables`.
- Main project `kytdomflmjytzyaabogi` was not modified.
- Staging verification confirmed all three tables exist with RLS enabled and policies for owner-only CRUD.
- A rollback-only staging probe created a timetable, entry, and reminder as user A; user A saw `1/1/1`, user B saw `0/0/0`; transaction was rolled back, so no probe data remains.
- Supabase security/performance advisor output contained pre-existing project-wide findings; the new timetable tables were not reported as RLS-without-policy findings. New indexes naturally appear as unused until traffic exists.

### Domain, repository, service, API

- `frontend/src/lib/intelligence/academic/academicTimetableModel.js`
  - deterministic normalization/validation, course derivation, Today/Week projections, and cross-week `projectNextClass`.
- `frontend/src/lib/server/database/AcademicTimetableRepository.js`
  - owner-scoped PostgreSQL CRUD, all-or-nothing timetable + entries transaction, active timetable serialization, idempotency/digest conflict handling, entry/reminder CRUD.
- `frontend/src/lib/server/academic/AcademicTimetableService.js`
  - canonical workspace assembly, manual create, confirm draft, mutations, durable tasks/notifications reads, and post-commit owner-scoped realtime publication.
- `frontend/src/lib/server/academic/TimetableVisionExtractor.js`
  - existing server-side `AIGatewayService`, `AI_CAPABILITY.MULTIMODAL`, strict structured schema/prompt, field confidence, no hallucination instruction, manual fallback, no persistence.
- `frontend/src/lib/server/academic/timetableImage.js`
  - 8 MB limit, PNG/JPEG/WEBP allowlist, magic-byte/extension checks, dimension checks, SHA-256; image is not retained.
- API routes under `frontend/src/app/api/academic/timetable/`:
  - workspace/manual `route.js`
  - `[timetableId]/route.js`
  - `confirm/route.js`
  - `import/route.js`
  - `entries/[entryId]/route.js`
  - `reminders/route.js` and `reminders/[reminderId]/route.js`
- `frontend/src/lib/server/academic/academicApi.js` provides owner extraction, idempotency, route params, and safe errors.
- Existing `frontend/src/app/api/academic/notifications/route.js` and `frontend/src/app/api/v1/notifications/route.js` now use `AcademicNotificationRepository`; the v1 route no longer falls back to in-memory `AcademicNotificationStore`.

### UI / realtime / integrations

- `/academic` is now `frontend/src/app/academic/[[...slug]]/page.jsx` with `AcademicWorkspace` instead of redirecting to dashboard.
- `frontend/src/components/academic/AcademicWorkspace.jsx` provides exact empty text `Bạn chưa có thời khóa biểu.`, manual editor, image import/draft review, uncertainty highlighting, Today/Week/mobile day tabs, next class, courses, tasks, notifications, and explicit 10-minute class reminders.
- `frontend/src/components/academic/AcademicSummaryWidget.jsx` is integrated into profile and dashboard (`CommandCenterDashboard.jsx`).
- Realtime academic channel/event is wired in `RealtimeContext.jsx` and `/api/realtime/stream/route.js`; PostgreSQL remains authority.
- Latest UI fixes: unauthenticated `/academic` renders login CTA instead of hanging on loading; editing an existing timetable persists name/term with entries; next class can roll into the next seven days.

### Legacy academic behavior and Contract removal

- `academicCommandCenterDataLoader.js`, `PersonalizationEngine.js`, and `AcademicBriefingEngine.js` no longer synthesize timetable/deadline/fixture data; compatibility reads return unavailable/empty data.
- Old academic presentation components that depended on the retired inferred/fixture path were removed. Durable task/notification infrastructure was preserved.
- Deleted product-only Contract route/API/component/engine:
  - `frontend/src/app/contract-check/page.jsx`
  - `frontend/src/app/api/contract-check/analyze/route.js`
  - `frontend/src/components/trust/ContractCheckIntakeTab.jsx`
  - `frontend/src/lib/intelligence/contract/contractIntelligenceEngine.js`
- Removed Contract tab handling/copy from Trust, navigation/landing/showcase routes, and product-facing academic copy. `CONTRACT_LEGAL_RULES` was removed from the unused legal registry; generic technical `contractVersion`/schema/test terminology should remain.

## Verification already run

- `npm run test:academic-timetable` — PASS, 10/10.
- `npm run test:all` — PASS, all configured Layer 1–4/intelligence/geospatial/threat-intel suites plus 10/10 academic tests. This ran before the final small `projectNextClass`, UI, and product-copy edits; rerun after resuming.
- `npm run lint` — exit 0, 536 warnings and 0 errors (repository-wide pre-existing warnings). Focused new-file lint had zero errors; one existing Copilot warning remains for unused `context`.
- `node --check` passed for the new timetable model/service/repository.
- First complete `npm run build` — PASS, Next.js 16.3.0, generated 142 static pages and all academic routes.
- A second build after the latest small edits compiled successfully but was interrupted by the user’s checkpoint request before finalization; rerun it.
- Runtime smoke check used local dev server on port `3132` (started and stopped by this pass): `GET /academic` returned 200 with no redirect; unauthenticated `GET /api/academic/timetable` returned 401. `RUNTIME_TEST_PORT=3132`, `SERVER_PROCESS_REUSED=NO`.

## Immediate next actions

1. Run from `C:\Users\Duy\Projects\MyProj\StudentHub-AI\frontend`:

   ```powershell
   npm run test:all
   npm run lint
   npm run build
   ```

2. From the repository root, run an accurate product-reference scan (the earlier scan was accidentally run with `frontend/src` paths while already inside `frontend`, so do not rely on it):

   ```powershell
   rg -n -i --glob '!**/tests/**' 'contract-check|contract analysis|legal contract|contractanalyzer|contract_document|legal_contract|hợp đồng|hop dong' frontend/src frontend/public database
   ```

   Classify remaining hits. Keep technical software contracts and generic legal/document taxonomy only if they are not active Contract product functionality.

3. Review `git status --short`; preserve all pre-existing unrelated changes. Do not deploy. The repository is intentionally dirty.

4. If the final build/tests pass, report the exact requested verdict:

   `STUDENTHUB_ACADEMIC_TIMETABLE_IMPLEMENTED`

   Use `STUDENTHUB_ACADEMIC_TIMETABLE_PARTIAL` if runtime/database proof or a release gate remains incomplete; do not claim implemented solely from compilation.

## Important cautions

- Do not print or commit `.env.local`, `GEMINI_API_KEY`, database URLs, cookies, or credentials.
- Do not apply the migration to the main Supabase project unless the user explicitly authorizes production schema changes; it is intentionally only applied to staging so far.
- Do not use Friend backend or add a file-store/JSON authority.
- Do not delete old task/notification infrastructure merely because legacy tests reference it; the user explicitly required preserving it. Only ensure official deadline/inferred schedule logic is not on active product read/write paths.
