# 👤 HCMUTE Personalized Student Impact & Digital Twin Protocol
> **Document ID**: `UNI-IMPACT-STUDENT-001` | **Version**: 9.0.0 | **Zero-Spam Standard**  
> **Institution**: Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)  

---

## 1. Nguyên Tắc Cảnh Báo Cá Nhân Hóa (Zero-Spam Principle)
- **Chỉ gửi tín hiệu tới đối tượng thực sự bị tác động**: Sinh viên Khóa K23 ngành Cơ khí không bao giờ nhận thông báo thay đổi chuẩn đầu ra TOEIC 550 của Khóa K26 ngành CNTT.
- **Bảo mật danh tính sinh viên**: Phép tính tác động được thực thi trên Digital Twin cục bộ hoặc phiên đăng nhập sinh viên ủy quyền, không công khai danh sách sinh viên bị cảnh báo.

---

## 2. Kịch Bản Minh Họa Đánh Giá Tác Động Thực Tế

### Kịch Bản A: Sinh Viên K26 Nhận Thông Báo Chuẩn Ngoại Ngữ Mới
```json
{
  "studentId": "SV_26110001",
  "cohort": 2026,
  "programCode": "7480103",
  "isAffected": true,
  "impactType": "LANGUAGE_STANDARD_MODIFIED",
  "oldRequirement": "TOEIC 500",
  "newRequirement": "TOEIC 550 / B2 International",
  "requiredAction": "Chuẩn đầu ra Ngoại ngữ điều chỉnh thành [TOEIC 550 / B2 International]. Cần hoàn thành nộp chứng chỉ trước học kỳ 8.",
  "radarAlert": {
    "severity": "HIGH",
    "title": "Cập Nhật Học Vụ Dành Riêng Cho Khóa K26",
    "source": "Khoa Ngoại Ngữ & Phòng Đào Tạo"
  }
}
```

### Kịch Bản B: Sinh Viên K24 Không Bị Ảnh Hưởng Bởi Chuẩn K26
```json
{
  "studentId": "SV_24110001",
  "cohort": 2024,
  "programCode": "7480103",
  "isAffected": false,
  "impactType": "UNAFFECTED",
  "reason": "Quy định mới áp dụng cho khóa [2026] / ngành [7480103], không ảnh hưởng tới khóa K24 ngành 7480103.",
  "radarAlert": null
}
```
