import test from "node:test";
import assert from "node:assert/strict";
import { safeExternalUrl, safeInternalPath } from "../../src/lib/security/safeExternalUrl.js";

test("safeExternalUrl only permits HTTP and HTTPS", () => {
  assert.equal(safeExternalUrl("https://example.edu.vn/evidence"), "https://example.edu.vn/evidence");
  assert.equal(safeExternalUrl("http://example.edu.vn/evidence"), "http://example.edu.vn/evidence");
  assert.equal(safeExternalUrl("HTTPS://EXAMPLE.EDU.VN/EVIDENCE"), "https://example.edu.vn/EVIDENCE");
  assert.equal(safeExternalUrl("javascript:alert(1)"), undefined);
  assert.equal(safeExternalUrl("JAVASCRIPT:alert(1)"), undefined);
  assert.equal(safeExternalUrl(" javascript:alert(1)"), undefined);
  assert.equal(safeExternalUrl("data:text/html,<script>alert(1)</script>"), undefined);
  assert.equal(safeExternalUrl("vbscript:msgbox(1)"), undefined);
  assert.equal(safeExternalUrl("//evil.example/phish"), undefined);
  assert.equal(safeExternalUrl("not a url"), undefined);
  assert.equal(safeExternalUrl(null), undefined);
  assert.equal(safeExternalUrl(undefined), undefined);
});

test("safeInternalPath permits local routes without protocol-relative redirects", () => {
  assert.equal(safeInternalPath("/dashboard/trajectory"), "/dashboard/trajectory");
  assert.equal(safeInternalPath("//evil.example/phish"), undefined);
  assert.equal(safeInternalPath("javascript:alert(1)"), undefined);
  assert.equal(safeInternalPath("data:text/html,<script>alert(1)</script>"), undefined);
  assert.equal(safeInternalPath("dashboard/trajectory"), undefined);
});
