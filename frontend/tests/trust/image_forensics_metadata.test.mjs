import test from "node:test";
import assert from "node:assert/strict";
import { ExifForensicsAnalyzer } from "../../src/lib/ai-trust/forensics/deterministic/ExifForensicsAnalyzer.js";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("EXIF Forensics — Detects editor software and treats it as a SIGNAL, not proof of fake", () => {
  // Construct dummy binary buffer containing EXIF header with 'Photoshop'
  const header = "Exif\0\0" + "Apple iPhone 15 Pro\0" + "Adobe Photoshop 2024\0" + "2024:08:15 14:32:00\0";
  const buffer = Buffer.concat([
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
    Buffer.from(header, "latin1"),
    Buffer.alloc(200),
  ]);

  const analysis = ExifForensicsAnalyzer.analyze(buffer);

  assert.equal(analysis.exifPresent, true);
  assert.equal(analysis.camera.make, "Apple");
  assert.equal(analysis.software.editorDetected, true);
  assert.equal(analysis.software.editorName, "photoshop");
  assert.equal(analysis.timestamps.creationTime, "2024:08:15 14:32:00");

  const evaluated = ImageForensicsPolicyV1.evaluate({
    exifResult: analysis,
    artifact: { mediaArtifactId: "art_exif", sha256: "hash_exif" },
  });

  const dto = evaluated.publicDto;
  assert.equal(dto.metadata.software.editorDetected, true);
  assert.equal(dto.metadata.software.editorName, "photoshop");

  // Invariant (Hardening Rule 6): Photoshop software tag does NOT automatically mean FAKE
  assert.equal(dto.verdict, undefined);
  assert.notEqual(dto.summary.riskLevel, "CRITICAL");
});

test("EXIF Forensics — Stripped metadata is handled gracefully and does NOT prove fake", () => {
  // Binary with no EXIF markers
  const cleanBuffer = Buffer.concat([
    Buffer.from([0xFF, 0xD8, 0xFF, 0xDB]),
    Buffer.alloc(200),
  ]);

  const analysis = ExifForensicsAnalyzer.analyze(cleanBuffer);

  assert.equal(analysis.exifPresent, false);
  assert.equal(analysis.status, "NO_EXIF");
  assert.equal(analysis.software.editorDetected, false);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    exifResult: analysis,
    artifact: { mediaArtifactId: "art_noexif", sha256: "hash_noexif" },
  });

  assert.equal(evaluated.publicDto.metadata.exifPresent, false);
  // Missing metadata must not cause high risk or fake verdict
  assert.notEqual(evaluated.publicDto.summary.riskLevel, "HIGH");
  assert.notEqual(evaluated.publicDto.summary.riskLevel, "CRITICAL");
});

test("EXIF Forensics — Detects GPS presence while strictly redacting coordinates", () => {
  const header = "Exif\0\0" + "Canon EOS R5\0" + "GPSInfo\0" + "GPSVersionID\0";
  const buffer = Buffer.concat([
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
    Buffer.from(header, "latin1"),
    Buffer.alloc(200),
  ]);

  const analysis = ExifForensicsAnalyzer.analyze(buffer);
  assert.equal(analysis.hasGps, true);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    exifResult: analysis,
    artifact: { mediaArtifactId: "art_gps", sha256: "hash_gps" },
  });

  // Public DTO has boolean hasGps only
  assert.equal(evaluated.publicDto.metadata.hasGps, true);
  assert.equal(evaluated.publicDto.metadata.gpsCoordinates, undefined);
  assert.equal(evaluated.publicDto.metadata.latitude, undefined);
  assert.equal(evaluated.publicDto.metadata.longitude, undefined);
});
