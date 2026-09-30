import assert from "node:assert/strict";
import test from "node:test";
import { hostMatchesCanonicalDomain } from "../../src/lib/ai-trust/layer3/registry/canonicalDomainMatch.js";

test("canonical target matching accepts root hosts and their real subdomains", () => {
  assert.equal(hostMatchesCanonicalDomain("neu.edu.vn", "neu.edu.vn"), true);
  assert.equal(hostMatchesCanonicalDomain("https://fit.neu.edu.vn/admissions", "neu.edu.vn"), true);
  assert.equal(hostMatchesCanonicalDomain("www.europa.eu", "europa.eu"), true);
});

test("canonical target matching rejects lookalike suffixes and unrelated domains", () => {
  assert.equal(hostMatchesCanonicalDomain("notneu.edu.vn", "neu.edu.vn"), false);
  assert.equal(hostMatchesCanonicalDomain("neu.edu.vn.attacker.example", "neu.edu.vn"), false);
  assert.equal(hostMatchesCanonicalDomain("example.org", "neu.edu.vn"), false);
  assert.equal(hostMatchesCanonicalDomain("not a host", "neu.edu.vn"), false);
});
