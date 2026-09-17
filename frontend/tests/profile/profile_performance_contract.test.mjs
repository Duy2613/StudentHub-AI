import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getRouteMediaPolicy } from "../../src/lib/media/vnextMediaRegistry.js";

const root = existsSync(join(process.cwd(), "frontend", "src"))
  ? join(process.cwd(), "frontend")
  : process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("Profile Performance Contract: Route media policy strictly forbids video for profile routes", () => {
  // 1. Check expert route policy
  const expertPolicy = getRouteMediaPolicy("/expert/profile");
  assert.ok(expertPolicy);
  assert.equal(expertPolicy.videoEligible, false);

  // 2. Check static/fallback route policy for /profile
  const userProfilePolicy = getRouteMediaPolicy("/profile");
  assert.ok(userProfilePolicy);
  assert.equal(userProfilePolicy.videoEligible, false);
  assert.equal(userProfilePolicy.presentation, "static");
});

test("Profile Performance Contract: User Profile source code has 0 <video> elements", () => {
  const userPage = read("src/app/profile/page.jsx");
  assert.doesNotMatch(userPage, /<video/i);
  assert.doesNotMatch(userPage, /autoPlay/i);
  assert.doesNotMatch(userPage, /<canvas/i);
});

test("Profile Performance Contract: Expert Profile source code has 0 <video> elements", () => {
  const expertPage = read("src/app/expert/profile/page.jsx");
  const expertWorkspace = read("src/components/expert/ExpertProfileWorkspace.jsx");
  const reviewModal = read("src/components/expert/ExpertReviewDeskModal.jsx");

  assert.doesNotMatch(expertPage, /<video/i);
  assert.doesNotMatch(expertWorkspace, /<video/i);
  assert.doesNotMatch(reviewModal, /<video/i);
  assert.doesNotMatch(reviewModal, /autoPlay/i);
});

test("Profile Performance Contract: Lightweight skeleton loaders are used instead of blocking spinners", () => {
  const userPage = read("src/app/profile/page.jsx");
  const expertWorkspace = read("src/components/expert/ExpertProfileWorkspace.jsx");

  assert.match(userPage, /animate-pulse/);
  assert.match(expertWorkspace, /workspace-loading/);
});
