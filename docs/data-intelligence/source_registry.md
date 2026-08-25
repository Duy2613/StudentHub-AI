# 📚 StudentHub AI — Recalibrated Master Source Registry

> **Audit Version**: 2.0.0 | **Last Updated**: 2026-08-25 | **Authority Level**: Zero-Fabrication Audited

---

## 1. Phân Tầng Nguồn Dữ Liệu Sau Kiểm Toán (Audited Source Hierarchy Tiers)

| Tier | Định Nghĩa & Phạm Vi | Mức Độ Tin Cậy Tối Đa (Max Confidence) | Yêu Cầu Đối Soát | Phân Loại Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- |
| **TIER A (OFFICIAL)** | Cổng thông tin trường ĐH, Bộ Công An, Bộ TT&TT (NCSC), Bộ GD&ĐT, Ngân hàng Nhà nước. | `0.95` (Nếu có văn bản gốc / Live Sync) | Độc lập, có trích dẫn xuất xứ | `GOLD_ELIGIBLE` |
| **TIER B (TRUSTED SECONDARY)** | Báo chí chính thống (Nhân Dân, Tuổi Trẻ, Thanh Niên), API công khai được cấp phép. | `0.75` | Yêu cầu $\ge 2$ nguồn độc lập | `CORROBORATIVE_ONLY` |
| **TIER C (PUBLIC COMMUNITY)** | Diễn đàn sinh viên công khai (*HCMUTE - UTE Thắc Mắc Học Tập*, *Ký Sự Bách Khoa*). | `0.45` | Bắt buộc đối soát | `TREND_DISCOVERY_ONLY` |
| **TIER D (UNVERIFIED / ANONYMOUS)** | Bình luận ẩn danh, tin đồn chưa kiểm chứng. | `0.20` | Gắn nhãn `UNVERIFIED` | `ISOLATED_QUARANTINE` |
| **TIER S (SYNTHETIC / RED-TEAM)** | Dữ liệu giả lập tấn công, biến thể lỗi OCR, kiểm thử biên LLM. | `0.10` | Đóng dấu `data_origin: SYNTHETIC` | `TESTING_ONLY` |

---

## 2. Danh Mục Nguồn Đã Tái Thẩm Định

### 🏛️ A. Nguồn Học Vụ & Đào Tạo HCMUTE
1. **Trang chủ Trường HCMUTE (`hcmute.edu.vn`)**:
   - Thẩm quyền: `TIER_A_OFFICIAL` | Trạng thái: `ACCESSIBLE` (Duyệt web công khai).
2. **Cổng Thông tin Sinh viên & Đào tạo Online (`online.hcmute.edu.vn`)**:
   - Thẩm quyền: `TIER_A_OFFICIAL` | Trạng thái: `AUTH_REQUIRED` (Yêu cầu tài khoản sinh viên).
3. **Phòng Đào tạo (PĐT) & CTSV**:
   - Thẩm quyền: `TIER_A_OFFICIAL` | Trạng thái: `ACCESSIBLE`.
4. **Khoa Công nghệ Thông tin (FIT - `fit.hcmute.edu.vn`)**:
   - Thẩm quyền: `TIER_A_OFFICIAL` | Trạng thái: `READABLE_STATIC_REGISTRY`.

### ⚖️ B. Văn Bản Pháp Luật & Quy Chế Nhà Nước
1. **Bộ luật Dân sự 2015 (Điều 472-482)**:
   - `VALID_FROM: 2017-01-01` | `CURRENT_STATUS: ACTIVE_ENFORCED` | Trạng thái: `READABLE_STATIC_REGISTRY`.
2. **Bộ luật Lao động 2019 (Điều 20)**:
   - `VALID_FROM: 2021-01-01` | `CURRENT_STATUS: ACTIVE_ENFORCED` | Trạng thái: `READABLE_STATIC_REGISTRY`.
3. **Thông tư 09/2023/TT-BCT**:
   - `VALID_FROM: 2023-10-16` | `CURRENT_STATUS: ACTIVE_ENFORCED` | Trạng thái: `READABLE_STATIC_REGISTRY`.

### 🚨 C. Nguồn Cứu Hộ & Cấp Cứu
1. **Tổng Đài 112, 113, 114, 115**:
   - Trạng thái: `CALL_ACTION_AVAILABLE` (Kích hoạt trình gọi điện `tel:` trên máy sinh viên).
   - Tích hợp API điều phối: `NOT_DIRECTLY_CONNECTED`.
