# 🏫 StudentHub AI — HCMUTE Campus Geo-Intelligence Graph

> **Document ID**: `CAMPUS-GEO-001` | **Version**: 1.0.0 | **Campus**: Số 1 Võ Văn Ngân, TP. Thủ Đức, TP.HCM

---

## 1. Đồ Thị Không Gian Khuôn Viên Trường (Campus Spatial Graph)

| Mã Điểm (Node ID) | Tên Khu Vực / Địa Điểm | Loại Hình (Category) | Tọa Độ Thực Tế (Lat, Lng) | Chức Năng Cốt Lõi |
| :--- | :--- | :--- | :--- | :--- |
| `HCMUTE_GATE_MAIN` | Cổng Chính (Cổng 1) | `GATE_ENTRANCE` | `10.8507, 106.7721` | Cổng vào số 1 Võ Văn Ngân, chốt bảo vệ 24/7, trạm đón trả xe buýt |
| `HCMUTE_CENTRAL_TOWER` | Tòa Nhà Trung Tâm (Central Tower) | `ACADEMIC_ADMIN` | `10.8512, 106.7725` | Ban Giám Hiệu, Phòng Đào Tạo (Tầng 2), Phòng CTSV (Tầng 1), Văn phòng Tiếp sinh viên |
| `HCMUTE_BLOCK_A` | Giảng Đường Khu A (A-Block) | `CLASSROOM_HALL` | `10.8518, 106.7719` | Giảng đường đại cương, phòng máy tính khoa CNTT (FIT Lab), phòng học Lý luận chính trị |
| `HCMUTE_BLOCK_B` | Khu Thí Nghiệm Khu B (B-Block) | `LABORATORY` | `10.8522, 106.7724` | Phòng thí nghiệm Điện tử viễn thông, IoT, Điều khiển tự động |
| `HCMUTE_BLOCK_E` | Khu Xưởng Thực Hành (E-Block / FME) | `WORKSHOP` | `10.8526, 106.7731` | Xưởng Cơ khí chế tạo máy, Xưởng Ô tô, Xưởng CNC |
| `HCMUTE_LIBRARY` | Thư Viện Trung Tâm ĐH SPKT | `LIBRARY_STUDY` | `10.8514, 106.7730` | Phòng tự học 24/7, kho tài liệu luận văn, trạm tra cứu thông tin học thuật |
| `HCMUTE_MEDICAL_STATION` | Trạm Y Tế Trường (Health Clinic) | `MEDICAL_FIRST_AID` | `10.8509, 106.7715` | Sơ cấp cứu ban đầu, cấp phát thuốc cảm sốt, chuyển tuyến Bệnh viện Thủ Đức |
| `HCMUTE_SECURITY_HQ` | Phòng Trực Bảo Vệ Toàn Trường | `SECURITY_POINT` | `10.8508, 106.7720` | Tiếp nhận tin báo mất cắp, hỗ trợ khẩn cấp trong khuôn viên, bàn giao tài sản thất lạc |
| `HCMUTE_PARKING_ZONE` | Nhà Giữ Xe Sinh Viên (Bãi xe số 1 & 2) | `PARKING_AREA` | `10.8505, 106.7728` | Bãi giữ xe máy có camera giám sát thông minh |
| `HCMUTE_BUS_STOP` | Trạm Xe Buýt ĐH Sư Phạm Kỹ Thuật | `PUBLIC_TRANSIT` | `10.8503, 106.7718` | Tuyến xe buýt 06, 08, 56, 104, 150 kết nối Làng ĐH và Trung tâm Quận 1 |

---

## 2. Các Tuyến Đường Nội Bộ & Điểm Tránh Mưa Ngập

1. **Lối Đi Có Mái Che (Covered Walkway)**: Nối từ Cổng chính $\rightarrow$ Tòa Nhà Trung Tâm $\rightarrow$ Giảng đường Khu A $\rightarrow$ Thư viện.
2. **Khu Vực Nguy Cơ Đọng Nước Khi Mưa Lớn**: Tuyến đường dốc từ Xưởng Cơ khí ra Cổng phụ sau (cần cảnh báo giảm tốc độ khi mặt đường ướt).
