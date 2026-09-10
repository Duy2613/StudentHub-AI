import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KHAI_MINH_VISUAL_REGISTRY, getKhaiMinhRouteVisual } from "../../src/lib/media/khaiMinhVisualRegistry.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(frontendRoot, "..");
const inventoryPath = path.join(repoRoot, "artifacts", "visual", "STUDENTHUB_KHAI_MINH_ASSET_INVENTORY_2026-09-10.json");

function publicPath(src) {
  return path.join(frontendRoot, "public", src.replace(/^\//, ""));
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
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const derivativesById = new Map(inventory.derivatives.map((item) => [item.id, item]));

  for (const asset of Object.values(KHAI_MINH_VISUAL_REGISTRY)) {
    for (const source of [asset.desktopSrc, asset.tabletSrc, asset.mobileSrc, asset.ogSrc, asset.decorativeSrc]) {
      assert.match(source, /^\/media\/khai-minh\/.+\.avif$/);
      assert.ok(fs.existsSync(publicPath(source)), `Missing derivative: ${source}`);
    }

    const derivative = derivativesById.get(asset.id);
    assert.ok(derivative, `Missing inventory entry: ${asset.id}`);
    assert.equal(asset.provenance.sourceSha256, derivative.sourceSha256);
    assert.ok(fs.statSync(publicPath(asset.mobileSrc)).size <= 180 * 1024, `${asset.id} mobile derivative exceeds 180KB`);
    assert.ok(fs.statSync(publicPath(asset.desktopSrc)).size <= 320 * 1024, `${asset.id} desktop derivative exceeds 320KB`);
  }
});

test("original concept art is not exposed through the product public media folder", () => {
  const publicMedia = fs.readdirSync(path.join(frontendRoot, "public", "media", "khai-minh"));
  assert.equal(publicMedia.some((name) => name.toLowerCase().endsWith(".png")), false);
  assert.equal(publicMedia.some((name) => name.toLowerCase().includes("download")), false);
});
