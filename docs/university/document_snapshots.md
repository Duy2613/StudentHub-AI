# 📸 HCMUTE Immutable Document Snapshots & Provenance Archive
> **Document ID**: `UNI-DOC-SNAP-001` | **Version**: 9.0.0 | **Zero-Fabrication Standard**  
> **Institution**: Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)  

---

## 1. Nguyên Tắc Bất Biến Của Bản Chụp Văn Bản
- **Tuyệt đối không ghi đè**: Mỗi khi văn bản được cập nhật, hệ thống tạo bản chụp phiên bản mới (`v2.0`, `v2026.1`) và giữ nguyên bản chụp cũ để đối soát lịch sử.
- **Chứng thực băm SHA-256**: Mỗi bản chụp được tính mã băm SHA-256 trên nội dung thô đã chuẩn hóa để chứng minh tính toàn vẹn.

---

## 2. Danh Mục Các Bản Chụp Văn Bản Trọng Yếu Hiện Lưu Trữ

| Document ID | Phiên Bản | Mã Băm SHA-256 (Rút gọn) | Tiêu Đề Văn Bản | Ngày Ban Hành | Ngày Hiệu Lực | Trạng Thái |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| `DOC_QD_3116` | `v1.0` | `e3b0c442...b855` | Quyết định số 3116/QĐ-ĐHSPKT (Quy chế đào tạo đại học) | 22/08/2025 | 22/08/2025 | **`ACTIVE`** |
| `DOC_QD_3811` | `v1.0` | `5f4dcc3b...052a` | Quyết định số 3811/QĐ-ĐHSPKT (Quy chế tín chỉ cũ) | 31/12/2024 | 31/12/2024 | **`SUPERSEDED`** |
| `DOC_FIT_CURRICULUM_SE` | `v2026.1`| `ca978112...48bb` | Chương trình đào tạo Kỹ thuật Phần mềm K26 | 10/08/2026 | 10/08/2026 | **`ACTIVE`** |

---

## 3. Cơ Chế Phục Hồi An Toàn Khi Sập Nguồn Trực Tuyến
Nếu cổng thông tin trường bị nghẽn mạng hoặc bảo trì máy chủ:
1. Hệ thống tự động chuyển sang phục vụ dữ liệu từ bản chụp snapshot gần nhất (`LAST_VERIFIED_SNAPSHOT`).
2. Gắn nhãn cảnh báo rõ ràng: `[STALE_SOURCE_WARNING]` để người học biết dữ liệu được truy xuất từ bản chụp lưu trữ.
3. Tuyệt đối không thay thế dữ liệu đã được xác minh bằng dữ liệu rỗng hoặc suy diễn giả định.
