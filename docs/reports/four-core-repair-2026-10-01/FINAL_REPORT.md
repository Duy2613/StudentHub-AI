# Báo cáo chốt sửa bốn lõi StudentHub

- **Trạng thái gói:** READY_FOR_PRODUCTION_ROLLOUT_PENDING_APPROVAL
- **Chấp nhận toàn bộ production:** NO — FULL_FIX_ACCEPTED chưa đạt
- **Candidate source SHA:** eea55564ebaef4dc2edc7af14586fe8f04324114
- **Branch:** codex/studenthub-four-core-repair-20261001
- **Source repair commit:** 187da95961f66abfa1ba9b05fca19915f8fab8b5
- **Mobile overflow fix commit:** eea55564ebaef4dc2edc7af14586fe8f04324114
- **Production deployment quan sát được:** Vercel deployment dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7, SHA 595a99110367aefb545b02dab4b9f9a5a6106ab6; production không bị sửa trong lần này.
- **Thư mục bằng chứng:** docs/reports/four-core-repair-2026-10-01/.

Candidate được tạo trong worktree riêng để giữ nguyên repository người dùng. SHA nêu trên là SHA của code ứng dụng đã chạy build, regression, browser và staging integration. Các tài liệu báo cáo được thêm sau đó không đổi source SHA này.

## Kết quả theo lõi

| Lõi / luồng | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| Auth/session | **PASS trên staging; production baseline kiểm tra riêng** | Bảy synthetic stage identities qua login/reload; quyền được thu hồi và identity bị disable sau test. Production diagnostic trước đó ghi nhận 8/8 tài khoản allowlist đăng nhập, session sống sau reload và logout làm session thành 401; auth-production-canonical.json dùng harness SHA bb240430... nên không dùng thay bằng chứng candidate release. |
| Profile | **PARTIAL** | Năm trường hồ sơ được lưu, đọc lại từ DB và hiển thị sau reload trên staging. Candidate sửa /profile/[id], Trust case link và trạng thái activity/query; public-profile contract theo ID chưa được nghiệm thu đầy đủ qua staging. |
| Community | **PASS trên staging; production FAIL trên bản đang deploy** | Đã kiểm tra preview → publish bền vững, linkage Trust revision, thread công khai, nested comments depth 0/1, retry idempotent. Production đang chạy SHA cũ: /api/v1/community trả 500 INTERNAL_SERVER_ERROR; /api/intelligence/community/posts trả 503 PROMAX_MIGRATION_REQUIRED. |
| Expert V5 | **PARTIAL** | Staging kiểm tra nguồn canonical, mission đúng/sai 100/0, retry không cộng tiến trình hai lần, không tăng credential star; room timer 30 giây do server, answers riêng tư, adjudication/settlement/dispute, SSE replay và outsider deny. Request → matching/assignment → assessment đầy đủ chưa được nghiệm thu end-to-end. |
| Trust | **PARTIAL** | Text/URL/image/QR đều persist và owner đọc lại; người khác nhận 404; L1–L4 hoàn tất trong staging. Provider ở chế độ OFF, budget 0: không chứng minh được live Gemini/Tavily availability, retrieval holdout hoặc provider SLO. |
| Search / nguồn hợp nhất | **PARTIAL** | Candidate có thay đổi để lỗi một nguồn không làm mất nguồn còn hoạt động và giữ trạng thái partial/error. Freshness của search vừa ghi trên staging chưa có gate độc lập đủ để đóng toàn bộ search. Production baseline trước đó ghi /api/v1/search 503. |
| Realtime | **PASS trong staging cho room scope đã kiểm tra** | Hai browser, SSE reconnect/replay theo cursor, recipient scope, outsider denial và event readback đã kiểm tra; không đại diện cho mọi realtime channel. |
| Storage/media | **PASS_LOCAL_ONLY** | Local disposable Supabase chứng minh owner upload/download/signed URL, non-owner và anonymous bị từ chối, exact-owner cleanup. Staging storage chưa chạy gate tương đương. |
| Responsive UI | **PASS candidate; FAIL production baseline** | Candidate browser matrix: Chromium/Firefox/WebKit × 4 routes × 4 độ rộng = 48/48. Production baseline cũ: 42/48; sáu lỗi là overflow Community ở 360/390 px, scrollWidth 472–473 px. |
| Database/migration | **PASS rehearsal local; production rollout BLOCKED** | Fresh chain 29 migrations, idempotency, observed-schema fixture upgrades và synthetic data preservation đều PASS trên local disposable PostgreSQL 17.6. Đây không phải production/staging clone và chưa chứng minh cloud grants, policies, triggers hay runtime DB target. |

## Những sửa đổi đã đưa vào candidate

Source repair commit 187da959 sửa các hợp đồng API và dữ liệu giữa Community, Expert, Trust và Profile: chuẩn hóa route params của App Router; giữ partial result khi một search source lỗi; sửa projection/pagination của Community và Expert repository; giữ privacy, revision và idempotency ở Expert review/room; sửa profile projection, query status và hành vi route theo ID; làm readiness diagnostics tách dependency khỏi capability. Các test fault/integration và harness staging/browser cũng được thêm để kiểm tra hành vi bền vững và owner scope.

Commit eea55564 xử lý overflow trạng thái session trong header ở viewport rất hẹp. Firefox Trust 360 px được kiểm tra lại ở 360 px, và matrix release cuối cùng đạt 48/48.

**Không có migration source file nào được sửa hoặc thêm trong candidate.** Đối chiếu catalog cho thấy migration bổ sung cần thiết đã tồn tại trong repository; rehearsal chọn đúng các file hiện có và ghi plan vào migration-rehearsal-final.json. Không sửa migration ledger, không reset DB, không xóa dữ liệu và không chạy cloud migration.

## Kiểm chứng gắn SHA và môi trường

Các artifact có candidateSha ghi rõ SHA eea55564ebaef4dc2edc7af14586fe8f04324114. Build, lint và regression log được lập chỉ mục với cùng candidate SHA trong evidence-index.json. Storage là assurance riêng trên local disposable Supabase, không được dùng làm bằng chứng staging hoặc production.

- **Staging integration:** staging-integration.json, project ref bniwtkjtramqaozrrtrk, 16/16 gates PASS; profile readback gồm năm trường; Trust owner readback; Community nested comments; Expert mission/room. Bảy identity synthetic bị disable, role bị thu hồi và session bị xóa; immutable test history giữ lại kèm run tag.
- **Browser candidate:** browser-candidate-staging-release.json, 48/48 PASS, 3 engine × 4 route × 4 viewport.
- **Build:** build-final.log, Next.js 16.3.7 compile và TypeScript pass, 143/143 static generation.
- **Lint:** lint-final.log, exit 0, 0 errors và 490 repository warnings.
- **Regression:** regression-rerun.log, 390/396 discovered test files PASS; sáu live gates BLOCKED_EXTERNAL: fresh_retrieval_holdout_v3, fresh_retrieval_holdout_v4, fresh_retrieval_holdout_v5_public_api, live_web_retrieval, real_world_live_search_golden_flow và expert_v5_live_readonly. 64 removed-feature tests được quality runner skip có ghi lý do. Lượt đầu có một lỗi thoáng qua ở canonical_api_runtime.test.mjs khi GET /trust trả 500; test đơn và full rerun đều pass, không tái hiện được.
- **Migration rehearsal:** migration-rehearsal-final.json, PostgreSQL 17.6 local disposable, 29 migration chain; forward idempotency, production/staging observed-schema fixture upgrades, preservation dữ liệu synthetic, từ chối schema không tương thích và kiểm tra RLS/grants/append-only/nested FK đều PASS.
- **Schema snapshot:** schema-production.json, schema-staging.json, schema-drift-final.json. Read-only catalog: production operator target ref kytdomflmjytzyaabogi có 65 tables/694 columns/10 ledger entries; staging ref bniwtkjtramqaozrrtrk có 107 tables/1,157 columns/16 ledger entries. Cả hai có 0 table thường trong hai schema quan sát bị tắt RLS. SHA-256 catalog lần lượt 88526eda878d18b8f4dd1e47f84279395cc9f3bff13316b91cc0d0545c0214d6 và 013e527c258bd17c29b6e4f7e30c0411bf8649118e82cc9ac8703457489b1f3e.
- **Production read-only:** production-snapshot-final.json; deployment hiện tại vẫn SHA 595a991... Liveness/readiness trả 200 nhưng không công bố backend project ref; hai Community API nêu trên vẫn lỗi. Production browser baseline chi tiết nằm ở browser-production-final.json (harness SHA d92841b..., production deployment SHA 595a991...): 42/48 pass và sáu Community mobile overflow. Browser baseline và candidate release là hai artifact tách biệt.

Production catalog snapshot chỉ chứng minh project ref của kết nối operator read-only, **không chứng minh Vercel runtime đang trỏ cùng database**. Lệnh pull environment Vercel được automatic command review chặn trước khi chạy; không thu được giá trị environment và không thử vòng qua cơ chế chặn.

## Drift và migration provenance

Schema production thiếu 22 bảng thuộc phạm vi sửa (21 Expert V5 và public.community_comments) cùng sáu cột dùng chung: private.expert_review_requests.community_contribution_id, bốn cột lease/shadow của private.integration_outbox, và private.reputation_events.context. Có 20 bảng staging-only ngoài phạm vi đợt này và cột legacy public.profiles.institution_label chỉ có ở staging, cần giữ nguyên.

Migration ledger có 10 version production và 16 version staging; tên/version ledger không khớp hoàn toàn với repository. Kế hoạch trong fixture rehearsal:

**Production — 8 migration files có sẵn trong repository:**

1. 20260926111838_community_nested_comments.sql
2. 20260926112754_community_expert_request_linkage.sql
3. 20260927032100_trust_four_layer_stage_constraint.sql
4. 20260929135354_studenthub_expert_v5_missions_rooms.sql
5. 20260929135553_expert_v5_trigger_path_and_fk_indexes.sql
6. 202610010001_integration_outbox_forward_reconciliation.sql
7. 202610010002_profile_presentation_check_reconciliation.sql
8. 202610010003_expert_v5_event_sequence_permissions.sql

**Staging — 8 migration files có sẵn trong repository:**

1. 202609170001_durable_academic_workflows.sql
2. 202609170002_demo_entitlements.sql
3. 202609180001_reputation_events_idempotency.sql
4. Các migration mục 1, 3, 6, 7, 8 trong danh sách production.

Plan là kết quả rehearsal trên fixture dựng từ catalog read-only và synthetic rows. Trước bất kỳ lần apply thật nào, operator phải đối chiếu chính xác version/name/statement hash với ledger từng môi trường; không suy ra migration “chưa chạy” chỉ từ tên khác và không dùng migration repair/stamp để làm ledger xanh.

## Gates còn mở

1. Tạo bản backup PostgreSQL ngoài Supabase, giữ checksum và chứng minh restore trên project disposable tương thích; hiện chưa có artifact backup/restore được xác minh. Supabase Free không có scheduled daily backup theo tài liệu nền tảng; object Storage cần backup riêng vì pg_dump không chứa file objects. [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups).
2. Xác minh project ref của Vercel production runtime DB, Auth và durable-session target qua kênh operator an toàn, chỉ ghi metadata không nhạy cảm.
3. Chạy migration thực trên staging sau preflight và kiểm tra lại cloud policies, grants, functions, triggers, indexes, ownership, RLS và readback.
4. Chạy Expert request/assignment/assessment end-to-end, staging Storage, và các gate Community search freshness còn thiếu.
5. Chạy live Gemini/Tavily và các holdout chỉ khi quyền/budget được cấp; hiện sáu test files bị chặn external, không được tính PASS.
6. Sau khi staging đạt, mới chốt lịch rollout production và post-deploy verification.

Vì các gate trên chưa đóng, đây **không phải** FULL_FIX_ACCEPTED. Production hiện vẫn chạy deployment cũ và các API đang lỗi không được coi là đã sửa chỉ vì candidate/staging pass.
