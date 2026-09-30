import assert from "node:assert/strict";
import test from "node:test";

import { communityThreadPseudonym } from "../../src/lib/server/database/CommunityRepository.js";

test("Community thread pseudonyms are stable within a thread and isolated between threads", () => {
  const previousSecret = process.env.CAPABILITY_SECRET;
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousEnvironment = process.env.NODE_ENV;
  process.env.CAPABILITY_SECRET = "community-pseudonym-test-secret";
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "test";

  try {
    const sameThread = communityThreadPseudonym("thread-a", "user-1");
    assert.equal(communityThreadPseudonym("THREAD-A", "USER-1"), sameThread);
    assert.match(sameThread, /^Người tham gia [A-F0-9]{10}$/);
    assert.notEqual(communityThreadPseudonym("thread-a", "user-2"), sameThread);
    assert.notEqual(communityThreadPseudonym("thread-b", "user-1"), sameThread);
    assert.equal(sameThread.includes("user-1"), false);
  } finally {
    if (previousSecret === undefined) delete process.env.CAPABILITY_SECRET;
    else process.env.CAPABILITY_SECRET = previousSecret;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test("production thread pseudonyms fail closed when the server secret is absent", () => {
  const previousSecret = process.env.CAPABILITY_SECRET;
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousEnvironment = process.env.NODE_ENV;
  delete process.env.CAPABILITY_SECRET;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "production";

  try {
    assert.throws(() => communityThreadPseudonym("thread-a", "user-1"), /server secret/i);
  } finally {
    if (previousSecret === undefined) delete process.env.CAPABILITY_SECRET;
    else process.env.CAPABILITY_SECRET = previousSecret;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});
