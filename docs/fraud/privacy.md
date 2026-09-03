# 🔒 StudentHub AI — Privacy Protection & PII Masking Pipeline

> **Document ID**: `FRAUD-PRIVACY-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Nguyên Tắc Bảo Mật Quyền Riêng Tư Của Nạn Nhân

* **Làm Mờ Tự Động (Automated Redaction)**:
  - Mọi số CCCD (12 chữ số), số thẻ ngân hàng (16 chữ số), địa chỉ nhà riêng và số điện thoại cá nhân trong ảnh tải lên hoặc tin nhắn phản ánh sẽ được làm mờ (Masking dạng `0912***789` hoặc `07920300****`) trước khi đưa vào luồng phân tích lưu trữ.
* **Xử Lý Tạm Thời (Ephemeral Ingestion)**:
  - Tệp ảnh tải lên và khung hình camera chỉ lưu tạm thời trên bộ nhớ đệm trong thời gian thực thi phiên quét; tự động xóa sau khi trả kết quả phân tích.
