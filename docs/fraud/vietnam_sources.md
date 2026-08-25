# 🇻🇳 StudentHub AI — Vietnam Fraud Intelligence Sources

> **Document ID**: `FRAUD-VN-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Danh Mục Nguồn Dữ Liệu An Ninh Mạng Việt Nam

| Cơ Quan Ban Hành | Tên Miền / Cổng Thông Tin | Phạm Vi Cảnh Báo & Dữ Liệu | Cơ Chế Tích Hợp |
| :--- | :--- | :--- | :--- |
| **Cục An toàn Thông tin (Bộ TT&TT)** | `tinnhiemmang.vn` & `khonggianmang.vn` | Danh sách đen website lừa đảo, tài khoản ngân hàng vi phạm, chiến dịch lừa đảo công nghệ cao. | CSDL IOCs tĩnh tuyển chọn trong `threatIntelligenceFeed.js` |
| **Cổng Thông Tin Bộ Công An** | `bocongan.gov.vn` | 24 thủ đoạn lừa đảo phổ biến, phương thức mạo danh cơ quan tư pháp (Lệnh bắt, VKS). | Ma trận đối soát tâm lý `psychologicalManipulationEngine.js` |
| **Trung Tâm Xử Lý Tin Giả Việt Nam** | `tingia.gov.vn` & `vafc.gov.vn` | Đính chính tin đồn giả mạo, hình ảnh công văn cắt ghép. | Bộ phân giải mâu thuẫn chéo `crossModalContradictionEngine.js` |
| **Cổng Thông Tin Đào Tạo HCMUTE** | `hcmute.edu.vn` & `fit.hcmute.edu.vn` | Thông báo thu học phí chính thức, số tài khoản ngân hàng nhà trường, quy chế tín chỉ. | Đồ thị thực thể chính danh `universityTuitionRegistry.js` |
