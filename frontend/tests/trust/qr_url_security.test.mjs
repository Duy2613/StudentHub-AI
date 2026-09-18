import test from "node:test";
import assert from "node:assert/strict";
import { QrIntakeService } from "../../src/lib/ai-trust/layer1/qr/QrIntakeService.js";
import { LAYER_1_REASONS } from "../../src/lib/ai-trust/layer1/types.js";

test("QR URL Security — Blocks SSRF targets, loopback, private networks, and cloud metadata", () => {
  const ssrfTargets = [
    "http://localhost:3000",
    "http://127.0.0.1:8000/admin",
    "http://10.0.0.1/internal",
    "http://192.168.1.1/router",
    "http://169.254.169.254/latest/meta-data/",
  ];

  for (const target of ssrfTargets) {
    const intake = QrIntakeService.intake(target);
    assert.equal(intake.securityStatus, "BLOCKED", `Should block SSRF target: ${target}`);
    assert.equal(intake.signals.some(s => s.type === LAYER_1_REASONS.SSRF_TARGET_BLOCKED), true);
  }
});

test("QR URL Security — Blocks dangerous non-HTTP schemes", () => {
  const dangerousSchemes = [
    "javascript:alert('pwned')",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "file:///etc/passwd",
    "vbscript:msgbox(1)",
  ];

  for (const payload of dangerousSchemes) {
    const intake = QrIntakeService.intake(payload);
    assert.equal(intake.securityStatus, "BLOCKED", `Should block dangerous scheme: ${payload}`);
  }
});

test("QR URL Security — Blocks URLs with embedded credentials", () => {
  const intake = QrIntakeService.intake("https://admin:supersecret@phishing-hub.com/dashboard");
  assert.equal(intake.securityStatus, "BLOCKED");
  assert.equal(intake.signals.some(s => s.type === LAYER_1_REASONS.CREDENTIAL_LEAK_IN_URL), true);
});

test("QR URL Security — Flags Punycode and IDN homograph attack domains", () => {
  const intake = QrIntakeService.intake("https://xn--80ak6aa92e.com");
  assert.ok(intake.signals.some(s => s.type === LAYER_1_REASONS.HOMOGRAPH_ATTACK));
  assert.equal(intake.securityStatus, "SUSPICIOUS");
});

test("QR URL Security — Flags open redirect parameters", () => {
  const intake = QrIntakeService.intake("https://example.com/login?redirect=https://evil.com");
  assert.ok(intake.signals.some(s => s.type === LAYER_1_REASONS.OPEN_REDIRECT_SUSPECTED));
});

test("QR URL Security — Approves standard public HTTPS URL", () => {
  const intake = QrIntakeService.intake("https://studenthub.vn/community/news");
  assert.equal(intake.securityStatus, "SAFE");
  assert.equal(intake.decodedType, "URL");
});
