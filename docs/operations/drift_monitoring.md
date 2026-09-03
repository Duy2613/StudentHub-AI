# 📈 STUDENTHUB AI v9 — CONTINUOUS DRIFT MONITORING & MLOps POLICY
> **Document ID**: `OPS-DRIFT-002` | **Version**: 9.0.0 | **Constitution 44–47 Certified**  
> **Telemetry Scope**: Source Drift, Data Drift, Model Drift, Calibration Degradation  

---

## 1. 4 Chiều Giám Sát Độ Lệch Hệ Thống (4-Dimensional Drift Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        STUDENTHUB AI DRIFT MONITORING MATRIX                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. SOURCE DRIFT (Constitution 45)                                                      │
│    • DOM Mutation Alarms: Detects CSS selector / schema breakages on university portals│
│    • Rate Limit & Policy Shifts: Monitors HTTP 429 / 403 status changes.               │
│    • Action: Disables parser immediately to prevent corrupted data ingestion.          │
│                                                                                        │
│ 2. DATA DRIFT (Constitution 46)                                                        │
│    • Vocabulary KL-Divergence: Monitored rolling distribution (Threshold: KL > 0.050).  │
│    • Emerging Scam Vector Frequency: >= 50 occurrences of unseen pattern in 7 days.   │
│    • Action: Emits DATA_DRIFT_ALERT and queues samples for human adjudication.        │
│                                                                                        │
│ 3. MODEL DRIFT (Constitution 47)                                                       │
│    • Rolling F1 Degradation: Alert if rolling F1 drops by > 0.020.                     │
│    • Out-of-Distribution Surge: Alert if OOD rate rises above 8.0% of live traffic.    │
│    • Action: Triggers Challenger Gate benchmarking against fresh Gold dataset.         │
│                                                                                        │
│ 4. CALIBRATION DRIFT                                                                   │
│    • Expected Calibration Error (ECE): Monitored rolling reliability curve.            │
│    • Overconfidence Penalty: Re-calibrates temperature parameter if ECE > 0.050.       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Quy Tắc Vàng: Cấm Tự Động Huấn Luyện Ngầm (Constitution 48 & 53)
- **Dữ liệu người dùng và phản ánh thời gian thực TUYỆT ĐỐI KHÔNG tự động trở thành dữ liệu huấn luyện**.
- Mọi dữ liệu mới muốn vào Gold Dataset bắt buộc phải vượt qua:
  1. Tách biệt danh tính & PII Scrubbing.
  2. Double Annotation & Inter-Annotator Agreement ($\ge 0.85$).
  3. Phân định nguồn gốc (`data_origin` $\neq$ `UNKNOWN`).
  4. Phê duyệt bởi Hội đồng Kiểm định mô hình.
