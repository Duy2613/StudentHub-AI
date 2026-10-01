# Báo cáo chốt sửa bốn lõi StudentHub

- **Trạng thái gói:** STAGING_VERIFIED_PRODUCTION_HOLD
- **Chấp nhận toàn bộ production:** NO — FULL_FIX_ACCEPTED chưa đạt
- **Candidate source SHA:** eea55564ebaef4dc2edc7af14586fe8f04324114
- **Branch:** codex/studenthub-four-core-repair-20261001
- **Source repair commit:** 187da95961f66abfa1ba9b05fca19915f8fab8b5
- **Mobile overflow fix commit:** eea55564ebaef4dc2edc7af14586fe8f04324114
- **Production deployment quan sát được:** Vercel deployment dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7, SHA 595a99110367aefb545b02dab4b9f9a5a6106ab6; production không bị sửa trong lần này.
- **Thư mục bằng chứng:** docs/reports/four-core-repair-2026-10-01/.

Candidate được tạo trong worktree riêng để giữ nguyên repository người dùng. SHA nêu trên là SHA của code ứng dụng đã chạy build, regression, browser và staging integration. Các tài liệu báo cáo và harness được thêm sau đó không đổi source SHA này. Lượt chốt staging ghi nhận 17 gate PASS và một gate PARTIAL, không có gate FAIL; phần PARTIAL là chính sách ẩn hồ sơ sinh viên theo ID. Migration rehearsal cục bộ PASS. Đối chiếu staging cho thấy các migration trong plan đã có trong ledger dưới tên/version tương đương hoặc chính xác, nên không chạy lại migration. Production vẫn ở trạng thái HOLD.

## Kết quả theo lõi

| Lõi / luồng | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| Auth/session | **PASS trên staging; production baseline kiểm tra riêng** | Bảy synthetic stage identities qua login/reload; quyền được thu hồi và identity bị disable sau test. Production diagnostic trước đó ghi nhận 8/8 tài khoản allowlist đăng nhập, session sống sau reload và logout làm session thành 401; auth-production-canonical.json dùng harness SHA bb240430... nên không dùng thay bằng chứng candidate release. |
| Profile | **PASS phần hồ sơ riêng tư; PARTIAL public student ID route** | Năm trường hồ sơ được lưu và đọc lại sau reload; activity status, Trust case owner readback/link sau reload, trạng thái rỗng khác trạng thái lỗi và chống route ID injection đều PASS. `/profile/{studentId}` trả 404 theo privacy boundary. Public Expert profile qua route riêng, DTO đã loại email. |
| Community | **PASS trên staging; production FAIL trên bản đang deploy** | Đã kiểm tra preview → publish bền vững, linkage Trust revision, thread công khai, nested comments depth 0/1, retry idempotent. Production đang chạy SHA cũ: /api/v1/community trả 500 INTERNAL_SERVER_ERROR; /api/intelligence/community/posts trả 503 PROMAX_MIGRATION_REQUIRED. |
| Expert V5 | **PASS các luồng staging đã kiểm tra** | Nguồn canonical thật, mission đúng/sai 100/0, retry không cộng tiến trình hai lần, không tăng credential star; room timer 30 giây do server, answers riêng tư, adjudication/settlement/dispute, SSE replay và outsider deny. Request → exact-domain matching → assignment → Workbench → assessment/persistence/replay, sai scope bị chặn, và Expert public DTO không lộ email đều PASS. |
| Trust | **PASS persistence/owner isolation; PARTIAL live AI** | Text/URL/image/QR persist, L1–L4 hoàn tất, owner đọc lại và người khác nhận 404. Provider mode OFF/budget 0: chưa chứng minh live Gemini/Tavily availability hoặc retrieval holdout/SLO. |
| Search / nguồn hợp nhất | **PARTIAL** | Community search của bài synthetic mới đọc được ngay bởi user thứ hai ở exact/partial/keyword/tiếng Việt có dấu; recent feed và realtime event bền vững PASS. Query không dấu chưa được hỗ trợ và author-filter route chưa được expose. OpenAlex/Crossref trả metadata; production baseline trước đó ghi /api/v1/search 503. |
| Realtime | **PASS trong staging cho room scope đã kiểm tra** | Hai browser, SSE reconnect/replay theo cursor, recipient scope, outsider denial và event readback đã kiểm tra; không đại diện cho mọi realtime channel. |
| Storage/media | **Trust IMAGE/QR trực tiếp PASS trên staging; Expert Room media FAIL acceptance** | Direct Trust upload/read/signed URL/owner isolation/cleanup PASS. Expert Room currently stores raw challenge bytes rather than a durable canonical asset reference; R05/R06/R09 fail by code-path audit. Live Room media acceptance was not run because staging credential rotation/invalidation remains unverified. See `ROOM_MEDIA_STORAGE_ACCEPTANCE.md`. |
| Responsive UI | **PASS candidate; FAIL production baseline** | Candidate browser matrix: Chromium/Firefox/WebKit × 4 routes × 4 độ rộng = 48/48. Production baseline cũ: 42/48; sáu lỗi là overflow Community ở 360/390 px, scrollWidth 472–473 px. |
| Database/migration | **PASS rehearsal; staging migration plan reconciled; production rollout BLOCKED** | Fresh chain 29 migrations, idempotency, observed-schema fixture upgrades và synthetic data preservation PASS trên local disposable PostgreSQL 17.6. Read-only staging ledger reconciliation tìm đủ 8/8 planned migration là APPLIED_EXACT/APPLIED_EQUIVALENT; không duplicate/apply. Production operator DB có 4 migration chắc chắn NOT_APPLIED, 15 UNKNOWN và không có APPLIED_EXACT; runtime DB của Vercel chưa xác minh. |

## Phân loại các mục product-contract ở gate 13

| Mục | Disposition | Trạng thái evidence và căn cứ |
| --- | --- | --- |
| `AVATAR_STORAGE` | **NONCRITICAL_FOLLOWUP** | Profile contract hiện nhận `AvatarUrl`; giao diện có ô `type="url"`, không có luồng chọn/tải file avatar. Profile API contract test xác nhận chỉ sửa `FullName/AvatarUrl`. Vì vậy bucket upload avatar riêng không phải gate của contract hiện tại; đây không phải PASS cho upload avatar. |
| `ROOM_MEDIA_STORAGE` | **RELEASE_REQUIRED — FAIL** | R05/R06/R09 fail by code-path audit: upload Room không tạo durable object, Room lưu `bytes` thay cho asset reference, Evidence Package không mang media ID/digest. Live acceptance chưa chạy; xem matrix R01–R17 tại `ROOM_MEDIA_STORAGE_ACCEPTANCE.md`. Không cần bucket `room-media` riêng; cần tích hợp bucket Trust hiện hữu và kiểm chứng end-to-end. |
| `UNACCENTED_COMMUNITY_SEARCH` | **NONCRITICAL_FOLLOWUP** | Staging exact/partial/keyword và truy vấn tiếng Việt có dấu đều PASS; artifact `staging-integration.json` ghi rõ truy vấn không dấu chưa được hỗ trợ theo contract tìm kiếm hiện tại. Không gọi mục này là PASS. |
| `AUTHOR_FILTER` | **NONCRITICAL_FOLLOWUP** | Artifact staging ghi `NOT_EXPOSED_BY_CURRENT_ROUTE`; contract hiện tại không yêu cầu bộ lọc theo tác giả. Không gọi mục này là PASS. |

Các disposition này được khóa vào candidate source SHA eea55564ebaef4dc2edc7af14586fe8f04324114 và đối chiếu với staging ref bniwtkjtramqaozrrtrk. Xem `evidence-index.json` để biết file/code evidence cụ thể.

## Những sửa đổi đã đưa vào candidate

Source repair commit 187da959 sửa các hợp đồng API và dữ liệu giữa Community, Expert, Trust và Profile: chuẩn hóa route params của App Router; giữ partial result khi một search source lỗi; sửa projection/pagination của Community và Expert repository; giữ privacy, revision và idempotency ở Expert review/room; sửa profile projection, query status và hành vi route theo ID; làm readiness diagnostics tách dependency khỏi capability. Các test fault/integration và harness staging/browser cũng được thêm để kiểm tra hành vi bền vững và owner scope.

Commit eea55564 xử lý overflow trạng thái session trong header ở viewport rất hẹp. Firefox Trust 360 px được kiểm tra lại ở 360 px, và matrix release cuối cùng đạt 48/48.

**Không có migration source file nào được sửa hoặc thêm trong candidate.** Đối chiếu catalog cho thấy migration bổ sung cần thiết đã tồn tại trong repository; rehearsal chọn đúng các file hiện có và ghi plan vào migration-rehearsal-final.json. Không sửa migration ledger, không reset DB, không xóa dữ liệu và không chạy cloud migration.

## Kiểm chứng gắn SHA và môi trường

Các artifact có candidateSha ghi rõ SHA eea55564ebaef4dc2edc7af14586fe8f04324114. Build, lint và regression log được lập chỉ mục với cùng candidate SHA trong evidence-index.json. Storage có assurance riêng trên local và staging; không kết quả nào đại diện cho production.

- **Staging integration:** staging-integration.json, project ref bniwtkjtramqaozrrtrk, run `fourcore-1790856038049`, 18 gates: 17 PASS, 1 PARTIAL, 0 FAIL; 109 API checks. Profile activity/link/readback/empty-state PASS; public student-ID route trả 404 theo privacy policy. Trust owner readback, Community nested comments/search/realtime, Expert request/assignment/assessment và Expert V5 mission/room PASS. Bảy synthetic identity bị disable, roles thu hồi; Trust visibility được phục hồi; không cleanup lỗi. Harness SHA-256 `940413163c5e87175072c2686f74113503a5ee0ea3185f4404da64a9e907c033`, chạy trên evidence commit `0c9a4f3cc326209a5436b49e41041fdce1e1304e` với harness working-tree changes; candidate source SHA vẫn eea55564.... Lượt harness đầu chọn một Trust fixture cũ ngoài top-five và fail assertion; lưu ở staging-integration-attempt-profile-link-ordering.json. Sửa harness để chọn fixture thật sự được Profile hiển thị rồi chạy lại đạt các assertions.
- **Staging storage:** staging-storage.json, private bucket `trust-screenshots-private`; owner upload/read/signed URL và non-owner/anonymous denial cho Trust image + QR PASS; exact-path cleanup và hai synthetic identity cleanup PASS. Không có avatar hoặc room-media bucket.
- **OpenAlex smoke:** openalex-smoke.json; candidate local trỏ staging, một truy vấn works, limit 3, HTTP 200; OpenAlex và Crossref AVAILABLE, trả 3 records. Kết quả chỉ là metadata, `isAuthoritative=false`.
- **Browser candidate:** browser-candidate-staging-release.json, 48/48 PASS, 3 engine × 4 route × 4 viewport.
- **Build:** build-final.log, Next.js 16.3.7 compile và TypeScript pass, 143/143 static generation.
- **Lint:** lint-final.log, exit 0, 0 errors và 490 repository warnings.
- **Regression:** regression-rerun.log, 390/396 discovered test files PASS; sáu live gates BLOCKED_EXTERNAL: fresh_retrieval_holdout_v3, fresh_retrieval_holdout_v4, fresh_retrieval_holdout_v5_public_api, live_web_retrieval, real_world_live_search_golden_flow và expert_v5_live_readonly. 64 removed-feature tests được quality runner skip có ghi lý do. Lượt đầu có một lỗi thoáng qua ở canonical_api_runtime.test.mjs khi GET /trust trả 500; test đơn và full rerun đều pass, không tái hiện được.
- **Migration rehearsal:** migration-rehearsal-final.json, PostgreSQL 17.6 local disposable, 29 migration chain; forward idempotency, production/staging observed-schema fixture upgrades, preservation dữ liệu synthetic, từ chối schema không tương thích và kiểm tra RLS/grants/append-only/nested FK đều PASS.
- **Schema/migration reconciliation:** schema-production.json, schema-staging.json, schema-drift-final.json, migration-ledger-reconciliation.json và MIGRATION_LEDGER_RECONCILIATION.md. Operator read-only refs: production `kytdomflmjytzyaabogi` có 65 tables/694 columns/10 ledger entries; staging `bniwtkjtramqaozrrtrk` có 107 tables/1,157 columns/16 ledger entries. Production repository reconciliation: 10 APPLIED_EQUIVALENT, 4 NOT_APPLIED, 15 UNKNOWN, 0 hash mismatch, 0 APPLIED_EXACT. Staging: 4 APPLIED_EXACT, 10 APPLIED_EQUIVALENT, 1 NOT_APPLIED, 14 UNKNOWN; cả 8 migration thuộc plan staging là exact/equivalent. Không sửa ledger và không chạy migration cloud trong lượt này. SHA-256 catalog production `88526eda878d18b8f4dd1e47f84279395cc9f3bff13316b91cc0d0545c0214d6`, staging `013e527c258bd17c29b6e4f7e30c0411bf8649118e82cc9ac8703457489b1f3e`.
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

Plan là kết quả rehearsal trên fixture dựng từ catalog read-only và synthetic rows. Ledger reconciliation sau đó xác nhận tám migration staging trong plan đã có dưới version/name chính xác hoặc alias với stored SQL tương đương; vì vậy staging không cần apply lại. Production operator ref có 4 migration mục tiêu chắc chắn NOT_APPLIED, 4 UNKNOWN trong 8 mục tiêu; toàn catalog 15 UNKNOWN. Đây chỉ là operator DB ref, không phải Vercel runtime target đã xác minh. Không suy ra migration chưa chạy từ tên/version khác, không dùng repair/stamp và không apply cloud migration từ rehearsal một mình.

## Gates còn mở

1. Xác minh project ref của Vercel production runtime DB/Auth/session qua kênh operator được phép. `vercel env pull` bị automatic command review chặn trước thực thi; không thử bypass. Operator snapshot `kytdomflmjytzyaabogi` chưa đủ chứng minh runtime target.
2. Tạo backup mã hóa của đúng production runtime DB, ghi checksum và chứng minh restore trên disposable Supabase-compatible project. Chưa tạo: runtime target chưa rõ, `pg_dump` không có trên PATH, chưa có đích backup/restore được xác minh; Docker có sẵn nhưng không dùng để đoán hoặc kết nối target. Backup Storage objects riêng cũng chưa có.
3. Resolve 15 migration UNKNOWN và aliases production; bốn file mục tiêu rõ ràng NOT_APPLIED cần preflight trên đúng runtime DB. Không chạy migration khi identity, backup và ledger provenance còn mở.
4. Hoàn tất maintenance window/operator, abort threshold và approval trước mọi production write/deploy.
5. Residual product gates: Gemini/Tavily live và fresh unseen retrieval holdout (provider OFF; chưa có corpus được duyệt); `ROOM_MEDIA_STORAGE` là RELEASE_REQUIRED và hiện FAIL theo R05/R06/R09 static audit, chưa chạy live. Avatar upload storage, unaccented Community search và author-filter route là NONCRITICAL_FOLLOWUP theo contract hiện tại. Tavily chưa được gọi.
6. Sau khi tất cả non-Tavily gates, backup/restore, identity và production approval đạt, mới chạy một Tavily one-shot theo budget rồi chốt rollout/canary/post-deploy verification.

Vì các gate trên chưa đóng, đây **không phải** FULL_FIX_ACCEPTED. Production hiện vẫn chạy deployment cũ và các API đang lỗi không được coi là đã sửa chỉ vì candidate/staging pass.
