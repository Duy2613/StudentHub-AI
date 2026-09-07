import { test } from "node:test";
import assert from "node:assert/strict";

import { PostgresForumRepository } from "../../src/lib/forum/PostgresForumRepository.js";

test("forum ranking orders by aggregate vote expressions with deterministic tie breaks", async () => {
  const calls = [];
  const pool = {
    async query(text, values) {
      calls.push({ text, values });
      return {
        rows: [{
          id: "post-1",
          category: "GENERAL",
          location_tag: "CAMPUS",
          title: "A valid forum title",
          content: "A valid forum post content with enough characters.",
          images: [],
          links: [],
          author_id: "user-1",
          display_name: "Student",
          trust_votes: "4",
          distrust_votes: "1",
          like_count: "4",
          created_at: "2026-09-06T00:00:00.000Z",
        }],
      };
    },
  };

  const posts = await new PostgresForumRepository(pool).list({ sortBy: "ranking", q: "scholarship" });
  assert.equal(posts[0].trustVoteCount, 4);
  assert.equal(posts[0].likeCount, 4);
  assert.match(calls[0].text, /count\(\*\) filter \(where v\.value=1\) - count\(\*\) filter \(where v\.value=-1\)/i);
  assert.match(calls[0].text, /p\.created_at desc, p\.id desc/i);
  assert.doesNotMatch(calls[0].text, /order by \(trust_votes-distrust_votes\)/i);
  assert.deepEqual(calls[0].values, ["", "", "scholarship"]);
});

