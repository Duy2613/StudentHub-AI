import test from "node:test";
import assert from "node:assert/strict";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("Privacy & Redaction — Public MediaForensicsDTO strictly redacts private metadata", () => {
  const privateStoragePath = "trust-screenshots-private/user_123/art_abc.jpg";
  const rawExifBlob = { rawLength: 65536, hasRawGps: true, rawGpsBytes: "N10.7725_E106.6980" };
  const rawGenAiResponse = { api_user: "secret_user", raw_body: "sensitive_vendor_response" };

  const evaluated = ImageForensicsPolicyV1.evaluate({
    artifact: {
      mediaArtifactId: "art_abc",
      sha256: "hash123",
      privateStoragePath,
      width: 1920,
      height: 1080,
      byteSize: 102400,
    },
    exifResult: {
      status: "COMPLETED",
      exifPresent: true,
      camera: { make: "Sony", model: "A7IV" },
      software: { editorDetected: false, editorName: null },
      timestamps: { creationTime: "2024:08:15 10:00:00" },
      hasGps: true,
      rawExifInternal: rawExifBlob,
    },
    genAiResult: {
      provider: "sightengine",
      detector: "GENAI_DETECTION",
      status: "SUCCESS",
      verdict: "NO_STRONG_AI_SIGNAL",
      providerScore: 0.05,
      rawPayload: rawGenAiResponse,
    },
  });

  const { publicDto, internalMetadata } = evaluated;

  // 1. Internal metadata keeps tracking details for server/audit
  assert.equal(internalMetadata.privateStoragePath, privateStoragePath);
  assert.deepEqual(internalMetadata.rawExif, rawExifBlob);

  // 2. Public DTO MUST NOT contain private storage paths
  const publicStr = JSON.stringify(publicDto);
  assert.equal(publicStr.includes("trust-screenshots-private"), false);
  assert.equal(publicStr.includes("user_123"), false);

  // 3. Public DTO MUST NOT contain raw GPS coordinates
  assert.equal(publicStr.includes("10.7725"), false);
  assert.equal(publicStr.includes("106.6980"), false);
  assert.equal(publicDto.metadata.hasGps, true);
  assert.equal(publicDto.metadata.rawGpsBytes, undefined);

  // 4. Public DTO MUST NOT contain raw EXIF blob or vendor raw payload
  assert.equal(publicDto.metadata.rawExifInternal, undefined);
  assert.equal(publicStr.includes("secret_user"), false);

  // 5. Invariant (Hardening Rule 14): PRIVATE_METADATA_LEAK = 0
  const leakedFields = [
    publicDto.privateStoragePath,
    publicDto.rawExif,
    publicDto.metadata?.rawExifInternal,
    publicDto.metadata?.gpsCoordinates,
    publicDto.metadata?.latitude,
    publicDto.metadata?.longitude,
  ].filter(Boolean);

  assert.equal(leakedFields.length, 0);
});
