# 🛡️ StudentHub AI — Comprehensive Reality Audit & Zero-Fabrication Protocol

> **Audit Identifier**: `AUDIT-REALITY-2026-08-25`  
> **Status**: Completed Independent Audit  
> **Auditor Role**: Principal AI Systems Architect & Data Acquisition Auditor  
> **Final Reality Verdict**: `PARTIALLY_REAL_DATA_READY` (Deterministic algorithms and static knowledge fixtures verified; live third-party network pipelines classified as manual/fixture-isolated).

---

## 1. Executive Summary & Audit Mandate

Previous reports contained several conceptual overstatements where static knowledge modeling, deterministic algorithms, and UI deep-links were labeled as `CONNECTED` live network data streams.

Under this **Zero-Fabrication Audit**, every claim, source row, confidence metric, and test capability has been re-evaluated against empirical facts:

### ⚠️ Key Deficiencies Identified & Corrected:
1. **Misclassification of `CONNECTED`**:
   - Static knowledge graph registries (e.g., HCMUTE course catalog, NCSC IOC fixtures) were incorrectly labeled as active live network ingest streams.
   - **Correction**: Reclassified into precise lifecycle stages (`DISCOVERED`, `ACCESSIBLE`, `READABLE_STATIC_REGISTRY`, `AUTH_REQUIRED`, `PROGRAMMATIC_ACCESS_UNCONFIRMED`).
2. **Data Modeling Error on Legal Regulations**:
   - Laws were marked as `INDEFINITE` (forever valid).
   - **Correction**: Replaced with temporal bounds (`VALID_FROM: 2017-01-01`, `CURRENT_STATUS: ACTIVE_ENFORCED`, `AMENDED_BY`).
3. **Overstatement of Emergency 112/113/114/115 Integration**:
   - Client-side `tel:` URL protocol was termed "Native Telecom Dispatch Connected".
   - **Correction**: Clarified as `CALL_ACTION_AVAILABLE` with `EMERGENCY_SERVICE_INTEGRATION = NOT_DIRECTLY_CONNECTED`.
4. **Unsubstantiated Threat Intelligence Live API Claims**:
   - `tinnhiemmang.vn` was implied to have an automated live REST API feed.
   - **Correction**: Downgraded to `READABLE_MANUAL_REGISTRY` (NCSC does not provide open unauthenticated bulk REST APIs).
5. **Test Scope Overstatement**:
   - 199 passing tests were presented without clarifying that they are **in-memory unit/engine tests on fixtures**, not live external network integration tests.
   - **Correction**: Clearly separated `PASS_WITH_FIXTURE` (199/199) from `PASS_WITH_LIVE_NETWORK` (0/14).

---

## 2. Re-Calibrated Source Lifecycle Schema

```
[ DISCOVERED ] ──→ [ ACCESSIBLE ] ──→ [ AUTHENTICATED ] ──→ [ READABLE ] ──→ [ INGESTING ] ──→ [ SYNCING ] ──→ [ VERIFIED ] ──→ [ PRODUCTION_READY ]
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
 [ UNAVAILABLE ]   [ ACCESS_LIMITED ]   [ AUTH_REQUIRED ]  [ PROGRAMMATIC_ACCESS_UNCONFIRMED ]
```

---

## 3. Comprehensive Reality Audit Matrix (14 Master Domains)

| Domain | Source / Target | Previous Claimed Status | Verified Reality Status | Real Access Type | Live API Status | Evidence & Reality Notes | Freshness Status | Recalibrated Confidence | Identified Problems / Overstatements |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Academic OS** | `online.hcmute.edu.vn` | `CONNECTED` | `AUTH_REQUIRED` | Web Portal (Session Cookie) | `API_UNAVAILABLE` | Cổng đào tạo yêu cầu xác thực SSO sinh viên, CAPTCHA; hệ thống hiện dùng KG tĩnh. | `STALE_WITHOUT_AUTH` | **0.65** | Gán nhãn `CONNECTED` khi chưa có live authenticated ingest pipeline. |
| **Academic Org** | `daotao.hcmute.edu.vn` | `CONNECTED` | `ACCESSIBLE` | Web Page / Public News | `PROGRAMMATIC_UNCONFIRMED` | Trang tin tức đào tạo công khai; chưa có RSS/JSON endpoint chính thức. | `PERIODIC_MANUAL` | **0.75** | Chưa có webhook tự động cập nhật công văn mới. |
| **Student Affairs** | `ctsv.hcmute.edu.vn` | `CONNECTED` | `ACCESSIBLE` | Web Page / Public Notices | `PROGRAMMATIC_UNCONFIRMED` | Tiếp nhận thông báo học bổng qua web; chưa có cổng API đối soát. | `PERIODIC_MANUAL` | **0.72** | Thiếu crawler tự động ingest văn bản PDF. |
| **Curriculum Graph**| `fit.hcmute.edu.vn` | `CONNECTED` | `READABLE_STATIC_REGISTRY` | Static In-Memory KG | `NONE` | Cây môn học Giải tích, C++ được mô hình hóa trong mã nguồn tĩnh. | `STATIC_CURATED` | **0.90** | Dữ liệu chính xác nhưng lưu tĩnh trong code, không live sync. |
| **Tuition Banking** | BIDV / VietinBank Gateways | `CONNECTED` | `NOT_INTEGRATED` | Listed Institution / Web Info | `API_UNAVAILABLE` | Chưa có hợp đồng cổng thanh toán API với ngân hàng; chỉ là thông tin số tài khoản. | `STATIC_VERIFIED` | **0.60** | Khẳng định "Banking Gateway CONNECTED" là overstatement nghiêm trọng. |
| **Housing Law** | Bộ luật Dân sự 2015 | `CONNECTED (INDEFINITE)` | `READABLE_STATIC_REGISTRY` | Legal Statute Text | `N/A` | Hiệu lực từ 01/01/2017; quy tắc bóc tách hợp đồng đối soát theo Điều 472-482. | `ACTIVE_ENFORCED` | **0.95** | Đã sửa `INDEFINITE` thành `VALID_FROM: 2017-01-01 / ACTIVE`. |
| **Labor Law** | Bộ luật Lao động 2019 | `CONNECTED (INDEFINITE)` | `READABLE_STATIC_REGISTRY` | Legal Statute Text | `N/A` | Hiệu lực từ 01/01/2021; đối soát bẫy giữ CCCD gốc và cọc tiền theo Điều 20. | `ACTIVE_ENFORCED` | **0.95** | Đã sửa `INDEFINITE` thành `VALID_FROM: 2021-01-01 / ACTIVE`. |
| **Power Tariffs** | Thông tư 09/2023/TT-BCT | `CONNECTED (INDEFINITE)` | `READABLE_STATIC_REGISTRY` | Circular Regulation | `N/A` | Quy định biểu giá bán lẻ điện cho người thuê nhà; cập nhật theo chu kỳ Bộ Công Thương. | `ACTIVE_ENFORCED` | **0.95** | Dữ liệu quy chế tĩnh được nhúng vào Engine phân tích. |
| **Geospatial GPS** | Google Maps Platform | `CONNECTED` | `MAP_URL_DEEPLINK_AVAILABLE` | Deep-link / Web URL | `API_KEY_NOT_CONFIGURED` | Mở chỉ đường `maps.google.com/dir` qua trình duyệt; chưa gọi Routes REST API backend. | `CLIENT_SIDE_LIVE` | **0.70** | Gán nhãn "Google Routes API Connected" khi chưa có Server API Key. |
| **Emergency 24/7** | Tổng đài 112, 113, 114, 115| `CONNECTED` | `CALL_ACTION_AVAILABLE` | Client-side `tel:` trigger | `NOT_DIRECTLY_CONNECTED` | Hệ thống chỉ kích hoạt ứng dụng quay số của máy sinh viên; không có API điều phối 112. | `ALWAYS_AVAILABLE` | **0.85** | Tuyên bố "Native Telecom Dispatch Connected" là sai bản chất. |
| **Threat IOCs** | NCSC (`tinnhiemmang.vn`) | `CONNECTED` | `READABLE_MANUAL_REGISTRY` | In-Memory Curated Array | `API_UNAVAILABLE` | Danh sách tên miền độc hại được biên soạn thủ công; NCSC không mở API bulk query. | `MANUAL_UPDATE` | **0.70** | Tuyên bố "Connected Government IOC Feed" là overstatement. |
| **Student Forum** | UTE Thắc Mắc Học Tập | `CONNECTED` | `DISCOVERED / ACCESS_LIMITED` | Public Web Group | `API_UNAVAILABLE` | Diễn đàn công khai trên Facebook; Meta cấm cào tự động không có token ứng dụng. | `UNSYNCHRONIZED` | **0.40** | Dữ liệu mẹo học tập hiện được tổng hợp thủ công, không live stream. |
| **Traffic Cameras** | Cổng TTGT TP.HCM | `INTEGRATION_UNAVAILABLE`| `PUBLIC_VISIBLE / PROG_UNCONF` | Web Image Frame | `API_UNAVAILABLE` | Website hiển thị ảnh snapshot nhưng không cung cấp API mở cho bên thứ 3. | `EXTERNAL_REFRESH`| **0.50** | Đã ghi nhận chính xác không bịa live API camera. |
| **Weather Radar** | Radar Nhà Bè (`nchmf.gov.vn`)| `CONNECTED` | `DISCOVERED / VISUAL_PORTAL` | Web Portal Image | `API_UNAVAILABLE` | Ảnh phản hồi radar hiển thị trên web KTTV; backend chưa có bộ giải mã NetCDF trực tiếp.| `MANUAL_FETCH` | **0.55** | Động cơ Nowcasting chạy trên mô phỏng thông số, chưa decode live raster. |
