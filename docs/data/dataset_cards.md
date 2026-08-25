# 📇 STUDENTHUB AI — MASTER DATASET CARDS
> **Document ID**: `DATA-CARD-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Dataset Card: CSDL Điều Khoản Luật Phòng Thủ Sinh Viên (`DS_VN_LEGAL_2024`)

* **Nguồn gốc**: Trích xuất nguyên văn từ Văn bản quy phạm pháp luật:
  - *Bộ Luật Lao Động 2019* (Luật số 45/2019/QH14) - Điều 17 (Hành vi người sử dụng lao động không được làm).
  - *Luật Nhà Ở 2023* (Luật số 27/2023/QH15) & *Bộ Luật Dân Sự 2015* - Điều 472 (Hợp đồng thuê nhà).
* **Mục đích sử dụng**: Làm luật căn cứ tất định đối soát hợp đồng thuê trọ và hợp đồng làm việc bán thời gian.
* **Tỷ lệ thực tế**: **100% Real Legal Source** | **PII Review**: Đã xóa thông tin cá nhân trong án lệ.

---

## 2. Dataset Card: Tập Dữ Liệu Hard Negatives Chống Báo Động Nhầm (`DS_HARD_NEGATIVES`)

* **Nguồn gốc**: Cảnh báo an ninh từ các ngân hàng (Vietcombank, Techcombank, BIDV, MB) và các bài viết giáo dục an toàn mạng.
* **Mục đích sử dụng**: Huấn luyện mô hình phân biệt giữa *"Tin cảnh báo lừa đảo"* vs *"Tin lừa đảo thực sự"*, chống hiện tượng gắn cờ nhầm từ khóa `OTP` / `ngân hàng`.
* **Tỷ lệ thực tế**: **100% Real Authentic Text** | **Nhãn**: `LEGITIMATE (ALLOW)`.
