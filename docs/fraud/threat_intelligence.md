# ⚡ StudentHub AI — Threat Intelligence Architecture

> **Document ID**: `FRAUD-THREAT-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Trục Hợp Nhất Dữ Liệu Tình Báo Đe Dọa (Threat Intelligence Fusion)

Hệ thống kết hợp 5 nguồn tình báo phòng thủ độc lập:
1. **URLhaus API (`https://urlhaus-api.abuse.ch/v1/url/`)**: Kiểm tra trực tiếp URL/Tên miền với cơ sở dữ liệu malware/phishing toàn cầu.
2. **NCSC Threat Feed**: Đối soát danh sách đen các số tài khoản nhận tiền lừa đảo và tên miền mạo danh cơ quan Việt Nam.
3. **APWG Threat Vectors**: Nhận diện tấn công Quishing (mã QR độc hại) và Combosquatting thương hiệu.
4. **FTC Sentinel Risk Multipliers**: Đánh giá phương thức thanh toán rủi ro cao (chuyển khoản gấp, tiền mã hóa, thẻ cào).
5. **Fraud Knowledge Graph**: Truy vết mâu thuẫn chéo giữa tên miền khai báo, tên chủ tài khoản thụ hưởng và tổ chức chính danh.
