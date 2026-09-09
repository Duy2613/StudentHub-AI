/**
 * StudentHub Visual System VNext — "Khai Minh"
 * Knowledge Observatory Spatial Ontology
 *
 * Represents the 7 converging layers of authentic student academic trust:
 * 1. Văn bản Quy phạm (Official Regulations & Ministry Standards)
 * 2. Thông báo Học vụ (Academic Circulars & Deadlines)
 * 3. Thẩm định Chứng chỉ (Credential & Certificate Verification)
 * 4. Cảnh báo Rủi ro (Fraud & Financial Risk Detection)
 * 5. Hội đồng Chuyên gia (Domain-Scoped Expert Guild)
 * 6. Cộng đồng Sinh viên (Collective Grounded Intelligence)
 * 7. Lộ trình Tín chỉ (Credit & Prerequisite Architecture)
 */

export const OBSERVATORY_LAYERS = [
  {
    id: "van-ban-phap-quy",
    label: "Văn bản Quy phạm",
    en: "Official Regulations",
    x: -2.1,
    y: 1.4,
    z: 0.2,
    color: "#8EC5FF",
    domain: "Nguồn thẩm quyền",
    description: "Quy chế đào tạo Bộ GD&ĐT, điều lệ trường ĐH & văn bản có giá trị pháp lý.",
  },
  {
    id: "thong-bao-hoc-vu",
    label: "Thông báo Học vụ",
    en: "Academic Circulars",
    x: 0.0,
    y: 1.9,
    z: -0.3,
    color: "#7BE0B2",
    domain: "Tiến độ học tập",
    description: "Thời hạn đóng học phí, lịch đăng ký tín chỉ và quy định điều kiện tốt nghiệp.",
  },
  {
    id: "tham-dinh-chung-chi",
    label: "Thẩm định Chứng chỉ",
    en: "Credential Verification",
    x: 2.1,
    y: 1.2,
    z: 0.4,
    color: "#7BE0B2",
    domain: "Chuẩn đầu ra",
    description: "Đối soát chuẩn ngoại ngữ, tin học và chứng chỉ quốc tế được công nhận.",
  },
  {
    id: "canh-bao-rui-ro",
    label: "Cảnh báo Rủi ro",
    en: "Risk & Fraud Shield",
    x: 2.2,
    y: -0.6,
    z: -0.2,
    color: "#FF9C9C",
    domain: "Bảo vệ sinh viên",
    description: "Phát hiện link học phí giả mạo, học bổng bẫy, nhà trọ lừa cọc qua 4 lớp kiểm định.",
  },
  {
    id: "hoi-dong-chuyen-gia",
    label: "Hội đồng Chuyên gia",
    en: "Expert Guild",
    x: 0.6,
    y: -1.7,
    z: -0.4,
    color: "#F3C56B",
    domain: "Thẩm định học thuật",
    description: "Cố vấn học tập, giảng viên đầu ngành xác minh trong đúng phạm vi chuyên môn.",
  },
  {
    id: "cong-dong-sinh-vien",
    label: "Trí tuệ Sinh viên",
    en: "Collective Intelligence",
    x: -1.7,
    y: -1.1,
    z: 0.5,
    color: "#7BE0B2",
    domain: "Bằng chứng thực tế",
    description: "Dữ liệu phản hồi học phần thực tế, đánh giá giảng viên khách quan có minh chứng.",
  },
  {
    id: "lo-trinh-phat-trien",
    label: "Lộ trình Tín chỉ",
    en: "Credit Roadmap",
    x: -1.6,
    y: 0.2,
    z: -0.5,
    color: "#8EC5FF",
    domain: "Kiến trúc học tập",
    description: "Cây môn học tiên quyết, dự báo cảnh báo học vụ và lộ trình ra trường đúng hạn.",
  },
];

export const OBSERVATORY_RELATIONS = [
  ["van-ban-phap-quy", "thong-bao-hoc-vu"],
  ["thong-bao-hoc-vu", "tham-dinh-chung-chi"],
  ["thong-bao-hoc-vu", "canh-bao-rui-ro"],
  ["canh-bao-rui-ro", "hoi-dong-chuyen-gia"],
  ["hoi-dong-chuyen-gia", "cong-dong-sinh-vien"],
  ["cong-dong-sinh-vien", "lo-trinh-phat-trien"],
  ["lo-trinh-phat-trien", "van-ban-phap-quy"],
  ["tham-dinh-chung-chi", "hoi-dong-chuyen-gia"],
  ["van-ban-phap-quy", "hoi-dong-chuyen-gia"],
];

// Unified canonical export: Observatory layers as primary, with fallback lookup
export const KNOWLEDGE_DOMAINS = [
  ...OBSERVATORY_LAYERS,
  // Legacy aliases to preserve test suite compatibility
  { id: "frontend", label: "Frontend Engineering", x: -2.2, y: 1.4, z: 0.2, color: "#8EC5FF", domain: "Application" },
  { id: "backend", label: "APIs & Backend Logic", x: 0.0, y: 1.8, z: -0.4, color: "#7BE0B2", domain: "Application" },
  { id: "database", label: "Database & Storage", x: 1.8, y: 1.2, z: 0.5, color: "#7BE0B2", domain: "Data & Storage" },
  { id: "security", label: "Security & Trust", x: 2.2, y: -0.5, z: -0.2, color: "#FF9C9C", domain: "Reliability" },
  { id: "ai", label: "AI Systems", x: -1.6, y: -0.8, z: 0.6, color: "#F3C56B", domain: "Intelligence" },
  { id: "system-design", label: "System Design", x: 0.5, y: -1.6, z: -0.5, color: "#FFB66D", domain: "Architecture" },
  { id: "cloud", label: "Cloud & Infra", x: 1.6, y: -1.8, z: 0.3, color: "#8EC5FF", domain: "Platform" },
  { id: "devops", label: "DevOps & CI/CD", x: -0.8, y: -1.9, z: 0.4, color: "#F3C56B", domain: "Reliability" },
  { id: "embedded", label: "Embedded Systems", x: -2.6, y: 0.2, z: -0.6, color: "#7BE0B2", domain: "Hardware" },
];

export const KNOWLEDGE_RELATIONS = [
  ...OBSERVATORY_RELATIONS,
  ["frontend", "backend"],
  ["backend", "database"],
  ["backend", "security"],
  ["database", "system-design"],
  ["backend", "ai"],
  ["backend", "cloud"],
  ["cloud", "devops"],
  ["security", "system-design"],
  ["embedded", "backend"],
  ["frontend", "ai"],
];
