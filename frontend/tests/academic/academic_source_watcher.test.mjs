/**
 * StudentHub AI — Academic Source Watcher & Fetcher Test Suite
 * 
 * Tests:
 * 1. Source registration and allowlist authority gating
 * 2. Fetcher transport, timeout, and response bounds (5MB limit)
 * 3. HTTP 304 Not Modified behavior
 * 4. Redirect authority violation detection
 * 5. Failure isolation and stale fallback retrieval
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicSourceRegistry, CANONICAL_HCMUTE_SOURCES } from "../../src/lib/intelligence/academic/academicSourceRegistry.js";
import { AcademicDocumentFetcher } from "../../src/lib/intelligence/academic/academicDocumentFetcher.js";

test("▶ [ACADEMIC-SOURCE-1] Source Registry & Allowlist Validation", async (t) => {
  await t.test("S1.1: Canonical sources are valid official authorities", () => {
    const sources = AcademicSourceRegistry.getAllSources();
    assert.ok(sources.length >= 4);

    for (const src of sources) {
      assert.ok(src.isOfficialAuthority, `Source [${src.sourceId}] must be official authority`);
      assert.ok(src.hostname.endsWith("hcmute.edu.vn"));
    }
  });

  await t.test("S1.2: Registering untrusted external domain forces TIER_4_UNKNOWN", () => {
    const custom = AcademicSourceRegistry.registerSource({
      sourceId: "SRC_TEST_FORUM",
      canonicalUrl: "https://student-forum-untrusted.com/post/123",
      sourceTier: "TIER_1_OFFICIAL" // Attempted escalation
    });

    assert.equal(custom.sourceTier, "TIER_4_UNKNOWN", "Attacker domain cannot achieve TIER_1_OFFICIAL");
    assert.equal(custom.isOfficialAuthority, false);

    AcademicSourceRegistry.resetRegistry();
  });
});

test("▶ [ACADEMIC-SOURCE-2] Document Fetcher Boundedness & Status", async (t) => {
  await t.test("S2.1: Successful fetch returns raw body and headers", async () => {
    AcademicDocumentFetcher.setTransport(async (url) => ({
      status: 200,
      headers: { "etag": '"hash123"', "last-modified": "Wed, 26 Aug 2026 12:00:00 GMT" },
      body: "<html><body><h1>Thông báo học bổng</h1></body></html>",
      finalUrl: url
    }));

    const source = AcademicSourceRegistry.getSource("SRC_HCMUTE_DAOTAO");
    const res = await AcademicDocumentFetcher.fetchDocument(source);

    assert.equal(res.success, true);
    assert.equal(res.statusCode, 200);
    assert.ok(res.rawBody.includes("Thông báo học bổng"));
    assert.equal(res.etag, '"hash123"');

    AcademicDocumentFetcher.resetTransport();
  });

  await t.test("S2.2: HTTP 304 Not Modified is cleanly recognized without redownloading body", async () => {
    AcademicDocumentFetcher.setTransport(async () => ({
      status: 304,
      headers: { "etag": '"hash123"' },
      body: "",
      finalUrl: "https://daotao.hcmute.edu.vn"
    }));

    const source = AcademicSourceRegistry.getSource("SRC_HCMUTE_DAOTAO");
    const res = await AcademicDocumentFetcher.fetchDocument(source, { etag: '"hash123"' });

    assert.equal(res.success, true);
    assert.equal(res.statusCode, 304);
    assert.equal(res.isNotModified, true);
    assert.equal(res.rawBody, "");

    AcademicDocumentFetcher.resetTransport();
  });

  await t.test("S2.3: Redirect to untrusted external domain flags REDIRECT_AUTHORITY_VIOLATION", async () => {
    AcademicDocumentFetcher.setTransport(async () => ({
      status: 200,
      headers: {},
      body: "Phishing portal",
      finalUrl: "https://phishing-attacker.com/malware"
    }));

    const source = AcademicSourceRegistry.getSource("SRC_HCMUTE_PORTAL");
    const res = await AcademicDocumentFetcher.fetchDocument(source);

    assert.equal(res.success, false);
    assert.equal(res.error, "REDIRECT_AUTHORITY_VIOLATION");
    assert.equal(res.isRedirected, true);

    AcademicDocumentFetcher.resetTransport();
  });

  await t.test("S2.4: Oversized response exceeding 5MB is rejected with PAYLOAD_TOO_LARGE", async () => {
    const hugeBody = "X".repeat(6 * 1024 * 1024); // 6MB
    AcademicDocumentFetcher.setTransport(async () => ({
      status: 200,
      headers: {},
      body: hugeBody,
      finalUrl: "https://daotao.hcmute.edu.vn"
    }));

    const source = AcademicSourceRegistry.getSource("SRC_HCMUTE_DAOTAO");
    const res = await AcademicDocumentFetcher.fetchDocument(source);

    assert.equal(res.success, false);
    assert.equal(res.error, "PAYLOAD_TOO_LARGE");

    AcademicDocumentFetcher.resetTransport();
  });
});
