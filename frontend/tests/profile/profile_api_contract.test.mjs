import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = existsSync(join(process.cwd(), "frontend", "src"))
  ? join(process.cwd(), "frontend")
  : process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("User Profile UI calls the Owner /api/users/me contract and only edits FullName/AvatarUrl", () => {
  const page = read("src/app/profile/page.jsx");
  const authService = read("src/lib/auth/authService.js");
  const route = read("src/app/api/users/me/route.js");

  assert.match(page, /const EDITABLE_FIELDS = \["fullName", "avatarUrl"\]/);
  assert.match(page, /FullName/);
  assert.match(page, /AvatarUrl/);
  assert.match(page, /TrustScore/);
  assert.match(page, /StarLevel/);
  assert.match(page, /Email/);
  assert.match(authService, /\/api\/users\/me/);
  assert.match(route, /export \{ GET, PUT \} from "\.\.\/profile\/route\.js"/);
});

test("Expert Profile uses a separate read/write contract and keeps authority fields read-only", () => {
  const page = read("src/components/expert/ExpertProfileWorkspace.jsx");
  const route = read("src/app/api/experts/me/route.js");
  const service = read("src/lib/server/expert/ExpertQualificationService.js");

  assert.match(page, /\/api\/experts\/me/);
  assert.match(page, /Bio/);
  assert.match(page, /Expertise/);
  assert.match(page, /TrustScore/);
  assert.match(page, /StarLevel/);
  assert.match(route, /export const GET/);
  assert.match(route, /export const PUT/);
  assert.match(route, /trustScore: null/);
  assert.match(route, /starLevel: null/);
  assert.match(route, /body\?\.Bio/);
  assert.match(route, /body\?\.Expertise/);
  assert.match(service, /static async updateProfile/);
});
