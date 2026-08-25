# 📈 STUDENTHUB AI — DRIFT MONITORING & RETRAINING TRIGGER POLICY
> **Document ID**: `OPS-DRIFT-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Giám Sát Độ Lệch & Tự Động Kích Hoạt Cảnh Báo (Drift Triggers)

* **`DATA_DRIFT_THRESHOLD`**: Khi phát hiện $\ge 50$ lượt xuất hiện của một từ khóa lừa đảo mới trong 7 ngày $\longrightarrow$ Gửi cờ `DRIFT_ALERT_NEW_VOCABULARY`.
* **`MODEL_DRIFT_THRESHOLD`**: Khi tỷ lệ phán quyết `INSUFFICIENT_EVIDENCE` hoặc `CONFLICT_UNRESOLVED` tăng vượt mức $> 12\%$ tổng số lượt quét $\longrightarrow$ Gửi cờ `RETRAIN_CANDIDATE_REQUIRED`.
* **`ZERO_AUTOMATIC_RETRAINING_RULE`**: Nghiêm cấm việc tự động đưa dữ liệu người dùng vào huấn luyện lại mà không qua hội đồng chuyên gia duyệt nhãn vàng.
