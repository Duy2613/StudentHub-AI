# 🚨 StudentHub AI — Emergency Hotlines & Rescue Action Registry

> **Document ID**: `EMERG-SRC-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Danh Bạ Tổng Đài Khẩn Cấp Quốc Gia & Cứu Hộ Sinh Viên

| Đầu Số (Hotline) | Đơn Vị Tiếp Nhận Tiếp Ứng | Phạm Vi & Thẩm Quyền | Giao Thức Kích Hoạt (Mechanism) | Trạng Thái Tích Hợp Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| **`112`** | Tổng đài Cứu nạn Quốc gia | Tìm kiếm cứu nạn, sự cố thiên tai | `tel:112` Native Dialer | `CALL_ACTION_AVAILABLE` (Không có API điều phối) |
| **`113`** | Cảnh sát Phản ứng Nhanh | An ninh trật tự, tội phạm, cướp giật | `tel:113` Native Dialer | `CALL_ACTION_AVAILABLE` (Không có API điều phối) |
| **`114`** | Cứu hỏa & Cứu nạn Cứu hộ | Hỏa hoạn, sự cố kẹt thang máy, ngập lụt | `tel:114` Native Dialer | `CALL_ACTION_AVAILABLE` (Không có API điều phối) |
| **`115`** | Cấp cứu Y tế Toàn quốc | Tai nạn giao thông, cấp cứu sức khỏe | `tel:115` Native Dialer | `CALL_ACTION_AVAILABLE` (Không có API điều phối) |
| **`028.38966882`** | Công An Phường Linh Chiểu | Khu vực Trường HCMUTE & Ký Túc Xá | `tel:02838966882` Direct Call | `CALL_ACTION_AVAILABLE` (Số điện thoại công vụ xác thực) |
| **`028.37242160`** | Đồn Công An ĐHQG-HCM | Khu vực Ký Túc Xá Khu A & Khu B | `tel:02837242160` Direct Call | `CALL_ACTION_AVAILABLE` (Số điện thoại công vụ xác thực) |

---

## 2. Giao Thức Kích Hoạt Có Chủ Đích (Hold-2s Intentional Trigger)

* **Tránh bấm nhầm (False Positive Prevention)**:
  - Nút SOS yêu cầu sinh viên nhấn giữ liên tục **2.0 giây** kèm hiệu ứng đếm ngược trực quan và phản hồi âm thanh rung `haptic`.
* **Đồng hành di chuyển (Trip Companion)**:
  - Cho phép hẹn giờ hành trình (ví dụ: 20 phút); nếu chưa nhấn xác nhận "Đến Nơi An Toàn", ứng dụng sẽ tự động kích hoạt cảnh báo nhắc nhở sinh viên kiểm tra vị trí.
