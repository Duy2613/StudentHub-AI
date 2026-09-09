/**
 * Extensible Provider-Oriented Search Architecture (Section 38)
 * Supports local deterministic indexing now and future server/federated search.
 */

export const STATIC_SEARCH_INDEX = [
  // Supporting evidence surfaces
  { id: "case-1", category: "Cases", title: "Evidence Case Lab", href: "/cases", description: "Theo dõi tình huống, lần chạy, phiên bản và nguồn đối chiếu" },

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
  { id: "nav-2", category: "Navigation", title: "Bàn điều khiển cá nhân", href: "/dashboard", description: "Trung tâm các tình huống và việc cần làm" },
  { id: "nav-3", category: "Navigation", title: "Hồ sơ sinh viên", href: "/profile", description: "Thông tin hồ sơ và quyền truy cập của bạn" },
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
