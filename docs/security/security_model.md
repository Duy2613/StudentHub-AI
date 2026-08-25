# 🛡️ STUDENTHUB AI — DEFENSIVE SECURITY ARCHITECTURE MODEL
> **Document ID**: `SEC-MOD-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Các Tầng Bảo Vệ An Ninh Không Gian Mạng

1. **`SSRF_PROTECTION` (Chống Tấn Công Yêu Cầu Máy Chủ)**:
   - Nghiêm cấm máy chủ thực hiện fetch tới các dải IP nội bộ (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
2. **`MAGIC_BYTES_VERIFICATION` (Xác Thực Nhị Phân Tệp)**:
   - Kiểm tra magic bytes ở đầu tệp (ví dụ: `\xFF\xD8\xFF` cho JPEG, `\x89\x50\x4E\x47` cho PNG) trước khi gửi tới thư viện OCR.
3. **`UNTRUSTED_CONTENT_SANDBOXING` (Cách Ly Dữ Liệu Lạ)**:
   - Mọi văn bản bóc tách từ PDF, HTML, QR Code đều bị coi là dữ liệu không tin cậy và không bao giờ được nhúng trực tiếp làm System Prompt.
4. **`RATE_LIMIT_AND_DOS_PREVENTION` (Chống Nghẽn Tài Nguyên)**:
   - Giới hạn kích thước ảnh tải lên tối đa 10MB; tự động downscale về 1024px để tránh làm tê liệt bộ nhớ RAM trình duyệt.
