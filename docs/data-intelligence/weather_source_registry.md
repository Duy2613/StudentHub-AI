# 🌦️ StudentHub AI — Weather Source Registry & Multi-Sensor Nowcasting

> **Document ID**: `WX-REG-001` | **Version**: 1.0.0 | **Authority**: NCHMF (Trung tâm Dự báo KTTV Quốc gia) & Open-Meteo

---

## 1. Danh Mục Nguồn Khí Tượng & Viễn Thám Thực Tế

| Source ID | Provider / Operator | Loại Dữ Liệu | Phạm Vi / Tọa Độ | Tần Suất Cập Nhật | Định Dạng Dữ Liệu | Độ Tin Cậy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `WX_NCHMF_RADAR` | Trung tâm KTQT KTTV (`hymetnet.gov.vn`) | Radar thời tiết Nhà Bè (Độ phản hồi dBZ, Vận tốc gió Doppler) | TP.HCM & Bán kính 150km | 10–15 phút/lần | Raster Image / NetCDF | **0.96** |
| `WX_NCHMF_SAT` | Trung tâm Dự báo KTTV Quốc gia (`nchmf.gov.vn`) | Vệ tinh Himawari-9 (Ảnh mây hồng ngoại IR, Kênh hơi nước Water Vapor) | Đông Nam Á / Nam Bộ | 15–30 phút/lần | Gridded GeoTIFF / PNG | **0.95** |
| `WX_NCHMF_WARN` | Ban Chỉ đạo QG PCTT & NCHMF | Cảnh báo dông lốc sét, mưa lớn diện rộng, ngập lụt đô thị TP.HCM | TP.HCM / TP. Thủ Đức | Theo sự kiện (Event-driven) | Official Text Bulletins | **1.00** |
| `WX_STATION_TSN` | Trạm Khí tượng Sân bay Tân Sơn Nhất (METAR / SYNOP) | Nhiệt độ, Độ ẩm, Áp suất, Tốc độ gió, Tầm nhìn thực | `10.8188, 106.6520` | 30 phút/lần | METAR Code / JSON | **0.99** |
| `WX_OPEN_METEO` | Open-Meteo Scientific Weather API | Dự báo số trị (NWP: GFS, ECMWF IFS, DWD ICON) | `10.8524, 106.7712` (Thủ Đức) | 1 giờ/lần | REST JSON API | **0.92** |
| `WX_RAIN_MAP` | Trung tâm Điều hành Chống ngập TP.HCM (UBND TP.HCM) | Bản đồ điểm ngập nước theo thời gian thực | Tuyến đường Võ Văn Ngân, Tô Ngọc Vân... | 15 phút/lần trong mùa mưa | Public Web GIS | **0.94** |

---

## 2. Mô Hình Dự Báo Ngắn Hạn (Weather Nowcaster Horizons)

Hệ thống phân tách rõ 4 khung thời gian dự báo ngắn hạn (Nowcasting Horizons):

1. **Khung 0 – 15 phút (`NOWCAST_0_15M`)**: Trọng số cao nhất từ **Camera Visual Evidence ($40\%$) + Radar Nhà Bè ($40\%$) + Trạm Quan Trắc ($20\%$)**. Xác suất chính xác đạt $\approx 92\%$.
2. **Khung 15 – 30 phút (`NOWCAST_15_30M`)**: Trọng số chính từ **Radar Cell Tracking Vector ($55\%$) + Vệ tinh ($25\%$) + Mô hình số trị ($20\%$)**.
3. **Khung 30 – 60 phút (`NOWCAST_30_60M`)**: Trọng số chính từ **Vệ tinh Hồng Ngoại ($45\%$) + Mô hình số trị ($35\%$) + Cảnh báo NCHMF ($20\%$)**.
4. **Khung 1 – 3 giờ (`NOWCAST_1_3H`)**: Trọng số chính từ **Mô hình số trị ECMWF/GFS ($60\%$) + Bản tin cảnh báo chính thức NCHMF ($40\%$)** (Camera không còn đóng vai trò dự báo ở khung này).

---

## 3. Máy Trạng Thái Khí Tượng (Weather State Machine Transitions)

$$\text{CLEAR} \longrightarrow \text{PARTLY\_CLOUDY} \longrightarrow \text{OVERCAST} \longrightarrow \text{RAIN\_APPROACHING} \longrightarrow \text{LIGHT\_RAIN} \longrightarrow \text{HEAVY\_DOWNPOUR} \longrightarrow \text{STORM\_LIKE} \longrightarrow \text{RAIN\_WEAKENING} \longrightarrow \text{CLEARING}$$
