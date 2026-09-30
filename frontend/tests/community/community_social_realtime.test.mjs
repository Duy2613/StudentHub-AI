import assert from "node:assert/strict";
import test from "node:test";

import { createCommunitySocialRealtimeEvent } from "../../src/lib/community/communitySocialRealtime.js";
import { normalizeRealtimeEvent } from "../../src/lib/server/realtime/DurableRealtimeRepository.js";

const postId = "11111111-1111-4111-8111-111111111111";

test("generic Community writes map to the existing public realtime channel", () => {
  const cases = [
    ["POST_CREATED", "community:contribution"],
    ["COMMENT_CREATED", "community:comment"],
    ["LIKE_SET", "community:reaction"],
    ["PERCEPTION_SET", "community:reaction"],
  ];

  for (const [action, eventType] of cases) {
    const event = createCommunitySocialRealtimeEvent({ postId, action, correlationId: `request-${action}` });
    assert.equal(event?.channel, "community");
    assert.equal(event?.eventType, eventType);
    assert.equal(event?.classification, "PUBLIC");
    assert.equal(event?.subjectId, null);
    assert.deepEqual(event?.data, { postId, action });
    assert.doesNotThrow(() => normalizeRealtimeEvent(event));
  }
});

test("social invalidations carry no author or user-authored content and reject unknown actions", () => {
  const event = createCommunitySocialRealtimeEvent({ postId, action: "COMMENT_CREATED", correlationId: "request-1" });
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes("content"), false);
  assert.equal(serialized.includes("author"), false);
  assert.equal(serialized.includes("email"), false);
  assert.equal(createCommunitySocialRealtimeEvent({ postId, action: "COMMENT_EDITED", correlationId: "request-2" }), null);
  assert.equal(createCommunitySocialRealtimeEvent({ postId, action: "POST_CREATED" }), null);
});
