# 🚩 StudentHub AI — Unverified Claims & Verified Capabilities Audit

> **Document ID**: `UNVERIF-CLAIMS-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Danh Sách Tuyên Bố Bị Hạ Cấp & Cảnh Báo (UNVERIFIED_CLAIMS — Red-Flag List)

Những tuyên bố sau đây trong các báo cáo trước đã được kiểm toán và **BÁC BỎ HOẶC HẠ CẤP** do thiếu bằng chứng live network trực tiếp:

1. ❌ **"Tuition Banking Portals CONNECTED via Banking Gateway"**:
   - *Thực tế*: StudentHub AI **không có kết nối API thanh toán trực tiếp** với BIDV/VietinBank; chỉ cung cấp thông tin số tài khoản và cú pháp hướng dẫn sinh viên.
2. ❌ **"Legal Framework = INDEFINITE (vĩnh cửu)"**:
   - *Thực tế*: Luật có vòng đời hiệu lực từ ngày ban hành (`VALID_FROM`) đến khi có văn bản sửa đổi/thay thế. Đã cập nhật lại đúng bản chất.
3. ❌ **"Native Telecom Dispatch 112/113/114/115 CONNECTED"**:
   - *Thực tế*: Ứng dụng chỉ tạo liên kết `tel:` mở ứng dụng gọi điện thoại trên thiết bị; **không kết nối API trực tiếp với trung tâm chỉ huy 112/113**.
4. ❌ **"NCSC Threat Intelligence Feed CONNECTED via API"**:
   - *Thực tế*: Danh sách đen IOCs trong mã nguồn được biên soạn thủ công từ các cảnh báo công khai; không có automated API polling trực tiếp từ NCSC.
5. ❌ **"Google Routes Platform CONNECTED via Backend API"**:
   - *Thực tế*: Giao diện sử dụng deep-link mở Google Maps client-side; backend chưa cấu hình Google Cloud Routes API Key có tính phí.
6. ❌ **"199/199 Tests Passed proves real external sources are verified"**:
   - *Thực tế*: 100% tests là Unit Tests và Fixture Tests chạy trên Node.js nội bộ, kiểm chứng tính đúng đắn của logic thuật toán, **không kiểm chứng đường truyền mạng sống tới bên thứ 3**.

---

## 2. Danh Sách Năng Lực Đã Được Kiểm Chứng Tuyệt Đối (VERIFIED_CAPABILITIES — Positive List)

Những tính năng và thuật toán sau đây đã được **KIỂM CHỨNG 100% HOẠT ĐỘNG CHÍNH XÁC** trên mã nguồn:

| Năng Lực Được Xác Thực (Verified Capability) | Tệp Mã Nguồn Triển Khai (Source File) | Bằng Chứng Kiểm Thử (Test Proof) | Trạng Thái Kỹ Thuật (Status) |
| :--- | :--- | :--- | :--- |
| **1. Bóc Tách Điều Khoản & Cảnh Báo Bẫy Cọc / Giữ CCCD** | `frontend/src/lib/intelligence/contract/contractIntelligenceEngine.js` | `intelligence_domains.test.mjs` (Domain 2) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **2. So Sánh Hai Bản Công Văn Cũ & Mới (Version Diff v1 vs v2)**| `frontend/src/lib/intelligence/document/documentVersionDiffEngine.js` | `intelligence_domains.test.mjs` (Domain 2) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **3. Giải Bài Toán Chuỗi Môn Tiên Quyết (Prerequisite Cascade DAG)**| `frontend/src/lib/intelligence/academic/academicReasoningEngine.js` | `intelligence_domains.test.mjs` (Domain 1) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **4. Nhận Diện 24 Đòn Thao Túng Tâm Lý Tội Phạm** | `frontend/src/lib/intelligence/fraud/psychologicalManipulationEngine.js` | `intelligence_domains.test.mjs` (Domain 3) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **5. Phát Hiện Mâu Thuẫn Chéo Logo vs QR vs Tên Miền** | `frontend/src/lib/intelligence/fraud/crossModalContradictionEngine.js` | `intelligence_domains.test.mjs` (Domain 3) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **6. Quyền Được Nói "Không Biết / Chưa Đủ Bằng Chứng" (Abstention)**| `frontend/src/lib/intelligence/fusion/claimVerificationEngine.js` | `intelligence_domains.test.mjs` (Domain 3) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **7. Đánh Giá Chất Lượng Khung Hình Camera (Laplacian Sharpness)** | `frontend/src/lib/intelligence/geospatial/cameraVisionEngine.js` | `geospatial_weather_camera.test.mjs` | ✅ `ALGORITHMICALLY_VERIFIED` |
| **8. Nowcasting Thời Tiết Đa Cảm Biến & Xử Lý Bất Đồng Radar/Camera**| `frontend/src/lib/intelligence/geospatial/weatherNowcastingEngine.js` | `geospatial_weather_camera.test.mjs` | ✅ `ALGORITHMICALLY_VERIFIED` |
| **9. Định Tuyến An Toàn Né Rốn Ngập Nước Xiết Võ Văn Ngân** | `frontend/src/lib/intelligence/geospatial/weatherResilientRoutingEngine.js` | `geospatial_weather_camera.test.mjs` | ✅ `ALGORITHMICALLY_VERIFIED` |
| **10. Kích Hoạt Khẩn Cấp Có Chủ Đích Hold-2s & Trip Timer** | `frontend/src/lib/intelligence/emergency/emergencySystemEngine.js` | `intelligence_domains.test.mjs` (Domain 4) | ✅ `ALGORITHMICALLY_VERIFIED` |
| **11. Đồ Thị Không Gian Khuôn Viên HCMUTE (Tòa Nhà Trung Tâm, Y Tế)** | `frontend/src/lib/intelligence/geospatial/hcmuteCampusGeoGraph.js` | `geospatial_weather_camera.test.mjs` | ✅ `ALGORITHMICALLY_VERIFIED` |
| **12. Trợ Lý Đa Tình Huống Unified Copilot (6 Situation Modes)** | `frontend/src/lib/intelligence/copilot/studentCopilotEngine.js` | `intelligence_domains.test.mjs` (Domain 5) | ✅ `ALGORITHMICALLY_VERIFIED` |
