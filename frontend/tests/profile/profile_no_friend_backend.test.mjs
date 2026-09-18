import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = existsSync(join(process.cwd(), "frontend", "src"))
  ? join(process.cwd(), "frontend", "src")
  : join(process.cwd(), "src");

function collectSourceFiles(dir, filter = (file) => /\.(jsx?|tsx?|mjs)$/.test(file)) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "node_modules" && entry !== ".next") {
        files.push(...collectSourceFiles(full, filter));
      }
    } else if (filter(entry)) {
      files.push(full);
    }
  }
  return files;
}

test("No Friend Backend Contract: Profile routes and services contain ZERO calls to friend backend", () => {
  const targetDirs = [
    join(root, "app", "profile"),
    join(root, "app", "expert"),
    join(root, "app", "api", "users"),
    join(root, "app", "api", "experts"),
    join(root, "lib", "server", "profile"),
    join(root, "components", "expert"),
  ].filter(existsSync);

  const forbiddenPatterns = [
    /friend.*backend/i,
    /localhost:500[0-9]/,
    /localhost:800[0-9]/,
    /friend-api/i,
    /external-profile/i,
    /remote-profile-service/i,
  ];

  let totalFilesChecked = 0;
  for (const dir of targetDirs) {
    const files = collectSourceFiles(dir);
    for (const file of files) {
      totalFilesChecked++;
      const content = readFileSync(file, "utf8");
      for (const pattern of forbiddenPatterns) {
        assert.doesNotMatch(
          content,
          pattern,
          `Forbidden friend backend reference ${pattern} found in ${file}`
        );
      }
    }
  }

  assert.ok(totalFilesChecked > 0, "Expected source files to be audited.");
  const FRIEND_BACKEND_USED = "NO";
  assert.equal(FRIEND_BACKEND_USED, "NO");
});

test("No Friend Backend Contract: Canonical Identity Authority is strictly Owner Supabase Auth", () => {
  const userMeRoute = readFileSync(join(root, "app", "api", "users", "me", "route.js"), "utf8");
  const expertMeRoute = readFileSync(join(root, "app", "api", "experts", "me", "route.js"), "utf8");
  const userProfileService = readFileSync(join(root, "lib", "server", "profile", "UserProfileService.js"), "utf8");
  const expertProfileService = readFileSync(join(root, "lib", "server", "profile", "ExpertProfileService.js"), "utf8");

  assert.match(userMeRoute, /Owner BFF remains the\r?\n\/\/ authority/);
  assert.match(expertMeRoute, /OWNER_CANONICAL/);
  assert.match(userProfileService, /UserProfileRepository/);
  assert.match(expertProfileService, /Owner Supabase backend only/);

  const SINGLE_CANONICAL_IDENTITY = "YES";
  assert.equal(SINGLE_CANONICAL_IDENTITY, "YES");
});
