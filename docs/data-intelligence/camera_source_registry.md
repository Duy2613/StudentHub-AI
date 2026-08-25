# 📹 StudentHub AI — Camera Source Registry & Computer Vision Standards

> **Document ID**: `CAM-REG-001` | **Version**: 1.0.0 | **Authority**: Sở GTVT TP.HCM & ĐHQG-HCM

---

## 1. Danh Mục Camera Giao Thông Thực Tế Khu Vực Thủ Đức & HCMUTE

| Camera ID | Provider / Operator | Tuyến Đường & Nút Giao | Tọa Độ (Lat, Lng) | Hướng Quan Sát (Heading) | Trạng Thái Truy Cập | Tần Suất Cập Nhật | Độ Tin Cậy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CAM_TD_01` | Sở GTVT TP.HCM (`giaothong.hochiminhcity.gov.vn`) | Ngã tư Thủ Đức (Võ Văn Ngân - Võ Nguyên Giáp) | `10.8528, 106.7716` | Đông Bắc $\rightarrow$ Cầu vượt Thủ Đức | `PUBLIC_VISIBLE / PROGRAMMATIC_UNCONFIRMED` | 15–30s/frame | **0.95** |
| `CAM_TD_02` | Sở GTVT TP.HCM / UTE Gate | Cổng chính HCMUTE (Số 1 Võ Văn Ngân) | `10.8507, 106.7721` | Tây Nam $\rightarrow$ Tòa nhà Trung tâm | `PUBLIC_VISIBLE / CAMPUS_AUTHORIZED` | 15–30s/frame | **0.98** |
| `CAM_TD_03` | Sở GTVT TP.HCM | Ngã ba Đặng Văn Bi - Võ Văn Ngân | `10.8465, 106.7645` | Tây Bắc $\rightarrow$ Chợ Thủ Đức | `PUBLIC_VISIBLE / PROGRAMMATIC_UNCONFIRMED` | 15–30s/frame | **0.92** |
| `CAM_TD_04` | Sở GTVT TP.HCM | Ngã tư Bình Thái (Đỗ Xuân Hợp - Võ Nguyên Giáp) | `10.8285, 106.7662` | Đông Nam $\rightarrow$ Ga Metro Bình Thái | `PUBLIC_VISIBLE / PROGRAMMATIC_UNCONFIRMED` | 15–30s/frame | **0.94** |
| `CAM_TD_05` | Ban Quản lý ĐHQG-HCM | Cổng Ký túc xá Khu B ĐHQG (Tạ Quang Bửu) | `10.8805, 106.7825` | Bắc $\rightarrow$ Tòa D5 - D6 KTX | `PUBLIC_AUTHORIZED` | 30s/frame | **0.96** |
| `CAM_TD_06` | Sở GTVT TP.HCM | Nút giao Tô Ngọc Vân - Phạm Văn Đồng | `10.8652, 106.7512` | Tây $\rightarrow$ Cầu vượt Linh Xuân | `PUBLIC_VISIBLE / PROGRAMMATIC_UNCONFIRMED` | 15–30s/frame | **0.93** |

---

## 2. Tiêu Chuẩn Kiểm Tra Chất Lượng Khung Hình (Frame Quality Gate)

Mọi khung hình camera trước khi đưa vào mô hình Vision bắt buộc phải được đánh giá qua 4 thông số:

1. **Độ Sáng & Độ Tương Phản (`brightness`, `contrast`)**: Phát hiện điều kiện ban đêm, chói sáng (glare) hoặc ngược sáng mạnh.
2. **Hiện Tượng Nhòe & Mất Tiêu Cự (`blur_index`)**: Tính toán qua phương sai Laplacian ($\sigma^2 \ge 100$).
3. **Giọt Nước Bám Trên Ống Kính (`lens_droplets`)**: Nhận diện biến dạng quang học cục bộ trên bề mặt kính để không nhầm thành ngập lụt toàn cảnh.
4. **Khung Hình Đóng Băng / Quá Hạn (`stale_frame`)**: Kiểm tra timestamp; nếu ảnh không đổi sau $> 120\text{s}$ gắn nhãn `FRAME_STALE` và hạ điểm tin cậy về $0.1$.

---

## 3. Phân Biệt Bằng Chứng Thị Giác vs Kết Luận Khí Tượng

* **Bằng chứng thị giác từ camera (Camera Visual Cues)**: Vệt nước bắn từ bánh xe (tire spray), người đi bộ mặc áo mưa / che dù, mặt đường bóng loáng (road sheen), vệt mưa rơi (rain streaks), nước đọng ven lề (standing water).
* **Quy tắc khoa học**:
  > *"Camera chỉ cung cấp bằng chứng hiện trường về trạng thái mưa và mặt đường tại thời điểm quan sát. Tuyệt đối không dùng camera đơn lẻ để dự báo lượng mưa chính xác bằng milimet hoặc dự báo thời tiết 3 giờ tới mà không có radar/vệ tinh."*
