import { getPostgresPool } from "./PostgresPool.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FIELD_TO_COLUMNS = Object.freeze({
  displayName: ["display_name", "full_name"],
  fullName: ["display_name", "full_name"],
  avatarUrl: ["avatar_url"],
  avatarId: ["avatar_id"],
  university: ["university"],
  major: ["major"],
  academicYear: ["academic_year"],
  bio: ["bio"],
  githubUsername: ["github_username"],
});

const SAFE_PROFILE_KEYS = new Set(Object.keys(FIELD_TO_COLUMNS));

export const LEGACY_PROFILE_SEED_IN_REAL_AUTH_FLOW = 0;

function normalizeUserId(value) {
  const candidate = String(value || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(candidate)) {
    const error = new Error("A canonical authenticated identity is required for a user profile.");
    error.code = "PROFILE_ID_INVALID";
    error.statusCode = 403;
    throw error;
  }
  return candidate;
}

function text(value, max = 1000) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return normalized ? normalized.slice(0, max) : null;
}

function profileRecord(row) {
  const record = row?.profile_record && typeof row.profile_record === "object"
    ? row.profile_record
    : row || {};
  const fullName = text(record.display_name || record.full_name, 120);
  return {
    id: row?.id || record.id || null,
    displayName: fullName,
    fullName,
    avatarId: text(record.avatar_id, 80),
    avatarUrl: text(record.avatar_url, 1000),
    university: text(record.university, 180),
    major: text(record.major, 180),
    academicYear: text(record.academic_year, 80),
    bio: text(record.bio, 1000),
    githubUsername: text(record.github_username, 120),
    onboarded: record.onboarded === true,
    createdAt: row?.created_at || record.created_at || null,
    updatedAt: row?.updated_at || record.updated_at || null,
  };
}

function readQuery() {
  return `
    select p.id, p.display_name, p.avatar_url, p.bio, p.created_at, p.updated_at,
           to_jsonb(p) as profile_record
      from public.profiles p
     where p.id = $1
     limit 1
  `;
}

async function read(pool, userId) {
  try {
    return await pool.query(readQuery(), [userId]);
  } catch (error) {
    // The compatibility branch supports a legacy profiles table during the
    // existing migration window. It still projects only safe fields.
    if (error?.code !== "42703") throw error;
    return pool.query(
      `select p.id, to_jsonb(p) as profile_record
         from public.profiles p
        where p.id = $1
        limit 1`,
      [userId]
    );
  }
}

async function ensureRow(pool, userId, fallbackName) {
  try {
    await pool.query(
      `insert into public.profiles (id, display_name, bio)
       values ($1, $2, null)
       on conflict (id) do nothing`,
      [userId, text(fallbackName, 120) || "Thành viên StudentHub"]
    );
  } catch (error) {
    if (error?.code !== "42703") throw error;
    await pool.query(
      `insert into public.profiles (id, full_name)
       values ($1, $2)
       on conflict (id) do nothing`,
      [userId, text(fallbackName, 120) || "Thành viên StudentHub"]
    );
  }
}

function writableUpdates(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => SAFE_PROFILE_KEYS.has(key))
      .map(([key, value]) => [key, key === "bio" ? text(value, 1000) : text(value, key === "fullName" || key === "displayName" ? 120 : 180)])
  );
}

async function availableColumns(pool) {
  const result = await pool.query(
    `select column_name
       from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'`
  );
  return new Set(result.rows.map((row) => row.column_name));
}

export class UserProfileRepository {
  static sanitizeUpdates(value) {
    return writableUpdates(value);
  }

  static async getOrCreate({ userId, fallbackName } = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const pool = getPostgresPool();
    let result = await read(pool, normalizedUserId);
    if (!result.rows[0]) {
      await ensureRow(pool, normalizedUserId, fallbackName);
      result = await read(pool, normalizedUserId);
    }
    return profileRecord(result.rows[0]);
  }

  static async update({ userId, fallbackName, updates } = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const pool = getPostgresPool();
    await this.getOrCreate({ userId: normalizedUserId, fallbackName });
    const safe = writableUpdates(updates);
    const columns = await availableColumns(pool);
    const assignments = [];
    const values = [];
    const assignedColumns = new Set();

    for (const [key, value] of Object.entries(safe)) {
      const column = FIELD_TO_COLUMNS[key]?.find((candidate) => columns.has(candidate));
      if (!column || assignedColumns.has(column)) continue;
      assignedColumns.add(column);
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    }
    if (columns.has("updated_at")) assignments.push("updated_at = now()");

    if (assignments.length > 0) {
      values.push(normalizedUserId);
      await pool.query(
        `update public.profiles
            set ${assignments.join(", ")}
          where id = $${values.length}`,
        values
      );
    }
    return this.getOrCreate({ userId: normalizedUserId, fallbackName });
  }

  /**
   * Marks the first-run flow complete using a server-owned column. This is
   * intentionally separate from writable presentation fields so a client
   * cannot downgrade or invent authority state through a generic profile PUT.
   */
  static async markOnboarded({ userId, fallbackName } = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const pool = getPostgresPool();
    await this.getOrCreate({ userId: normalizedUserId, fallbackName });
    const columns = await availableColumns(pool);
    if (!columns.has("onboarded")) {
      const error = new Error("The profile onboarding state migration is not applied.");
      error.code = "PROFILE_ONBOARDING_SCHEMA_UNAVAILABLE";
      error.statusCode = 503;
      throw error;
    }
    const assignments = ["onboarded = true"];
    if (columns.has("updated_at")) assignments.push("updated_at = now()");
    await pool.query(
      `update public.profiles set ${assignments.join(", ")} where id = $1`,
      [normalizedUserId]
    );
    return this.getOrCreate({ userId: normalizedUserId, fallbackName });
  }
}

export { normalizeUserId };
