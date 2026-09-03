/**
 * StudentHub AI — HCMUTE Campus Spatial Knowledge Graph
 * 
 * Maps real-world campus entities at Số 1 Võ Văn Ngân, TP. Thủ Đức:
 * - Academic Admin (Tòa Nhà Trung Tâm - PĐT, CTSV, KHTC)
 * - Classroom Halls (Giảng đường Khu A, Khu B, Khu E)
 * - Laboratories & Workshops (FIT Lab, FEEE Lab, FME Workshops)
 * - Emergency & Health (Trạm Y Tế, Chốt Trực Bảo Vệ 24/7)
 * - Logistics (Bãi giữ xe số 1 & 2, Trạm xe buýt Cổng 1)
 */

export const HCMUTE_CAMPUS_SPATIAL_NODES = [
  {
    id: "HCMUTE_GATE_MAIN",
    name: "Cổng Chính (Cổng 1) - Số 1 Võ Văn Ngân",
    category: "GATE_ENTRANCE",
    coordinates: { lat: 10.8507, lng: 106.7721 },
    amenities: ["Chốt bảo vệ 24/7", "Trạm đón trả xe buýt (Tuyến 06, 08, 56)", "Cây ATM"],
    safetyRating: 98,
  },
  {
    id: "HCMUTE_CENTRAL_TOWER",
    name: "Tòa Nhà Trung Tâm (Central Building)",
    category: "ACADEMIC_ADMIN",
    coordinates: { lat: 10.8512, lng: 106.7725 },
    floors: {
      "Floor 1": "Phòng CTSV (Học bổng, Rèn luyện, Giấy xác nhận)",
      "Floor 2": "Phòng Đào Tạo (Học vụ, Đăng ký môn, Phúc khảo đề thi)",
      "Floor 3": "Phòng Kế Hoạch Tài Chính (Biên lai học phí, Miễn giảm)",
    },
    safetyRating: 99,
  },
  {
    id: "HCMUTE_BLOCK_A",
    name: "Giảng Đường Khu A (A-Block)",
    category: "CLASSROOM_HALL",
    coordinates: { lat: 10.8518, lng: 106.7719 },
    departments: ["Khoa CNTT (FIT Lab máy tính)", "Khoa Lý Luận Chính Trị"],
    safetyRating: 95,
  },
  {
    id: "HCMUTE_BLOCK_E",
    name: "Khu Xưởng Thực Hành (E-Block / FME)",
    category: "WORKSHOP",
    coordinates: { lat: 10.8526, lng: 106.7731 },
    departments: ["Khoa Cơ Khí Chế Tạo Máy", "Xưởng Cơ Khí Động Lực"],
    safetyRating: 92,
  },
  {
    id: "HCMUTE_MEDICAL_STATION",
    name: "Trạm Y Tế Trường (Health Clinic)",
    category: "MEDICAL_FIRST_AID",
    coordinates: { lat: 10.8509, lng: 106.7715 },
    services: ["Sơ cứu khẩn cấp", "Cấp phát thuốc cảm sốt cơ bản", "Chuyển tuyến Bệnh viện Thủ Đức"],
    safetyRating: 100,
    emergencyHotline: "(028) 3896 8641",
  },
  {
    id: "HCMUTE_SECURITY_HQ",
    name: "Phòng Trực Bảo Vệ Toàn Trường",
    category: "SECURITY_POINT",
    coordinates: { lat: 10.8508, lng: 106.772 },
    services: ["Tiếp nhận tin báo an ninh", "Xử lý đồ thất lạc", "Bảo vệ đêm 24/7"],
    safetyRating: 100,
    hotline: "(028) 3722 1223 (ext 8113)",
  },
];
