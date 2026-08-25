# 🌐 StudentHub AI — International Threat Intelligence Sources

> **Document ID**: `FRAUD-INTL-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Các Nguồn Dữ Liệu Quốc Tế Chính Thức

### 🏛️ A. FTC Consumer Sentinel Network (Hoa Kỳ)
* **Nguồn**: `https://www.ftc.gov/reports/consumer-sentinel-network-data-book-2024`
* **Loại dữ liệu**: Báo cáo tổng hợp số liệu thống kê tội phạm lừa đảo người tiêu dùng năm 2024.
* **Top 5 Danh mục lừa đảo**:
  1. *Mạo danh (Impersonation Scams)*: Thiệt hại trung vị $800 USD.
  2. *Mua sắm trực tuyến & Hàng giả (Online Shopping)*: Thiệt hại trung vị $180 USD.
  3. *Lừa đảo việc làm / CTV (Job & Task Scams)*: Thiệt hại trung vị $1,200 USD.
  4. *Lừa đảo đầu tư & Tiền ảo (Investment Scams)*: Thiệt hại trung vị $3,500 USD.
  5. *Trúng thưởng & Học bổng giả (Prizes & Sweepstakes)*: Thiệt hại trung vị $500 USD.
* **Kênh tiếp cận chính**: Mạng xã hội (thiệt hại lớn nhất), Tin nhắn SMS (số lượng báo cáo nhiều nhất), Cuộc gọi thoại, Email.

### 🛡️ B. APWG (Anti-Phishing Working Group)
* **Nguồn**: `https://apwg.org/trendreports`
* **Loại dữ liệu**: Báo cáo định kỳ quý về xu hướng tấn công lừa đảo trực tuyến toàn cầu.
* **Các vector tấn công nổi bật**:
  - *Quishing (QR Code Phishing)*: Nhúng mã QR độc hại trong email/ảnh để vượt tường lửa văn bản.
  - *Brand Combosquatting*: Ghép tên miền thương hiệu ngân hàng/trường học với hậu tố đánh lừa (`-online`, `-otp`).
  - *BEC (Business Email Compromise)*: Giả mạo lãnh đạo/giảng viên yêu cầu chuyển tiền gấp.

### ⚡ C. URLhaus by abuse.ch
* **Nguồn**: `https://urlhaus.abuse.ch/api/`
* **Loại dữ liệu**: REST API cộng đồng kiểm tra URL độc hại, trang web phân phối mã độc, botnet C2 và phishing.
* **Tích hợp trong StudentHub AI**: [`urlhausClient.js`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/ai-trust/threat-intel/urlhausClient.js) thực hiện tra cứu trực tiếp với cơ chế cache 15 phút và bảo vệ timeout 2.5s.
