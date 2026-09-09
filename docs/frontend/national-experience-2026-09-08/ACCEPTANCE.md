# Kế hoạch nghiệm thu và bằng chứng

Ngày: 08/09/2026 · Trạng thái các test bên dưới: `PLANNED_NOT_RUN`.

## 1. Quy tắc evidence

Yêu cầu trong [SPEC](SPEC.md) không tự trở thành PASS. Mỗi run phải có: requirement/test IDs, UTC và timezone, commit + dirty digest nếu có, environment, data/fixture hash, browser/device/network, mode, command, outcome, artifacts đã giảm nhạy cảm và người review.

Kết quả hợp lệ: `PASS`, `FAIL`, `BLOCKED_BY_ENV`, `NOT_TESTED`, `NOT_APPLICABLE_WITH_REASON`. Không cộng skip/blocked vào pass; không dùng report khác commit làm bằng chứng mới. Check schema/string trong code không thay kiểm thử hành vi.

Quy tắc đóng gate: tất cả điều kiện bắt buộc có evidence; lỗi không được giải quyết bằng cách xóa test. Khi scope giảm hợp lệ, ghi lý do, cập nhật spec/coverage và thay test theo hành vi đích.

## 2. Traceability và test matrix

| Gate / test | Requirement | Phép thử có ý nghĩa | Bằng chứng cần lưu |
| --- | --- | --- | --- |
| G-EVENT / T-01 | SCOPE-01 + COMPETITION-FIT | So tên/bảng/độ tuổi/deadline/prebuilt/tool disclosure với đúng thể lệ | URL/PDF/version, checklist eligibility, mục chưa xác nhận |
| G-SCOPE / T-02 | SCOPE-01, IA-01 | Crawl navigation, footer, search, command palette, mobile menu, deep links; kiểm tra không quảng bá course | Route/link inventory; screenshot; network trace không course chunk |
| G-TYPE / T-03 | TYP-01/02/03 | Render proof Việt, NFC/NFD, long names, actual fonts/weights, fallback, 200% resize | Font/request map, screenshots 320/390/768/1440, lỗi clipping |
| G-VISUAL / T-04 | COL-01, LAY-01/02, HERO-01, ART-01 | Chấm hai static proof cùng copy; kiểm tra focus, CTA, stable background | Score sheet có reviewer; contrast cặp/state thực, layer inventory |
| G-MOTION / T-05 | HERO-02, MED-01/02, A11Y-03 | Autoplay deny, reduced-motion từ trước/sau mount, Pause, storage fail, hidden/offscreen, codec error, context lost | Media requests, pause state, frame/CPU trace và static fallback |
| G-UI / T-06 | STATE-01, AUTH-04, DATA-04 | Invalid/running/partial/unknown/conflict/save fail/offline/auth/429/late run | Screenshot + response mode/run/revision; không mất draft mới |
| G-AUTH / T-07 | AUTH-01, SEC-01 | Guest/A/B/reviewer/admin với read/list/mutation/export; logout/revocation; client-forged owner/role | Request/response redacted; denied operation không đổi DB |
| G-RLS / T-08 | SEC-02/03, DATA-02/03 | Hai synthetic tenants/owners trên DB/storage test; thử effective role và đường bypass; upload/download scope | Role/policy evidence không chứa secret; negative access matrix |
| G-CORE / T-09 | BE-01/02, DATA-01/04 | Submit → analysis → commit → readback; inject rollback trước commit; private report theo revision | Case/run/revision, row counts, persisted flag, transaction outcome |
| G-IDEMPOTENCY / T-10 | BE-03, BE-04 | Concurrent same key/digest; same key/different digest; late response và retry | Một hiệu ứng business; conflict rõ; exact IDs/digests |
| G-RECOVERY / T-11 | REL-01 | Kill worker trước/sau commit, lease expiry, stale worker completion, retry exhaustion, restart | Lease/fencing/attempt log, final rows và orphan/duplicate counts |
| G-REALTIME / T-12 | REL-02 | Hai instance, cursor reconnect, private event trên public-named channel, slow consumer, gap/replay | Sequence continuity, authorized recipients, lag/drop/replay evidence |
| G-DOMAIN / T-13 | AUTH-02/03, COM-01, EXP-01 | Community vote không đổi verdict; expert thiếu scope/COI bị chặn; assessment replay không tăng reputation | Revision/actor evidence và counterexample |
| G-AI-DATA / T-14 | AI-01 | Exact/near dedupe, campaign/time split audit, label disagreements/adjudication | Data card, split/hash manifest; danh sách leakage cluster đã xử lý |
| G-AI / T-15 | AI-02/03 | Baseline/ablation/full trên cùng holdout; count false reassurance/coverage/quality/cost | Predictions, labels, denominators, CI, model/prompt/data/code hashes |
| G-LABBE / T-16 | LAB-01/02 | Shadow mode, minimization, Node/Python vectors, dedup/conflict, timeout-after-commit, assurance permissions/freshness | Mode, IDs/hash, outbox/attempts; không có unauthorized writeback |
| G-LABBE-LIVE / T-17 | LAB-01/02 | HTTPS TLS/token/scope/classification; wrong token/scope; outage/catch-up | Chỉ chạy staging do dự án sở hữu; receipt và recovery; môi trường thiếu → BLOCKED |
| G-PERF / T-18 | PERF-01, A11Y-01/02 | Cold load ≥5 lần; raw JS/font/media budgets; keyboard, zoom/reflow, AT/device | Median/worst/profile, screenshots và manual checks; TBT không thay INP |
| G-OPS / T-19 | PERF-02, OPS-01 | Load profile và backpressure; DB/provider outage; restart/restore theo runbook | p50/p95, errors, admission rejects, queue age, recovery time, cost |
| G-USER / T-20 | IA-01, STATE-01, TYP-02 | Người dùng tìm điểm vào, đọc source, nhận ra uncertainty, phục hồi lỗi | Task success/time, lỗi hiểu, quote có consent, giới hạn mẫu |
| G-PACK / T-21 | DATA-01/03, AI-03 + COMPETITION-FIT | Đối chiếu claim từng slide/README/report với artifact đúng candidate | Claim ledger, disclosure, package hashes, demo recording |

T-01…T-21 là **ID test đề xuất**, không phải tên testfile đã tồn tại hoặc số bài đã pass.

## 3. Golden flow tối thiểu

Tình huống thử: một lời mời học bổng có thông tin thời hạn hoặc nguồn chưa khớp. Dữ liệu là public đã được phép hoặc fixture có nhãn, không dùng ảnh chứa số tài khoản/giấy tờ của người thật.

1. Người dùng vào `/trust`, thấy input và giới hạn; gửi một nội dung hợp lệ.
2. Server kiểm tra identity/quyền/giới hạn và phát run status thật. Không lấy thời gian animation làm tiến độ.
3. Kết quả phân tách căn cứ, điều chưa biết, mâu thuẫn và next action. Nếu thiếu nguồn, abstain/partial rõ.
4. User có quyền lưu: case/run/revision được commit; client nhận persisted state thật.
5. Đọc lại bằng session cùng owner trả đúng revision; user B không đọc được. Guest không có durable persistence thì không được claim đã lưu.
6. Restart runtime/worker trong môi trường test; đọc lại và thử retry cùng key vẫn không tạo hiệu ứng lặp.
7. Labbe unavailable không đổi kết luận hoặc làm transaction chờ HTTP; outbox còn event để recovery theo mode.
8. Report/Passport lấy đúng snapshot, không tự trộn evidence mới vào revision cũ.

Demo read-only có thể dùng fixture, nhưng T-09…T-12 cần runtime/DB thực của môi trường test để chứng minh durability.

## 4. Profile tải thử có giới hạn

Chỉ chạy khi có yêu cầu kiểm thử trên tài nguyên được sở hữu. Không load test endpoint của trường, provider công cộng hoặc production. Các mức dưới là **envelope thử ban đầu**, không phải capacity hiện có.

| Profile | Điều kiện đề xuất | Chỉ tiêu theo dõi / mốc xem xét |
| --- | --- | --- |
| L0 smoke | 1 app instance, 1 worker; 20 case tổng, concurrency 2; provider stub có nhãn | Zero duplicate business effect; case đã ack nhận bền vững không mất sau restart |
| L1 mixed | 2 app instances, 250 SSE connections, 5 request/s trong 15 phút; synthetic read/mutation mix và local stub | Non-provider API p95 mục tiêu ≤500ms; event lag p95 ≤2s; report hardware/DB/pool |
| L2 backpressure | Tăng dần admission trong DB test, tối đa giới hạn operator đã đặt | Rejection có 429/Retry-After hoặc typed busy; bounded queue/memory; không OOM |
| L3 outage/recovery | Dừng receiver/worker test 60s; backlog tối đa 500 event | Catch-up mục tiêu ≤120s sau phục hồi nếu worker capacity đủ; zero unauthorized/duplicate effect |
| L4 real provider | Tối đa 20 request được phép, concurrency 1 trước, token/cost cap đã cấu hình | Latency/cost/provider errors riêng; không suy performance model từ stub |

Mục tiêu L1 về error: <1% lỗi 5xx không chủ đích ở request được nhận; báo riêng toàn bộ rejected/timeouts, không giấu chúng để có tỉ lệ đẹp. Stop nếu memory/pool/queue vượt giới hạn đặt trước hoặc hết cost cap. Không dùng L1 để khẳng định phục vụ 250 người dùng nghiệp vụ đồng thời hoặc quy mô toàn quốc.

## 5. AI evaluation và hiệu quả thực tế

- Ghi split trước tuning; dedupe không chỉ theo exact text; lưu source/campaign groups và time boundary.
- Annotation guideline nêu riêng factual validity, source quality, risk và next-action appropriateness; không ép chúng thành một nhãn `safe`.
- Nếu dùng 300 case pilot, công bố số từng nhóm, số abstain, cases bị loại và lý do. Nhóm high-risk ≥100 theo SPEC; không có false reassurance quan sát là điều kiện challenge, không là xác suất lỗi bằng 0.
- Dùng blinded review khi khả thi; task-level paired comparison với baseline trên cùng case. Báo uncertainty theo sample, không dựng con số “AI chính xác 99%”.
- Thử người dùng trả lời: có tìm được bằng chứng đúng hơn/nhanh hơn không; có nhận ra thiếu nguồn không; có hiểu quyền quyết định thuộc về mình không. Không đo impact bằng số page/component.
- Chỉ claim tiết kiệm thời gian nếu có protocol và đo trước/sau hoặc đối chứng, counterbalance thứ tự để giảm learning effect.

## 6. Accessibility và visual review

Viewports: 320, 390, 768, 1024, 1440 CSS px; tiếng Việt có dấu; dark baseline; system font fallback. Test trên Android phổ thông/iPhone thật khi có; không ghi device PASS từ emulation.

Keyboard-only, visible focus, skip link, form errors, dialogs/menus, screen reader ít nhất một môi trường desktop và một mobile khi phù hợp. Axe là một phần kiểm tra, không chứng nhận toàn bộ WCAG. Kiểm tra chủ động reduced-motion/Save-Data/error state và video Pause ở mọi rendition.

Review thẩm mỹ theo rubric PLAN; ảnh current/build phải chụp mới. Snapshot Trust cũ chỉ dùng làm bối cảnh, không là golden baseline bắt buộc giữ nguyên.

## 7. Hồ sơ dự thi và demo

Gói đề xuất: one-page problem/solution; báo cáo kỹ thuật với architecture và authority; evaluation/data/model cards; user pilot; demo video; dependency/license/AI disclosure; README chạy lại; known limitations và evidence manifest. Format/duration cuối cùng phải theo đúng bảng thi.

Kịch bản rehearsal nội bộ 5 phút, điều chỉnh khi thể lệ xác nhận:

| Thời gian | Nội dung | Bằng chứng |
| --- | --- | --- |
| 0:00–0:30 | Vấn đề cụ thể và đối tượng | Một case có nguồn/mode được nói rõ |
| 0:30–1:40 | Trust input → kết quả → source drill-down | Run thật hoặc fixture đã công bố; uncertainty hiện rõ |
| 1:40–2:25 | Community và Expert hỗ trợ trong scope | Không tự đổi verdict; nêu đóng góp từng nguồn |
| 2:25–3:10 | Commit/readback/revision và owner isolation | ID thực trên môi trường test, không số giả |
| 3:10–4:00 | Outage/insufficient evidence/retry | Failure behavior có evidence; không giấu outage |
| 4:00–4:40 | So sánh baseline và bài học từ lỗi | Holdout, denominator, sai số, đóng góp tự làm |
| 4:40–5:00 | Impact/pilot và giới hạn | Điều đã chứng minh và bước mở rộng khả thi |

Không dùng 3 phút đầu để trình diễn landing/video. Khi mất mạng tại buổi thi, chuyển sang bản ghi/fixture có nhãn và nói rõ nguồn; không trình diễn đó như request live.

Prompt library trong PROMPTS không phải Prompt Log lịch sử. Nếu thể lệ cần toàn bộ lịch sử, thu thập từ nguồn thật, kê khai tool/AI assistance và xử lý dữ liệu nhạy cảm theo hướng dẫn BTC; không tự bịa conversation để nộp.

## 8. Các lệnh hiện có để tham chiếu

Các script sau đã được kiểm tra tên trong `package.json`; **chưa chạy trong pass tài liệu này**. Chọn phạm vi và xác nhận live database test không nhắm dữ liệu thật trước khi chạy suite rộng.

```text
npm run lint
npm run build
npm run audit:bundle
npm run test:security
npm run test:phase2-auth
npm run test:labbe
npm run test:all-discovered
```

Các lệnh browser/live staging theo cấu hình repo và môi trường cụ thể. Không thêm env flag, tự chạy migration hoặc bật writeback để biến gate thành PASS.

## 9. Điều kiện đóng theo cấp độ

| Cấp độ | Điều kiện | Điều không được suy ra |
| --- | --- | --- |
| DOCUMENTATION_COMPLETE | Tài liệu/link/ID nhất quán, scope rõ, không claim giả | Code đã thay đổi hoặc test runtime đã pass |
| LOCAL_CORE_VERIFIED | Scope/UI/core/auth/contracts/budgets trên candidate local đạt | Live provider/DB/cluster đã được chứng minh |
| STAGING_CORE_VERIFIED | DB/auth/readback/role/recovery/observability đúng owned staging đạt | Production hoặc scale quốc gia |
| COMPETITION_PACKAGE_REVIEWED | Đúng thể lệ, claim ledger, disclosure và demo được review | Chắc chắn qua vòng hoặc đoạt giải |

Labbe live chỉ bắt buộc với claim live Labbe; khả năng độc lập của Trust là gate bắt buộc dù Labbe bị tắt. Không nâng verdict toàn dự án chỉ vì một nhóm test pass.
