/**
 * Extensible Provider-Oriented Search Architecture (Section 38)
 * Supports local deterministic indexing now and future server/federated search.
 */

export const STATIC_SEARCH_INDEX = [
  // Courses
  { id: "c-1", category: "Courses", title: "Full-Stack Web Systems", href: "/learn", description: "Từ giao diện đến database và kiến trúc phân tán" },
  { id: "c-2", category: "Courses", title: "Distributed Systems & Cloud Architecture", href: "/learn", description: "CAP Theorem, Event Sourcing & High Availability" },
  { id: "c-3", category: "Courses", title: "AI Engineering & Epistemic Evaluation", href: "/learn", description: "Xác thực mô hình AI, RAG có nguồn tin và giảm ảo giác" },
  { id: "c-4", category: "Courses", title: "Security, RLS & Zero-Trust Authentication", href: "/learn", description: "Bảo vệ BOLA, Row Level Security và mã hóa JWT/JWKS" },

  // Lessons
  { id: "l-1", category: "Lessons", title: "Modern State Architectures & Concurrent React", href: "/learn/full-stack/lesson-1", description: "Quản lý state phức tạp và tối ưu render pipeline" },
  { id: "l-2", category: "Lessons", title: "Indexing, B-Trees & Query Optimization", href: "/learn/full-stack/lesson-2", description: "Tối ưu hóa truy vấn PostgreSQL và cấu trúc chỉ mục" },
  { id: "l-3", category: "Lessons", title: "Row Level Security (RLS) & Zero-Trust Auth", href: "/learn/security/lesson-1", description: "Thiết kế ma trận bảo mật và phân quyền nguyên tử" },

  // Practice
  { id: "p-1", category: "Practice", title: "BOLA / IDOR Defense Challenge", href: "/practice", description: "Thực hành phát hiện và ngăn chặn lỗ hổng kiểm soát truy cập" },
  { id: "p-2", category: "Practice", title: "Database Deadlock Resolution", href: "/practice", description: "Xử lý tranh chấp giao dịch đồng thời trong PostgreSQL" },
  { id: "p-3", category: "Practice", title: "Cache Stampede Mitigation", href: "/practice", description: "Thiết kế khóa mutex và probabilistic early expiration" },

  // Projects
  { id: "pr-1", category: "Projects", title: "StudentHub Evidence Case Lab", href: "/cases", description: "Hệ thống đối soát bằng chứng học vụ 4 tầng độc lập" },
  { id: "pr-2", category: "Projects", title: "Living Evidence Passport Engine", href: "/projects", description: "Hồ sơ số chứng thực kỹ năng và kết quả học tập" },
  { id: "pr-3", category: "Projects", title: "Campus Academic Radar", href: "/academic", description: "Dự báo rủi ro tín chỉ và tiến độ tốt nghiệp" },

  // Trust
  { id: "t-1", category: "Trust", title: "Kiểm tra học bổng & cơ hội thực tập", href: "/trust", description: "Xác thực tính pháp lý và nguồn phát hành thông báo" },
  { id: "t-2", category: "Trust", title: "Đối chiếu văn bản học vụ HCMUTE", href: "/trust", description: "Tra cứu quyết định và biểu mẫu đào tạo chính thức" },

  // Community
  { id: "cm-1", category: "Community", title: "Diễn đàn trao đổi học thuật & môn học", href: "/community", description: "Kinh nghiệm đăng ký môn, ma sát thực tế và đánh giá" },
  { id: "cm-2", category: "Community", title: "Báo cáo sự cố & quy trình xét duyệt", href: "/community", description: "Cảnh báo sớm từ mạng lưới sinh viên các khóa" },

  // Experts
  { id: "ex-1", category: "Experts", title: "Mạng lưới cố vấn học vụ & giảng viên", href: "/expert", description: "Kết nối chuyên gia xác thực theo đúng thẩm quyền" },
  { id: "ex-2", category: "Experts", title: "Hội đồng hướng dẫn đồ án tốt nghiệp", href: "/expert", description: "Tra cứu phạm vi chuyên môn và các đề tài bảo vệ" },

  // Navigation
  { id: "nav-1", category: "Navigation", title: "Lộ trình học tập (Roadmap)", href: "/roadmap", description: "Biểu đồ quan hệ môn học và kế hoạch tốt nghiệp" },
  { id: "nav-2", category: "Navigation", title: "Bàn điều khiển cá nhân (Dashboard)", href: "/dashboard", description: "Trung tâm chỉ huy học vụ, cảnh báo sớm và việc cần làm" },
  { id: "nav-3", category: "Navigation", title: "Hồ sơ sinh viên 360", href: "/profile", description: "Thông tin học vụ, chứng chỉ và kết quả tích lũy" },
];

/**
 * Search Provider interface
 */
export async function searchCanonicalProduct(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return [];

  // Local deterministic search
  const matches = STATIC_SEARCH_INDEX.filter((item) => {
    return (
      item.title.toLowerCase().includes(normalized) ||
      item.description.toLowerCase().includes(normalized) ||
      item.category.toLowerCase().includes(normalized)
    );
  });

  // Group by category
  const groups = {};
  matches.forEach((item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  return groups;
}
