import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { PostgresForumRepository } from "@/lib/forum/PostgresForumRepository.js";
import { DatabaseUnavailableError } from "@/lib/server/database/PostgresPool.js";
import { createSecureId } from "@/lib/security/secureId.js";

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
const REACTION_LEDGER = new Map();
const COMMENTS_BY_POST = new Map();

const VALID_CATEGORIES = new Set(["truong_hoc", "quan_an", "nha_tro"]);
const MAX_TITLE_LENGTH = 180;
const MAX_CONTENT_LENGTH = 6000;

function normalizeText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function safeLinks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((link) => String(link || "").trim())
    .filter((link) => /^https:\/\//i.test(link))
    .slice(0, 5);
}

function enrichIntegrity(post) {
  const evidenceCount = (post.links || []).length + (post.images || []).length;
  const contentLength = (post.content || "").length;
  return {
    evidenceCount,
    evidenceStatus: evidenceCount > 0 ? "EVIDENCE_ATTACHED" : "FIRST_HAND_UNVERIFIED",
    moderationStatus: contentLength >= 20 ? "PUBLISHED" : "REQUIRES_REVIEW",
    trustScoreMeaning: "Tín hiệu cộng đồng, không phải chứng nhận sự thật"
  };
}

function toPublicForumPost(post) {
  const safe = { ...post };
  delete safe.authorId;
  delete safe.authorAvatar;
  delete safe.authorTrustScore;
  safe.authorName = "Cộng đồng StudentHub";
  safe.authorVerificationState = "UNVERIFIED_COMMUNITY_SIGNAL";
  const comments = Array.isArray(safe.comments) ? safe.comments : [];
  safe.comments = comments.slice(-100).map(comment => {
    const publicComment = { ...comment };
    delete publicComment.authorId;
    delete publicComment.authorName;
    publicComment.authorName = "Thành viên cộng đồng";
    return publicComment;
  });
  safe.sourceState = safe.sourceState || "COMMUNITY_SIGNAL";
  safe.isAuthoritative = false;
  return safe;
}

function rankingScore(post) {
  const trusted = Math.max(0, Number(post.trustVoteCount) || 0);
  const distrusted = Math.max(0, Number(post.distrustVoteCount) || 0);
  const total = trusted + distrusted;
  const approval = total > 0 ? trusted / total : 0.5;
  // Wilson lower bound: a one-vote post cannot outrank a consistently trusted post.
  const z = 1.96;
  const denominator = 1 + (z * z) / Math.max(1, total);
  const center = approval + (z * z) / (2 * Math.max(1, total));
  const spread = z * Math.sqrt((approval * (1 - approval) + (z * z) / (4 * Math.max(1, total))) / Math.max(1, total));
  const confidenceAdjustedApproval = (center - spread) / denominator;
  return confidenceAdjustedApproval * 100 + Math.min(10, total) + (Number(post.likeCount) || 0) * 0.02;
}

function usesExplicitMemoryAdapter() {
  return process.env.NODE_ENV !== "production" && process.env.STUDENTHUB_PERSISTENCE_ADAPTER === "memory";
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function databaseFailure(error, operation) {
  const unavailableCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "57P01", "57P02", "57P03", "53300"]);
  if (error instanceof DatabaseUnavailableError || unavailableCodes.has(error?.code)) {
    return NextResponse.json({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: `Forum ${operation} is temporarily unavailable.` } }, { status: 503 });
  }
  return null;
}

/**
 * GET /api/forum/posts?category=&q=&locationTag=&sortBy=
 * Lấy danh sách bài viết diễn đàn lọc theo keyword/tag (Phần E.2)
 */
async function readForumPosts(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const locationTag = (searchParams.get("locationTag") || "").toLowerCase().trim();
    const sortBy = searchParams.get("sortBy") || "ranking"; // 'ranking' | 'newest' | 'likes'

    if (!usesExplicitMemoryAdapter()) {
      const posts = await new PostgresForumRepository().list({ category, q, locationTag, sortBy });
      return NextResponse.json({ success: true, count: posts.length, posts: posts.map((post) => toPublicForumPost({ ...post, comments: [], integrity: enrichIntegrity(post) })), sourceState: "COMMUNITY_SIGNAL", isAuthoritative: false });
    }

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
        const scoreA = rankingScore(a);
        const scoreB = rankingScore(b);
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
      posts: filtered.map((post) => toPublicForumPost({ ...post, comments: COMMENTS_BY_POST.get(post.id) || [], integrity: enrichIntegrity(post) })),
      sourceState: "COMMUNITY_SIGNAL",
      isAuthoritative: false,
      dataNotice: "Bài đăng cộng đồng là tín hiệu trải nghiệm, không phải văn bản chính thức.",
    });
  } catch (error) {
    const unavailable = databaseFailure(error, "read");
    if (unavailable) return unavailable;
    throw error;
  }
}

/**
 * PATCH /api/forum/posts
 * Server-side reactions and comments. A reaction is idempotent per user/post.
 */
async function updateForumPost(request, routeParams, principal) {
  try {
    if (!usesExplicitMemoryAdapter()) {
      return NextResponse.json({
        success: false,
        error: { code: "PERSISTENCE_WORKFLOW_NOT_MIGRATED", message: "Forum reactions and comments are unavailable until their PostgreSQL workflow is enabled." }
      }, { status: 503 });
    }
    const body = await request.json();
    const { action, postId, text } = body || {};
    const post = FORUM_POSTS.find((item) => item.id === postId);
    const actor = normalizeText(principal.subjectId, 120);
    if (!post || !actor) return NextResponse.json({ success: false, error: "Bài viết hoặc người dùng không hợp lệ." }, { status: 400 });

    if (action === "like") {
      const key = `${postId}:${actor}`;
      const liked = !REACTION_LEDGER.has(key);
      if (liked) REACTION_LEDGER.set(key, "like"); else REACTION_LEDGER.delete(key);
      post.likeCount = Math.max(0, Number(post.likeCount || 0) + (liked ? 1 : -1));
      return NextResponse.json({ success: true, action: liked ? "LIKED" : "UNLIKED", post: toPublicForumPost({ ...post, integrity: enrichIntegrity(post) }) });
    }

    if (action === "comment") {
      const normalizedText = normalizeText(text, 1000);
      if (normalizedText.length < 2) return NextResponse.json({ success: false, error: "Bình luận cần ít nhất 2 ký tự." }, { status: 400 });
      const comment = {
        id: createSecureId("comment"),
        authorId: actor,
        authorName: normalizeText(principal.attributes?.fullName || principal.email || "Thành viên StudentHub", 80),
        text: normalizedText,
        createdAt: new Date().toISOString()
      };
      const comments = COMMENTS_BY_POST.get(postId) || [];
      comments.push(comment);
      COMMENTS_BY_POST.set(postId, comments.slice(-100));
      return NextResponse.json({ success: true, comment: toPublicForumPost({ comments: [comment] }).comments[0], comments: toPublicForumPost({ comments: COMMENTS_BY_POST.get(postId) }).comments });
    }

    return NextResponse.json({ success: false, error: "Action diễn đàn không hợp lệ." }, { status: 400 });
  } catch (error) {
    const unavailable = databaseFailure(error, "read");
    if (unavailable) return unavailable;
    throw error;
  }
}

/**
 * POST /api/forum/posts
 * Đăng bài viết mới vào diễn đàn
 */
async function createForumPost(request, routeParams, principal) {
  try {
    const body = await request.json();
    const { category, locationTag, title, content, images, links, authorAvatar } = body || {};

    const normalizedTitle = normalizeText(title, MAX_TITLE_LENGTH);
    const normalizedContent = normalizeText(content, MAX_CONTENT_LENGTH);
    const normalizedCategory = VALID_CATEGORIES.has(category) ? category : "nha_tro";

    if (!normalizedContent || !normalizedTitle || normalizedTitle.length < 8 || normalizedContent.length < 20) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề cần ít nhất 8 ký tự và nội dung cần ít nhất 20 ký tự." },
        { status: 400 }
      );
    }

    const newPost = {
      id: createSecureId("post"),
      category: normalizedCategory,
      locationTag: normalizeText(locationTag || "CAMPUS", 80).toUpperCase(),
      title: normalizedTitle,
      content: normalizedContent,
      images: Array.isArray(images) ? images.slice(0, 5) : [],
      links: safeLinks(links),
      authorId: normalizeText(principal.subjectId, 120),
      authorName: normalizeText(principal.attributes?.fullName || principal.email || "Thành viên StudentHub", 80),
      authorAvatar: normalizeText(authorAvatar || "student-tech", 80),
      authorTrustScore: 50,
      trustScoreSource: "SERVER_UNASSESSED_BASELINE",
      authorVerificationState: principal.attributes?.emailVerified ? "VERIFIED_IDENTITY" : "KNOWN_ACCOUNT",
      trustVoteCount: 1, // Tác giả tự vote khởi điểm
      distrustVoteCount: 0,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    };

    const memoryAdapter = usesExplicitMemoryAdapter();
    if (!memoryAdapter && !isUuid(principal.subjectId)) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTHORITATIVE_IDENTITY_REQUIRED", message: "A canonical identity session is required to publish." }
      }, { status: 401 });
    }
    const persistedPost = memoryAdapter
      ? (FORUM_POSTS.unshift(newPost), newPost)
      : await new PostgresForumRepository().create({
          authorId: principal.subjectId,
          category: normalizedCategory,
          locationTag: newPost.locationTag,
          title: normalizedTitle,
          content: normalizedContent,
          images: newPost.images,
          links: newPost.links,
        });

    return NextResponse.json(
      {
        success: true,
        message: "Đăng bài viết thành công!",
        // The authenticated creator may receive their own server-assigned
        // subject for optimistic client reconciliation.  Public reads still
        // pass through toPublicForumPost and never expose authorId.
        post: {
          ...toPublicForumPost({ ...persistedPost, integrity: enrichIntegrity(persistedPost) }),
          authorId: principal.subjectId,
          authorTrustScore: persistedPost.authorTrustScore,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const unavailable = databaseFailure(error, "write");
    if (unavailable) return unavailable;
    throw error;
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_FORUM_POSTS",
  allowAnonymous: true,
  maxRequests: 90
}, readForumPosts);

export const PATCH = SecurityFabric.wrapHandler(
  {
    action: "INTERACT_WITH_COMMUNITY_POST",
    requiredPermission: "COMMUNITY.POST",
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024
  },
  updateForumPost
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "CREATE_COMMUNITY_POST",
    requiredPermission: "COMMUNITY.POST",
    allowAnonymous: false,
    maxRequests: 20,
    maxBodyBytes: 128 * 1024
  },
  createForumPost
);
