import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommunityStore } from "../../src/lib/intelligence/community/communityStore.js";
import { CommunityQueryEngine } from "../../src/lib/intelligence/community/communityQueryEngine.js";

describe("Community production fixture boundary", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemo = process.env.STUDENTHUB_COMMUNITY_DEMO;
  const storagePath = join(mkdtempSync(join(tmpdir(), "studenthub-community-production-")), "store.json");

  before(() => {
    process.env.NODE_ENV = "production";
    delete process.env.STUDENTHUB_COMMUNITY_DEMO;
    delete process.env.STUDENTHUB_PERSISTENCE_ADAPTER;
    CommunityStore.setStoragePath(storagePath);
  });

  after(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalDemo === undefined) delete process.env.STUDENTHUB_COMMUNITY_DEMO;
    else process.env.STUDENTHUB_COMMUNITY_DEMO = originalDemo;
    rmSync(storagePath, { force: true });
    rmSync(join(storagePath, ".."), { recursive: true, force: true });
  });

  it("does not seed TOEIC fixture observations in production", () => {
    CommunityStore.clear();
    const result = CommunityQueryEngine.query({ topic: "TOEIC_SUBMISSION_TIME" });
    const serialized = JSON.stringify(result);

    assert.doesNotMatch(serialized, /POST_TOEIC_01|POST_TOEIC_02|POST_TOEIC_03|POST_TOEIC_EDGE/);
    assert.equal(result.communityReality.firstHandReportCount, 0);
    assert.equal(result.communityReality.independentProvenanceClustersCount, 0);
  });
});
