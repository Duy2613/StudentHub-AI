import test from "node:test";
import assert from "node:assert/strict";
import { LiveWebRetrievalService } from "../../src/lib/server/trust/LiveWebRetrievalService.js";

test("REAL SEARCH 1: Live Web Search returns real URLs with full provenance contract", async () => {
  const query = "Đại học Bách khoa Đại học Quốc gia Thành phố Hồ Chí Minh";
  const res = await LiveWebRetrievalService.searchLiveWeb({ query, maxResults: 2, timeoutMs: 10000 });

  assert.equal(res.success, true, "Search request should succeed");
  assert.equal(res.provider, "WIKIPEDIA_LIVE_API");
  assert.ok(res.results.length > 0, "Should return at least 1 real result");

  const first = res.results[0];
  assert.ok(first.url.startsWith("https://vi.wikipedia.org/wiki/"), `URL must be real wikipedia URL: ${first.url}`);
  assert.ok(first.title.length > 0, "Title must be present");
  assert.ok(first.domain === "vi.wikipedia.org", "Domain must be vi.wikipedia.org");
  assert.ok(first.snippet.length > 0, "Snippet must be present");
});

test("REAL SEARCH 2: SSRF Gate rejects private, loopback, and metadata targets", async () => {
  assert.equal(LiveWebRetrievalService.isSafeUrl("http://127.0.0.1:8080/admin"), false);
  assert.equal(LiveWebRetrievalService.isSafeUrl("http://localhost:3000"), false);
  assert.equal(LiveWebRetrievalService.isSafeUrl("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(LiveWebRetrievalService.isSafeUrl("http://10.0.0.1/private"), false);
  assert.equal(LiveWebRetrievalService.isSafeUrl("http://192.168.1.1/router"), false);
  assert.equal(LiveWebRetrievalService.isSafeUrl("file:///etc/passwd"), false);
  assert.equal(LiveWebRetrievalService.isSafeUrl("javascript:alert(1)"), false);
});

test("REAL SEARCH 3: Safe Fetch & Snapshot computes real SHA-256 and extracts title", async () => {
  const targetUrl = "https://hcmut.edu.vn";
  const res = await LiveWebRetrievalService.fetchAndSnapshotUrl(targetUrl, { timeoutMs: 8000 });

  assert.equal(res.success, true, `Fetch to ${targetUrl} should succeed`);
  assert.ok(res.title.includes("Bách khoa") || res.title.length > 0, "Title must be extracted");
  assert.ok(res.contentDigest.length === 64, "Digest must be 64-char hex SHA-256");
  assert.ok(res.byteSize > 0, "Byte size must be positive");
  assert.equal(res.parserVersion, "2.1.0-live-html");
});

test("REAL SEARCH 4: Multi-claim live evidence discovery attaches full provenance", async () => {
  const claims = [
    {
      claimId: "claim-bk-1",
      normalizedText: "Trường Đại học Bách Khoa ĐHQG TP.HCM đào tạo kỹ sư công nghệ",
      entities: ["HCMUT"]
    }
  ];

  const discovery = await LiveWebRetrievalService.discoverLiveEvidenceForClaims({
    claims,
    runId: "run_test_golden",
    revision: 1
  });

  assert.equal(discovery.success, true);
  assert.equal(discovery.retrievalProviderStatus, "REAL_WEB_RETRIEVAL_VERIFIED");
  assert.ok(discovery.sources.length > 0, "Must discover real sources");

  const source = discovery.sources[0];
  assert.ok(source.canonicalUrl.startsWith("https://"), "Source must have canonical HTTPS URL");
  assert.ok(source.contentDigest.length === 64, "Source must have real SHA-256 digest");
  assert.equal(source.retrievalMethod, "REAL_WEB_RETRIEVAL");
  assert.ok(source.retrievalQueryId.includes("claim-bk-1"), "Must bind retrievalQueryId");
  assert.ok(source.title.length > 0, "Must have real title");
  assert.ok(source.domain.length > 0, "Must have real domain");
  assert.equal(source.allowedUse, "ACADEMIC_STUDENT_VERIFICATION");
});

test("REAL SEARCH 5: Critic Counter-Search triggers second retrieval cycle and enters graph", async () => {
  const claim = {
    claimId: "claim-scam-1",
    text: "Học bổng toàn phần yêu cầu nộp cọc 5 triệu qua ví điện tử"
  };

  const counterRes = await LiveWebRetrievalService.executeCriticCounterSearch({
    claim,
    counterHypothesis: "Học bổng chính quy không bao giờ yêu cầu sinh viên chuyển tiền đặt cọc",
    runId: "run_counter_test",
    revision: 1
  });

  assert.equal(counterRes.success, true);
  assert.ok(counterRes.newSources.length > 0, "Counter search must produce sources");

  const counterSrc = counterRes.newSources[0];
  assert.equal(counterSrc.claimRelations[claim.claimId], "CONTRADICTS", "Counter source must contradict claim");
  assert.equal(counterSrc.retrievalMethod, "REAL_WEB_RETRIEVAL");
  assert.ok(counterSrc.contentDigest.length === 64);
});

test("REAL SEARCH 6: Failure Injection returns truthful SEARCH_UNAVAILABLE without fake evidence", async () => {
  const claims = [{ claimId: "c-fail-1", text: "Some claim" }];

  // Simulate timeout
  const timeoutRes = await LiveWebRetrievalService.discoverLiveEvidenceForClaims({
    claims,
    simulateFailure: "TIMEOUT"
  });
  assert.equal(timeoutRes.success, false);
  assert.equal(timeoutRes.code, "SEARCH_TIMEOUT");
  assert.equal(timeoutRes.retrievalProviderStatus, "SEARCH_UNAVAILABLE");
  assert.equal(timeoutRes.sources.length, 0, "Must NOT synthesize fake sources on timeout");

  // Simulate provider unavailable
  const unavailRes = await LiveWebRetrievalService.discoverLiveEvidenceForClaims({
    claims,
    simulateFailure: "UNAVAILABLE"
  });
  assert.equal(unavailRes.success, false);
  assert.equal(unavailRes.code, "SEARCH_UNAVAILABLE");
  assert.equal(unavailRes.retrievalProviderStatus, "SEARCH_UNAVAILABLE");
  assert.equal(unavailRes.sources.length, 0, "Must NOT synthesize fake sources on provider failure");

  // Simulate empty results
  const emptyRes = await LiveWebRetrievalService.discoverLiveEvidenceForClaims({
    claims,
    simulateFailure: "EMPTY"
  });
  assert.equal(emptyRes.success, true);
  assert.equal(emptyRes.retrievalProviderStatus, "INSUFFICIENT_EVIDENCE");
  assert.equal(emptyRes.sources.length, 0);
});
