/**
 * StudentHub AI — CommunityRepository
 * 
 * Manages community posts, comments, votes, and trust case follows
 * anchored in PostgreSQL with strict RLS and author derivation.
 */

import { getPostgresPool } from "./PostgresPool.js";

export class CommunityRepository {
  /**
   * Creates a post with server-derived author ID.
   */
  static async createPost({ authorId, title, content, status = "PUBLISHED" }) {
    if (!authorId || !title || !content) {
      throw new Error("authorId, title, and content are required.");
    }
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.posts (author_id, title, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING id, author_id, title, content, status, created_at`,
      [authorId, String(title).trim(), String(content).trim(), status]
    );
    return res.rows[0];
  }

  /**
   * Lists published community posts.
   */
  static async listPosts({ limit = 20, offset = 0, authorId = null } = {}) {
    const pool = getPostgresPool();
    let query = `SELECT id, author_id, title, content, status, created_at FROM public.posts WHERE status = 'PUBLISHED'`;
    const params = [];

    if (authorId) {
      params.push(authorId);
      query += ` AND author_id = $${params.length}`;
    }

    params.push(Math.min(limit, 50), Math.max(offset, 0));
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  /**
   * Adds a comment with server-derived author.
   */
  static async addComment({ postId, authorId, body, content }) {
    const textContent = content || body;
    if (!postId || !authorId || !textContent) {
      throw new Error("postId, authorId, and content are required.");
    }
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.comments (post_id, author_id, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'PUBLISHED', now(), now())
       RETURNING id, post_id, author_id, content, status, created_at`,
      [postId, authorId, String(textContent).trim()]
    );
    return res.rows[0];
  }

  /**
   * Casts a vote on a post (+1 or -1).
   */
  static async votePost({ userId, postId, direction, value }) {
    const voteVal = value !== undefined ? value : direction;
    if (!userId || !postId || ![-1, 1].includes(voteVal)) {
      throw new Error("userId, postId, and value (+1 or -1) are required.");
    }
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.votes (post_id, user_id, value, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (post_id, user_id) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()
       RETURNING post_id, user_id, value`,
      [postId, userId, voteVal]
    );
    return res.rows[0];
  }

  /**
   * Follows an Evidence Passport for material updates.
   */
  static async followPassport({ ownerId, passportId }) {
    if (!ownerId || !passportId) {
      throw new Error("ownerId and passportId are required.");
    }
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.case_follows (owner_id, passport_id, created_at)
       VALUES ($1, $2, now())
       ON CONFLICT (owner_id, passport_id) DO NOTHING
       RETURNING owner_id, passport_id, created_at`,
      [ownerId, passportId]
    );
    return res.rows[0] || { ownerId, passportId, followed: true };
  }
}
