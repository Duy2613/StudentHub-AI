# 🎯 StudentHub AI — Hard Negative Corpus Specification

> **Document ID**: `FRAUD-HARD-NEG-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Nguyên Tắc Bắt Buộc Về Hard Negatives
Sự xuất hiện của các từ khóa như `ngân hàng`, `OTP`, `công an`, `học phí`, `lừa đảo`, `phishing` **KHÔNG ĐỒNG NGHĨA LÀ LỪA ĐẢO**.

Hệ thống bắt buộc phải vượt qua các tình huống kiểm thử nghịch đảo:
1. **Thông báo bảo mật chính thức từ ngân hàng**:
   - Ví dụ: *"Vietcombank cảnh báo: Ngân hàng KHÔNG BAO GIỜ yêu cầu khách hàng cung cấp mã OTP/Smart OTP hoặc mật khẩu qua bất kỳ đường link nào."* $\longrightarrow$ **`LEGITIMATE (ALLOW)`**.
2. **Bài tập học thuật về An toàn Thông tin**:
   - Ví dụ: *"Bài tập lớn môn An toàn Mạng: Phân tích cơ chế hoạt động của mã độc Trojan và giao thức xác thực 2 bước 2FA."* $\longrightarrow$ **`LEGITIMATE (ALLOW)`**.
3. **Báo chí đưa tin cảnh báo lừa đảo**:
   - Ví dụ: *"Báo Tuổi Trẻ đưa tin: Công an TP.HCM triệt phá đường dây giả danh công an lừa đảo chiếm đoạt tài sản qua mạng."* $\longrightarrow$ **`LEGITIMATE (ALLOW)`**.
