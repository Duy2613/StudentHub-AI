import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const repoRoot = path.resolve(frontendRoot, "..");

test("V3 Media Manifest Integrity Contract verifies all entries and physical assets", () => {
  const manifestPath = path.join(repoRoot, "public/media/v3/media-manifest.json");
  assert.ok(fs.existsSync(manifestPath), "Canonical media-manifest.json must exist in public/media/v3");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.version, "3.0.0");
  assert.equal(manifest.canonicalRoot, "/media/v3");

  const v3Dir = path.join(repoRoot, "public/media/v3");
  const integrityDiscrepancies = [];
  let totalEntriesVerified = 0;

  for (const [categoryName, category] of Object.entries(manifest.categories)) {
    for (const [assetKey, asset] of Object.entries(category)) {
      totalEntriesVerified++;
      const fullPath = path.join(v3Dir, asset.entry);

      // 1. Physical file existence
      assert.ok(fs.existsSync(fullPath), `Physical file missing for ${categoryName}.${assetKey}: ${asset.entry}`);

      // 2. Physical file stat & zero-byte check
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        integrityDiscrepancies.push({
          asset: `${categoryName}.${assetKey}`,
          entry: asset.entry,
          issue: "ZERO_BYTE_PHYSICAL_FILE",
          size: stat.size,
          zeroByteUpstream: asset.zeroByteUpstream === true
        });
        // Repository integrity failure must not be silently hidden
        assert.equal(asset.zeroByteUpstream, true, `Zero-byte asset ${asset.entry} must be documented in manifest with zeroByteUpstream: true`);
      }

      // 3. MIME expectation vs extension
      const ext = path.extname(asset.entry).toLowerCase();
      if (asset.type === "video") {
        assert.equal(ext, ".mp4", `Video asset ${asset.entry} must have .mp4 extension`);
        assert.equal(asset.mime, "video/mp4", `Video asset ${asset.entry} must have video/mp4 MIME`);

        // 4. Poster reference
        assert.ok(asset.poster, `Video ${asset.entry} must declare a poster reference`);
        const posterRel = asset.poster.replace("/media/v3/", "");
        assert.ok(fs.existsSync(path.join(v3Dir, posterRel)), `Poster physical file missing: ${asset.poster}`);

        // 5. Mobile fallback
        assert.ok(asset.mobileFallback, `Video ${asset.entry} must declare a mobile fallback`);
        const mobileRel = asset.mobileFallback.replace("/media/v3/", "");
        assert.ok(fs.existsSync(path.join(v3Dir, mobileRel)), `Mobile fallback physical file missing: ${asset.mobileFallback}`);

        // 6. Reduced-motion fallback
        assert.ok(asset.reducedMotionFallback, `Video ${asset.entry} must declare a reduced-motion fallback`);
        const motionRel = asset.reducedMotionFallback.replace("/media/v3/", "");
        assert.ok(fs.existsSync(path.join(v3Dir, motionRel)), `Reduced-motion fallback physical file missing: ${asset.reducedMotionFallback}`);
      } else if (asset.type === "image") {
        assert.equal(ext, ".webp", `Image asset ${asset.entry} must have .webp extension`);
        assert.equal(asset.mime, "image/webp", `Image asset ${asset.entry} must have image/webp MIME`);
      }
    }
  }

  assert.ok(totalEntriesVerified >= 45, `Expected at least 45 verified media manifest entries, found ${totalEntriesVerified}`);
  assert.equal(integrityDiscrepancies.length, 1, "Expected exactly 1 documented upstream discrepancy (shared/empty-expert.webp)");
  assert.equal(integrityDiscrepancies[0].entry, "shared/empty-expert.webp");
});
