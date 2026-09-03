# 🔒 STUDENTHUB AI — PRIVACY PROTECTION & PII REDACTION MODEL
> **Document ID**: `PRIV-MOD-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Nguyên Tắc Bảo Vệ Dữ Liệu Cá Nhân

1. **Che giấu tự động (Automated PII Masking)**:
   - Số CCCD/CMND: Che còn 4 số cuối (Ví dụ: `07920300****`).
   - Số điện thoại: Che các số giữa (Ví dụ: `0912***789`).
   - Số tài khoản cá nhân: Che 6 số giữa.
2. **Xử lý tạm thời (Ephemeral Processing)**:
   - Ảnh chụp OCR và camera chỉ tồn tại trên bộ nhớ RAM đệm trong suốt phiên quét và tự động giải phóng sau khi phân tích xong.
3. **Không lưu trữ trái phép lịch sử GPS**:
   - Vị trí GPS của sinh viên chỉ dùng để tính toán phân đoạn an toàn cục bộ trên máy người dùng, không truyền lên máy chủ nếu người dùng không bấm "Lưu hành trình".
