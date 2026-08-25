import { NextResponse } from "next/server";

// In-memory store conforming to ForumPost model (Phần F)
let FORUM_POSTS = [
  {
    id: "post-1",
    category: "nha_tro",
    locationTag: "HUST",
    title: "Cảnh báo phòng trọ ảo ép cọc tại ngõ 27 Tạ Quang Bửu (gần ĐHBK Hà Nội)",
    content: "Có đối tượng đăng tin cho thuê phòng khép kín giá 1.8 triệu đầy đủ điều hòa nóng lạnh nhưng bắt chuyển khoản cọc 1 triệu để 'giữ chỗ không người khác thuê mất'. Mình đến tận ngõ 27 kiểm tra thì số nhà đó không hề cho thuê. Các bạn tân sinh viên cẩn thận nhé!",
    images: ["/assets/scam_room_evidence.jpg"],
    links: ["https://phongtro-fake-sample.com"],
    authorId: "usr_stu_01",
    authorName: "Nguyễn Minh Quân",
    authorAvatar: "student-tech",
    authorTrustScore: 92,
    trustVoteCount: 48,
    distrustVoteCount: 2,
    likeCount: 35,
    createdAt: "2026-02-25T08:30:00.000Z",
  },
  {
    id: "post-2",
    category: "quan_an",
    locationTag: "VNU_HCM",
    title: "Gợi ý quán cơm trưa sinh viên sạch sẽ, chuẩn vị tại Làng Đại học Thủ Đức",
    content: "Quán cơm niêu cô Ba cạnh cổng KTX Khu B bán suất ăn 25k-30k đầy đặn, canh rau miễn phí và cô chủ rất thân thiện với sinh viên. Quán có chứng nhận ATTP treo công khai.",
    images: [],
    links: [],
    authorId: "usr_stu_02",
    authorName: "Trần Bảo Ngọc",
    authorAvatar: "student-creative",
    authorTrustScore: 88,
    trustVoteCount: 62,
    distrustVoteCount: 1,
    likeCount: 54,
    createdAt: "2026-02-25T09:15:00.000Z",
  },
  {
    id: "post-3",
    category: "truong_hoc",
    locationTag: "UTE",
    title: "Hướng dẫn nhận diện đúng Fanpage & Tài khoản thu học phí chính thức trường HCMUTE",
    content: "Mùa đóng học phí kỳ 2 đang diễn ra, lưu ý nhà trường chỉ thu qua cổng online.hcmute.edu.vn và STK định danh ngân hàng BIDV/Vietinbank mang tên Trường ĐH SPKT TP.HCM. Tuyệt đối không chuyển khoản qua STK cá nhân!",
    images: [],
    links: ["https://hcmute.edu.vn/tin-tuc/thong-bao-hoc-phi"],
    authorId: "usr_exp_01",
    authorName: "TS. Nguyễn Minh Đức",
    authorAvatar: "expert-tech",
    authorTrustScore: 99,
    trustVoteCount: 95,
    distrustVoteCount: 0,
    likeCount: 120,
    createdAt: "2026-02-25T10:00:00.000Z",
  },
];

/**
 * GET /api/forum/posts?category=&q=&locationTag=&sortBy=
 * Lấy danh sách bài viết diễn đàn lọc theo keyword/tag (Phần E.2)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const locationTag = (searchParams.get("locationTag") || "").toLowerCase().trim();
    const sortBy = searchParams.get("sortBy") || "ranking"; // 'ranking' | 'newest' | 'likes'

    let filtered = FORUM_POSTS.filter((post) => {
      // 1. Filter by category (truong_hoc | quan_an | nha_tro)
      if (category && category !== "all" && post.category !== category) {
        return false;
      }

      // 2. Filter by locationTag
      if (locationTag && !post.locationTag.toLowerCase().includes(locationTag)) {
        return false;
      }

      // 3. Keyword / Tag search (Full-text matching - E.2)
      if (q) {
        const matchesTitle = post.title?.toLowerCase().includes(q);
        const matchesContent = post.content?.toLowerCase().includes(q);
        const matchesLocation = post.locationTag?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesLocation) {
          return false;
        }
      }

      return true;
    });

    // Ranking algorithm (Phần E.4):
    // rankingScore = trustVoteCount - distrustVoteCount + (author.trustScore / 20)
    filtered.sort((a, b) => {
      if (sortBy === "ranking") {
        const scoreA = a.trustVoteCount - a.distrustVoteCount + ((a.authorTrustScore || 80) / 20);
        const scoreB = b.trustVoteCount - b.distrustVoteCount + ((b.authorTrustScore || 80) / 20);
        return scoreB - scoreA;
      }
      if (sortBy === "likes") {
        return b.likeCount - a.likeCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      posts: filtered,
    });
  } catch (error) {
    console.error("[Forum GET API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải bài viết diễn đàn." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forum/posts
 * Đăng bài viết mới vào diễn đàn
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { category, locationTag, title, content, images, links, authorId, authorName, authorAvatar, authorTrustScore } = body || {};

    if (!content || !title) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề và nội dung bài viết không được để trống." },
        { status: 400 }
      );
    }

    const newPost = {
      id: `post-${Date.now()}`,
      category: category || "nha_tro",
      locationTag: locationTag || "CAMPUS",
      title: title.trim(),
      content: content.trim(),
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
      authorId: authorId || "usr_anonymous",
      authorName: authorName || "Thành viên StudentHub",
      authorAvatar: authorAvatar || "student-tech",
      authorTrustScore: Number(authorTrustScore || 80),
      trustVoteCount: 1, // Tác giả tự vote khởi điểm
      distrustVoteCount: 0,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    };

    FORUM_POSTS.unshift(newPost);

    return NextResponse.json(
      {
        success: true,
        message: "Đăng bài viết thành công!",
        post: newPost,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Forum POST API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi đăng bài viết." },
      { status: 500 }
    );
  }
}
