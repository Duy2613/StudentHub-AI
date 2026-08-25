# 🩺 StudentHub AI — Source Health Monitoring & Resilience Policy

> **Document ID**: `SRC-HLTH-001` | **Version**: 1.0.0 | **Monitoring Interval**: 1h

---

## 1. Trạng Thái Sức Khỏe Nguồn Dữ Liệu (Source Health Status)

| Nguồn Dữ Liệu | Endpoint / Domain | Tần Suất Quét | Thời Gian Phản Hồi | Tỷ Lệ Sẵn Sàng (Uptime) | Trạng Thái Sức Khỏe | Cơ Chế Fallback Khi Sự Cố |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cổng Đào Tạo HCMUTE** | `online.hcmute.edu.vn` | 1 giờ/lần | $\approx 240\text{ms}$ | $99.4\%$ | `HEALTHY` | Chuyển sang Knowledge Graph tĩnh + RAG bộ nhớ đệm |
| **Phòng Đào Tạo HCMUTE** | `daotao.hcmute.edu.vn` | 6 giờ/lần | $\approx 310\text{ms}$ | $98.9\%$ | `HEALTHY` | Sử dụng văn bản quy chế PDF đã tải về |
| **Phòng CTSV HCMUTE** | `ctsv.hcmute.edu.vn` | 6 giờ/lần | $\approx 280\text{ms}$ | $99.1\%$ | `HEALTHY` | Sử dụng biểu mẫu offline đã xác minh |
| **Khoa CNTT (FIT)** | `fit.hcmute.edu.vn` | 12 giờ/lần | $\approx 210\text{ms}$ | $99.6\%$ | `HEALTHY` | Sử dụng cây đề cương môn học trong Knowledge Graph |
| **NCSC Tín Nhiệm Mạng** | `tinnhiemmang.vn` | 3 giờ/lần | $\approx 180\text{ms}$ | $99.8\%$ | `HEALTHY` | Sử dụng danh sách IOCs Blacklist cục bộ |
| **Google Maps Geocoding** | Google Maps API | Thời gian thực | $\approx 120\text{ms}$ | $99.9\%$ | `HEALTHY` | Sử dụng tọa độ centroid khu vực đã tính sẵn |
| **Tổng Đài Cứu Hộ 112/113** | Viễn thông Quốc gia | Thời gian thực | $< 50\text{ms}$ | $100.0\%$ | `HEALTHY` | Giao thức quay số trực tiếp `tel:` phần cứng |

---

## 2. Quy Tắc Xử Lý Lỗi & Phòng Vệ Ngắt Mạch (Circuit Breaker & Fallback Protocol)

1. **Khi Cổng Web Nhà Trường Tạm Thời Bảo Trì (502 / 504 Gateway Timeout)**:
   - Hệ thống tự động chuyển sang đọc bản sao lưu (Snapshot) mới nhất trong `REAL_KNOWLEDGE_LAKE`.
   - Giao diện người dùng sẽ hiển thị nhãn cảnh báo: `"Dữ liệu từ bản lưu trữ lúc [Timestamp], đang chờ cổng trường hoạt động trở lại"`.
2. **Khi Có Mâu Thuẫn Thông Tin (Conflict Discrepancy)**:
   - Nếu 2 văn bản công bố ngày hết hạn khác nhau, hệ thống kích hoạt `ConflictResolutionEngine` và hiển thị đồng thời cả 2 mốc thời gian kèm ngày ban hành của văn bản mới nhất.
3. **Phòng Thủ SSRF & Chặn Truy Cập Trái Phép**:
   - Mọi yêu cầu truy vấn tài nguyên từ bên ngoài đều bị chặn các dải IP nội bộ (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
