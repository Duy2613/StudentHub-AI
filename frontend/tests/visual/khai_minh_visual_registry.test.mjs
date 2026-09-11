import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KHAI_MINH_VISUAL_REGISTRY, getKhaiMinhRouteVisual } from "../../src/lib/media/khaiMinhVisualRegistry.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(frontendRoot, "..");
const runtimeManifestPath = path.join(repoRoot, "artifacts", "visual", "STUDENTHUB_KHAI_MINH_RUNTIME_ASSET_MANIFEST_2026-09-11.json");
const runtimeManifest = JSON.parse(fs.readFileSync(runtimeManifestPath, "utf8"));
const derivativesByPath = new Map(runtimeManifest.files.map((item) => [item.path, item]));
const publicMediaRoot = path.join(frontendRoot, "public", "media", "khai-minh");

function publicPath(src) {
  return path.join(frontendRoot, "public", src.replace(/^\//, ""));
}

function collectPublicMediaFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? collectPublicMediaFiles(target) : [target];
  });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

test("Khai Minh registry covers the canonical visual route set", () => {
  const expected = {
    "/": "KH-LANDING-HERO-01",
    "/trust": "KH-TRUST-ATMOSPHERE-01",
    "/community": "KH-COMMUNITY-ATMOSPHERE-01",
    "/expert": "KH-EXPERT-ATMOSPHERE-01",
    "/cases": "KH-CASES-ATMOSPHERE-01",
    "/dashboard": "KH-DASHBOARD-ATMOSPHERE-01",
    "/settings": "KH-SETTINGS-ATMOSPHERE-01",
    "/academic": "KH-ACADEMIC-ATMOSPHERE-01",
  };

  for (const [route, assetId] of Object.entries(expected)) {
    assert.equal(getKhaiMinhRouteVisual(route).asset?.id, assetId);
  }
  assert.equal(getKhaiMinhRouteVisual("/unknown-reading-surface").asset?.id, "KH-STATIC-ATMOSPHERE-01");
});

test("Khai Minh registry serves only responsive derivatives with truthful metadata", () => {
  assert.equal(runtimeManifest.runtimeFormat, "webp");
  assert.equal(runtimeManifest.derivativeCount, 52);
  assert.equal(runtimeManifest.publicMediaPngCount, 0);

  for (const asset of Object.values(KHAI_MINH_VISUAL_REGISTRY)) {
    const sources = {
      desktop: asset.desktopSrc,
      tablet: asset.tabletSrc,
      mobile: asset.mobileSrc,
      og: asset.ogSrc,
    };
    for (const [variant, source] of Object.entries(sources)) {
      assert.match(source, /^\/media\/khai-minh\/.+\.webp$/);
      const derivative = derivativesByPath.get(source);
      assert.ok(derivative, `Missing runtime manifest entry: ${source}`);
      assert.equal(derivative.variant, variant);
      const derivativePath = publicPath(source);
      assert.ok(fs.existsSync(derivativePath), `Missing derivative: ${source}`);
      assert.equal(fs.statSync(derivativePath).size, derivative.byteSize, `Byte-size drift: ${source}`);
      assert.equal(sha256(derivativePath), derivative.sha256, `Hash drift: ${source}`);
    }

    assert.ok(derivativesByPath.get(asset.mobileSrc).byteSize <= runtimeManifest.budgets.mobileBytes, `${asset.id} mobile derivative exceeds canonical budget`);
    assert.ok(derivativesByPath.get(asset.desktopSrc).byteSize <= runtimeManifest.budgets.desktopBytes, `${asset.id} desktop derivative exceeds canonical budget`);
  }
});

test("original concept art is not exposed through the product public media folder", () => {
  const physicalFiles = collectPublicMediaFiles(publicMediaRoot).map((filePath) => "/" + path.relative(path.join(frontendRoot, "public"), filePath).replaceAll(path.sep, "/"));
  assert.deepEqual(physicalFiles.sort(), runtimeManifest.files.map((item) => item.path).sort());
  assert.equal(physicalFiles.some((source) => source.toLowerCase().endsWith(".png")), false);
  assert.equal(physicalFiles.some((source) => source.toLowerCase().includes("download")), false);
});
