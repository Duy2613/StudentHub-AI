# 🗺️ StudentHub AI — Map Provider & Routing Engine Registry

> **Document ID**: `MAP-PROV-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Phân Tách Minh Bạch Các Chế Độ Định Tuyến Giao Thông (Google Routes API Modes)

Hệ thống phân định rạch ròi 3 chế độ tính toán lộ trình theo chuẩn kỹ thuật của Google Routes Platform:

| Chế Độ Kỹ Thuật (Routing Mode) | Bản Chất Tính Toán (Algorithm Behavior) | Độ Trễ Ước Tính (Latency) | Trạng Thái Tích Hợp Hiện Tại |
| :--- | :--- | :---: | :--- |
| **`TRAFFIC_UNAWARE`** | Tính toán lộ trình theo giới hạn tốc độ thiết kế của từng cung đường, không xét mật độ kẹt xe thực tế. | $\approx 120\text{ ms}$ | `CLIENT_FALLBACK_READY` |
| **`TRAFFIC_AWARE`** | Tính toán dựa trên dữ liệu vận tốc trung bình và tình trạng ùn tắc thời gian thực trên các tuyến đường chính. | $\approx 350\text{ ms}$ | `SPEC_SUPPORTED` |
| **`TRAFFIC_AWARE_OPTIMAL`** | Thuật toán tìm kiếm vét cạn cao cấp của Google Maps để tìm các đường nhánh né kẹt xe tối ưu nhất; độ trễ cao hơn. | $\approx 750\text{ ms}$ | `DEEP_LINK_TRIGGERED` |

---

## 2. Hàm Chi Phí Đa Tiêu Chí Theo Từng Phân Đoạn Đường (Segment-Level Cost Function)

$$\text{route\_cost} = \text{travel\_time} + \text{traffic\_penalty} + \text{weather\_penalty} + \text{flooding\_penalty} + \text{incident\_penalty} + \text{visibility\_penalty} + \text{road\_hazard\_penalty} + \text{uncertainty\_penalty}$$

* **Nguyên tắc phân lập rủi ro (Segment Isolation)**:
  - Nếu đường Võ Văn Ngân có đoạn dốc bị ngập nước xiết ($\text{flooding\_penalty} = +15\text{ min}$), hệ thống chỉ cảnh báo trên đoạn dốc cụ thể đó; không tuyên bố toàn bộ tuyến đường là nguy hiểm.
