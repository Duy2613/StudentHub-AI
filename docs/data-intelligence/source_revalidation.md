# 🔬 StudentHub AI — Source Revalidation & Subagent Evidence Matrix

> **Document ID**: `AUDIT-SUBAGENT-MATRIX` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Báo Cáo Thẩm Định 12 Tiểu Ban Kiểm Toán (Auditors A – L)

### 🏫 AUDITOR_A: University & HCM-UTE Ecosystem
* **Nguồn khảo sát**: `hcmute.edu.vn`, `online.hcmute.edu.vn`, `daotao.hcmute.edu.vn`, `ctsv.hcmute.edu.vn`.
* **Tuyên bố trước đây**: `"HCMUTE University OS CONNECTED (Confidence 0.98)"`.
* **Hiện trạng thực tế**:
  - `online.hcmute.edu.vn` yêu cầu đăng nhập tài khoản sinh viên với mật khẩu và cookie bảo mật.
  - Backend của StudentHub AI hiện **chưa cài đặt crawler có xác thực (Authenticated Headless Worker)**; dữ liệu danh mục môn học (`MATH141701`, `PROG130103`) được trích xuất và mô hình hóa thành đồ thị tĩnh trong `hcmuteKnowledgeGraph.js`.
* **Phán quyết**: Hạ cấp từ `CONNECTED` $\longrightarrow$ `READABLE_STATIC_REGISTRY` & `AUTH_REQUIRED`. Độ tin cậy thực tế: **0.75**.

---

### ⚖️ AUDITOR_B: Government & Legal Framework
* **Nguồn khảo sát**: Bộ luật Dân sự 2015, Bộ luật Lao động 2019, Thông tư 09/2023/TT-BCT.
* **Tuyên bố trước đây**: `"Legal Framework CONNECTED (INDEFINITE) (Confidence 1.00)"`.
* **Hiện trạng thực tế**:
  - Văn bản pháp luật là tài liệu tĩnh có giá trị áp dụng từ ngày hiệu lực đến khi có văn bản sửa đổi/bổ sung.
  - Việc ghi `INDEFINITE` (vĩnh cửu) là sai nguyên lý quản trị dữ liệu pháp lý.
* **Phán quyết**: Sửa đổi schema dữ liệu: `VALID_FROM: 2017-01-01 / 2021-01-01`, `VALID_TO: UNTIL_REPEALED_OR_AMENDED`, `STATUS: ACTIVE_ENFORCED`. Trạng thái: `READABLE_STATIC_REGISTRY`. Độ tin cậy: **0.95**.

---

### 🗺️ AUDITOR_C: GPS & Google Maps Platform
* **Nguồn khảo sát**: Google Maps Platform (Routes / Places API).
* **Tuyên bố trước đây**: `"Google Maps Platform CONNECTED via API"`.
* **Hiện trạng thực tế**:
  - Mã nguồn frontend tại `safety-map/page.jsx` mở liên kết URL trình duyệt: `window.open("https://www.google.com/maps/dir/?api=1&...")`.
  - Backend **chưa thiết lập Google Cloud Server-Side API Key** để gọi REST endpoint `/directions/v2:computeRoutes`.
  - Thuật toán 3 tuyến đường (**Fastest, Safest, Balanced**) hiện là giải thuật nội bộ tính trên trọng số danh mục.
* **Phán quyết**: Hạ cấp từ `CONNECTED` $\longrightarrow$ `MAP_URL_DEEPLINK_AVAILABLE`. Độ tin cậy: **0.70**.

---

### 📹 AUDITOR_D: Traffic Cameras & Public Streams
* **Nguồn khảo sát**: Cổng TTGT TP.HCM (`giaothong.hochiminhcity.gov.vn`).
* **Tuyên bố trước đây**: `"Camera Giao Thông: INTEGRATION_UNAVAILABLE"`.
* **Hiện trạng thực tế**:
  - Không có API mở chính thức cho bên thứ 3 stream video.
  - Báo cáo trước đó đã ghi nhận đúng trạng thái không bịa stream trực tiếp.
* **Phán quyết**: Duy trì `PUBLIC_VISIBLE / PROGRAMMATIC_ACCESS_UNCONFIRMED`. Độ tin cậy: **0.50**.

---

### 🌦️ AUDITOR_E: Weather, Radar & Satellite
* **Nguồn khảo sát**: NCHMF Radar Nhà Bè (`nchmf.gov.vn`), Vệ tinh Himawari-9.
* **Tuyên bố trước đây**: `"Radar & Weather Sources CONNECTED"`.
* **Hiện trạng thực tế**:
  - Động cơ `weatherNowcastingEngine.js` hiện xử lý logic thuật toán hợp nhất trên các tham số đầu vào (parameters).
  - Chưa có live pipeline tự động cào và giải mã raster ảnh phản hồi radar Nhà Bè về server theo chu kỳ 10 phút.
* **Phán quyết**: Hạ cấp từ `CONNECTED` $\longrightarrow$ `DISCOVERED / VISUAL_PORTAL_ONLY`. Độ tin cậy: **0.55**.

---

### 🛡️ AUDITOR_F: Cybersecurity & Threat Intelligence
* **Nguồn khảo sát**: NCSC (`tinnhiemmang.vn`, `khonggianmang.vn`).
* **Tuyên bố trước đây**: `"NCSC Threat Feed CONNECTED"`.
* **Hiện trạng thực tế**:
  - `threatIntelligenceFeed.js` chứa mảng tĩnh 5 tên miền và 3 số tài khoản lừa đảo làm mẫu kiểm thử.
  - NCSC **không cung cấp public REST API unauthenticated** để bên thứ 3 query danh sách đen trực tiếp.
* **Phán quyết**: Hạ cấp từ `CONNECTED` $\longrightarrow$ `READABLE_MANUAL_REGISTRY`. Độ tin cậy: **0.70**.

---

### 👨‍🏫 AUDITOR_G: Teacher Review & Public Community
* **Nguồn khảo sát**: UTE Thắc Mắc Học Tập, Ký Sự Giảng Đường.
* **Tuyên bố trước đây**: `"Student Community & Teacher Reviews CONNECTED"`.
* **Hiện trạng thực tế**:
  - Dữ liệu 4 giảng viên trong `profReviewRegistry.js` là bộ dữ liệu mẫu được tuyển chọn thủ công, không phải crawler tự động từ các group mạng xã hội (vì rào cản chính sách Meta API).
* **Phán quyết**: Hạ cấp từ `CONNECTED` $\longrightarrow$ `DISCOVERED / STATIC_CURATED`. Độ tin cậy: **0.65**.

---

### 🚨 AUDITOR_H: Emergency Hotlines & Dispatch
* **Nguồn khảo sát**: Đầu số 112, 113, 114, 115.
* **Tuyên bố trước đây**: `"Native Telecom Dispatch CONNECTED"`.
* **Hiện trạng thực tế**:
  - Ứng dụng chỉ tạo thẻ bấm giao thức `tel:112`, `tel:113` kích hoạt trình gọi điện thoại trên máy người dùng.
  - **Không có bất kỳ kết nối API trực tiếp nào với hệ thống điều phối của Tổng đài Quốc gia 112**.
* **Phán quyết**: Sửa đổi thành `CALL_ACTION_AVAILABLE` & `EMERGENCY_SERVICE_INTEGRATION = NOT_DIRECTLY_CONNECTED`. Độ tin cậy: **0.85**.

---

### 💳 AUDITOR_I: Banking & Tuition Portals
* **Nguồn khảo sát**: Cổng đóng học phí ngân hàng (BIDV, VietinBank).
* **Tuyên bố trước đây**: `"Tuition Banking Portals CONNECTED"`.
* **Hiện trạng thực tế**:
  - StudentHub AI chỉ hiển thị thông tin hướng dẫn số tài khoản và cú pháp chuyển khoản của nhà trường; không có API kết nối ngân hàng hoặc Open Banking OAuth.
* **Phán quyết**: Hạ cấp từ `CONNECTED` $\longrightarrow$ `NOT_INTEGRATED / INFORMATION_ONLY`. Độ tin cậy: **0.60**.

---

### 🧪 AUDITOR_J: Test & Code Reality Verification
* **Nguồn khảo sát**: 199 bài kiểm tra trong `frontend/tests/`.
* **Tuyên bố trước đây**: `"199/199 Tests Passed certifies that real external data is correct"`.
* **Hiện trạng thực tế**:
  - 100% các bài test là Unit Tests và Deterministic Fixture Assertions chạy trên Node.js nội bộ.
  - 0 bài test nào thực hiện HTTP request trực tiếp tới các máy chủ trường ĐH hay cổng chính phủ trong khi chạy `test:all`.
* **Phán quyết**: Tách bạch minh bạch: `PASS_WITH_FIXTURE = 199/199`, `PASS_WITH_LIVE_EXTERNAL_NETWORK = 0/14`.

---

### 🔒 AUDITOR_K: Privacy & Authorization Scope
* **Phán quyết**: Tuân thủ nghiêm ngặt nguyên tắc không thu thập dữ liệu trái phép, không lưu trữ token/cookie bí mật của người dùng. Trạng thái: `COMPLIANT`.

---

### 🏷️ AUDITOR_L: Source Provenance Model
* **Phán quyết**: Các bản ghi tĩnh đã có cấu trúc xuất xứ chuẩn (`publisher`, `source_url`, `content_hash`), cần hoàn thiện cơ chế cập nhật tự động timestamp cho các dữ liệu thời gian thực.
