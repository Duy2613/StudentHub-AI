import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const frontendRoot = process.cwd().endsWith("frontend") ? process.cwd() : join(process.cwd(), "frontend");

test("registration email shape does not imply verified student status or reputation points", () => {
  const radar = readFileSync(join(frontendRoot, "src/components/auth/SaffronAcademicRadar.jsx"), "utf8");
  const registration = readFileSync(join(frontendRoot, "src/app/register/page.jsx"), "utf8");

  assert.match(radar, /const hasInstitutionalEmailShape =/);
  assert.doesNotMatch(radar, /\bisStudent\b/);
  assert.match(radar, /Định dạng email có thể thuộc tổ chức/);
  assert.match(radar, /không xác nhận danh tính hoặc tư cách sinh viên/);
  assert.doesNotMatch(registration, /\+\s*30\s+điểm/i);
});
