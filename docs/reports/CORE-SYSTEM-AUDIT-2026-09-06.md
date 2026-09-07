# Kiểm tra lõi StudentHub AI × Labbe

Ngày kiểm tra: **06/09/2026**, múi giờ Asia/Bangkok; các HTTP probe ghi nhận lúc khoảng 15:06. Phạm vi được người dùng xác nhận: **kiểm tra, lập kiến trúc và báo cáo trước; chưa sửa code**. Labbe là dự án tại `C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe`, tên trong source là GOVSEC Citadel.

**Kết luận: đã có nền tảng lõi có thể phát triển tiếp, nhưng chưa đủ bằng chứng để công bố vận hành đầy đủ hoặc chịu tải lớn.** Đã kết nối được PostgreSQL thật, chạy qua 64 kiểm thử Trust và 28 kiểm thử tích hợp Labbe bằng fixture. Đồng thời phát hiện lỗi diễn đàn đang xảy ra, realtime chung chứa số liệu mô phỏng, luồng chuyên gia chưa nối thành quy trình hồ sơ–quiz–thẩm định, và benchmark AI thiếu bằng chứng đo tương ứng.

Trong lượt này chỉ tạo tài liệu và bằng chứng kiểm tra. Không sửa ứng dụng, migration, cấu hình hay model; không huấn luyện, triển khai, phát sự kiện broadcast thử hoặc ghi dữ liệu nghiệp vụ vào PostgreSQL. Kiểm thử Labbe dùng SQLite tạm do fixture tạo.

Đọc tiếp [kiến trúc và kế hoạch triển khai](C:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/architecture/CORE-SYSTEM-MASTERPLAN-2026-09-06.md). [Bằng chứng có cấu trúc](C:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/core-audit-2026-09-06/evidence.json) kèm hash source giúp đối chiếu khi code thay đổi. Working tree của cả hai dự án đã có nhiều thay đổi từ trước; đây là kiểm tra snapshot hiện tại, không phải chứng nhận một bản phát hành đã khóa commit.

## 1. Những gì đã xác nhận trực tiếp

| Kiểm tra | Kết quả quan sát | Giới hạn của bằng chứng |
|---|---|---|
| PostgreSQL từ cấu hình local của frontend | Kết nối được PostgreSQL **17.6**; các bảng Trust, expert, forum, session, audit và Passport hiện diện | Giao dịch chỉ đọc; chưa chứng minh ghi đồng thời, migration trên DB sạch, failover hoặc RLS xuyên người dùng |
| RLS của 12 bảng lõi được kiểm tra | Cả 12 bật RLS; role kết nối có `rolbypassrls=true`, `rolsuper=false` | Không được coi cờ bật RLS là bằng chứng rằng các query của role này bị RLS chặn |
| `GET /api/health/ready` trên local port 3000 | HTTP 200, `READY` | `liveProviders.configured=false`, `required=false`; không kiểm chứng AI/reputation ngoài hệ thống |
| `GET /trust` | HTTP 200; HTML có nhãn cố định `12ms LATENCY` | Chưa đo latency pipeline hoặc kiểm tra thị giác trên thiết bị trong lượt này |
| `GET /api/v1/experts` | HTTP 200, 6 hồ sơ, một hồ sơ trả `VERIFIED_EXPERT`, không có provenance ở top level | Không xác minh bằng cấp/danh tính; source đọc ExpertStore có dữ liệu seed |
| `GET /api/forum/posts` mặc định | **HTTP 500**, `INTERNAL_SERVER_ERROR` | Lỗi được tái hiện một lần ở API và khoanh vùng tiếp bằng truy vấn chỉ đọc |
| Repository forum với `sortBy=ranking` | **SQLSTATE 42703**, `column "trust_votes" does not exist` | Nhánh `newest` và `likes` chạy được; không kiểm tra hành vi ghi |
| Hai file kiểm thử Trust hiện có | **64 pass, 0 fail, 0 skip** | Kiểm tra contract/policy bằng fixture; không phải benchmark mô hình hoặc load test |
| Ba file kiểm thử Labbe hiện có | **28 pass** | In-process TestClient + SQLite tạm; không phải kết nối StudentHub↔Labbe qua mạng thật |

Các phép đo HTTP là probe đơn lẻ trên máy phát triển. Không dùng chúng làm p95/p99 hoặc SLA. API đang chạy có thể dùng cấu hình tiến trình khác shell kiểm tra; kết luận PostgreSQL ở trên áp dụng cho kết nối nạp `frontend/.env.local`.

## 2. Phát hiện theo thứ tự ưu tiên

P0 = cần xử lý trước khi mở rộng việc sử dụng luồng liên quan. P1 = chặn hoàn thiện lõi hoặc công bố sẵn sàng. P2 = cần làm để vận hành rõ ràng và bền vững. Đây là mức ưu tiên kỹ thuật, không phải điểm CVSS.

| ID | Mức | Phát hiện và tác động | Bằng chứng | Hướng xử lý đề xuất |
|---|---|---|---|---|
| CORE-01 | P0 | Route broadcast nhận `channel`, `eventType`, `data` rồi phát trực tiếp; stream cho chọn kênh/`all`. Không thấy kiểm tra principal, quyền kênh hoặc giới hạn payload ở hai handler. Proxy chỉ thêm headers. Người gọi route có thể tự tạo sự kiện realtime nếu route được truy cập. | [broadcast](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/realtime/broadcast/route.js:9), [stream](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/realtime/stream/route.js:10), [proxy](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/proxy.js:8) | Chuyển sự kiện nghiệp vụ sang server producer đã xác thực; kiểm tra quyền theo case/topic; schema allowlist, quota, giới hạn kích thước. Không đưa dữ liệu riêng tư vào hub hiện tại. |
| CORE-02 | P1 | RealtimeHub khởi tạo 1.842 người dùng, F1, latency; ticker tự thay đổi số và phát kết quả audit mẫu bằng `Math.random`. Hero hiển thị “ACTIVE”, `12ms` và số lượng nguồn/người đóng góp cố định. Không thể dùng đây làm telemetry thực. | [hub](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/realtime/RealtimeHub.js:11), [ticker](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/realtime/RealtimeHub.js:137), [hero](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/trust/TrustWorkspaceClient.jsx:21) | Số liệu phải có nguồn đo và cửa sổ thời gian; thiếu đo trả “chưa có dữ liệu”; fixture chỉ ở chế độ demo có nhãn. |
| CORE-03 | P1 | Diễn đàn mặc định lỗi 500. `ORDER BY (trust_votes-distrust_votes)` dùng alias đầu ra bên trong biểu thức; PostgreSQL báo không có cột. | [repository](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/forum/PostgresForumRepository.js:35), probe SQLSTATE 42703 | Đưa phép tổng hợp vào subquery/CTE hoặc tính biểu thức aggregate hợp lệ; thêm kiểm thử tích hợp cho đủ ba kiểu sắp xếp. |
| CORE-04 | P1 | Bình luận/phản ứng qua `PATCH /api/forum/posts` trả 503 khi không dùng memory adapter. CommunityRepository có phương thức ghi nhưng không thấy caller production của repository này trong `frontend/src`. | [route](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/forum/posts/route.js:218), [repository](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/database/CommunityRepository.js:48) | Hợp nhất API với PostgreSQL và sự kiện sau commit; kiểm tra đăng bình luận, sửa/xóa, vote, retry, người dùng mất quyền. |
| CORE-05 | P1 | Expert và community intelligence dùng `Map` + file JSON cùng dữ liệu seed. API v1 experts đọc ExpertStore; ExpertRepository không được nối vào đường API đang kiểm tra. Chưa thấy quiz bank/attempt/grading API hoặc schema chuyên gia tương ứng. | [ExpertStore](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertStore.js:22), [API](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/v1/experts/route.js:11), [CommunityStore](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityStore.js:20) | Xây luồng hồ sơ–xác minh–quiz–cấp phạm vi–nhận case–phản biện bằng DB; tách seed khỏi xác minh người thật. |
| CORE-06 | P1 | Trust stream phát `PIPELINE_COMPLETED` và đóng kết nối trước khi chờ lưu DB. Kết quả của `recordTrustExecution` bị bỏ qua, gồm caseId/passportId; lỗi lưu chỉ log. Phân tích xong chưa bảo đảm lịch sử đã lưu. | [route Trust](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/v1/trust/route.js:65) | Ghi job trước khi nhận; công bố `PERSISTED`/`PERSIST_FAILED` tách biệt; trả định danh lưu thật; worker chịu trách nhiệm hoàn tất và phục hồi. |
| CORE-07 | P1 | Idempotency hiện tìm case theo hash nội dung rồi xử lý riêng. Hash lower-case toàn input, chưa khóa đồng thời, chưa gắn policy/model/metadata; query tìm case không có giới hạn “recent” như comment. Retry có thể trùng hoặc lấy kết quả cũ không đúng ngữ cảnh. | [service](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/database/TrustPersistenceService.js:49), [query](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/database/DurableTrustRepository.js:281) | Khóa duy nhất `(owner, operation, idempotency_key)`; đối chiếu digest input chuẩn hóa đúng loại, metadata và version; khác payload trả conflict. |
| CORE-08 | P1 | Repository expert upsert assessment rồi luôn cộng reputation +1, không cùng transaction. Gọi lại cùng assessment vẫn có thể tăng điểm; việc xác minh domain và ghi assessment cũng tách query. Đây là rủi ro trước khi nối repository vào API. | [assessment](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/database/ExpertRepository.js:71) | Assessment immutable theo revision, kiểm tra assignment/domain/COI tại transaction; reputation chỉ ghi một lần khi outcome được chấp nhận, có unique event và khả năng đảo điều chỉnh. |
| CORE-09 | P1 | Role DB hiện có quyền `BYPASSRLS`. Repository dùng pool này nên kiểm tra owner/scopes tại server là ranh giới thiết yếu; chưa thực hiện ma trận người A/người B trong lượt kiểm tra. | Probe catalog và [pool](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/database/PostgresPool.js:15) | Tách runtime role ít quyền khỏi role quản trị; thiết kế context transaction và chạy quyền âm tính trên DB sạch. Không chỉ thêm cờ FORCE RLS. |
| CORE-10 | P1 | Trainer ghi cố định `verdictAccuracy: "100.0%"`, `f1Score: 0.998`, `inferenceLatencyMs: 1.15`. Registry công bố các metric khác nhưng chưa nối được một run đo tái lập với artifact đang phục vụ. | [trainer](C:/Users/Duy/Projects/MyProj/StudentHub-AI/ai/trainer/train_multilabel_model.mjs:454), [registry](C:/Users/Duy/Projects/MyProj/StudentHub-AI/ai/models/model_registry.json:1), [TEVV contract](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/tests/evaluation/tevv_scientific_benchmarks.test.mjs:31) | Sinh metric từ prediction trên holdout có hash; lưu seed/config/model/data/code; cấm nhập metric bằng tay vào báo cáo đánh giá. |
| CORE-11 | P1 | Dataset trùng nhiều; L2C đang là rule baseline và tự khai `NO_VERIFIED_TRAINING_DATASET`, chưa calibrated. Thêm vòng lặp train chưa giải quyết chất lượng dữ liệu hoặc kết nối model vào runtime. | Kiểm kê ở mục 4; [L2C](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/v5/l2c/StudentDomainRiskModel.js:265) | Làm corpus có nguồn, nhãn chuyên gia, split theo campaign/thời gian; đánh giá từng task trước khi thay baseline. |
| CORE-12 | P1 | RealtimeHub/history, rate limiter và bulkhead ở memory từng process. Trust stream gắn với request và không có event log/replay cursor bền vững trong luồng này. Chưa có bằng chứng nhiều replica, mất mạng hoặc restart giữ đủ sự kiện. | [hub](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/realtime/RealtimeHub.js:185), [rate limiter](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/security/hardening/RateLimiter.js:12), [bulkhead](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/providers/Bulkhead.js:9) | Job/event/outbox trong DB, stream đọc projection sau commit, quota toàn hệ thống và kiểm thử quá tải/phục hồi. |
| CORE-13 | P2 | Trang Trust render đầy đủ bảy card, mỗi card nhiều trường, rồi nối verdict/evidence/timeline/graph/passport; chọn xem một stage chưa tồn tại. | [timeline](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/trust/TrustPipelineTimeline.jsx:60), [result stack](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/trust/AiTrustStudioView.jsx:569) | Thanh chọn stage + một vùng nội dung, tự theo stage đang chạy tới khi người dùng chủ động xem lịch sử. |
| CORE-14 | P2 | Readiness hiện có thể READY dù provider ngoài chưa cấu hình; vài check chỉ dựa vào có giá trị cấu hình. | [readiness](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/server/health/readiness.js:28), HTTP probe | Tách liveness, nền tảng sẵn sàng, capability readiness và trạng thái từng run; hiển thị phần phụ thuộc bị giảm chức năng. |

CORE-01 là kết luận từ source, không phải một cuộc thử phát sự kiện trái phép trên hệ thống đang chạy. CORE-08 chưa được khai thác trên dữ liệu thật. Các mục này vẫn cần được khắc phục trước khi nối thêm dữ liệu hoặc mở luồng sản phẩm.

PostgreSQL quy định role có `BYPASSRLS` bỏ qua RLS; `FORCE ROW LEVEL SECURITY` xử lý ngoại lệ chủ bảng, không thay thế việc tách role này. Vì vậy “12 bảng bật RLS” và “runtime bị RLS giới hạn” là hai kiểm chứng khác nhau. [Tài liệu PostgreSQL 17](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

## 3. Phần lõi nên giữ và phát triển tiếp

**Trust V5 đã có cấu trúc đáng giữ:** bảy stage riêng, typed operation status, signal/evidence envelope, thứ tự xử lý, hủy run cũ, retry giới hạn, chính sách giữ tín hiệu nguy hiểm và L5 chỉ được hạ mức bảo đảm. 64 kiểm thử vừa chạy bao gồm provider timeout, prompt injection, nguồn trùng, evidence thiếu/cũ, không đổi `NO_KNOWN_THREAT` thành safe và phản hồi run cũ. [Orchestrator](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/v5/TrustPipelineOrchestrator.js:120), [contract](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/v5/contracts.js:29).

**Database không cần làm lại từ đầu:** đã có profile, session, posts/comments/votes, case/input/entity/evidence/claim, expert profile/domain/assessment, audit và Passport. DurableTrustRepository có transaction khi ghi một bộ case; cần nối kết quả commit vào response, bổ sung job/event/idempotency và làm quyền đúng trên các caller. [Migration nền](C:/Users/Duy/Projects/MyProj/StudentHub-AI/database/migrations/202608270001_v2_authority_foundation.sql:93).

**Provider gateway đã có cơ chế hữu ích:** timeout, bounded retry, circuit breaker, bulkhead và redactor. Cần kiểm kê adapter thực sự được route sử dụng, đo ngân sách dùng chung và worker cancellation; không đồng nhất việc có lớp Gateway với mọi provider đã được nối. L2B mặc định deterministic khi không có opt-in; L3 mặc định KnowledgeBaseRetriever; L4 policy tất định, narrative AI là tùy chọn. [L2B](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/layer2/Layer2SemanticService.js:119), [L3](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js:258), [L4](C:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/layer4/Layer4TrustService.js:63).

## 4. Kiểm kê AI và dữ liệu huấn luyện

Đếm trên file hiện có bằng quy tắc `trim → Unicode NFC → lowercase` của trường text. Chỉ đo trùng khớp chính xác sau chuẩn hóa, chưa tính near-duplicate, nhãn mâu thuẫn hoặc dữ liệu rò giữa campaign.

| Dataset | Tổng dòng | Text khác nhau | Dòng trùng dư | Tỷ lệ trùng dư |
|---|---:|---:|---:|---:|
| `scam_knowledge_dataset.json` | 6.982 | 3.231 | 3.751 | 53,72% |
| `multilabel_scam_dataset.json` | 23.455 | 2.784 | 20.671 | 88,13% |

Artifact multi-label đang lưu ghi `trainingSamplesCount=5695`, khác số dòng dataset hiện tại; chưa thấy liên kết bằng dataset hash chứng minh artifact đó được train trên snapshot nào. Đây có thể là artifact cũ sau khi dataset thay đổi, không phải bằng chứng đã train toàn bộ dữ liệu mới.

L2C trong Trust V5 công bố đúng giới hạn: rule baseline, không fine-tuned, `calibratedRisk=null`. Cần giữ tính trung thực này. Bộ model neural ở thư mục AI không tự động thay thế L2C chỉ vì cùng được gọi là “Trust Model”.

Các trainer đã đọc dùng augmentation/khởi tạo/shuffle ngẫu nhiên không có seed cố định trong những đường xử lý đó; không thấy quy trình locked holdout tương ứng trước khi xuất metric cố định. Tăng epochs trên tập lặp không chứng minh phát hiện campaign mới. Chưa chạy train, chưa đo lại F1 và chưa kiểm toán nguồn/quyền sử dụng từng sample trong lượt này.

## 5. Labbe có thể đóng vai trò gì

Labbe là **dịch vụ giám sát và bảo đảm an ninh** có FastAPI, mô hình identity/policy, event inbox/outbox, worker, detection, correlation, alert/incident và các kiểm thử. Không phải một model AI đã train để tự đánh giá mọi người dùng.

| Khả năng hiện có ở Labbe | Bằng chứng | Cách dùng trong kiến trúc đề xuất |
|---|---|---|
| Nhận StudentHub security events có workload identity, scope, classification và kiểm tra hash | [API nhận](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/app/main.py:2621) | StudentHub outbox gửi event tối thiểu, có retry/idempotency |
| Assurance chỉ đọc theo case, trả reason codes và refs | [DTO](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/app/main.py:381), [API đọc](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/app/main.py:2844) | Bổ sung mục “Tình trạng xử lý và an ninh” khi người dùng có quyền |
| Chế độ DISABLED / SHADOW / STAGING_I5 | [I5 contract](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/docs/security/STUDENTHUB_I5_W09.md:1) | Chạy shadow trước; không tự bật phản ứng khi mới kết nối |
| Worker claim/lease/fencing, retry và dead letter | [worker](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/app/security_worker.py:40) | Tái sử dụng ý tưởng contract và test; vẫn tách DB và quyền hai hệ thống |
| AI analyst assistance có deterministic fallback | [fallback contract](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/docs/security/AI_ASSISTANCE_FALLBACK_V1.md:1) | AI giải thích dữ liệu đã được phân quyền; không tự sửa policy hoặc thi hành response |

28 kiểm thử hiện tại xác nhận các contract local như duplicate/conflict, scope, shadow và không write-back. Chưa tìm thấy transport/caller Citadel trong `StudentHub/frontend/src` hoặc `StudentHub/scripts` qua tìm kiếm tên Citadel/GOVSEC/Labbe và event contract; do đó **chưa xác nhận tích hợp hai runtime thực sự hoạt động**. Source phía nhận và việc gọi từ phía gửi là hai hạng mục riêng.

Sự kiện phát hiện một URL lừa đảo là kết quả nghiệp vụ Trust; không tự động biến thành sự cố hạ tầng. Labbe hiện đã thể hiện ranh giới này trong [I5 engine](C:/Users/Duy/OneDrive/Documents/ChatGPT/labbe/app/integration_i5.py:75).

## 6. Quy mô và giao diện 3D

Chưa chạy stress, soak, burst, reconnect storm, kill worker, phục hồi DB hoặc model failure qua nhiều instance trong lượt này. Không có bằng chứng đủ để ghi “chịu mọi tải”, “realtime cực mạnh”, “không bottleneck” hoặc “AI chuyên gia toàn năng”. Kế hoạch đi kèm đặt ngân sách tải, công thức và từng gate để biến các mong muốn này thành kết quả đo được.

3D phù hợp làm bản đồ case/evidence và trạng thái hệ thống lấy từ telemetry thật. Các luồng submit, lưu dữ liệu, xác minh và quản lý quyền phải hoạt động hoàn chỉnh khi WebGL bị tắt. Không dùng animation làm tiến độ xử lý hoặc khả năng của backend.

## 7. Bằng chứng và cách chạy lại

- [Trust contract output](C:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/core-audit-2026-09-06/trust-contract-tests.txt): hai file `trust_engine_v5_sequential.test.mjs`, `trust_engine_high_assurance.test.mjs`, Node 24.19.0, 64 pass.
- [Labbe integration output](C:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/core-audit-2026-09-06/labbe-integration-tests.txt): `test_studenthub_i5_staging.py`, `test_studenthub_inbox.py`, `test_studenthub_assurance_api.py`, 28 pass; có một cảnh báo dependency TestClient.
- [Evidence manifest](C:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/core-audit-2026-09-06/evidence.json): status của probe, cấu hình chỉ ở mức có/không, thống kê duplicate và SHA-256 source. Không chứa secret, hostname DB hoặc bản ghi người dùng.

Lệnh Trust: chạy Node 24 với `--test --test-reporter=spec` và hai đường dẫn test trên từ StudentHub root. Lệnh Labbe: Python trong `.venv`, `-m pytest -p no:cacheprovider` với ba file trên và `-q`. Không chạy các test “live gate” đang chọn người dùng thật từ DB trong giai đoạn audit chỉ đọc này.

Shell mặc định tìm `D:/SQL2022/node.exe` trước và `node --version` thoát 1 không có output. Các kiểm thử ở báo cáo dùng Node 24.19.0 tại `C:/Users/Duy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`; đây là chi tiết cần giữ để tái lập kết quả, chưa sửa PATH.

**Điểm bắt đầu triển khai đề xuất:** CORE-01/02/03, sau đó hoàn thiện trạng thái lưu case và màn hình một stage. Tiếp theo mới nối expert quiz, forum realtime và Labbe qua event bền vững; nâng AI theo các gate dữ liệu/đánh giá riêng trong kế hoạch.
