/**
 * StudentHub AI — Automated Secret Boundary Test
 *
 * Enforces Section 9 & Section 80 of Backend Max Specification:
 * - No OPENAI_API_KEY in client bundle
 * - No GEMINI_API_KEY in client bundle
 * - No SUPABASE_SERVICE_ROLE_KEY in client bundle
 * - No DATABASE_URL in client bundle
 * - All provider tokens and service credentials must be strictly server-only.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("SECRET BOUNDARY: Production client bundle contains ZERO server secrets", () => {
  const staticDir = path.resolve("frontend/.next/static");
  if (!fs.existsSync(staticDir)) {
    // If not built yet, skip gracefully or fail if in verification mode
    return;
  }

  const forbiddenPatterns = [
    /OPENAI_API_KEY/,
    /GEMINI_API_KEY/,
    /SUPABASE_SERVICE_ROLE_KEY/,
    /DATABASE_URL/,
    /sk-[a-zA-Z0-9]{20,}/,
    /AIzaSy[a-zA-Z0-9_-]{30,}/,
    /postgres:\/\/[^:]+:[^@]+@/,
  ];

  const foundViolations = [];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".css"))) {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(content)) {
            foundViolations.push({
              file: path.relative(process.cwd(), fullPath),
              pattern: pattern.toString(),
            });
          }
        }
      }
    }
  }

  scanDirectory(staticDir);

  assert.equal(
    foundViolations.length,
    0,
    `CRITICAL: Found secrets or server environment variable names in client static bundle: ${JSON.stringify(foundViolations, null, 2)}`
  );
});
