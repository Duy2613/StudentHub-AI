import { getPostgresPool } from "../server/database/PostgresPool.js";

function toDto(row) {
  return {
    id: row.id,
    category: row.category,
    locationTag: row.location_tag,
    title: row.title,
    content: row.content,
    images: row.images || [],
    links: row.links || [],
    authorId: row.author_id,
    authorName: row.display_name || "StudentHub member",
    authorTrustScore: null,
    trustScoreSource: "NOT_EXPOSED_BY_REPUTATION_AUTHORITY",
    trustVoteCount: Number(row.trust_votes || 0),
    distrustVoteCount: Number(row.distrust_votes || 0),
    likeCount: Number(row.like_count || 0),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export class PostgresForumRepository {
  constructor(pool = getPostgresPool()) { this.pool = pool; }

  async create({ authorId, category, locationTag, title, content, images, links }) {
    const result = await this.pool.query(`
      insert into public.posts(author_id, category, location_tag, title, content, images, links)
      values($1,$2,$3,$4,$5,$6,$7)
      returning *, null::text display_name, 0::bigint trust_votes, 0::bigint distrust_votes, 0::bigint like_count
    `, [authorId, category, locationTag, title, content, images, links]);
    return toDto(result.rows[0]);
  }

  async list({ category = "", q = "", locationTag = "", sortBy = "ranking" } = {}) {
    const orderBy = sortBy === "newest" ? "p.created_at desc" : sortBy === "likes" ? "like_count desc, p.created_at desc" : "(trust_votes-distrust_votes) desc, p.created_at desc";
    const result = await this.pool.query(`
      select p.*, pr.display_name,
        count(*) filter (where v.value=1) trust_votes,
        count(*) filter (where v.value=-1) distrust_votes,
        0::bigint like_count
      from public.posts p
      left join public.profiles pr on pr.id=p.author_id
      left join public.votes v on v.post_id=p.id
      where p.status='PUBLISHED'
        and ($1='' or p.category=$1)
        and ($2='' or p.location_tag ilike '%' || $2 || '%')
        and ($3='' or p.title ilike '%' || $3 || '%' or p.content ilike '%' || $3 || '%')
      group by p.id, pr.display_name
      order by ${orderBy}
      limit 100
    `, [category === "all" ? "" : category, locationTag, q]);
    return result.rows.map(toDto);
  }
}
