import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { decodeQrArtifactBytes } from "../../src/lib/server/media/QrArtifactDecoder.js";

test("QR image decoding derives the payload from canonical artifact bytes", async () => {
  const bytes = await readFile(new URL("./fixtures/room-media-qr.png", import.meta.url));
  const decoded = await decodeQrArtifactBytes(bytes);
  assert.deepEqual(decoded, { ok: true, payload: "https://example.org/studenthub/room-media-acceptance" });
});

test("unreadable QR images do not invent a decoded payload", async () => {
  const blank = await sharp({ create: { width: 64, height: 64, channels: 4, background: "white" } }).png().toBuffer();
  assert.deepEqual(await decodeQrArtifactBytes(blank), { ok: false, code: "QR_IMAGE_UNREADABLE" });
  assert.deepEqual(await decodeQrArtifactBytes(Buffer.from("invalid image")), { ok: false, code: "QR_IMAGE_UNREADABLE" });
});
