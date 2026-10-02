import crypto from "node:crypto";

function canonicalValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return null;
}

const IDENTITY_METADATA_KEYS = new Set([
  "url",
  "ocrText",
  "qrContent",
  "qrPayload",
  "mimeType",
  "fileName",
  "fileSize",
  "extractionAuthority",
  "institutionContext",
  "imageHash",
]);

/**
 * Hashes the normalized Trust input while preserving case-sensitive content.
 * Control metadata used by the retry path is excluded so a retry resolves the
 * same durable case without weakening URL/path/query identity.
 */
export function computeTrustInputHash(input = {}) {
  const inputType = String(input.type || "text").toLowerCase();
  const sourceMetadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
    ? Object.fromEntries(Object.entries(input.metadata).filter(([key]) => IDENTITY_METADATA_KEYS.has(key)))
    : {};
  const hasCanonicalMediaArtifact = ["image", "qr"].includes(inputType)
    && Boolean(input.metadata?.mediaArtifactId)
    && typeof sourceMetadata.imageHash === "string"
    && /^[0-9a-f]{64}$/i.test(sourceMetadata.imageHash);
  return crypto.createHash("sha256")
    .update(JSON.stringify(canonicalValue({
      type: inputType,
      // Artifact-backed media is identified by the server-verified artifact
      // digest and decoded metadata. A stale editor draft is not part of it.
      content: hasCanonicalMediaArtifact ? "" : String(input.content || "").trim(),
      metadata: sourceMetadata,
    })))
    .digest();
}
