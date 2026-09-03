# 📍 StudentHub AI — Geolocation Source & Quality Hierarchy Registry

> **Document ID**: `GEO-SRC-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Phân Tầng Nguồn Định Vị (Location Source Hierarchy)

Mọi tọa độ địa lý trong hệ thống được coi là **Quan sát (Observation)** có gắn kèm sai số không chắc chắn ($\pm \text{meters}$), thời gian thực nhận và nguồn gốc truy vết:

| Nguồn Định Vị (Source ID) | Phương Thức Thu Nhận | Độ Không Chắc Chắn Mặc Định (Uncertainty Radius) | Đánh Giá Chất Lượng (Quality Grade) | Điều Kiện Sử Dụng & Giới Hạn |
| :--- | :--- | :---: | :---: | :--- |
| **`DEVICE_GPS`** | Chip phần cứng GNSS (GPS / GLONASS / Galileo) | $\pm 3\text{m} - 10\text{m}$ | `EXCELLENT` | Hoạt động tối ưu ngoài trời; suy hao trong hầm hoặc nhà cao tầng. |
| **`BROWSER_GEOLOCATION`** | `navigator.geolocation.getCurrentPosition` | $\pm 10\text{m} - 50\text{m}$ | `GOOD / ACCEPTABLE` | Phụ thuộc quyền cấp phép `LOCATION_GRANTED` của người dùng. |
| **`GOOGLE_GEOLOCATION_API`** | Cell Towers (Trạm BTS) & Wi-Fi BSSID Triangulation | $\pm 25\text{m} - 100\text{m}$ | `ACCEPTABLE` | Yêu cầu API Key & Hạn mức tính phí; hỗ trợ định vị sơ bộ trong nhà. |
| **`MAP_GEOCODING`** | Reverse Geocoding địa chỉ hành chính | $\pm 50\text{m} - 200\text{m}$ | `ACCEPTABLE` | Dùng để hiển thị tên đường/phường; không thay thế tọa độ thô. |
| **`USER_SELECTED_LOCATION`**| Người dùng ghim thủ công trên bản đồ | Xác định theo điểm ghim | `USER_VERIFIED` | Nguồn có chủ đích từ người dùng. |
| **`CAMERA_LOCATION`** | Tọa độ lắp đặt camera giao thông cố định | $\pm 1\text{m}$ (Khảo sát thực tế) | `SURVEY_GRADE` | Dùng làm mốc đối soát mặt đường. |
| **`FACILITY_LOCATION`** | Tọa độ trụ sở Công An, Bệnh Viện, Cổng Trường | $\pm 2\text{m}$ (Bản đồ quy hoạch) | `SURVEY_GRADE` | Điểm an toàn đối chiếu. |

---

## 2. Cổng Kiểm Soát Chất Lượng & Chống Nhảy Vị Trí Ảo (Spike Detection)

1. **Bộ lọc dịch chuyển phi lý (Invalid Teleportation)**:
   - Nếu $\Delta d > 500\text{m}$ trong thời gian $\Delta t \le 5\text{s}$ (vận tốc tính toán $> 120\text{ km/h}$ trong đô thị) $\longrightarrow$ Kích hoạt cờ `INVALID_POSITION_JUMP`.
2. **Bộ lọc làm mượt nhiễu (GPS Smoothing)**:
   - Sử dụng giải thuật Exponential Moving Average ($\alpha = 0.65$) để triệt tiêu dao động dừng đèn đỏ; đồng thời bảo tồn nguyên vẹn cả `RAW_LOCATION` và `FILTERED_LOCATION`.
