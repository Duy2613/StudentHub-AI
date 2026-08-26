# 🎯 HCMUTE Golden Student Test Scenarios Library
> **Document ID**: `UNI-SCENARIO-GOLD-001` | **Version**: 9.0.0 | **Zero-Fabrication Standard**  
> **Institution**: Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)  

---

## 1. Thư Viện Kịch Bản Sinh Viên Mẫu (Golden Scenarios)

### Kịch Bản 1: Sinh Viên K23 Ngành Kỹ Thuật Phần Mềm (Chuẩn Bị Tốt Nghiệp)
- **Hồ sơ sinh viên**:
  - Khóa: `2023` | Ngành: `7480103` (KTPM)
  - Tín chỉ tích lũy: `150 / 150` | CPA: `3.15`
  - Chứng chỉ: TOEIC 480 (Đạt chuẩn K23 $\ge 450$), GDTC Đạt, GDQP-AN Đạt.
- **Kỳ vọng hệ thống**:
  - `isGraduationReady`: `true`
  - `isThesisEligible`: `true`
  - Không bị ảnh hưởng bởi chuẩn TOEIC 550 của khóa K26.

---

### Kịch Bản 2: Sinh Viên K26 Ngành Kỹ Thuật Phần Mềm (Tân Sinh Viên)
- **Hồ sơ sinh viên**:
  - Khóa: `2026` | Ngành: `7480103` (KTPM)
  - Học kỳ 1: Đạt CPA `0.85`, rớt 0 tín chỉ.
- **Kỳ vọng hệ thống**:
  - Dưới **QĐ 3116/2025** (ngưỡng 0.80), sinh viên **KHÔNG BỊ CẢNH BÁO HỌC VỤ**.
  - Dưới quy chế cũ (ngưỡng 1.00), sinh viên sẽ bị cảnh báo nhầm. Hệ thống phải chứng minh tuân thủ đúng QĐ 3116.
  - Chuẩn đầu ra ngoại ngữ được thiết lập là `TOEIC 550 / B2 International`.

---

### Kịch Bản 3: Sinh Viên K24 Đang Bị Cảnh Báo Học Vụ
- **Hồ sơ sinh viên**:
  - Khóa: `2024` | Ngành: `7480103` (KTPM)
  - Học kỳ 2: Điểm TBHK `0.90` (Dưới ngưỡng 1.00 theo QĐ 3116 Điều 16).
- **Kỳ vọng hệ thống**:
  - Kích hoạt trạng thái: `ACADEMIC_WARNING`
  - Giới hạn tín chỉ đăng ký học kỳ tiếp theo: tối đa `16 tín chỉ` (theo QĐ 3116 Điều 14 Khoản 4).
  - Bắn cảnh báo Radar khẩn cấp tới sinh viên.
