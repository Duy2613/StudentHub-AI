import { getPostgresPool } from "../../server/database/PostgresPool.js";

export class PostgresSessionRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async create(record) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(`
        insert into private.server_sessions(
          token_hash, user_id, auth_provider, upstream_jti_hash, created_at,
          last_seen_at, idle_expires_at, expires_at, user_agent_hash
        ) values($1,$2,$3,$4,$5,$5,$6,$7,$8)
      `, [record.tokenHash, record.userId, record.authProvider, record.upstreamJtiHash,
        record.createdAt, record.idleExpiresAt, record.expiresAt, record.userAgentHash]);
      await client.query(`insert into private.audit_events(event_type, actor_id, target_type)
        values('SESSION_CREATED',$1,'SESSION')`, [record.userId]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async findActive(tokenHash, now) {
    const result = await this.pool.query(`
      update private.server_sessions s
      set last_seen_at=$2, idle_expires_at=least($2 + interval '30 minutes', s.expires_at)
      where s.token_hash=$1 and s.revoked_at is null and s.expires_at>$2 and s.idle_expires_at>$2
      returning s.user_id, s.created_at, s.last_seen_at, s.expires_at, s.session_version,
        coalesce((select array_agg(r.code order by r.code)
          from private.user_roles ur join private.roles r on r.id=ur.role_id
          where ur.user_id=s.user_id and ur.revoked_at is null), array['STUDENT']::text[]) roles
    `, [tokenHash, now]);
    return result.rows[0] || null;
  }

  async revoke(tokenHash, reason = "LOGOUT") {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query(`
        update private.server_sessions set revoked_at=coalesce(revoked_at, now()), revocation_reason=$2
        where token_hash=$1 returning user_id
      `, [tokenHash, reason]);
      if (result.rows[0]) {
        await client.query(`insert into private.audit_events(event_type, actor_id, target_type)
          values('SESSION_REVOKED',$1,'SESSION')`, [result.rows[0].user_id]);
      }
      await client.query("commit");
      return result.rowCount > 0;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeAllForUser(userId, exceptTokenHash = null, reason = "LOGOUT_ALL") {
    const result = await this.pool.query(`
      update private.server_sessions set revoked_at=coalesce(revoked_at, now()), revocation_reason=$3
      where user_id=$1 and revoked_at is null and ($2::bytea is null or token_hash<>$2)
    `, [userId, exceptTokenHash, reason]);
    return result.rowCount;
  }

  async cleanupExpired(now = new Date()) {
    const result = await this.pool.query(
      "delete from private.server_sessions where expires_at < $1 - interval '7 days'",
      [now]
    );
    return result.rowCount;
  }

  async appendAudit({ eventType, actorId = null, targetType = null, targetId = null, requestId = null, metadata = {} }) {
    await this.pool.query(`
      insert into private.audit_events(event_type, actor_id, target_type, target_id, request_id, metadata)
      values($1,$2,$3,$4,$5,$6::jsonb)
    `, [eventType, actorId, targetType, targetId, requestId, JSON.stringify(metadata)]);
  }
}
