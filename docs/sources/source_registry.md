# 📋 STUDENTHUB AI — MASTER SOURCE REGISTRY
> **Document ID**: `SRC-REG-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. 9 Phân Tầng Nguồn Dữ Liệu (Master Source Tiers)

1. `OFFICIAL`: Cổng thông tin chính thống của các trường Đại học (HCMUTE, UIT, HUST, UEH).
2. `GOVERNMENT`: Cổng thông tin Chính phủ, Bộ Công An, Bộ TT&TT, NCSC.
3. `UNIVERSITY`: Quy chế đào tạo tín chỉ, thông báo học bổng, sổ tay sinh viên.
4. `PUBLIC_DATASET`: Tập dữ liệu học thuật mở, FTC Data Book 2024, APWG Reports.
5. `THREAT_INTEL`: URLhaus (abuse.ch), NCSC Blacklists, CSDL số tài khoản lừa đảo.
6. `RESEARCH`: Báo cáo khoa học về an toàn thông tin, tâm lý tội phạm mạng.
7. `PUBLIC_COMMUNITY`: Đánh giá của sinh viên đã qua kiểm duyệt Trust Score.
8. `USER_AUTHORIZED`: Dữ liệu sinh viên chủ động tải lên (ảnh thẻ SV, bảng điểm).
9. `SYNTHETIC`: Kịch bản kiểm thử tấn công Red-team (tuyệt đối không đưa vào nhãn vàng).

---

## 2. Bảng Đăng Ký Chi Tiết Toàn Bộ Nguồn Dữ Liệu

| Source ID | Tên Cơ Quan / Dịch Vụ | Tên Miền / API Endpoint | Phạm Vi Truy Cập | Trạng Thái Kỹ Thuật |
| :--- | :--- | :--- | :--- | :---: |
| `SRC_URLHAUS` | URLhaus by abuse.ch | `https://urlhaus-api.abuse.ch/v1/url/` | Global Threat IOCs | `ACTIVE_API_INTEGRATED` |
| `SRC_NCSC_VN` | Cục An toàn Thông tin (Bộ TT&TT) | `tinnhiemmang.vn` & `khonggianmang.vn` | VN Cyber Threat Feeds | `READABLE_STATIC_REGISTRY` |
| `SRC_FTC_US` | Federal Trade Commission (USA) | `ftc.gov/consumer-sentinel` | Scam Loss Matrices | `READABLE_STATIC_REGISTRY` |
| `SRC_APWG` | Anti-Phishing Working Group | `apwg.org/trendreports` | Phishing Trends & Quishing | `READABLE_STATIC_REGISTRY` |
| `SRC_BCA_VN` | Bộ Công An Việt Nam | `bocongan.gov.vn` | 24 Thủ đoạn lừa đảo | `VERIFIED_DETERMINISTIC` |
| `SRC_HCMUTE` | Trường ĐH Sư phạm Kỹ thuật TP.HCM| `hcmute.edu.vn` & `fit.hcmute.edu.vn` | Cổng đào tạo & Học phí | `VERIFIED_DETERMINISTIC` |
| `SRC_UIT_VNU` | Trường ĐH Công nghệ Thông tin ĐHQG | `uit.edu.vn` | Khung CTĐT mẫu | `VERIFIED_DETERMINISTIC` |
| `SRC_HUST` | Đại học Bách Khoa Hà Nội | `hust.edu.vn` | Khung CTĐT mẫu & Tọa độ KTX| `VERIFIED_DETERMINISTIC` |
