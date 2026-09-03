# 🔐 StudentHub AI — Authorized Sources & Browser Session Inventory

> **Document ID**: `AUTH-SRC-001` | **Version**: 1.0.0 | **Privacy Tier**: Strict PII Minimization

---

## 1. Nguyên Tắc Quản Trị Phiên Đăng Nhập Được Ủy Quyền (Authorized Session Principles)

1. **Ủy Quyền Tối Thiểu (Principle of Least Privilege)**:
   - Hệ thống chỉ truy vấn các dữ liệu học tập cá nhân (thời khóa biểu, hạn đóng học phí, điểm quá trình) khi người dùng chủ động yêu cầu trong phiên làm việc.
2. **Tuyệt Đối Không Trích Xuất / Lưu Trữ Thông Tin Nhạy Cảm**:
   - **CẤM** trích xuất, in log hoặc lưu trữ cookies, session tokens, passwords, mã OTP hoặc khóa bí mật vào bất kỳ tệp dữ liệu nào.
   - **CẤM** quét hoặc thu thập tin nhắn cá nhân, hồ sơ của sinh viên khác trên các cổng trường hoặc mạng xã hội.
3. **Phân Định Ranh Giới Session**:
   - Việc trình duyệt đang đăng nhập vào một nền tảng **KHÔNG** đồng nghĩa với việc AI có quyền trích xuất hàng loạt (bulk export) dữ liệu ngoài phạm vi dịch vụ sinh viên.

---

## 2. Bảng Kiểm Kê Phiên & Nền Tảng Khả Dụng (Session Inventory)

| Nền Tảng (Platform) | Trạng Thái Truy Cập (Access Status) | Danh Mục Dữ Liệu Khả Dụng | Phạm Vi Ủy Quyền (Scope) | Giới Hạn & Rào Cản (Limitations) | Thời Điểm Xác Thực (Last Verified) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HCMUTE Online Student Portal** (`online.hcmute.edu.vn`) | `AUTHORIZED_USER_SESSION` | Thời khóa biểu học kỳ, Công nợ học phí, Lịch thi, Danh sách lớp học phần | Tài khoản sinh viên hiện tại | Chỉ đọc theo ngữ cảnh người dùng, không quét tài khoản người khác | 2026-08-25 |
| **HCMUTE CTSV Portal** (`ctsv.hcmute.edu.vn`) | `PUBLIC_AUTHORIZED` | Thông báo học bổng doanh nghiệp, Điểm rèn luyện cá nhân, Biểu mẫu trợ cấp | Thông tin công khai + Cá nhân | Phân tách dữ liệu công khai và thông tin riêng | 2026-08-25 |
| **Google Maps Platform** (Routes / Places API) | `API_PERMITTED` | Tọa độ địa lý, Khoảng cách đường đi, Thời gian di chuyển, Trụ sở Công An, Bệnh viện | Toàn bộ các làng ĐH Việt Nam | Dùng cho GPS Routing, không giả định Google Maps tự có nhãn an ninh | 2026-08-25 |
| **NCSC Vietnam Threat Feed** (`tinnhiemmang.vn`) | `PUBLIC_GOVERNMENT` | Danh sách đen tên miền phishing, Danh sách tài khoản ngân hàng lừa đảo | Toàn quốc | Dữ liệu cập nhật liên tục từ Cục An toàn Thông tin | 2026-08-25 |
| **Diễn Đàn UTE Thắc Mắc Học Tập** (Public Community) | `PUBLIC_COMMUNITY` | Câu hỏi học tập, Trao đổi đề thi, Mẹo vượt môn Giải tích, C++, Triết | Bài đăng công khai | Gắn nhãn `TIER_C_PUBLIC_COMMUNITY`, tách biệt Fact vs Opinion | 2026-08-25 |
| **Private Social Groups / Telegram Kín** | `ACCESS_LIMITED / PROHIBITED` | Không áp dụng | **KHÔNG TRUY CẬP** | Tuyệt đối không cào trộm nhóm kín, không bypass quyền riêng tư | 2026-08-25 |

---

## 3. Kế Hoạch Tích Hợp Cho Từng Nền Tảng (Application-Specific Plan)

```
[ USER BROWSER SESSION ]
        │
        ├── Cổng Đào Tạo HCMUTE ──→ Rút trích Thời khóa biểu / Hạn học phí ──→ Đưa vào Personal Student OS
        │
        ├── Bản Đồ An Ninh ───────→ Rút trích Tọa độ Trụ sở Công An / Y tế ─→ Tính toán Tuyến Đường An Toàn
        │
        └── Threat Feeds NCSC ────→ Rà soát Blacklist Tên miền / STK ────────→ Động cơ AI Scam Check
```
