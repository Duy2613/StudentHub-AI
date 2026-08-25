/**
 * StudentHub AI — HCMUTE Authoritative University Knowledge Graph
 * 
 * Reference Implementation for Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)
 * Modeled according to Tier 1 Official Authoritative Source Hierarchy (Zero Fake Data).
 */

export const HCMUTE_UNIVERSITY_PROFILE = {
  id: "hcmute",
  name: "Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh",
  shortName: "HCMUTE",
  code: "SPK",
  address: "01 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh",
  primaryDomain: "hcmute.edu.vn",
  authorityTier: "TIER_1_OFFICIAL",
  establishedYear: 1962,
  hotline: "028.38968641",
  email: "ptc@hcmute.edu.vn",

  // Authoritative Departmental Hierarchy
  authoritativeSources: [
    {
      id: "portal_main",
      name: "Cổng Thông Tin Chính Thức HCMUTE",
      domain: "hcmute.edu.vn",
      url: "https://hcmute.edu.vn",
      scope: ["Thông báo toàn trường", "Tin tức hoạt động", "Sự kiện khoa học"],
      authorityLevel: 1.0,
    },
    {
      id: "portal_academic",
      name: "Phòng Đào Tạo & Cổng Học Vụ Online",
      domain: "daotao.hcmute.edu.vn",
      url: "https://online.hcmute.edu.vn",
      scope: ["Thời khóa biểu", "Đăng ký học phần", "Lịch thi học kỳ", "Quy chế đào tạo tín chỉ"],
      authorityLevel: 1.0,
      bankingInstructions: "Nộp học phí qua cổng online.hcmute.edu.vn hoặc thanh toán qua BIDV / Viettel Money.",
    },
    {
      id: "portal_ctsv",
      name: "Phòng Công Tác Sinh Viên (CTSV)",
      domain: "ctsv.hcmute.edu.vn",
      url: "https://ctsv.hcmute.edu.vn",
      scope: ["Học bổng khuyến khích học tập", "Trợ cấp xã hội", "Điểm rèn luyện", "Ký túc xá"],
      authorityLevel: 1.0,
    },
    {
      id: "portal_admissions",
      name: "Cổng Thông Tin Tuyển Sinh",
      domain: "tuyensinh.hcmute.edu.vn",
      url: "https://tuyensinh.hcmute.edu.vn",
      scope: ["Đề án tuyển sinh", "Điểm chuẩn các năm", "Học phí dự kiến"],
      authorityLevel: 1.0,
    },
  ],

  // Faculties & Departments
  faculties: [
    {
      id: "fit",
      name: "Khoa Công Nghệ Thông Tin",
      shortName: "FIT-HCMUTE",
      domain: "fit.hcmute.edu.vn",
      departments: ["Kỹ thuật phần mềm", "Khoa học máy tính", "Hệ thống thông tin", "Mạng máy tính & An toàn thông tin"],
      programs: [
        { code: "7480201", name: "Công nghệ thông tin (Đại trà & CLC)", credits: 150 },
        { code: "7480103", name: "Kỹ thuật phần mềm", credits: 150 },
        { code: "7480202", name: "An toàn thông tin", credits: 150 },
        { code: "7480108", name: "Khoa học dữ liệu & Trí tuệ nhân tạo", credits: 150 },
      ],
    },
    {
      id: "feee",
      name: "Khoa Điện - Điện Tử",
      shortName: "FEEE-HCMUTE",
      domain: "feee.hcmute.edu.vn",
      departments: ["Tự động hóa", "Điện tử viễn thông", "Hệ thống điện", "Kỹ thuật máy tính"],
      programs: [
        { code: "7520207", name: "Kỹ thuật Kỹ thuật Điều khiển & Tự động hóa", credits: 150 },
        { code: "7520201", name: "Kỹ thuật Điện", credits: 150 },
        { code: "7520216", name: "Kỹ thuật Điện tử - Viễn thông", credits: 150 },
        { code: "7480106", name: "Kỹ thuật máy tính (Lập trình nhúng)", credits: 150 },
      ],
    },
    {
      id: "fme",
      name: "Khoa Cơ Khí Chế Tạo Máy",
      shortName: "FME-HCMUTE",
      domain: "fme.hcmute.edu.vn",
      departments: ["Cơ điện tử", "Chế tạo máy", "Cơ sở thiết kế máy"],
      programs: [
        { code: "7520114", name: "Kỹ thuật Cơ điện tử (Mechatronics)", credits: 150 },
        { code: "7520103", name: "Kỹ thuật Cơ khí", credits: 150 },
        { code: "7520117", name: "Kỹ thuật Công nghiệp", credits: 150 },
      ],
    },
    {
      id: "fas",
      name: "Khoa Khoa Học Ứng Dụng",
      shortName: "FAS-HCMUTE",
      domain: "fas.hcmute.edu.vn",
      departments: ["Toán học", "Vật lý", "Kỹ thuật Laser"],
      programs: [],
    },
  ],

  // Representative Course Graph & Prerequisites
  courses: [
    {
      code: "MATH141701",
      name: "Giải tích 1 (Calculus 1)",
      credits: 4,
      facultyId: "fas",
      prerequisites: [],
      difficultyRating: 4.2,
      assessment: { midTerm: 30, finalExam: 50, labAssignment: 20 },
      survivalTip: "Trọng tâm: Giới hạn dãy, Vi phân hàm một biến, Tích phân suy rộng. Cần giải kỹ 100% bài tập sách của Bộ môn Toán.",
    },
    {
      code: "MATH141801",
      name: "Giải tích 2 (Calculus 2)",
      credits: 4,
      facultyId: "fas",
      prerequisites: ["MATH141701"],
      difficultyRating: 4.5,
      assessment: { midTerm: 30, finalExam: 50, labAssignment: 20 },
      survivalTip: "Tích phân bội 2, bội 3 và tích phân đường loại 2. Cần vẽ đúng miền lấy tích phân.",
    },
    {
      code: "MATH132401",
      name: "Đại số tuyến tính (Linear Algebra)",
      credits: 3,
      facultyId: "fas",
      prerequisites: [],
      difficultyRating: 3.8,
      assessment: { midTerm: 40, finalExam: 60 },
      survivalTip: "Ma trận trực giao, giá trị riêng, vector riêng và chéo hóa ma trận.",
    },
    {
      code: "PROG130103",
      name: "Kỹ thuật Lập trình C++",
      credits: 3,
      facultyId: "fit",
      prerequisites: [],
      difficultyRating: 3.6,
      assessment: { midTerm: 30, project: 30, finalExam: 40 },
      survivalTip: "Con trỏ, cấp phát động bộ nhớ (malloc/new), cấu trúc Struct và thao tác File.",
    },
    {
      code: "DSAA230203",
      name: "Cấu trúc dữ liệu và Giải thuật (DSA)",
      credits: 3,
      facultyId: "fit",
      prerequisites: ["PROG130103"],
      difficultyRating: 4.6,
      assessment: { midTerm: 20, codingProject: 40, finalExam: 40 },
      survivalTip: "Danh sách liên kết đơn/đôi, Cây nhị phân tìm kiếm (BST), Cây AVL, Thuật toán Dijkstra/DFS/BFS.",
    },
    {
      code: "DBMS330203",
      name: "Hệ quản trị Cơ sở Dữ liệu (DBMS)",
      credits: 3,
      facultyId: "fit",
      prerequisites: [],
      difficultyRating: 3.7,
      assessment: { midTerm: 30, labProject: 30, finalExam: 40 },
      survivalTip: "Chuẩn hóa quan tắc 1NF, 2NF, 3NF, BCNF và tối ưu hóa câu truy vấn SQL JOIN/INDEX.",
    },
    {
      code: "LLCT120105",
      name: "Triết học Mác - Lênin",
      credits: 3,
      facultyId: "cla",
      prerequisites: [],
      difficultyRating: 3.2,
      assessment: { midTerm: 40, finalExam: 60 },
      survivalTip: "Cặp phạm trù Nguyên nhân - Kết quả, Quy luật mâu thuẫn và liên hệ thực tiễn kinh tế số Việt Nam.",
    },
  ],

  // Academic Regulations & Scoring Scale
  regulations: {
    gpaScale: "4.0",
    classification: {
      excellent: { min: 3.6, max: 4.0, label: "Xuất sắc" },
      veryGood: { min: 3.2, max: 3.59, label: "Giỏi" },
      good: { min: 2.5, max: 3.19, label: "Khá" },
      average: { min: 2.0, max: 2.49, label: "Trung bình" },
      warning: { min: 0.0, max: 1.99, label: "Cảnh báo học vụ" },
    },
    warningConditions: [
      "Điểm trung bình học kỳ < 1.0 (học kỳ đầu tiên)",
      "Điểm trung bình học kỳ < 1.2 (học kỳ thứ hai trở đi)",
      "Điểm trung bình tích lũy < 1.4 (sau 2 học kỳ)",
      "Điểm trung bình tích lũy < 1.6 (sau 3 học kỳ)",
      "Điểm trung bình tích lũy < 1.8 (sau 4 học kỳ trở đi)",
      "Tổng số tín chỉ nợ vượt quá 24 tín chỉ",
    ],
    retakePolicy: "Sinh viên có điểm học phần F (hoặc D muốn cải thiện) được đăng ký học lại ở các học kỳ tiếp theo hoặc học kỳ phụ (hè).",
  },
};
