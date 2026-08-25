# 🛡️ StudentHub AI — Fraud Intelligence Source Registry

> **Document ID**: `FRAUD-SRC-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Phân Tầng Nguồn Dữ Liệu Phòng Chống Lừa Đảo (Source Tiering)

| Phân Tầng (Tier) | Danh Mục Nguồn (Sources) | Thẩm Quyền (Authority) | Tần Suất Cập Nhật (Freshness) | Trạng Thái Tích Hợp (Status) |
| :--- | :--- | :--- | :--- | :--- |
| **TIER A (OFFICIAL)** | NCSC (`tinnhiemmang.vn`), Bộ Công An, Bộ TT&TT, FTC Consumer Sentinel Data Book, FBI IC3 | Cơ quan quản lý nhà nước | Báo cáo định kỳ / IOCs | `READABLE_STATIC_REGISTRY` |
| **TIER B (THREAT FEEDS)**| URLhaus (abuse.ch), APWG Phishing Activity Trends Reports | Mạng lưới phòng chống tội phạm mạng toàn cầu | API thời gian thực / Báo cáo quý | `ACTIVE_API_INTEGRATED` |
| **TIER C (COMMUNITY)** | Báo cáo sinh viên đã xác minh qua hệ thống Trust Score $\ge 80$ | Bằng chứng thực địa | Thời gian thực có kiểm duyệt | `USER_VERIFIED` |
| **TIER D (UNVERIFIED)** | Phản ánh ẩn danh, tin đồn mạng xã hội chưa có văn bản/hình ảnh | Dữ liệu thô | Cách ly | `ISOLATED_QUARANTINE` |
| **TIER S (SYNTHETIC)** | Kịch bản Red-team, tấn công Prompt Injection, bẫy Homoglyph | Kiểm thử độ bền | Đóng dấu `SYNTHETIC` | `ADVERSARIAL_BENCHMARK_ONLY` |
