# StudentHub AI × Labbe — báo cáo triển khai master prompt

**Ngày:** 06/09/2026 (Asia/Bangkok)  
**Trạng thái:** `IMPLEMENTED_WITH_EXTERNAL_GATES`  
**Phạm vi:** triển khai theo audit `CORE-SYSTEM-AUDIT-2026-09-06.md` và master plan `CORE-SYSTEM-MASTERPLAN-2026-09-06.md`.

## Kết quả đã triển khai

### Trust

- Trust V5 vẫn giữ đủ bảy stage kỹ thuật `L1, L2A, L2B, L2C, L3, L4, L5`, nhưng UI chỉ hiển thị một stage panel tại một thời điểm.
- Stage được chuyển bằng tab, phím mũi tên, Home/End và Previous/Next; chọn stage không chạy lại AI, không tạo request mới, không tự cuộn và không cướp focus.
- Đã tách durable identity thành `trust_cases`, `trust_runs`, `trust_stage_runs`, `trust_case_revisions`, `trust_verdict_revisions`. Terminal response chỉ trả sau khi transaction ghi case graph, run, revision và outbox thành công.
- Retry giữ idempotency và input hash phân biệt hoa thường của nội dung URL/path/query. Case, run, input, evidence và claim ID trùng owner khác bị từ chối trong transaction.
- `Idempotency-Key` của Trust được ràng buộc duy nhất theo owner trong `trust_runs`; cùng key với payload khác trả `409 TRUST_IDEMPOTENCY_CONFLICT`, cùng payload trả lại case đã commit.

### Realtime và Community

- Realtime transport không còn số liệu giả, ticker ngẫu nhiên, mock audit hay client event có quyền hoàn tất stage/verdict.
- SSE có channel allowlist, scope policy, replay bounded, payload limit, rate limit, server generated client ID và cleanup khi disconnect.
- Broadcast tổng quát yêu cầu quyền admin; notification chỉ là projection. Database/event log mới là nguồn sự thật.
- Forum ranking đã bỏ cột không tồn tại `trust_votes`, dùng aggregate vote expression và tie-break deterministic.

### Experts

- Đã thêm workflow server-owned: profile application → identity review → quiz eligible → quiz in progress → domain review → active/rejected/appealed.
- Quiz có version, câu hỏi server-side, CSPRNG shuffle, deadline server, attempt limit, resume, idempotent answer upsert và chấm điểm server-side. Answer key không gửi xuống client.
- UI hiển thị từng câu, trạng thái thời hạn và kết quả review; client không thể tự ghi verified, domain grant hoặc activation. AI chỉ là trợ lý, human review là authority.

### Labbe

- Đã thêm `DISABLED → SHADOW → STAGING → CONTROLLED` mode gate.
- Trust chỉ phát minimal decision signal sau commit; payload có schema version, SHA-256 hash, workload bearer, idempotency key và không chứa raw input.
- Outbox dùng transaction cùng Trust case, lease, `FOR UPDATE SKIP LOCKED`, retry/backoff và admin drain route. Writeback từ Labbe về StudentHub bị khóa.

### Báo cáo bền vững

- Đã thêm report vertical slice cho Trust: snapshot nhất quán theo `caseRevision`, artifact JSON có SHA-256, lifecycle event `REQUESTED → SNAPSHOTTING → GENERATING → VALIDATING → READY`, owner scope và idempotency.
- API đã có `POST/GET /api/v1/reports` và `GET /api/v1/reports/{reportId}`; route đi qua Security Fabric, không cho anonymous, không trả raw input và chỉ đọc artifact sau khi kiểm tra owner.
- Migration `202609060004_reports.sql` tạo private `report_jobs`, `report_artifacts`, `report_job_events` với RLS/grant service-only. Export worker/PDF, TTL link, access audit và các report Expert/Community/AI/Ops vẫn thuộc M7.

### Database và readiness

- Đã áp dụng local PostgreSQL migrations:
  - `202609060001_expert_qualification.sql`
  - `202609060002_integration_outbox.sql`
  - `202609060003_trust_runs_revisions.sql`
  - `202609060004_reports.sql`
- Readiness tách `liveness`, `platformReadiness`, `capabilityReadiness` và `runStatus`; process-local realtime được báo `DEGRADED` và `authoritative: false`, không che thành production cluster capability.
- RLS live proof kiểm tra anonymous, cross-user, service-only authority, expert qualification và Trust revision ownership/append-only behavior.

## Bằng chứng kiểm chứng

| Gate | Kết quả |
|---|---:|
| Trust V5 sequential/high assurance | 64/64 pass |
| Security Fabric integration/attack simulation | 18/18 pass |
| Trust persistence, expert, Labbe, realtime, forum contracts | 11/11 pass |
| Phase 2 live PostgreSQL persistence/idempotency | 1/1 pass |
| Phase 3 live PostgreSQL/RLS | 8/8 pass |
| Phase 2 report snapshot/idempotency live gate | 1/1 pass |
| Core contract suite (Trust/Security/Expert/Labbe/Realtime/Forum/Report) | 94/94 pass |
| Report migration contract | 1/1 pass |
| Trust UI Chromium E2E | 1/1 pass |
| Frontend lint | pass, 0 errors; warnings hiện hữu được giữ nguyên |
| Frontend production build | pass, 135/135 static pages/routes |

## Những capability chưa được tuyên bố hoàn tất

- Chưa bật Labbe remote vì môi trường hiện tại đang `DISABLED`; cần cấp base URL và workload token để chạy STAGING/CONTROLLED. Không có writeback.
- Realtime hiện là process-local SSE fallback, chưa phải authoritative multi-instance transport. Cần thay bằng private channel/broker dùng chung và chạy fan-out/load test.
- Chưa retrain/promote model mới. Audit đã phát hiện exact duplicate cao trong corpus; cần provenance, near-duplicate/campaign clustering, label adjudication, holdout và evaluation artifact trước khi train tiếp.
- 3D chỉ là read-only projection có fallback; chưa được dùng làm authority hay blocking path.
- Chưa có bằng chứng production provider, clean-database restore, session restart, cross-browser field CWV, cluster load, soak, failure injection hoặc deployment.

## Handoff tiếp theo

1. Cấp môi trường staging và workload identity cho Labbe, sau đó chạy contract + delivery + retry + duplicate event drill.
2. Đưa Trust job/outbox/realtime sang worker/broker dùng chung, chạy burst, reconnect, slow consumer, DB/provider outage và multi-instance tests.
3. Hoàn thiện dataset registry/annotation/evaluation artifacts rồi mới quyết định challenger model.
4. Mở rộng report từ Trust snapshot sang Expert/Community/AI/Ops, sau đó tách export worker/PDF và access audit khi đã có queue/worker observability.
