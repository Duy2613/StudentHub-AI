import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { DatabaseUnavailableError, getPostgresPool } from "@/lib/server/database/PostgresPool.js";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATEGORY_VALUES = new Set(["GENERAL", "CAMPUS", "ACADEMIC", "SAFETY", "SCHOLARSHIP"]);

function cleanText(value, max = 1000) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function safeUrl(value, { image = false } = {}) {
  const candidate = cleanText(value, 1000);
  if (image && candidate.startsWith("/")) return candidate;
  return /^https:\/\//i.test(candidate) ? candidate : "";
}

function arrayValue(value) {
  return Array.isArray(value) ? value.filter(Boolean).slice(0, 8) : [];
}

function publicComment(row) {
  return {
    commentId: row.id,
    author: {
      name: row.display_name || "Thành viên StudentHub",
      avatarUrl: row.avatar_url || null,
    },
    text: cleanText(row.content, 2000),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function publicPost(row, comments = []) {
  const images = arrayValue(row.images);
  const links = arrayValue(row.links);
  const trustCount = Number(row.trust_count || 0);
  const doubtCount = Number(row.doubt_count || 0);
  return {
    postId: row.id,
    author: {
      name: row.display_name || "Thành viên StudentHub",
      avatarUrl: row.avatar_url || null,
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    topic: row.category || "GENERAL",
    location: row.location_tag || null,
    title: cleanText(row.title, 200),
    content: cleanText(row.content, 20_000),
    media: images,
    sources: links,
    sourceCount: links.length,
    likeCount: Number(row.like_count || 0),
    commentCount: Number(row.comment_count || 0),
    communityPerception: { trust: trustCount, doubt: doubtCount },
    comments,
    isAuthoritative: false,
    perceptionNotice: "Cảm nhận cộng đồng — không phải kết luận xác minh.",
  };
}

async function selectRows(pool, { postId = null, query = "", topic = "", limit = 40 } = {}) {
  const params = [];
  const filters = ["p.status = 'PUBLISHED'"];
  if (postId) filters.push(`p.id = $${params.push(postId)}`);
  if (query) {
    params.push(`%${cleanText(query, 120)}%`);
    filters.push(`(p.title ilike $${params.length} or p.content ilike $${params.length})`);
  }
  if (topic && topic !== "ALL") filters.push(`p.category = $${params.push(topic)}`);
  params.push(Math.min(Math.max(Number(limit) || 40, 1), 80));

  const result = await pool.query(
    `select p.id, p.category, p.location_tag, p.title, p.content, p.images, p.links, p.created_at,
            pr.display_name, pr.avatar_url,
            count(distinct v.user_id) filter (where v.value = 1) as like_count,
            count(distinct v.user_id) filter (where v.value = 1) as trust_count,
            count(distinct v.user_id) filter (where v.value = -1) as doubt_count,
            count(distinct c.id) filter (where c.status = 'PUBLISHED') as comment_count
       from public.posts p
       left join public.profiles pr on pr.id = p.author_id
       left join public.votes v on v.post_id = p.id
       left join public.comments c on c.post_id = p.id
      where ${filters.join(" and ")}
      group by p.id, pr.display_name, pr.avatar_url
      order by p.created_at desc, p.id desc
      limit $${params.length}`,
    params
  );
  return result.rows;
}

async function commentsFor(pool, postIds) {
  if (!postIds.length) return new Map();
  const result = await pool.query(
    `select c.id, c.post_id, c.content, c.created_at, pr.display_name, pr.avatar_url
       from public.comments c
       left join public.profiles pr on pr.id = c.author_id
      where c.post_id = any($1::uuid[]) and c.status = 'PUBLISHED'
      order by c.created_at asc
      limit 400`,
    [postIds]
  );
  const byPost = new Map();
  for (const row of result.rows) {
    const items = byPost.get(row.post_id) || [];
    items.push(publicComment(row));
    byPost.set(row.post_id, items.slice(-40));
  }
  return byPost;
}

async function readFeed(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const topic = cleanText(searchParams.get("topic") || "", 40).toUpperCase();
    const postId = cleanText(searchParams.get("postId") || "", 80) || null;
    if (postId && !UUID_PATTERN.test(postId)) {
      return Response.json({ success: false, error: { code: "VALIDATION", userMessage: "Bài viết không hợp lệ." } }, { status: 400 });
    }
    const pool = getPostgresPool();
    const rows = await selectRows(pool, { postId, query, topic, limit: postId ? 1 : searchParams.get("limit") || 40 });
    const comments = await commentsFor(pool, rows.map((row) => row.id));
    return Response.json({
      success: true,
      contractVersion: "community-social.v1",
      posts: rows.map((row) => publicPost(row, comments.get(row.id) || [])),
      sourceState: "DURABLE_POSTGRES",
      isAuthoritative: false,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: error instanceof DatabaseUnavailableError ? "DATABASE_UNAVAILABLE" : "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Bảng tin cộng đồng tạm thời chưa khả dụng. Không có dữ liệu thay thế được hiển thị." } },
      { status: 503 }
    );
  }
}

async function createPost(request, _routeParams, principal) {
  try {
    if (!UUID_PATTERN.test(String(principal.subjectId || ""))) {
      return Response.json({ success: false, error: { code: "AUTHENTICATED_IDENTITY_REQUIRED", userMessage: "Cần phiên StudentHub hợp lệ để đăng bài." } }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const content = cleanText(body?.content, 20_000);
    const title = cleanText(body?.title || content.split(/[.!?\n]/)[0], 200);
    const topic = cleanText(body?.topic || "GENERAL", 40).toUpperCase();
    const sourceUrl = safeUrl(body?.sourceUrl);
    const imageUrl = safeUrl(body?.imageUrl, { image: true });
    if (title.length < 5 || content.length < 20) {
      return Response.json({ success: false, error: { code: "VALIDATION", userMessage: "Bài chia sẻ cần ít nhất 20 ký tự." } }, { status: 400 });
    }
    const pool = getPostgresPool();
    const result = await pool.query(
      `insert into public.posts (author_id, title, content, category, location_tag, images, links, status, created_at, updated_at)
       values ($1, $2, $3, $4, 'CAMPUS', $5::text[], $6::text[], 'PUBLISHED', now(), now())
       returning id`,
      [principal.subjectId, title, content, CATEGORY_VALUES.has(topic) ? topic : "GENERAL", imageUrl ? [imageUrl] : [], sourceUrl ? [sourceUrl] : []]
    );
    const rows = await selectRows(pool, { postId: result.rows[0].id, limit: 1 });
    return Response.json({ success: true, post: publicPost(rows[0]), isAuthoritative: false }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: error instanceof DatabaseUnavailableError ? "DATABASE_UNAVAILABLE" : "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Không thể đăng bài lúc này. Hãy thử lại sau." } },
      { status: 503 }
    );
  }
}

async function interact(request, _routeParams, principal) {
  try {
    if (!UUID_PATTERN.test(String(principal.subjectId || ""))) {
      return Response.json({ success: false, error: { code: "AUTHENTICATED_IDENTITY_REQUIRED", userMessage: "Cần phiên StudentHub hợp lệ để tương tác." } }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const postId = String(body?.postId || "").trim();
    const action = String(body?.action || "").trim().toLowerCase();
    if (!UUID_PATTERN.test(postId)) return Response.json({ success: false, error: { code: "VALIDATION", userMessage: "Bài viết không hợp lệ." } }, { status: 400 });
    const pool = getPostgresPool();
    if (action === "comment") {
      const text = cleanText(body?.text, 2000);
      if (text.length < 2) return Response.json({ success: false, error: { code: "VALIDATION", userMessage: "Bình luận cần ít nhất 2 ký tự." } }, { status: 400 });
      await pool.query(
        `insert into public.comments (post_id, author_id, content, status, created_at, updated_at)
         select $1, $2, $3, 'PUBLISHED', now(), now()
          where exists (select 1 from public.posts where id = $1 and status = 'PUBLISHED')`,
        [postId, principal.subjectId, text]
      );
    } else if (action === "like") {
      await pool.query(
        `insert into public.votes (post_id, user_id, value, created_at, updated_at)
         values ($1, $2, 1, now(), now())
         on conflict (post_id, user_id) do update set value = 1, updated_at = now()`,
        [postId, principal.subjectId]
      );
    } else if (action === "perception") {
      const value = Number(body?.value) === -1 ? -1 : 1;
      await pool.query(
        `insert into public.votes (post_id, user_id, value, created_at, updated_at)
         values ($1, $2, $3, now(), now())
         on conflict (post_id, user_id) do update set value = excluded.value, updated_at = now()`,
        [postId, principal.subjectId, value]
      );
    } else {
      return Response.json({ success: false, error: { code: "VALIDATION", userMessage: "Thao tác cộng đồng không hợp lệ." } }, { status: 400 });
    }
    const rows = await selectRows(pool, { postId, limit: 1 });
    if (!rows[0]) return Response.json({ success: false, error: { code: "NOT_FOUND", userMessage: "Bài viết không còn khả dụng." } }, { status: 404 });
    const comments = await commentsFor(pool, [postId]);
    return Response.json({ success: true, post: publicPost(rows[0], comments.get(postId) || []) });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: error instanceof DatabaseUnavailableError ? "DATABASE_UNAVAILABLE" : "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Tương tác cộng đồng tạm thời chưa khả dụng." } },
      { status: 503 }
    );
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_SOCIAL_FEED", allowAnonymous: true, maxRequests: 90, maxBodyBytes: 0 }, readFeed);
export const POST = SecurityFabric.wrapHandler({ action: "CREATE_COMMUNITY_SOCIAL_POST", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 20, maxBodyBytes: 128 * 1024 }, createPost);
export const PATCH = SecurityFabric.wrapHandler({ action: "INTERACT_WITH_COMMUNITY_SOCIAL_POST", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 32 * 1024 }, interact);
