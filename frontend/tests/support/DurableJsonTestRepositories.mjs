import { existsSync, readFileSync, writeFileSync } from "node:fs";

function read(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
}
function write(path, value) { writeFileSync(path, JSON.stringify(value), "utf8"); }

export class DurableJsonSessionTestRepository {
  constructor(path) { this.path = path; }
  async create(record) {
    const state = read(this.path, { sessions: [], audit: [] });
    const tokenHash = record.tokenHash.toString("hex");
    const jti = record.upstreamJtiHash?.toString("hex") || null;
    if (state.sessions.some((item) => item.tokenHash === tokenHash || (jti && item.upstreamJtiHash === jti))) {
      const error = new Error("duplicate session proof"); error.code = "23505"; throw error;
    }
    state.sessions.push({
      ...record,
      tokenHash,
      upstreamJtiHash: jti,
      userAgentHash: record.userAgentHash?.toString("hex") || null,
      createdAt: record.createdAt.toISOString(),
      idleExpiresAt: record.idleExpiresAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      revokedAt: null,
      roles: record.roles || ["STUDENT"],
    });
    write(this.path, state);
  }
  async findActive(tokenHash, now) {
    const state = read(this.path, { sessions: [], audit: [] });
    const item = state.sessions.find((entry) => entry.tokenHash === tokenHash.toString("hex"));
    if (!item || item.revokedAt || new Date(item.expiresAt) <= now || new Date(item.idleExpiresAt) <= now) return null;
    item.lastSeenAt = now.toISOString();
    write(this.path, state);
    return { user_id: item.userId, roles: item.roles, expires_at: item.expiresAt, session_version: 1 };
  }
  async revoke(tokenHash, reason) {
    const state = read(this.path, { sessions: [], audit: [] });
    const item = state.sessions.find((entry) => entry.tokenHash === tokenHash.toString("hex"));
    if (!item) return false;
    item.revokedAt = new Date().toISOString(); item.revocationReason = reason; write(this.path, state); return true;
  }
  async appendAudit(event) {
    const state = read(this.path, { sessions: [], audit: [] }); state.audit.push(event); write(this.path, state);
  }
}

export class DurableJsonForumTestRepository {
  constructor(path) { this.path = path; }
  async create(post) {
    const state = read(this.path, { posts: [] });
    const persisted = { ...post, id: `post-${state.posts.length + 1}`, createdAt: new Date().toISOString() };
    state.posts.unshift(persisted); write(this.path, state); return persisted;
  }
  async list() { return read(this.path, { posts: [] }).posts; }
}
