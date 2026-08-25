# 🩺 STUDENTHUB AI — SOURCE HEALTH & CIRCUIT BREAKER POLICY
> **Document ID**: `SRC-HEALTH-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Trạng Thái Vận Hành Nguồn (Source States)

* `HEALTHY`: Nguồn phản hồi trong vòng $< 2000\text{ms}$, tỷ lệ lỗi $< 1\%$, dữ liệu cập nhật dưới 24h.
* `DEGRADED`: Nguồn phản hồi chậm $> 2500\text{ms}$ hoặc có dấu hiệu bị giới hạn tần suất (Rate Limited - 429).
* `FAILED`: Nguồn mất kết nối hoàn toàn $\rightarrow$ Tự động chuyển mạch sang Local In-Memory Cache.
* `STALE`: Dữ liệu chưa được cập nhật quá 30 ngày $\rightarrow$ Hạ điểm `EVIDENCE_STRENGTH`.

---

## 2. Bảng Theo Dõi Sức Khỏe Nguồn Tình Báo

| Nguồn Dữ Liệu | Tần Suất Kiểm Tra | Thời Gian Phản Hồi (Latency) | Cơ Chế Bảo Vệ (Circuit Breaker) |
| :--- | :---: | :---: | :--- |
| **URLhaus API** | Mỗi request | $\approx 45\text{ms} - 80\text{ms}$ | Timeout 2.5s + Cache 15 phút + Fallback offline |
| **NCSC Local Registry** | Real-time (0ms) | $0.05\text{ms}$ | Luôn khả dụng trên RAM (In-memory lookup) |
| **University Tuition DB** | Real-time (0ms) | $0.08\text{ms}$ | Đối soát mâu thuẫn chéo trực tiếp |
