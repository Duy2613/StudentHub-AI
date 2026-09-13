import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const protectedWrites = new Map([
  ["frontend/src/app/api/expert/appeals/route.js", "COMMUNITY.POST"],
  ["frontend/src/app/api/expert/appeals/review/route.js", "ADMIN.SECURITY"],
  ["frontend/src/app/api/expert/assignments/route.js", "ADMIN.SECURITY"],
  ["frontend/src/app/api/expert/assessments/route.js", "EXPERT.EVALUATE"],
  ["frontend/src/app/api/expert/qualification/route.js", "EXPERT.READ"],
  ["frontend/src/app/api/expert/qualification/quiz/route.js", "EXPERT.READ"],
  ["frontend/src/app/api/expert/qualification/quiz/answers/route.js", "EXPERT.READ"],
  ["frontend/src/app/api/expert/qualification/quiz/submit/route.js", "EXPERT.READ"],
  ["frontend/src/app/api/expert/qualification/practice/route.js", "EXPERT.READ"],
  ["frontend/src/app/api/expert/qualification/practice/review/route.js", "ADMIN.SECURITY"],
  ["frontend/src/app/api/expert/qualification/review/route.js", "ADMIN.SECURITY"],
  ["frontend/src/app/api/expert/quality/route.js", "ADMIN.SECURITY"],
  ["frontend/src/app/api/expert/reviews/route.js", "EXPERT.EVALUATE"],
]);

test("every durable Expert write route is authenticated and permission-gated", () => {
  for (const [path, permission] of protectedWrites) {
    const source = read(path);
    assert.match(source, /SecurityFabric\.wrapHandler/, path);
    assert.match(source, /allowAnonymous:\s*false/, path);
    assert.match(source, new RegExp(`requiredPermission\\s*:\\s*["']${permission.replace(".", "\\.")}["']`), `${path} must require ${permission}`);
  }
});

test("durable Expert writes use the authenticated principal instead of a client actor", () => {
  for (const path of [
    "frontend/src/app/api/expert/appeals/route.js",
    "frontend/src/app/api/expert/appeals/review/route.js",
    "frontend/src/app/api/expert/assignments/route.js",
    "frontend/src/app/api/expert/assessments/route.js",
    "frontend/src/app/api/expert/qualification/route.js",
    "frontend/src/app/api/expert/qualification/practice/route.js",
    "frontend/src/app/api/expert/qualification/practice/review/route.js",
    "frontend/src/app/api/expert/qualification/review/route.js",
    "frontend/src/app/api/expert/reviews/route.js",
  ]) {
    const source = read(path);
    assert.match(source, /principal\.subjectId|authenticatedUserId\(principal\)/, path);
  }
});

test("the public Expert scope evaluator is explicitly non-persistent", () => {
  const source = read("frontend/src/app/api/expert/evaluate/route.js");
  assert.match(source, /allowAnonymous:\s*true/);
  assert.match(source, /EXPERT_STORAGE_UNAVAILABLE/);
  assert.doesNotMatch(source, /submitAssessment|createAssignment|recordQualityEvent|UPDATE|INSERT/i);
});

test("durable sessions expose the Expert read scope for roles that already grant Expert.READ", () => {
  const source = read("frontend/src/lib/security/identity/IdentityResolver.js");
  assert.match(source, /BASE_SCOPES/);
  assert.match(source, /defaultScopesForRoles/);
  assert.match(source, /STUDENT.*EXPERT.*ADMIN.*AI_AGENT/);
  assert.match(source, /expert:read/);
});

test("public Expert read projections keep RBAC without blocking browser sessions on an OAuth scope", () => {
  for (const path of [
    "frontend/src/app/api/intelligence/experts/route.js",
    "frontend/src/app/api/intelligence/experts/[expertId]/route.js",
    "frontend/src/app/api/expert/profile/[expertId]/route.js",
    "frontend/src/app/api/v1/experts/route.js",
  ]) {
    const source = read(path);
    assert.match(source, /requiredPermission:\s*["']EXPERT\.READ["']/);
    assert.match(source, /allowAnonymous:\s*true/);
    assert.doesNotMatch(source, /requiredScopes:\s*\[["']expert:read["']\]/);
  }
});
