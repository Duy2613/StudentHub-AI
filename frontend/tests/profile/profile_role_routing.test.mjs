import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "../../src/lib/auth/presentationState.js";

const root = existsSync(join(process.cwd(), "frontend", "src"))
  ? join(process.cwd(), "frontend")
  : process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("Profile Role Routing: Active Expert is redirected from /profile to /expert/profile", () => {
  const userPage = read("src/app/profile/page.jsx");
  // Asserts role-aware redirection logic is present in user profile page
  assert.match(userPage, /expertLifecycleState === EXPERT_LIFECYCLE_STATE\.ACTIVE/);
  assert.match(userPage, /router\.replace\("\/expert\/profile"\)/);
});

test("Profile Role Routing: UnifiedAppShell routes Active Expert to /expert/profile and Student to /profile", () => {
  const shell = read("src/components/layout/UnifiedAppShell.jsx");
  assert.match(shell, /expertLifecycleState === EXPERT_LIFECYCLE_STATE\.ACTIVE/);
  assert.match(shell, /label: "Hồ sơ chuyên gia", href: "\/expert\/profile"/);
  assert.match(shell, /label: "Hồ sơ cá nhân", href: "\/profile"/);
});

test("Profile Role Routing: Routing authority is server-controlled (no localStorage/query override)", () => {
  const userPage = read("src/app/profile/page.jsx");
  const expertPage = read("src/components/expert/ExpertProfileWorkspace.jsx");

  // Verify that neither page reads role from localStorage or query params for routing
  assert.doesNotMatch(userPage, /localStorage\.getItem\(["']role["']\)/);
  assert.doesNotMatch(userPage, /searchParams\.get\(["']role["']\)/);
  assert.doesNotMatch(expertPage, /localStorage\.getItem\(["']role["']\)/);
  assert.doesNotMatch(expertPage, /searchParams\.get\(["']role["']\)/);
});

test("Profile Role Routing: EXPERT_LIFECYCLE_STATE maps accurately to canonical states", () => {
  assert.equal(normalizeExpertLifecycleState("ACTIVE"), EXPERT_LIFECYCLE_STATE.ACTIVE);
  assert.equal(normalizeExpertLifecycleState("DOMAIN_REVIEW"), EXPERT_LIFECYCLE_STATE.HUMAN_REVIEW);
  assert.equal(normalizeExpertLifecycleState("QUIZ_ELIGIBLE"), EXPERT_LIFECYCLE_STATE.QUIZ);
  assert.equal(normalizeExpertLifecycleState("NOT_APPLIED"), EXPERT_LIFECYCLE_STATE.NONE);
});
