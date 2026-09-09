# StudentHub AI — Database & Data-Source Selection Plan

**Ngày:** 09/09/2026  
**Phạm vi:** Community × Expert Promax, Trust bridge, private evidence và bộ đánh giá  
**Trạng thái:** `READY_FOR_PROVIDER_AND_SOURCE_CHECK`  
**Quyết định tạm thời:** giữ một PostgreSQL làm source of truth; chỉ chốt provider sau khi vượt các cổng live bên dưới.

## 1. Điều phải giữ nguyên từ kiến trúc hiện tại

Đường dữ liệu Promax đã được viết cho PostgreSQL, không phải cho một kho
document hoặc key-value:

- migration dùng `pgcrypto`, UUID, `jsonb`, `bytea`, generated identity,
  transaction và `pg_advisory_xact_lock`;
- dữ liệu nhạy cảm nằm trong schema `private`, còn public projection đi qua
  RLS/grants;
- contribution, assessment, review, appeal, correction và quality event có
  revision/idempotency/digest/history;
- durable outbox phải được ghi cùng transaction trước khi publish notification;
- Node `pg` đọc `DATABASE_URL`, pool được giới hạn tối đa 50 kết nối và SSL mặc
  định phải xác minh chứng chỉ;
- live RLS gate đọc `STUDENTHUB_RLS_TEST_DATABASE_URL`.

Vì vậy, MongoDB, Firestore hoặc một bảng NoSQL không được dùng làm authority
cho các bảng trên nếu không có một thiết kế lại toàn bộ invariant. Cache/search
có thể bổ sung sau, nhưng không được trở thành nguồn sự thật thứ hai.

## 2. Shortlist provider để kiểm tra

Đây là thứ tự kiểm tra, không phải tuyên bố hiệu năng hay giá thành đã đo.

| Ứng viên | Vai trò nên thử | Vì sao phù hợp / điều phải kiểm chứng | Rủi ro cần khóa |
| --- | --- | --- | --- |
| **Supabase Postgres + Auth + private Storage** | Ứng viên pilot mặc định | Code đã có Supabase Auth/RLS, `auth.uid()`, service-only write và private file metadata. Supabase cung cấp PostgreSQL đầy đủ, RLS, Auth/Storage cùng nền tảng; tài liệu cũng nêu database backup không bao gồm object trong Storage. | Xác minh đúng project/region; service role chỉ ở server; backup DB và backup object phải có hai quy trình; kiểm tra pooler và migration trên target thật. |
| **Neon Postgres** | Preview/CI branch hoặc phương án pilot nếu tách Auth/Storage | Database branching phù hợp tạo DB cô lập cho từng PR/test; có pooled connection. | Auth, private object storage và policy phải ghép ngoài DB; transaction pooler không hỗ trợ session-level advisory lock, nên phải chạy probe với chính đường `pg_advisory_xact_lock` của app và migration. |
| **Amazon RDS for PostgreSQL** | Production có đội vận hành/VPC | Có Multi-AZ, read replica, SSL, snapshot và point-in-time restore. | Tự vận hành Auth, object storage, secrets, observability và migration; phải chứng minh RTO/RPO thay vì chỉ bật backup. |
| **Cloud SQL for PostgreSQL** | Production nếu hạ tầng chính ở GCP | Có HA và PITR; có thể khôi phục sang instance mới. | Các lớp Auth/Storage/worker vẫn tách riêng; kiểm tra region, egress, failover và quyền IAM. |
| **Docker PostgreSQL cố định version** | Local/CI contract và migration test | Tái lập nhanh, không có chi phí dịch vụ, phù hợp chạy migration/RLS contract. | Không dùng làm production; không chứng minh HA, restore, network isolation hay object privacy. |

Tài liệu chính thức cần đọc khi điền bảng so sánh: [Supabase Database](https://supabase.com/docs/guides/database/overview), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Supabase backups](https://supabase.com/docs/guides/platform/backups), [Neon branching](https://neon.com/docs/guides/branching-intro), [Neon connection pooling](https://neon.com/docs/connect/connection-pooling), [Amazon RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html), [RDS backup/PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [Cloud SQL HA](https://docs.cloud.google.com/sql/docs/postgres/high-availability) và [Cloud SQL PITR](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/pitr).

## 3. Cổng loại trực tiếp

Một ứng viên bị loại khỏi pilot nếu trượt bất kỳ cổng **G1–G6**. Không cộng
điểm bù cho giá rẻ hoặc tiện lợi khi cổng bảo mật/durability bị trượt.

| Cổng | Bằng chứng bắt buộc | Điều kiện đạt |
| --- | --- | --- |
| **G1 — SQL compatibility** | Chạy toàn bộ migration trên DB rỗng, ghi version/extension và lỗi chính xác | PostgreSQL 15 hoặc 16 đã pin patch; `pgcrypto`, JSONB, UUID, bytea 32-byte, generated identity, check/unique/partial index và `pg_advisory_xact_lock` hoạt động. |
| **G2 — Authority/RLS** | User A, User B, anonymous, expert, moderator và service context; mỗi ca có query allow/deny | A không đọc file/evidence private của B; expert ngoài domain không ghi assessment; browser role không chạm bảng private; service write vẫn có audit. |
| **G3 — Transaction/idempotency** | Retry cùng payload, retry khác payload, stale revision, concurrent assignment/review | Không nhân bản event; payload khác trả conflict; stale write bị từ chối; outbox nằm trong cùng transaction với projection. |
| **G4 — Restart/restore** | Restart worker/DB, đọc lại sau commit, restore vào DB mới và chạy smoke test | Bản ghi đã báo thành công vẫn đọc được; restore giữ history/digest/outbox; có RTO/RPO đo được và runbook rollback. |
| **G5 — Private file path** | Upload original, privacy scan, redacted derivative, signed read, revoke/delete | Original không vào DTO/search/log/public URL; derivative tách revision; bucket private; quyền A/B và deletion được kiểm tra live. |
| **G6 — Operations/compliance** | SSL CA, pool saturation, metrics/log redaction, region, retention, DPA/license | Không log secret/PII; connection failure có trạng thái unavailable; region/retention/quyền dùng dữ liệu được owner ký; chi phí p50/p95 có giới hạn. |

## 4. Kế hoạch chạy kiểm tra trong bảy ngày

### Ngày 1 — Khóa yêu cầu và bảng ứng viên

1. Ghi provider, project, region, PostgreSQL version/patch, direct URL và
   pooler URL (chỉ ghi host/port đã che secret).
2. Điền khả năng extension, RLS, transaction, advisory lock, private schema,
   connection limit, PITR, restore-to-new-instance, logs, support, DPA,
   retention, egress và estimated monthly ceiling.
3. Chọn tối đa hai ứng viên để chạy live; các ứng viên còn lại chỉ cần desk
   review ở vòng này.

### Ngày 2 — Tạo môi trường disposable

1. Tạo một project/database **non-production** do StudentHub sở hữu; không
   dùng production URL cho test RLS hoặc migration thử.
2. Tạo test identities theo
   `docs/staging/STAGING_IDENTITY_RUNBOOK.md`: Anonymous, User A/B, Expert,
   Moderator và service context.
3. Dùng secret store/CI để cấp `DATABASE_URL` và
   `STUDENTHUB_RLS_TEST_DATABASE_URL`; không dán credential vào chat, commit,
   shell history hay log.

### Ngày 3 — Migration và contract gate

1. Áp dụng migration theo thứ tự repository trên DB rỗng và lưu checksum,
   migration timestamp, server version, extension list.
2. Chạy `npm run test:phase3-contract`, `npm run test:db` và các Promax
   contract tests.
3. Nếu provider có pooler, chạy cả direct và pooled URL; ghi rõ test nào cần
   session semantics. Migration chỉ được đưa vào staging sau khi diff/schema
   inspection xong.

### Ngày 4 — RLS, authority và concurrency

1. Chạy `npm run test:phase3-live` với disposable target.
2. Chạy hai instance đồng thời cho create/edit/reaction/assignment/assessment,
   kiểm tra advisory lock, unique idempotency, stale revision và request
   digest.
3. Kiểm tra read-after-commit, outbox replay, worker restart và cross-user
   private evidence. Mỗi kết quả phải lưu raw case/revision và query result.

### Ngày 5 — Backup, restore và file privacy

1. Tạo một case synthetic, contribution, assessment, appeal, correction và
   outbox event; chụp timestamp.
2. Restore DB sang instance mới, chạy lại smoke/readback và đối chiếu row
   count, history, digest, revision, outbox status.
3. Upload file mẫu có PII/QR/EXIF; chứng minh original private, derivative đã
   redact, signed URL hết hạn và User B bị từ chối. Backup object phải được
   kiểm tra riêng với backup DB.

### Ngày 6 — Kiểm tra nguồn dữ liệu bằng chứng

1. Lập inventory theo mục 5; bắt đầu từ 20 ca có nguồn được phép dùng.
2. Khóa hai người đọc độc lập cho mỗi claim; bất đồng chuyển third review.
3. Không đưa dữ liệu thật vào production cho đến khi provenance, license,
   PII classification và correction path đầy đủ.

### Ngày 7 — Chấm điểm và quyết định

1. Chấm ma trận mục 6, đính kèm bằng chứng chứ không chấm theo brochure.
2. Chọn một primary DB cho pilot; nếu cần branching, dùng Neon/Docker cho
   preview/CI nhưng không tạo source of truth thứ hai.
3. Ký decision record: provider, region, version, backup/restore result,
   RLS result, storage result, cost ceiling, người chịu trách nhiệm và ngày
   review lại.

## 5. Cách kiểm tra **nguồn dữ liệu**, tách khỏi việc chọn provider

PostgreSQL là nơi lưu provenance và projection; nó không biến một URL thành
nguồn đáng tin. Mỗi source snapshot phải có các trường sau:

| Trường | Yêu cầu |
| --- | --- |
| `source_id`, `publisher`, `source_type` | ID bất biến; phân loại `OFFICIAL`, `REGULATOR`, `EMPLOYER`, `ACADEMIC`, `COMMUNITY`, `SYNTHETIC`. |
| `canonical_url`, `retrieved_at`, `published_at` | URL chuẩn, thời điểm lấy và thời điểm văn bản công bố; timezone rõ. |
| `jurisdiction`, `domain_code` | Trường/khoa/ngành/địa bàn mà nguồn có thẩm quyền; không suy rộng ngoài scope. |
| `content_digest`, `snapshot_uri`, `parser_version` | Hash SHA-256, bản snapshot bất biến và phiên bản parser để tái lập. |
| `allowed_use`, `license_evidence` | Bằng chứng quyền lưu/trích dẫn/hiển thị; thiếu là `BLOCKED`, không tự suy đoán. |
| `valid_from`, `valid_to`, `supersedes_source_id` | Freshness, hết hiệu lực, văn bản thay thế và correction chain. |
| `pii_classification`, `redaction_state` | PII có/không, loại nào, ai duyệt redaction; original ở private storage. |
| `lineage`, `independence_key` | Nguồn gốc, bản sao/syndication và khóa độc lập dùng cho source clustering. |

### Thứ tự ưu tiên nguồn

1. **Tier A — authoritative:** thông báo/chính sách do trường, cơ quan quản
   lý hoặc đơn vị có thẩm quyền phát hành; dùng để tạo claim chính.
2. **Tier B — corroborating:** doanh nghiệp/đối tác/đơn vị chuyên môn có danh
   tính và scope rõ; dùng đối chiếu, không tự ghi đè Tier A.
3. **Tier C — community:** bài gửi của người dùng, ảnh, trải nghiệm và phản
   biện; lưu contribution/revision, source cluster và trạng thái chưa đủ bằng
   chứng; không biến like/vote thành sự thật.
4. **Tier D — synthetic:** fixture kiểm thử/demo; luôn gắn nhãn synthetic,
   tuyệt đối không dùng để tuyên bố hiệu quả ngoài đời.

### Rubric chấp nhận nguồn

Chấm tham khảo: authority/scope 30%, freshness 20%, provenance/reproducibility
20%, quyền sử dụng 15%, độ ổn định/máy đọc được 10%, PII risk 5%. Đây chỉ là
điểm xếp hàng; **trượt legal/provenance/PII là loại**, dù tổng điểm cao.

Khi nạp dữ liệu, tạo `trust_case`/`claim`/`evidence revision` với revision
riêng, gắn source IDs và lưu snapshot. Không scrape hàng loạt mạng xã hội rồi
đưa thẳng vào authority path. Bản sao cùng incident/source cluster chỉ là một
nguồn độc lập; mâu thuẫn phải được lưu song song và chuyển review.

## 6. Ma trận chấm provider

Sau khi vượt G1–G6, chấm 100 điểm:

| Tiêu chí | Trọng số | Cách đo |
| --- | ---: | --- |
| SQL/schema/transaction/RLS | 25 | Kết quả G1–G3, latency p50/p95 và lỗi thật |
| Backup/restore/durability | 20 | G4, RTO/RPO, readback và outbox sau restore |
| Auth + private Storage integration | 15 | G2/G5, signed URL, revoke, derivative và secret boundary |
| Privacy, region, compliance | 15 | G6, DPA, retention, deletion, audit log, data residency |
| Preview/CI/local reproducibility | 10 | DB cô lập, migration automation, seed reset, branch/clone |
| Cost/limits/scale | 10 | Chi phí theo pilot, pool limit, storage/egress, p95 dưới tải |
| Observability/support | 5 | DB metrics, slow query, alerting, incident/support SLA |

Không đưa điểm “AI accuracy” vào provider score; accuracy phụ thuộc corpus,
annotator và pipeline, được đo trong evaluation spec riêng.

## 7. Quyết định kiến trúc khuyến nghị

Cho pilot hiện tại, kiểm tra **Supabase Postgres trước** vì nó khớp trực tiếp
với Auth/RLS/Storage boundary đã có. Nếu preview per-PR và migration isolation
là ưu tiên lớn, dùng **Neon hoặc Docker Postgres cho CI/preview**, nhưng vẫn
giữ một primary authoritative DB. Chuyển sang **RDS hoặc Cloud SQL** khi đã có
người vận hành, yêu cầu VPC/HA/region rõ và đã diễn tập restore.

Mọi provider đều giữ cùng nguyên tắc:

- Postgres là authority; outbox cùng DB transaction;
- file/PDF/ảnh ở private object storage, metadata/hash/revision ở Postgres;
- search/vector/cache chỉ là projection có thể rebuild;
- nguồn community không cấp quyền expert, không đổi Trust truth;
- fixture synthetic và dữ liệu test không trộn với corpus thật.

## 8. Hồ sơ cần bạn thu thập

### Hồ sơ provider (không gửi secret)

`provider`, `project_id` đã che, `region`, PostgreSQL version/patch, direct vs
pooler mode, extension list, SSL CA policy, max connections, PITR/retention,
restore target, RTO/RPO, private network, object-storage policy, Auth model,
audit/metrics, DPA/data residency, monthly ceiling và link tài liệu chính thức.

### Hồ sơ nguồn dữ liệu

`source_id`, publisher/owner, canonical URL, source tier, jurisdiction/domain,
published/retrieved time, license/allowed use, snapshot/hash, parser version,
PII/redaction status, correction/supersedes link, independence key và người
duyệt.

Không gửi `DATABASE_URL`, service-role key, JWT, session pepper, signed URL,
cookie hay file có PII vào issue, chat, commit hoặc report công khai.

## 9. Điều kiện đóng kế hoạch

Được phép mở pilot khi có đủ:

- một provider vượt G1–G6 và ma trận chấm có evidence;
- migration checksum/version và live RLS A/B pass;
- read-after-commit, retry/idempotency, restart, outbox replay và restore
  rehearsal pass;
- private object storage + deletion/revoke pass;
- tối thiểu 20 case source-backed có provenance/license/PII đầy đủ;
- dataset/evaluation vẫn tách synthetic với real, có hai annotator và third
  review path;
- runbook rollback, owner, region, cost ceiling và ngày audit lại.

Nếu thiếu một mục trên, trạng thái phải giữ là
`DATABASE_AND_SOURCE_SELECTION_PARTIAL`, không gọi là production-ready hoặc
đã chứng minh kết quả cuộc thi.

## 10. Liên kết nội bộ cần dùng

- [Community × Expert Promax implementation report](../reports/COMMUNITY_EXPERT_PROMAX_IMPLEMENTATION_REPORT_2026-09-09.md)
- [Community × Expert Promax principal audit](../reports/COMMUNITY_EXPERT_PROMAX_PRINCIPAL_AUDIT_2026-09-09.md)
- [Staging environment variable matrix](../staging/STAGING_ENVIRONMENT_MATRIX.md)
- [Environment provisioning inventory](../reports/ENVIRONMENT_PROVISIONING_INVENTORY.md)
- [Community × Expert Promax evaluation spec](../evaluation/COMMUNITY-EXPERT-PROMAX-EVALUATION-SPEC-2026-09-09.md)

