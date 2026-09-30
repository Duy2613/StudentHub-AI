import assert from "node:assert/strict";
import test from "node:test";

import { EvidenceExtractor } from "../../src/lib/ai-trust/layer3/extractors/EvidenceExtractor.js";
import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { WebSearchRetriever } from "../../src/lib/ai-trust/layer3/retrieval/WebSearchRetriever.js";

test("direct URL retrieval prefers the article main content over page navigation", async () => {
  const html = `
    <html><head><title>Cybersecurity and Privacy</title></head>
      <body>
        <header><nav>Search NIST Menu Close Publications What We Do</nav></header>
        <main id="featured-story">
          <article><h2>Back to the Future: Why Agentic AI Needs a Strong Identity Foundation</h2><p>Artificial intelligence systems need robust identities across organizations. This long related feature is linked from a cybersecurity programme and discusses agentic assistants, identity design, implementation practices, and the future of autonomous software for research teams and enterprise architects.</p></article>
        </main>
        <main id="topic-content">
          <h1>Cybersecurity and Privacy</h1>
          <p>NIST develops cybersecurity and privacy standards, guidelines, and resources that help organizations manage risks and protect information.</p>
          <nav>Accessibility Contact Sitemap</nav>
        </main>
        <footer>Careers Contact Sitemap</footer>
      </body>
    </html>`;
  const retriever = new WebSearchRetriever({
    fetchImpl: async () => new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
  });

  const fetched = await retriever.fetch("https://8.8.8.8/cybersecurity-and-privacy");
  assert.equal(fetched.status, 200);
  assert.match(fetched.textContent, /Cybersecurity and Privacy/);
  assert.match(fetched.textContent, /NIST develops cybersecurity and privacy standards/);
  assert.doesNotMatch(fetched.textContent, /Search NIST Menu Close|Careers Contact Sitemap/);

  const excerpt = EvidenceExtractor.extractRelevantPassage(fetched.textContent, {
    subject: "https://8.8.8.8/cybersecurity-and-privacy",
    predicate: "",
  });
  assert.match(excerpt, /NIST develops cybersecurity and privacy standards/);
  assert.doesNotMatch(excerpt, /Search|Menu|Sitemap/);
  assert.doesNotMatch(excerpt, /Agentic AI/);
});

test("URL path terms select matching page content and abstain when the page does not cover them", () => {
  const url = "https://www.nist.gov/cybersecurity-and-privacy";
  const relevant = EvidenceExtractor.extractRelevantPassage(
    "A long unrelated article about autonomous agents and identity governance.\nNIST publishes cybersecurity and privacy guidance for organizations.",
    { subject: url, predicate: "" },
  );
  assert.match(relevant, /cybersecurity and privacy guidance/);
  assert.doesNotMatch(relevant, /unrelated article/);

  const irrelevant = EvidenceExtractor.extractRelevantPassage(
    "A long article about autonomous agents and identity governance for organizations.",
    { subject: url, predicate: "" },
  );
  assert.equal(irrelevant, "");
});

test("equal URL relevance prefers a complete factual sentence over a longer topic list", () => {
  const excerpt = EvidenceExtractor.extractRelevantPassage(
    "Priority areas to which NIST contributes include: artificial intelligence, cryptography, emerging technologies, human-centered cybersecurity, privacy, risk management, and trusted networks.\nNIST develops cybersecurity and privacy standards, guidelines, best practices, and resources for the public.",
    { subject: "https://www.nist.gov/cybersecurity-and-privacy", predicate: "" },
  );
  assert.match(excerpt, /^NIST develops cybersecurity and privacy standards/);
  assert.match(excerpt, /for the public\.$/);
});

test("Layer 3 direct URL evidence persists a topic-matching main passage", async () => {
  const html = `<html><body><header><nav>Search NIST Menu Close</nav></header><main>
    <p>Artificial intelligence systems need robust identities across organizations and enterprise teams.</p>
    <h1>Cybersecurity and Privacy</h1>
    <p>NIST develops cybersecurity and privacy standards, guidelines, best practices, and resources to meet public needs.</p>
  </main><footer>Contact Sitemap</footer></body></html>`;
  const retriever = new WebSearchRetriever({
    fetchImpl: async () => new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
  });
  const result = await Layer3EvidenceService.verify({
    input: { type: "url", content: "https://8.8.8.8/cybersecurity-and-privacy" },
    claims: [],
    candidateSources: [],
    options: { retriever, allowLocalFallback: false, requestId: "l3-direct-url-main-content" },
  });

  assert.equal(result.status, "NOT_APPLICABLE");
  assert.equal(result.claims.length, 0);
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].evidenceScope, "input_context");
  assert.match(result.evidence[0].excerpt, /NIST develops cybersecurity and privacy standards/);
  assert.doesNotMatch(result.evidence[0].excerpt, /Artificial intelligence|Search|Menu|Sitemap/);
});

test("evidence extraction abstains when retrieved text contains only navigation boilerplate", () => {
  const excerpt = EvidenceExtractor.extractRelevantPassage(
    "Search NIST Menu Close Publications What We Do",
    { subject: "https://www.nist.gov/cybersecurity-and-privacy", predicate: "" },
  );
  assert.equal(excerpt, "");
});
