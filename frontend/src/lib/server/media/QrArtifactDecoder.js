import sharp from "sharp";
import jsQR from "jsqr";

// Decode the verified Storage bytes on the server. Browser-provided QR text
// cannot replace the payload encoded in the canonical media artifact.
export async function decodeQrArtifactBytes(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length) return { ok: false, code: "QR_IMAGE_UNREADABLE" };
  try {
    const { data, info } = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(Uint8ClampedArray.from(data), info.width, info.height, { inversionAttempts: "attemptBoth" });
    if (!decoded?.data?.trim()) return { ok: false, code: "QR_IMAGE_UNREADABLE" };
    return { ok: true, payload: decoded.data.trim() };
  } catch {
    return { ok: false, code: "QR_IMAGE_UNREADABLE" };
  }
}
