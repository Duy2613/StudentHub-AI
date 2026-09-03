# 📈 StudentHub AI — Threat Drift & Continuous Learning Monitoring

> **Document ID**: `FRAUD-DRIFT-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Giám Sát Độ Lệch Dữ Liệu & Thủ Đoạn Mới (Drift Monitoring)

1. **`DATA_DRIFT_DETECTION`**:
   - Theo dõi sự xuất hiện của các từ khóa lừa đảo mới (ví dụ: bẫy vé concert, ứng dụng Deepfake tráo mặt, lừa đảo việc làm AI).
   - Khi tần suất từ khóa mới vượt ngưỡng $\ge 50$ lượt xuất hiện trong 7 ngày $\longrightarrow$ Kích hoạt cờ `DRIFT_ALERT_NEW_SCAM_VECTOR`.
2. **`MODEL_DRIFT_DETECTION`**:
   - Theo dõi tỷ lệ phân bổ phán quyết (Verdicts distribution). Nếu tỷ lệ `UNKNOWN` hoặc tranh chấp nguồn `ESCALATE` tăng đột biến $> 15\%$ $\longrightarrow$ Gửi tín hiệu `RETRAIN_CANDIDATE_REQUIRED`.
3. **Quy trình học liên tục có kiểm soát (Continuous Learning Pipeline)**:
   - Dữ liệu người dùng báo cáo sai/đúng $\rightarrow$ Hội đồng chuyên gia kiểm duyệt $\rightarrow$ Nạp vào `FRAUD_GOLD` $\rightarrow$ Đánh giá trên Benchmark $\rightarrow$ Cập nhật trọng số mô hình. **Tuyệt đối không tự động huấn luyện lại từ dữ liệu người dùng thô chưa qua đối soát.**
