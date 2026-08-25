# 📜 StudentHub AI — Fraud Dataset Governance & Annotation Policy

> **Document ID**: `FRAUD-DATASET-POL-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Nguyên Tắc Quản Trị Tập Dữ Liệu Huấn Luyện

1. **Thực tế là tối thượng (Real Data First)**: 100% các mẫu nhãn vàng trong `FRAUD_GOLD` phải có nguồn gốc từ vụ án có thật, thông cáo cảnh báo chính thức của NCSC/Bộ Công An hoặc báo cáo từ người dùng đã được đối soát.
2. **Cách ly dữ liệu tổng hợp (Synthetic Data Isolation)**: Dữ liệu tổng hợp chỉ được dùng cho mục đích kiểm thử tấn công (Red-team) và bắt buộc gắn nhãn `data_origin: SYNTHETIC`.
3. **Phân tách thời gian (Temporal Split)**: Tập huấn luyện sử dụng các vụ việc trong quá khứ; tập kiểm thử (Test Set) sử dụng các thủ đoạn mới phát sinh để tránh rò rỉ dữ liệu (Data Leakage).
4. **Bảo vệ dữ liệu cá nhân (PII Redaction)**: Toàn bộ số điện thoại cá nhân, số CCCD, địa chỉ nhà riêng của nạn nhân phải được làm mờ (Masked/Redacted) trước khi đưa vào tập dữ liệu.
