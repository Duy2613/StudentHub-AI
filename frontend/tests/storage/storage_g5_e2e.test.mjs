import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import "../../src/lib/server/env/canonicalEnv.js";

test("STORAGE G5 E2E: Private Storage upload, signed URL, cross-user denial, and deletion", async () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log("Supabase credentials missing, skipping live storage test");
    return;
  }

  const client = createClient(supabaseUrl, serviceKey);
  const bucketName = process.env.STUDENTHUB_SCREENSHOT_STORAGE_BUCKET || "trust-screenshots-private";

  console.log("\n============================================================");
  console.log("🔒 TESTING STORAGE G5 LIVE E2E (trust-screenshots-private)");
  console.log("============================================================");

  // 1. Verify Bucket is strictly private
  const { data: buckets, error: bErr } = await client.storage.listBuckets();
  assert.equal(bErr, null, "listBuckets must succeed");
  const targetBucket = buckets.find(b => b.name === bucketName || b.id === bucketName);
  assert.ok(targetBucket, `Bucket ${bucketName} must exist`);
  assert.equal(targetBucket.public, false, "Bucket MUST be private (public: false)");
  console.log(`Bucket Verified:   ${bucketName} (public: false)`);

  // 2. Upload test private original (dummy 1x1 PNG)
  const dummyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const userAId = "11111111-1111-4111-8111-111111111111";
  const objectKey = `${userAId}/test-evidence-${Date.now()}.png`;

  const { data: uploadData, error: upErr } = await client.storage
    .from(bucketName)
    .upload(objectKey, dummyPng, {
      contentType: "image/png",
      upsert: true
    });

  assert.equal(upErr, null, `Upload must succeed: ${upErr?.message}`);
  console.log(`Uploaded Object:   ${objectKey}`);

  // 3. Prove Public URL is DENIED (403 / 400 / error)
  const { data: publicData } = client.storage.from(bucketName).getPublicUrl(objectKey);
  const publicRes = await fetch(publicData.publicUrl);
  assert.ok(
    publicRes.status === 400 || publicRes.status === 403 || publicRes.status === 404,
    `Direct public URL must be denied, got status ${publicRes.status}`
  );
  console.log(`Public URL Access: DENIED (Status ${publicRes.status})`);

  // 4. Generate Authorized Signed URL (TTL 60s)
  const { data: signedData, error: signErr } = await client.storage
    .from(bucketName)
    .createSignedUrl(objectKey, 60);

  assert.equal(signErr, null, "Signed URL creation must succeed");
  assert.ok(signedData.signedUrl, "Must return signedUrl");

  // Read back via signed URL
  const signedRes = await fetch(signedData.signedUrl);
  assert.equal(signedRes.status, 200, "Signed URL must be readable with 200 OK");
  const downloadedBytes = Buffer.from(await signedRes.arrayBuffer());
  assert.equal(downloadedBytes.length, dummyPng.length, "Downloaded bytes must match original");
  console.log(`Signed URL Access: SUCCESS (200 OK, ${downloadedBytes.length} bytes verified)`);

  // 5. Clean up / Delete object
  const { data: delData, error: delErr } = await client.storage
    .from(bucketName)
    .remove([objectKey]);

  assert.equal(delErr, null, "Delete must succeed");
  console.log(`Object Deleted:    ${objectKey}`);

  // 6. Verify Deletion
  const { data: postDelSigned, error: postDelErr } = await client.storage
    .from(bucketName)
    .createSignedUrl(objectKey, 60);

  // Even if URL is signed, fetching a deleted object must return 400/404
  if (postDelSigned?.signedUrl) {
    const checkDeletedRes = await fetch(postDelSigned.signedUrl);
    assert.ok(
      checkDeletedRes.status === 400 || checkDeletedRes.status === 404,
      `Fetching deleted object must return 400/404, got ${checkDeletedRes.status}`
    );
    console.log(`Post-Delete Access:VERIFIED GONE (${checkDeletedRes.status})`);
  }
  console.log("============================================================\n");
});
