import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

process.env.STUDENTHUB_HERMETIC_TEST_MODE = "1";
const { MediaArtifactService } = await import("../../src/lib/server/media/MediaArtifactService.js");

const OWNER_ID = "f67b61d6-17af-4c95-9ddd-7366d6cb3c32";
const OUTSIDER_ID = "897b1459-025d-4aa0-aee7-66518e0f3c71";

function pngFixture() {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  bytes.writeUInt32BE(1, 16);
  bytes.writeUInt32BE(1, 20);
  return bytes;
}

function storageFake({ downloadBytes } = {}) {
  const calls = { upload: [], download: [], sign: [], remove: [] };
  return {
    calls,
    client: {
      storage: {
        from(bucket) {
          return {
            async upload(path, bytes, options) { calls.upload.push({ bucket, path, bytes, options }); return { data: { path }, error: null }; },
            async download(path) { calls.download.push({ bucket, path }); return { data: downloadBytes ? new Blob([downloadBytes]) : null, error: null }; },
            async createSignedUrl(path, expiresIn) { calls.sign.push({ bucket, path, expiresIn }); return { data: { signedUrl: `https://storage.test/${encodeURIComponent(path)}?token=temporary` }, error: null }; },
            async remove(paths) { calls.remove.push({ bucket, paths }); return { data: paths.map((name) => ({ name })), error: null }; },
          };
        },
      },
    },
  };
}

function metadataRow({ artifactUuid, ownerId = OWNER_ID, bytes, objectKey }) {
  return {
    id: artifactUuid,
    owner_id: ownerId,
    case_id: null,
    bucket_id: "trust-screenshots-private",
    object_key: objectKey,
    mime_type: "image/png",
    byte_size: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    created_at: new Date("2026-10-01T00:00:00.000Z"),
    expires_at: null,
  };
}

test("durable ingestion stores the same UUID, owner, object key, bytes and SHA-256 in Storage and metadata", async () => {
  const bytes = pngFixture();
  const storage = storageFake();
  const queries = [];
  const pool = { async query(sql, values) { queries.push({ sql, values }); return { rows: [{ id: values[0] }], rowCount: 1 }; } };

  const result = await MediaArtifactService.ingestImage({ bytes, claimedMimeType: "image/png", ownerUserId: OWNER_ID, requireDurableStorage: true, storageClient: storage.client, pool });

  assert.equal(result.ok, true);
  const artifactUuid = result.artifact.mediaArtifactId.slice(4);
  const objectKey = `${OWNER_ID}/${artifactUuid}.png`;
  assert.match(artifactUuid, /^[0-9a-f-]{36}$/i);
  assert.equal(storage.calls.upload.length, 1);
  assert.equal(storage.calls.upload[0].bucket, "trust-screenshots-private");
  assert.equal(storage.calls.upload[0].path, objectKey);
  assert.equal(storage.calls.upload[0].options.contentType, "image/png");
  assert.equal(storage.calls.upload[0].options.upsert, false);
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /INSERT INTO public\.screenshot_objects/i);
  assert.equal(queries[0].values[0], artifactUuid);
  assert.equal(queries[0].values[1], OWNER_ID);
  assert.equal(queries[0].values[4], objectKey);
  assert.equal(queries[0].values[5], "image/png");
  assert.equal(queries[0].values[6], bytes.length);
  assert.equal(queries[0].values[7].toString("hex"), result.artifact.sha256);
  assert.deepEqual(MediaArtifactService.getArtifactBytes(result.artifact.mediaArtifactId), bytes);
});

test("durable ingestion compensates the exact object when metadata insertion fails", async () => {
  const bytes = pngFixture();
  const storage = storageFake();
  const error = Object.assign(new Error("database unavailable"), { code: "42P01" });
  const pool = { async query() { throw error; } };

  const result = await MediaArtifactService.ingestImage({ bytes, ownerUserId: OWNER_ID, storageClient: storage.client, pool });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MEDIA_STORAGE_SCHEMA_REQUIRED");
  assert.equal(result.error.statusCode, 503);
  assert.equal(storage.calls.upload.length, 1);
  assert.deepEqual(storage.calls.remove, [{ bucket: "trust-screenshots-private", paths: [storage.calls.upload[0].path] }]);
  assert.equal(MediaArtifactService.getArtifact(result.artifact?.mediaArtifactId), null);
});

test("cold hydration verifies digest and authorizes signed read URLs against the same metadata row", async () => {
  const bytes = pngFixture();
  const artifactUuid = "658bbeb0-36cc-472d-a3ed-954027c7d0d0";
  const mediaArtifactId = `art_${artifactUuid}`;
  const objectKey = `${OWNER_ID}/${artifactUuid}.png`;
  const row = metadataRow({ artifactUuid, bytes, objectKey });
  const pool = { async query(sql, values) {
    assert.match(sql, /p\.state <> 'LEFT'/);
    assert.match(sql, /so\.owner_id = \$2::uuid/);
    assert.equal(values[0], artifactUuid);
    assert.equal(values[1], OWNER_ID);
    return { rows: [row], rowCount: 1 };
  } };
  const storage = storageFake({ downloadBytes: bytes });

  const hydrated = await MediaArtifactService.hydrateArtifact(mediaArtifactId, { requesterUserId: OWNER_ID, expectedSha256: row.sha256, storageClient: storage.client, pool });
  assert.equal(hydrated.ok, true);
  assert.equal(hydrated.artifact.sha256, row.sha256);
  assert.deepEqual(MediaArtifactService.getArtifactBytes(mediaArtifactId), bytes);
  assert.deepEqual(storage.calls.download, [{ bucket: "trust-screenshots-private", path: objectKey }]);

  const signed = await MediaArtifactService.createSignedReadUrl(mediaArtifactId, { requesterUserId: OWNER_ID, roomId: "b9fda6cb-6e38-4cf3-91e5-fb05868becd1", storageClient: storage.client, pool });
  assert.equal(signed.ok, true);
  assert.match(signed.url, /token=temporary/);
  assert.deepEqual(storage.calls.sign, [{ bucket: "trust-screenshots-private", path: objectKey, expiresIn: 300 }]);
});

test("outsider cannot hydrate an artifact and causes no Storage read", async () => {
  const storage = storageFake({ downloadBytes: pngFixture() });
  const pool = { async query() { return { rows: [], rowCount: 0 }; } };

  const result = await MediaArtifactService.hydrateArtifact("art_658bbeb0-36cc-472d-a3ed-954027c7d0d0", {
    requesterUserId: OUTSIDER_ID,
    roomId: "b9fda6cb-6e38-4cf3-91e5-fb05868becd1",
    storageClient: storage.client,
    pool,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MEDIA_ARTIFACT_ACCESS_DENIED");
  assert.equal(result.error.statusCode, 403);
  assert.equal(storage.calls.download.length, 0);
});

test("cleanup removes one run-owned object only when it has no case or Room reference", async () => {
  const artifactUuid = "658bbeb0-36cc-472d-a3ed-954027c7d0d0";
  const objectKey = `${OWNER_ID}/${artifactUuid}.png`;
  const storage = storageFake();
  const queries = [];
  const client = { async query(sql, values) {
    queries.push({ sql, values });
    if (/AS referenced/i.test(sql)) return { rows: [{ referenced: false }], rowCount: 1 };
    if (/^\s*SELECT/i.test(sql)) return { rows: [{ object_key: objectKey }], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  }, release() {} };
  const pool = { async connect() { return client; } };

  const result = await MediaArtifactService.cleanupUnreferencedArtifact({ mediaArtifactId: `art_${artifactUuid}`, ownerUserId: OWNER_ID, storageClient: storage.client, pool });

  assert.deepEqual(result, { ok: true, removed: true });
  assert.deepEqual(storage.calls.remove, [{ bucket: "trust-screenshots-private", paths: [objectKey] }]);
  assert.equal(queries.length, 5);
  assert.match(queries[1].sql, /case_id IS NULL/);
  assert.match(queries[1].sql, /FOR UPDATE/i);
  assert.match(queries[2].sql, /AS referenced/i);
  assert.match(queries[2].sql, /public\.case_inputs/);
  assert.match(queries[3].sql, /DELETE FROM public\.screenshot_objects/);
  assert.equal(queries[4].sql, "COMMIT");
});

test("canonical metadata mismatch and digest tampering fail before media enters the pipeline", async () => {
  const bytes = pngFixture();
  const id = "658bbeb0-36cc-472d-a3ed-954027c7d0d0";
  const row = metadataRow({ artifactUuid: id, bytes, objectKey: `${OWNER_ID}/${id}.png` });
  const storage = storageFake({ downloadBytes: bytes });
  const pool = { async query() { return { rows: [row], rowCount: 1 }; } };
  const mismatch = await MediaArtifactService.hydrateArtifact(`art_${id}`, { requesterUserId: OWNER_ID, expectedSha256: "0".repeat(64), storageClient: storage.client, pool });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.error.code, "MEDIA_ARTIFACT_HASH_MISMATCH");
  assert.equal(storage.calls.download.length, 0);
  row.object_key = `${OUTSIDER_ID}/${id}.png`;
  const signed = await MediaArtifactService.createSignedReadUrl(`art_${id}`, { requesterUserId: OWNER_ID, storageClient: storage.client, pool });
  assert.equal(signed.ok, false);
  assert.equal(signed.error.code, "MEDIA_ARTIFACT_HASH_MISMATCH");
  assert.equal(storage.calls.sign.length, 0);
});

test("cleanup leaves a Room-referenced artifact intact", async () => {
  const id = "658bbeb0-36cc-472d-a3ed-954027c7d0d0";
  const storage = storageFake();
  const client = { async query(sql) {
    if (/FOR UPDATE/i.test(sql)) return { rows: [{ object_key: `${OWNER_ID}/${id}.png` }], rowCount: 1 };
    if (/AS referenced/i.test(sql)) return { rows: [{ referenced: true }], rowCount: 1 };
    assert.doesNotMatch(sql, /DELETE/i);
    return { rows: [], rowCount: 0 };
  }, release() {} };
  const result = await MediaArtifactService.cleanupUnreferencedArtifact({ mediaArtifactId: `art_${id}`, ownerUserId: OWNER_ID, storageClient: storage.client, pool: { async connect() { return client; } } });
  assert.deepEqual(result, { ok: true, removed: false });
  assert.equal(storage.calls.remove.length, 0);
});

test("Vercel production refuses a consistently misrouted staging Storage/database configuration", async () => {
  const keys = ["NODE_ENV", "VERCEL_ENV", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "SUPABASE_PROJECT_REF", "SUPABASE_DATABASE_PROJECT_REF"];
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.SUPABASE_URL = "https://bniwtkjtramqaozrrtrk.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "unused-test-key";
    process.env.DATABASE_URL = "postgresql://postgres:unused@db.bniwtkjtramqaozrrtrk.supabase.co/postgres";
    process.env.SUPABASE_PROJECT_REF = "bniwtkjtramqaozrrtrk";
    process.env.SUPABASE_DATABASE_PROJECT_REF = "bniwtkjtramqaozrrtrk";
    const result = await MediaArtifactService.ingestImage({ bytes: pngFixture(), ownerUserId: OWNER_ID });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "MEDIA_STORAGE_PROJECT_MISMATCH");
    assert.equal(result.error.statusCode, 503);
  } finally {
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
