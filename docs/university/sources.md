# 🏛️ HCMUTE Authoritative University Source Registry
> **Document ID**: `UNI-SRC-HCMUTE-001` | **Version**: 9.0.0 | **Zero-Fabrication Standard**  
> **Reference Institution**: Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)  

---

## 1. 8 Trạng Thái Nguồn Học Thuật (Source State Machine)
- `DISCOVERED`: Tìm thấy cổng / phân hệ thông tin qua DNS hoặc liên kết chính thống.
- `ACCESSIBLE`: Kiểm tra kết nối mạng HTTP 200 OK thành công.
- `READABLE`: Dữ liệu HTML / PDF / API có thể bóc tách cấu trúc rõ ràng.
- `INGESTING`: Đang nạp văn bản và tài liệu vào Master Data Lake.
- `SYNCING`: Đang đối soát và đồng bộ lịch đào tạo theo chu kỳ.
- `VERIFIED`: Đã qua kiểm tra đối chiếu nguồn cấp 1 (Tier 1 Gold).
- `PRODUCTION_READY`: Hoàn toàn sẵn sàng phục vụ cho suy luận học thuật.

---

## 2. Bảng Đăng Ký Chi Tiết Toàn Bộ Nguồn Tin HCMUTE

| Source ID | Tên Cổng / Đơn Vị | Tên Miền / URL | Loại Nguồn | Cấp Thẩm Quyền | Phương Thức Truy Cập | Chu Kỳ Cập Nhật | Trạng Thái Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `SRC_HCMUTE_PORTAL` | Cổng thông tin trường | `hcmute.edu.vn` | Web Chính | `TIER_1_OFFICIAL` | Public Web | Hàng ngày | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_DAOTAO` | Phòng Đào tạo & Học vụ | `daotao.hcmute.edu.vn` | Web Đào tạo| `TIER_1_OFFICIAL` | Public Web | Hàng ngày | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_ONLINE` | Cổng học vụ sinh viên | `online.hcmute.edu.vn` | Web Học vụ | `TIER_1_OFFICIAL` | Auth Scoped | Thời gian thực| **`PRODUCTION_READY`** |
| `SRC_HCMUTE_CTSV` | Phòng Công tác Sinh viên| `ctsv.hcmute.edu.vn` | Web CTSV | `TIER_1_OFFICIAL` | Public Web | Hàng tuần | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_TUYENSINH`| Cổng Tuyển sinh | `tuyensinh.hcmute.edu.vn` | Tuyển sinh | `TIER_1_OFFICIAL` | Public Web | Hàng tháng | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_FIT` | Khoa CNTT | `fit.hcmute.edu.vn` | Khoa | `TIER_1_OFFICIAL` | Public Web | Hàng tuần | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_FEEE` | Khoa Điện - Điện tử | `feee.hcmute.edu.vn` | Khoa | `TIER_1_OFFICIAL` | Public Web | Hàng tuần | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_FME` | Khoa Cơ khí Chế tạo máy | `fme.hcmute.edu.vn` | Khoa | `TIER_1_OFFICIAL` | Public Web | Hàng tuần | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_QLCL` | Phòng Quản lý Chất lượng| `qlcl.hcmute.edu.vn` | Khảo sát | `TIER_1_OFFICIAL` | Public Web | Học kỳ | **`PRODUCTION_READY`** |
| `SRC_HCMUTE_THUVIEN` | Thư viện trường | `thuvien.hcmute.edu.vn` | Thư viện | `TIER_1_OFFICIAL` | Public Web | Hàng tháng | **`PRODUCTION_READY`** |
