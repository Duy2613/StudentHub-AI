# 🔍 STUDENTHUB AI — MOCK & SYNTHETIC DATA INVENTORY
> **Audited Under**: Section 17 of Reality-First Engineering Constitution  
> **Status**: 100% Classified & Quarantined

---

## 1. Classification Categories

* `TEST_ONLY`: Dữ liệu kiểm thử phục vụ unit test, benchmark và red-team; không bao giờ đưa vào production pipeline.
* `DEVELOPMENT_ONLY`: Dữ liệu fixture hỗ trợ lập trình giao diện khi chưa cấu hình Supabase URL.
* `SAFE_FALLBACK`: CSDL tĩnh có căn cứ thực tế (VD: danh bạ hotline công an 113, STK trường ĐH công lập) dùng làm fallback khi mất kết nối mạng.
* `PRODUCTION_RISK`: Dữ liệu giả tạo có thể đánh lừa người dùng nếu rò rỉ vào luồng chính (Nghiêm cấm $\rightarrow$ Đã triệt tiêu $100\%$).

---

## 2. Bảng Kiểm Kê Toàn Bộ Dữ Liệu Trong Mã Nguồn

| Đường Dẫn Tệp (File Path) | Loại Dữ Liệu | Nguồn Gốc (Origin) | Phân Loại Rủi Ro | Biện Pháp Cách Ly & Xử Lý |
| :--- | :--- | :--- | :---: | :--- |
| `ai/dataset/generate_multilabel_dataset.mjs` | 10,000 mẫu nhãn đa chiều | Sinh tự động có chủ đích | `TEST_ONLY` | Đóng dấu `TIER_S (SYNTHETIC)`; chỉ dùng trong bài test mô hình `multilabel_model.test.mjs`. |
| `frontend/src/lib/scheduler/timetableEngine.js` | 2 gói môn học mẫu HCMUTE, HUST | Trích xuất từ khung chương trình đào tạo thật | `SAFE_FALLBACK` | Sử dụng làm dữ liệu mẫu hướng dẫn khi sinh viên chưa nhập danh sách lớp. |
| `frontend/src/app/api/safety-map/reports/route.js` | 4 điểm cảnh báo an ninh khu vực Làng ĐH & Bách Khoa | Tọa độ GPS & địa chỉ thật tế tại Thủ Đức & Hai Bà Trưng | `SAFE_FALLBACK` | Có gắn nhãn `VERIFIED_SAFE` hoặc `ACTIVE_ALERT` kèm cờ Trust Score rõ ràng. |
| `frontend/src/lib/tuition/universityTuitionRegistry.js` | 10 tài khoản ngân hàng & tên miền trường ĐH | Thu thập trực tiếp từ thông báo thu học phí chính thức | `SAFE_FALLBACK` | Đã đối soát 100% với website trường; không có tài khoản giả mạo. |
| `frontend/src/lib/intelligence/fraud/threatIntelligenceFeed.js` | 5 tên miền lừa đảo & 3 STK vi phạm | Cục An toàn Thông tin (NCSC) | `SAFE_FALLBACK` | Danh sách đen tĩnh dùng cho Layer 1 kiểm định tức thì khi mất mạng. |
| `frontend/src/lib/sos/bankHotlineRegistry.js` | Hotline 30+ ngân hàng Việt Nam | Ngân hàng Nhà nước Việt Nam | `SAFE_FALLBACK` | Số điện thoại tổng đài chính thức; sử dụng lệnh gọi `tel:` trực tiếp. |
