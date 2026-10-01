/**
 * StudentHub AI — MediaArtifactService
 * 
 * Server-owned media artifact manager:
 * - Binary validation: magic bytes, MIME, strict byte size (<= 8MB).
 * - Decompression bomb defense: dimensions <= 8192x8192, <= 40 megapixels.
 * - SHA-256 cryptographic fingerprinting.
 * - Generates canonical mediaArtifactId.
 * - Persists to private storage (screenshot_objects / private spool) without leaking internal paths.
 * - Enables downstream stages to reference mediaArtifactId + imageHash rather than propagating base64.
 */

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPostgresPool } from "../database/PostgresPool.js";
import { canonicalEnv } from "../env/canonicalEnv.js";

const MAX_BYTE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_DIMENSION = 8192; // 8192 pixels
const MAX_MEGAPIXELS = 40; // 40 MP
const PRIVATE_MEDIA_BUCKET = "trust-screenshots-private";
const SIGNED_MEDIA_URL_TTL_SECONDS = 300;
const CANONICAL_PRODUCTION_PROJECT_REF = "kytdomflmjytzyaabogi";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedStorageClient = null;
let cachedStorageConfig = null;

function artifactUuid(mediaArtifactId) {
  const match = typeof mediaArtifactId === "string" && mediaArtifactId.match(/^art_([0-9a-f-]{36})$/i);
  return match && UUID_PATTERN.test(match[1]) ? match[1].toLowerCase() : null;
}

function projectRefFromSupabaseUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    const match = hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return match?.[1] || null;
  } catch { return null; }
}

function projectRefFromDatabaseUrl(value) {
  try {
    const url = new URL(value);
    const direct = url.hostname.toLowerCase().match(/^db\.([a-z0-9]{20})\.supabase\.co$/);
    if (direct) return direct[1];
    if (url.hostname.toLowerCase().endsWith(".pooler.supabase.com")) {
      const pooled = decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]{20})$/i);
      return pooled?.[1]?.toLowerCase() || null;
    }
  } catch { /* an opaque/custom connection string needs an explicit safe project ref */ }
  return null;
}

function storageConfiguration() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || canonicalEnv.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || canonicalEnv.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceRoleKey) {
    const error = new Error("Private media Storage is not configured.");
    error.code = "MEDIA_STORAGE_NOT_CONFIGURED";
    throw error;
  }

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || canonicalEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const expectedRef = (process.env.SUPABASE_PROJECT_REF || "").trim().toLowerCase() || null;
  const explicitDatabaseRef = (process.env.SUPABASE_DATABASE_PROJECT_REF || "").trim().toLowerCase() || null;
  const refs = [
    projectRefFromSupabaseUrl(url),
    projectRefFromSupabaseUrl(publicUrl),
    expectedRef,
    projectRefFromDatabaseUrl(process.env.DATABASE_URL || canonicalEnv.DATABASE_URL || ""),
    explicitDatabaseRef,
  ].filter(Boolean);
  if (new Set(refs).size > 1) {
    const error = new Error("Supabase Auth, Storage, and database project references do not match.");
    error.code = "MEDIA_STORAGE_PROJECT_MISMATCH";
    throw error;
  }
  const databaseRef = projectRefFromDatabaseUrl(process.env.DATABASE_URL || canonicalEnv.DATABASE_URL || "") || explicitDatabaseRef;
  const storageRef = projectRefFromSupabaseUrl(url) || expectedRef;
  if (process.env.NODE_ENV === "production" && (!storageRef || !databaseRef)) {
    const error = new Error("Production Supabase project identity could not be verified from non-sensitive configuration metadata.");
    error.code = "MEDIA_STORAGE_IDENTITY_UNVERIFIED";
    throw error;
  }
  if (process.env.VERCEL_ENV === "production" && (storageRef !== CANONICAL_PRODUCTION_PROJECT_REF || databaseRef !== CANONICAL_PRODUCTION_PROJECT_REF)) {
    const error = new Error("Vercel production must use the canonical StudentHub Supabase project.");
    error.code = "MEDIA_STORAGE_PROJECT_MISMATCH";
    throw error;
  }
  return { url, serviceRoleKey };
}

function getSupabaseStorageClient() {
  const config = storageConfiguration();
  if (!cachedStorageClient || cachedStorageConfig?.url !== config.url || cachedStorageConfig?.serviceRoleKey !== config.serviceRoleKey) {
    cachedStorageClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    cachedStorageConfig = config;
  }
  return cachedStorageClient;
}

function safeMediaError(error, fallbackCode = "MEDIA_STORAGE_UNAVAILABLE") {
  const code = ["MEDIA_STORAGE_NOT_CONFIGURED", "MEDIA_STORAGE_PROJECT_MISMATCH", "MEDIA_STORAGE_IDENTITY_UNVERIFIED", "MEDIA_STORAGE_SCHEMA_REQUIRED", "MEDIA_STORAGE_CLEANUP_FAILED", "MEDIA_ARTIFACT_ACCESS_DENIED", "MEDIA_ARTIFACT_NOT_FOUND", "MEDIA_ARTIFACT_HASH_MISMATCH", "MEDIA_ARTIFACT_CONFLICT", "MEDIA_MIME_MISMATCH"].includes(error?.code)
    ? error.code
    : fallbackCode;
  const messages = {
    MEDIA_STORAGE_NOT_CONFIGURED: "Private media storage is not configured.",
    MEDIA_STORAGE_PROJECT_MISMATCH: "Auth, Storage and database must use the same Supabase project.",
    MEDIA_STORAGE_IDENTITY_UNVERIFIED: "Production Supabase project identity is not verifiable from runtime metadata.",
    MEDIA_STORAGE_SCHEMA_REQUIRED: "Private media metadata storage is not initialized.",
    MEDIA_STORAGE_CLEANUP_FAILED: "The incomplete media upload could not be safely rolled back.",
    MEDIA_ARTIFACT_ACCESS_DENIED: "You are not authorized to access this media artifact.",
    MEDIA_ARTIFACT_NOT_FOUND: "The media artifact is unavailable.",
    MEDIA_ARTIFACT_HASH_MISMATCH: "The stored media artifact failed integrity verification.",
    MEDIA_ARTIFACT_CONFLICT: "The media artifact is already linked to different Trust evidence.",
    MEDIA_MIME_MISMATCH: "The uploaded file does not match its declared image type.",
  };
  const statusCode = code === "MEDIA_ARTIFACT_ACCESS_DENIED" ? 403 : code === "MEDIA_ARTIFACT_NOT_FOUND" ? 404 : code === "MEDIA_ARTIFACT_HASH_MISMATCH" || code === "MEDIA_ARTIFACT_CONFLICT" || code === "MEDIA_MIME_MISMATCH" ? 422 : 503;
  return { code, message: messages[code] || "Private media storage is temporarily unavailable.", statusCode };
}

function validateMetadataRow(row, id) {
  const extension = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" }[row.mime_type];
  const expectedKeys = extension === "jpeg"
    ? ["jpg", "jpeg"].map((ext) => `${String(row.owner_id).toLowerCase()}/${id}.${ext}`)
    : [`${String(row.owner_id).toLowerCase()}/${id}.${extension}`];
  if (String(row.id).toLowerCase() !== id || row.bucket_id !== PRIVATE_MEDIA_BUCKET
      || !extension || !expectedKeys.includes(row.object_key)
      || !/^[a-f0-9]{64}$/i.test(String(row.sha256 || ""))
      || Number(row.byte_size) < 1 || Number(row.byte_size) > MAX_BYTE_SIZE) {
    throw Object.assign(new Error("Canonical media metadata is inconsistent."), { code: "MEDIA_ARTIFACT_HASH_MISMATCH" });
  }
}

const MAGIC_BYTES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // RIFF...WEBP
};

const MIME_TYPES = {
  JPEG: "image/jpeg",
  PNG: "image/png",
  WEBP: "image/webp",
};

// In-memory bounded short-TTL server-side spool to ensure artifacts survive across
// immediate downstream pipeline calls in serverless/single-instance executions.
const ephemeralArtifactStore = new Map();
const EPHEMERAL_TTL_MS = 15 * 60 * 1000; // 15 minutes

function matchHeader(buffer, signature) {
  if (!buffer || buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

function detectMimeAndFormat(buffer) {
  if (matchHeader(buffer, MAGIC_BYTES.PNG)) {
    return { mimeType: MIME_TYPES.PNG, format: "png" };
  }
  if (matchHeader(buffer, MAGIC_BYTES.JPEG)) {
    return { mimeType: MIME_TYPES.JPEG, format: "jpeg" };
  }
  if (matchHeader(buffer, MAGIC_BYTES.WEBP_RIFF) && buffer.length >= 12) {
    const riffType = buffer.subarray(8, 12).toString("latin1");
    if (riffType === "WEBP") {
      return { mimeType: MIME_TYPES.WEBP, format: "webp" };
    }
  }
  return null;
}

/**
 * Extracts basic dimensions from PNG/JPEG/WEBP buffers safely without full decode
 */
function extractImageDimensions(buffer, format) {
  if (!buffer || buffer.length < 16) return { width: 0, height: 0 };

  try {
    if (format === "png" && buffer.length >= 24) {
      // PNG IHDR width at offset 16, height at offset 20 (big-endian 32-bit)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (format === "jpeg") {
      // Walk JPEG markers to find SOF0 (0xFFC0) or SOF2 (0xFFC2)
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) {
          // Height at offset+5 (16-bit BE), Width at offset+7 (16-bit BE)
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        // Skip marker segment
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (format === "webp" && buffer.length >= 30) {
      // Simple VP8 / VP8L / VP8X header parsing
      const chunkType = buffer.subarray(12, 16).toString("latin1");
      if (chunkType === "VP8 " && buffer.length >= 30) {
        // Keyframe header at offset 23
        const width = buffer.readUInt16LE(26) & 0x3FFF;
        const height = buffer.readUInt16LE(28) & 0x3FFF;
        return { width, height };
      }
      if (chunkType === "VP8L" && buffer.length >= 25) {
        // VP8L 14-bit width and height packed
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3F) << 8) | b0);
        const height = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6));
        return { width, height };
      }
      if (chunkType === "VP8X" && buffer.length >= 30) {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        return { width, height };
      }
    }
  } catch {
    // If dimension extraction fails, fail-safe defaults
  }

  return { width: 0, height: 0 };
}

export class MediaArtifactService {
  /**
   * Cleans up expired items from the ephemeral store
   */
  static cleanExpired() {
    const now = Date.now();
    for (const [id, item] of ephemeralArtifactStore.entries()) {
      if (now - item.createdAtTime > EPHEMERAL_TTL_MS) {
        ephemeralArtifactStore.delete(id);
      }
    }
  }

  /**
   * Ingests, validates, hashes, and registers an image binary.
   * 
   * @param {object} params
   * @param {Buffer|Uint8Array|string} params.bytes - Binary or base64
   * @param {string} [params.claimedMimeType]
   * @param {string} [params.ownerUserId]
   * @param {string} [params.caseId]
   * @returns {Promise<{ ok: boolean, artifact?: object, error?: { code: string, message: string } }>}
   */
  static async ingestImage({
    bytes,
    claimedMimeType = "",
    ownerUserId = null,
    caseId = null,
    requireDurableStorage = false,
    storageClient = null,
    pool = null,
  }) {
    this.cleanExpired();

    if (!bytes) {
      return { ok: false, error: { code: "EMPTY_MEDIA_BYTES", message: "Không tìm thấy dữ liệu tệp hình ảnh." } };
    }

    let buffer;
    if (typeof bytes === "string") {
      const cleanBase64 = bytes.replace(/^data:image\/[a-z0-9.+_-]+;base64,/i, "").trim();
      try {
        buffer = Buffer.from(cleanBase64, "base64");
      } catch {
        return { ok: false, error: { code: "INVALID_BASE64", message: "Định dạng base64 không hợp lệ." } };
      }
    } else if (Buffer.isBuffer(bytes)) {
      buffer = bytes;
    } else if (bytes instanceof Uint8Array) {
      buffer = Buffer.from(bytes);
    } else {
      return { ok: false, error: { code: "UNSUPPORTED_BUFFER_TYPE", message: "Kiểu dữ liệu buffer không hợp lệ." } };
    }

    // 1. Check byte size bounds
    if (buffer.length === 0) {
      return { ok: false, error: { code: "EMPTY_FILE", message: "Tệp hình ảnh rỗng (0 bytes)." } };
    }
    if (buffer.length > MAX_BYTE_SIZE) {
      return {
        ok: false,
        error: {
          code: "FILE_OVERSIZED",
          message: `Kích thước tệp vượt quá giới hạn tối đa cho phép (${(MAX_BYTE_SIZE / 1024 / 1024).toFixed(0)}MB).`,
        },
      };
    }

    // 2. Validate magic bytes and format
    const detected = detectMimeAndFormat(buffer);
    if (!detected) {
      return {
        ok: false,
        error: {
          code: "UNSUPPORTED_OR_CORRUPT_FORMAT",
          message: "Định dạng hình ảnh không được hỗ trợ hoặc tệp bị hỏng (chỉ hỗ trợ JPEG, PNG, WEBP).",
        },
      };
    }
    if (claimedMimeType && String(claimedMimeType).toLowerCase() !== detected.mimeType) {
      return { ok: false, error: { code: "MEDIA_MIME_MISMATCH", message: "Loại tệp không khớp với nội dung hình ảnh." } };
    }

    // 3. Decompression bomb protection: dimension bounds
    const { width, height } = extractImageDimensions(buffer, detected.format);
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return {
        ok: false,
        error: {
          code: "IMAGE_DIMENSIONS_EXCEEDED",
          message: `Kích thước ảnh (${width}x${height}) vượt quá giới hạn an toàn tối đa (${MAX_DIMENSION}x${MAX_DIMENSION}).`,
        },
      };
    }

    const megapixels = (width * height) / 1_000_000;
    if (megapixels > MAX_MEGAPIXELS) {
      return {
        ok: false,
        error: {
          code: "DECOMPRESSION_BOMB_RISK",
          message: `Số điểm ảnh (${megapixels.toFixed(1)}MP) vượt ngưỡng an toàn chống decompression bomb (${MAX_MEGAPIXELS}MP).`,
        },
      };
    }

    // 4. Compute SHA-256 fingerprint
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const artifactId = crypto.randomUUID();
    const mediaArtifactId = `art_${artifactId}`;
    const nowIso = new Date().toISOString();
    const durable = Boolean(requireDurableStorage || ownerUserId);
    if (durable && !UUID_PATTERN.test(String(ownerUserId || ""))) {
      return { ok: false, error: { code: "MEDIA_OWNER_INVALID", message: "Tài khoản tải media không hợp lệ." } };
    }
    const objectKey = durable ? `${String(ownerUserId).toLowerCase()}/${artifactId}.${detected.format}` : null;
    const privateStoragePath = `trust-screenshots-private/${objectKey}`;

    // Internal representation
    const internalArtifact = {
      id: mediaArtifactId,
      mediaArtifactId,
      ownerUserId,
      caseId,
      sha256,
      mimeType: detected.mimeType,
      format: detected.format,
      width,
      height,
      byteSize: buffer.length,
      privateStoragePath,
      createdAt: nowIso,
      createdAtTime: Date.now(),
      retentionState: durable ? "ACTIVE" : "EPHEMERAL",
      buffer, // bounded in-memory buffer for the pipeline execution
    };

    if (durable) {
      let storage = storageClient;
      let uploaded = false;
      try {
        storage ||= getSupabaseStorageClient();
        const database = pool || getPostgresPool();
        const upload = await storage.storage.from(PRIVATE_MEDIA_BUCKET).upload(objectKey, buffer, {
          contentType: detected.mimeType,
          cacheControl: "3600",
          upsert: false,
        });
        if (upload?.error) throw upload.error;
        uploaded = true;
        const inserted = await database.query(
          `INSERT INTO public.screenshot_objects
             (id, owner_id, case_id, bucket_id, object_key, mime_type, byte_size, sha256, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
           RETURNING id`,
          [artifactId, String(ownerUserId).toLowerCase(), caseId || null, PRIVATE_MEDIA_BUCKET, objectKey, detected.mimeType, buffer.length, Buffer.from(sha256, "hex")],
        );
        if (String(inserted.rows?.[0]?.id || "").toLowerCase() !== artifactId.toLowerCase()) {
          throw Object.assign(new Error("Private media metadata row was not created."), { code: "MEDIA_STORAGE_SCHEMA_REQUIRED" });
        }
      } catch (caught) {
        if (uploaded && storage) {
          try {
            const removed = await storage.storage.from(PRIVATE_MEDIA_BUCKET).remove([objectKey]);
            if (removed?.error) throw removed.error;
          } catch {
            return { ok: false, error: safeMediaError(Object.assign(new Error("Upload compensation failed."), { code: "MEDIA_STORAGE_CLEANUP_FAILED" })) };
          }
        }
        const code = ["42P01", "42703", "3F000"].includes(caught?.code) ? "MEDIA_STORAGE_SCHEMA_REQUIRED" : caught?.code;
        return { ok: false, error: safeMediaError(Object.assign(new Error("Durable media ingestion failed."), { code })) };
      }
    }

    // Cache only after durable Storage and metadata both commit successfully.
    ephemeralArtifactStore.set(mediaArtifactId, internalArtifact);

    // 5. Safe Client/Downstream Reference (NO raw bytes, NO private path)
    const publicArtifact = {
      mediaArtifactId,
      sha256,
      mimeType: detected.mimeType,
      width,
      height,
      byteSize: buffer.length,
      createdAt: nowIso,
      retentionState: internalArtifact.retentionState,
    };

    return {
      ok: true,
      artifact: publicArtifact,
      internal: internalArtifact,
    };
  }

  static async #authorizedRow(mediaArtifactId, { requesterUserId, roomId = null, pool = null } = {}) {
    const artifactId = artifactUuid(mediaArtifactId);
    if (!artifactId) throw Object.assign(new Error("Invalid media artifact id."), { code: "MEDIA_ARTIFACT_NOT_FOUND" });
    if (!UUID_PATTERN.test(String(requesterUserId || ""))) throw Object.assign(new Error("Authenticated media owner is required."), { code: "MEDIA_ARTIFACT_ACCESS_DENIED" });
    const database = pool || getPostgresPool();
    const result = await database.query(
      `SELECT so.id, so.owner_id, so.case_id, so.bucket_id, so.object_key, so.mime_type,
              so.byte_size, encode(so.sha256, 'hex') AS sha256, so.created_at, so.expires_at
         FROM public.screenshot_objects so
        WHERE so.id = $1::uuid AND so.bucket_id = $4 AND so.deleted_at IS NULL
          AND (so.expires_at IS NULL OR so.expires_at > now())
          AND (
            so.owner_id = $2::uuid
            OR (
              $3::uuid IS NOT NULL
              AND EXISTS (
                SELECT 1
                  FROM private.expert_verification_rooms r
                  JOIN private.expert_room_participants p ON p.room_id = r.id
                 WHERE r.id = $3::uuid AND r.host_user_id = so.owner_id
                   AND p.user_id = $2::uuid AND p.state <> 'LEFT'
                   AND r.challenge_payload #>> '{metadata,mediaArtifactId}' = 'art_' || so.id::text
                   AND r.challenge_payload #>> '{metadata,imageHash}' = encode(so.sha256, 'hex')
              )
            )
          )`,
      [artifactId, String(requesterUserId).toLowerCase(), roomId && UUID_PATTERN.test(String(roomId)) ? String(roomId).toLowerCase() : null, PRIVATE_MEDIA_BUCKET],
    );
    const row = result.rows?.[0];
    if (!row) throw Object.assign(new Error("Media artifact not found for this principal."), { code: "MEDIA_ARTIFACT_ACCESS_DENIED" });
    validateMetadataRow(row, artifactId);
    return row;
  }

  static async hydrateArtifact(mediaArtifactId, { requesterUserId, roomId = null, expectedSha256 = null, storageClient = null, pool = null } = {}) {
    try {
      const row = await this.#authorizedRow(mediaArtifactId, { requesterUserId, roomId, pool });
      const expected = String(expectedSha256 || row.sha256 || "").toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(expected) || expected !== String(row.sha256).toLowerCase()) {
        throw Object.assign(new Error("Media digest does not match the canonical metadata."), { code: "MEDIA_ARTIFACT_HASH_MISMATCH" });
      }
      const storage = storageClient || getSupabaseStorageClient();
      const downloaded = await storage.storage.from(PRIVATE_MEDIA_BUCKET).download(row.object_key);
      if (downloaded?.error || !downloaded?.data) throw downloaded?.error || new Error("Stored media object is missing.");
      const buffer = Buffer.from(await downloaded.data.arrayBuffer());
      const detected = detectMimeAndFormat(buffer);
      const actualHash = crypto.createHash("sha256").update(buffer).digest("hex");
      if (!detected || detected.mimeType !== row.mime_type || buffer.length !== Number(row.byte_size) || actualHash !== expected) {
        throw Object.assign(new Error("Stored media failed integrity verification."), { code: "MEDIA_ARTIFACT_HASH_MISMATCH" });
      }
      const { width, height } = extractImageDimensions(buffer, detected.format);
      const artifact = {
        id: mediaArtifactId,
        mediaArtifactId,
        ownerUserId: String(row.owner_id),
        caseId: row.case_id || null,
        sha256: actualHash,
        mimeType: detected.mimeType,
        format: detected.format,
        width,
        height,
        byteSize: buffer.length,
        privateStoragePath: `${PRIVATE_MEDIA_BUCKET}/${row.object_key}`,
        createdAt: new Date(row.created_at).toISOString(),
        createdAtTime: Date.now(),
        retentionState: "ACTIVE",
        buffer,
      };
      ephemeralArtifactStore.set(mediaArtifactId, artifact);
      return { ok: true, artifact: { mediaArtifactId, sha256: actualHash, mimeType: detected.mimeType, width, height, byteSize: buffer.length, createdAt: artifact.createdAt, retentionState: "ACTIVE" } };
    } catch (error) {
      return { ok: false, error: safeMediaError(error, error?.code === "MEDIA_ARTIFACT_ACCESS_DENIED" ? "MEDIA_ARTIFACT_ACCESS_DENIED" : "MEDIA_STORAGE_UNAVAILABLE") };
    }
  }

  static async createSignedReadUrl(mediaArtifactId, { requesterUserId, roomId = null, storageClient = null, pool = null, expiresIn = SIGNED_MEDIA_URL_TTL_SECONDS } = {}) {
    try {
      const row = await this.#authorizedRow(mediaArtifactId, { requesterUserId, roomId, pool });
      const storage = storageClient || getSupabaseStorageClient();
      const signed = await storage.storage.from(PRIVATE_MEDIA_BUCKET).createSignedUrl(row.object_key, Math.max(60, Math.min(600, Number(expiresIn) || SIGNED_MEDIA_URL_TTL_SECONDS)));
      if (signed?.error || !(signed?.data?.signedUrl || signed?.data?.signedURL)) throw signed?.error || new Error("Signed media URL was not created.");
      return { ok: true, url: signed.data.signedUrl || signed.data.signedURL, expiresIn: Math.max(60, Math.min(600, Number(expiresIn) || SIGNED_MEDIA_URL_TTL_SECONDS)) };
    } catch (error) {
      return { ok: false, error: safeMediaError(error, error?.code === "MEDIA_ARTIFACT_ACCESS_DENIED" ? "MEDIA_ARTIFACT_ACCESS_DENIED" : "MEDIA_STORAGE_UNAVAILABLE") };
    }
  }

  static async linkToTrustCase({ mediaArtifactId, ownerUserId, caseId, expectedSha256, client }) {
    const artifactId = artifactUuid(mediaArtifactId);
    if (!artifactId || !UUID_PATTERN.test(String(ownerUserId || "")) || !UUID_PATTERN.test(String(caseId || ""))) {
      throw Object.assign(new Error("Invalid media case linkage."), { code: "MEDIA_ARTIFACT_CONFLICT" });
    }
    const result = await client.query(
      `UPDATE public.screenshot_objects SET case_id = $3::uuid
        WHERE id = $1::uuid AND owner_id = $2::uuid AND bucket_id = $4
          AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at > now()) AND encode(sha256, 'hex') = $5
          AND (case_id IS NULL OR case_id = $3::uuid)
        RETURNING id`,
      [artifactId, String(ownerUserId).toLowerCase(), String(caseId).toLowerCase(), PRIVATE_MEDIA_BUCKET, String(expectedSha256 || "").toLowerCase()],
    );
    if (result.rowCount !== 1) throw Object.assign(new Error("Media artifact does not match the Trust case provenance."), { code: "MEDIA_ARTIFACT_CONFLICT" });
  }

  static async lockRoomArtifact({ mediaArtifactId, ownerUserId, expectedSha256, client }) {
    const id = artifactUuid(mediaArtifactId);
    if (!id || !UUID_PATTERN.test(String(ownerUserId || ""))) throw Object.assign(new Error("Invalid room media linkage."), { code: "MEDIA_ARTIFACT_CONFLICT" });
    const result = await client.query(
      `SELECT id FROM public.screenshot_objects
        WHERE id = $1::uuid AND owner_id = $2::uuid AND bucket_id = $3
          AND encode(sha256, 'hex') = $4 AND deleted_at IS NULL
          AND (expires_at IS NULL OR expires_at > now()) FOR UPDATE`,
      [id, String(ownerUserId).toLowerCase(), PRIVATE_MEDIA_BUCKET, String(expectedSha256 || "").toLowerCase()],
    );
    if (result.rowCount !== 1) throw Object.assign(new Error("Room media is no longer available."), { code: "MEDIA_ARTIFACT_CONFLICT" });
  }

  static async cleanupUnreferencedArtifact({ mediaArtifactId, ownerUserId, storageClient = null, pool = null }) {
    const artifactId = artifactUuid(mediaArtifactId);
    if (!artifactId || !UUID_PATTERN.test(String(ownerUserId || ""))) return { ok: false, error: safeMediaError({ code: "MEDIA_ARTIFACT_ACCESS_DENIED" }, "MEDIA_ARTIFACT_ACCESS_DENIED") };
    let client;
    try {
      const database = pool || getPostgresPool();
      client = await database.connect();
      await client.query("BEGIN");
      const rowResult = await client.query(
        `SELECT object_key FROM public.screenshot_objects
          WHERE id = $1::uuid AND owner_id = $2::uuid AND bucket_id = $3
            AND case_id IS NULL AND deleted_at IS NULL FOR UPDATE`,
        [artifactId, String(ownerUserId).toLowerCase(), PRIVATE_MEDIA_BUCKET],
      );
      if (!rowResult.rows?.[0]) {
        await client.query("COMMIT");
        return { ok: true, removed: false };
      }
      // Room creation locks the same metadata row before publishing a reference.
      // Recheck on a fresh statement after obtaining the lock to observe any
      // Room creation that committed while this transaction was waiting.
      const referenced = await client.query(
        `SELECT (EXISTS (SELECT 1 FROM private.expert_verification_rooms
          WHERE challenge_payload #>> '{metadata,mediaArtifactId}' = $1)
          OR EXISTS (SELECT 1 FROM public.case_inputs WHERE object_key = $1)) AS referenced`, [mediaArtifactId],
      );
      if (referenced.rows?.[0]?.referenced !== false) {
        await client.query("COMMIT");
        return { ok: true, removed: false };
      }
      const objectKey = rowResult.rows[0].object_key;
      const allowedKeys = ["png", "jpg", "jpeg", "webp"].map((ext) => `${String(ownerUserId).toLowerCase()}/${artifactId}.${ext}`);
      if (!allowedKeys.includes(objectKey)) throw new Error("Cleanup object ownership is inconsistent.");
      const storage = storageClient || getSupabaseStorageClient();
      const removed = await storage.storage.from(PRIVATE_MEDIA_BUCKET).remove([objectKey]);
      if (removed?.error) throw removed.error;
      const deleted = await client.query(
        `DELETE FROM public.screenshot_objects WHERE id = $1::uuid AND owner_id = $2::uuid
          AND case_id IS NULL AND object_key = $3`, [artifactId, String(ownerUserId).toLowerCase(), objectKey],
      );
      if (deleted.rowCount !== 1) throw new Error("Exact media metadata cleanup failed.");
      await client.query("COMMIT");
      ephemeralArtifactStore.delete(mediaArtifactId);
      return { ok: true, removed: true };
    } catch {
      if (client) await client.query("ROLLBACK").catch(() => {});
      return { ok: false, error: safeMediaError({ code: "MEDIA_STORAGE_CLEANUP_FAILED" }) };
    } finally {
      client?.release();
    }
  }

  /**
   * Retrieves an artifact by mediaArtifactId safely.
   */
  static getArtifact(mediaArtifactId) {
    this.cleanExpired();
    if (!mediaArtifactId || typeof mediaArtifactId !== "string") return null;
    return ephemeralArtifactStore.get(mediaArtifactId) || null;
  }

  /**
   * Retrieves bytes for processing (server-only).
   */
  static getArtifactBytes(mediaArtifactId) {
    const item = this.getArtifact(mediaArtifactId);
    return item?.buffer || null;
  }
}
