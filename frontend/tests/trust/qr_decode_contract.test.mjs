import test from "node:test";
import assert from "node:assert/strict";
import { QrIntakeService } from "../../src/lib/ai-trust/layer1/qr/QrIntakeService.js";
import { LAYER_1_REASONS } from "../../src/lib/ai-trust/layer1/types.js";

test("QR Decode Contract — Server independently normalizes and classifies URL vs Text", () => {
  // Scenario 1: Standard HTTPS URL in QR
  const urlPayload = "https://studenthub.vn/login?utm_source=qr";
  const urlIntake = QrIntakeService.intake(urlPayload);

  assert.equal(urlIntake.inputType, "QR");
  assert.equal(urlIntake.decodedType, "URL");
  assert.equal(urlIntake.decodedValue, urlPayload);
  assert.ok(urlIntake.normalizedValue.includes("https://studenthub.vn/login"));
  assert.equal(urlIntake.securityStatus, "SAFE");

  // Invariant (Hardening Rule 2): Intake DTO has NO truth verdict
  assert.equal(urlIntake.verdict, undefined);
  assert.equal(urlIntake.isAuthentic, undefined);
  assert.equal(urlIntake.isFake, undefined);

  // Scenario 2: Plain Text in QR
  const textPayload = "Hello, StudentHub AI Trust Engine!";
  const textIntake = QrIntakeService.intake(textPayload);

  assert.equal(textIntake.inputType, "QR");
  assert.equal(textIntake.decodedType, "TEXT");
  assert.equal(textIntake.decodedValue, textPayload);
  assert.equal(textIntake.securityStatus, "SAFE");
});

test("QR Decode Contract — Server ignores untrusted client-supplied metadata", () => {
  // Client attempts to pass pre-cooked client output claiming it is already a 'SAFE' URL
  const maliciousClientPayload = {
    content: "javascript:alert(document.cookie)",
    decodedType: "URL", // Client claims it's a URL
    securityStatus: "SAFE", // Client claims it's SAFE
    normalizedValue: "https://legit.vn", // Client tries spoofed normalization
  };

  const intake = QrIntakeService.intake(maliciousClientPayload);

  // Server independently evaluates raw content: detects javascript scheme and BLOCKS
  assert.equal(intake.decodedType, "OTHER");
  assert.equal(intake.securityStatus, "BLOCKED");
  assert.equal(intake.signals.some(s => s.type === LAYER_1_REASONS.MALICIOUS_SCRIPT_PAYLOAD), true);
});

test("QR Decode Contract — Empty QR payload is handled gracefully", () => {
  const emptyIntake = QrIntakeService.intake("");
  assert.equal(emptyIntake.decodedType, "EMPTY");
  assert.equal(emptyIntake.securityStatus, "BLOCKED");
});
