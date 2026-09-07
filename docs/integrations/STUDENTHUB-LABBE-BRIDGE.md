# StudentHub AI ↔ Labbe bridge

Bridge này chỉ gửi một Trust decision signal tối thiểu từ StudentHub AI sang
Labbe. Labbe độc lập về database, identity và policy; StudentHub không đọc
ngược assurance để tự đổi verdict và không hỗ trợ writeback.

## Mode

| Mode | Network | Outbox | Mục đích |
|---|---|---|---|
| `DISABLED` | không | không | mặc định an toàn |
| `SHADOW` | không | có | canonical event + hash, lease/retry/idempotency drill, không có side effect |
| `STAGING` | HTTPS có | có | receiver staging và retry/idempotency drill |
| `CONTROLLED` | không trong pass này | không trong pass này | được nhận diện nhưng bị khóa |

## Environment

```text
STUDENTHUB_LABBE_MODE=DISABLED
STUDENTHUB_LABBE_BASE_URL=https://labbe.example.internal
STUDENTHUB_LABBE_TOKEN=<workload-token>
STUDENTHUB_LABBE_SCOPE=labbe.events.ingest
STUDENTHUB_LABBE_CLASSIFICATION=INTERNAL
```

`STUDENTHUB_LABBE_BASE_URL` và token chỉ cần khi chuyển sang `STAGING` hoặc
`CONTROLLED`; `STUDENTHUB_LABBE_SCOPE` cũng bắt buộc cho remote staging.
Remote delivery luôn yêu cầu HTTPS, không chấp nhận userinfo/query/fragment
trong base URL, và dùng TLS verification mặc định của Node. Không đưa token
hoặc scope secret vào client bundle, realtime event, report snapshot hay log.

## Contract

StudentHub gửi `POST /api/v1/integrations/studenthub/events` với:

- `event_type: security.studenthub.trust_decision.v1`;
- `schema_version: studenthub-security-event-v1`;
- `event_id`, `correlation_id`, `causation_id`, `subject`;
- `case_id`, `case_revision`, `run_id`, `pipeline_status`, `security`, `truth`, `action`;
- `payload_hash` SHA-256 của canonical payload.

Payload là allowlist đúng bảy field ở trên; field ngoài allowlist bị reject
trước network. Raw screenshot, OCR text, URL content, raw/private evidence,
provider token, session token và credentials không nằm trong payload. Outbox lưu
event trước; delivery có lease token, retry/backoff và idempotency key. Có thể
drain thủ công bằng route admin:
`POST /api/v1/integrations/labbe`.

`SHADOW` worker vẫn claim lease thật và chuyển row sang `SHADOW` với
`shadow_count`, nhưng không gọi network và không tăng delivery `attempts`.
Rows `SHADOW` được staging worker nhận để catch-up khi mode được chuyển có chủ
đích sang `STAGING`. `CONFLICT` là trạng thái terminal cho cùng `event_id` với
hash khác; `IN_FLIGHT` update phải khớp `lease_token` để worker hết hạn không
ghi đè worker mới.

## Authority boundary

Labbe chỉ được observe/detect/correlate/assure. Bridge không có callback hoặc
writeback route để đổi Trust verdict, activate/revoke expert, moderate
Community hay ban user. `writeback` luôn là `DISABLED`.

Read-only assurance projection chỉ nhận observation sau authorization rõ ràng
với permission `ADMIN.SECURITY` và freshness window 5 phút. Kết quả chỉ có
`CURRENT`, `STALE` hoặc `UNAVAILABLE`; nó không chứa và không mutate Trust
verdict.

Canonical JSON/hash golden vectors dùng chung nằm tại
`docs/integrations/labbe-canonical-json-vectors.json`; Python reference verifier
ở `scripts/labbe_reference/canonical_json.py` dùng UTF-8, sorted object keys,
arrays giữ thứ tự, và ECMAScript-compatible number spelling.

## Release gate

Chỉ chuyển mode sau khi receiver staging xác nhận schema/hash/idempotency,
duplicate delivery không tạo hiệu ứng lần hai, timeout/retry không làm mất
event, TLS/workload token/scope/classification hợp lệ, wrong token/scope bị
chặn, receiver outage/catch-up hoạt động, và readiness/observability cho thấy
outbox không tăng không kiểm soát. Không claim production readiness từ bridge
này.
