import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const frontendRoot = path.resolve(process.cwd());
const repoRoot = path.resolve(frontendRoot, "..");
const sourceRoot = "D:/Download";
const generatedHero = "C:/Users/Duy/.codex/generated_images/01a08aff-9388-74b1-935e-25cb9a34ecec/exec-c1980fdb-9768-4caf-aac2-0916d4c7f054.png";
const publicRoot = path.join(frontendRoot, "public", "media", "khai-minh");
const visualRoot = path.join(repoRoot, "artifacts", "visual");
const stagingRoot = path.join(visualRoot, ".staging");

const suppliedNames = [
  "ChatGPT Image Sep 10, 2026, 05_55_11 PM (8).png",
  "ChatGPT Image Sep 10, 2026, 05_55_10 PM (7).png",
  "ChatGPT Image Sep 10, 2026, 05_55_09 PM (5).png",
  "ChatGPT Image Sep 10, 2026, 05_41_13 PM (4).png",
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (4).png",
  "ChatGPT Image Sep 10, 2026, 05_59_51 PM.png",
  "ChatGPT Image Sep 10, 2026, 05_55_08 PM (3).png",
  "ChatGPT Image Sep 10, 2026, 05_55_07 PM (1).png",
  "ChatGPT Image Sep 10, 2026, 05_41_25 PM.png",
  "ChatGPT Image Sep 10, 2026, 05_55_08 PM (2).png",
  "ChatGPT Image Sep 10, 2026, 05_49_19 PM.png",
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (3).png",
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (1).png",
  "ChatGPT Image Sep 10, 2026, 05_55_10 PM (6).png",
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (2).png",
  "ChatGPT Image Sep 10, 2026, 05_41_13 PM (3).png",
  "ChatGPT Image Sep 10, 2026, 05_55_13 PM (9).png",
  "ChatGPT Image Sep 10, 2026, 05_41_12 PM (1).png",
  "ChatGPT Image Sep 10, 2026, 05_55_09 PM (4).png",
  "ChatGPT Image Sep 10, 2026, 05_41_12 PM (2).png",
  "ChatGPT Image Sep 10, 2026, 05_41_04 PM.png",
];

const sourceNotes = {
  "ChatGPT Image Sep 10, 2026, 05_41_04 PM.png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["landing", "trust", "community", "expert", "cases"], note: "Multi-route concept sheet with product-like copy and UI text." },
  "ChatGPT Image Sep 10, 2026, 05_41_12 PM (1).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["community", "expert"], note: "Text-free dark archive and prism composition." },
  "ChatGPT Image Sep 10, 2026, 05_41_12 PM (2).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["expert", "trust"], note: "Text-free split-light prism composition." },
  "ChatGPT Image Sep 10, 2026, 05_41_13 PM (3).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["trust", "cases"], note: "Text-free daylight evidence architecture." },
  "ChatGPT Image Sep 10, 2026, 05_41_13 PM (4).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["trust", "landing"], note: "Text-free dark-to-light evidence prism with generous negative space." },
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (1).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["community", "expert"], note: "Text-free dark archive with document fragments." },
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (2).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["cases", "dashboard"], note: "Text-free split-light prism composition." },
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (3).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["cases", "academic"], note: "Text-free archive and knowledge-stack composition." },
  "ChatGPT Image Sep 10, 2026, 05_41_17 PM (4).png": { risk: "LOW", identity: "NONE_VISIBLE", use: "BACKGROUND_ONLY", routes: ["trust", "landing"], note: "Duplicate visual of the 05_41_13 PM (4) composition." },
  "ChatGPT Image Sep 10, 2026, 05_41_25 PM.png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["landing", "trust"], note: "Landing concept poster with embedded product-like copy and statistics." },
  "ChatGPT Image Sep 10, 2026, 05_49_19 PM.png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["community", "expert", "settings"], note: "Route contact sheet containing illustrative UI labels and testimonials." },
  "ChatGPT Image Sep 10, 2026, 05_55_07 PM (1).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["expert"], note: "Expert review concept with illustrative findings and portraits." },
  "ChatGPT Image Sep 10, 2026, 05_55_08 PM (2).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["academic", "trust"], note: "AI research assistant concept with illustrative citations and panels." },
  "ChatGPT Image Sep 10, 2026, 05_55_08 PM (3).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["landing", "academic"], note: "Knowledge atlas concept with embedded category labels." },
  "ChatGPT Image Sep 10, 2026, 05_55_09 PM (4).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["academic", "community"], note: "Critical thinking concept board with illustrative portraits and definitions." },
  "ChatGPT Image Sep 10, 2026, 05_55_09 PM (5).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["cases"], note: "Case archive concept with embedded dates, counts, and case titles." },
  "ChatGPT Image Sep 10, 2026, 05_55_10 PM (6).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["settings"], note: "Settings concept with illustrative navigation and privacy copy." },
  "ChatGPT Image Sep 10, 2026, 05_55_10 PM (7).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["settings"], note: "Duplicate settings concept with illustrative navigation and privacy copy." },
  "ChatGPT Image Sep 10, 2026, 05_55_11 PM (8).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["landing", "static"], note: "Vertical brand poster with embedded slogans and claims." },
  "ChatGPT Image Sep 10, 2026, 05_55_13 PM (9).png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["landing", "community", "expert"], note: "Brand hero concept with illustrative panels and people." },
  "ChatGPT Image Sep 10, 2026, 05_59_51 PM.png": { risk: "HIGH", identity: "ILLUSTRATIVE_ONLY", use: "REFERENCE_ONLY", routes: ["static"], note: "Closing route contact sheet with illustrative pricing, testimonials, FAQ, and map copy." },
};

const selectedVisuals = [
  { id: "KH-LANDING-HERO-01", source: generatedHero, stem: "landing-hero", role: "landing.hero", width: 1672, height: 941, risk: "NONE", humanIllustrative: true, route: "landing", note: "New text-free generated hero reference; safe for a product-rendered text overlay." },
  { id: "KH-TRUST-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_13 PM (4).png"), stem: "trust-atmosphere", role: "trust.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "trust", note: "Use only as a muted atmospheric layer behind live Trust UI." },
  { id: "KH-COMMUNITY-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_17 PM (1).png"), stem: "community-atmosphere", role: "community.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "community", note: "Use only as a low-opacity archive atmosphere behind live Community data." },
  { id: "KH-EXPERT-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_12 PM (2).png"), stem: "expert-atmosphere", role: "expert.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "expert", note: "Use only as a low-opacity scope atmosphere behind live Expert data." },
  { id: "KH-CASES-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_17 PM (3).png"), stem: "cases-atmosphere", role: "cases.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "cases", note: "Use only as a muted archive atmosphere; no source text is authoritative." },
  { id: "KH-DASHBOARD-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_17 PM (2).png"), stem: "dashboard-atmosphere", role: "dashboard.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "dashboard", note: "Use only as a quiet personal-desk atmosphere behind live dashboard data." },
  { id: "KH-SETTINGS-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_13 PM (3).png"), stem: "settings-atmosphere", role: "settings.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "settings", note: "Use only as a paper-light atmosphere behind live privacy settings." },
  { id: "KH-ACADEMIC-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_17 PM (3).png"), stem: "academic-atmosphere", role: "academic.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "academic", note: "Use only as a quiet archive atmosphere behind live academic records." },
  { id: "KH-STATIC-ATMOSPHERE-01", source: path.join(sourceRoot, "ChatGPT Image Sep 10, 2026, 05_41_13 PM (4).png"), stem: "static-atmosphere", role: "static.ambient", width: 1672, height: 941, risk: "LOW", humanIllustrative: false, route: "static", note: "Fallback atmosphere for non-canonical reading surfaces." },
];

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function copy(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

async function renderVariant(source, destination, width, height, options = {}) {
  const image = sharp(source).resize({ width, height, fit: options.fit || "cover", position: options.position || "attention", withoutEnlargement: false });
  if (options.blur) image.blur(options.blur);
  if (options.modulate) image.modulate(options.modulate);
  await image.avif({ quality: options.quality || 66, effort: 6 }).toFile(destination);
}

async function inspectSource(sourcePath, sourceName, sourceType = "ILLUSTRATIVE_CONCEPT_ART") {
  if (!fs.existsSync(sourcePath)) {
    return { sourceName, sourcePath: sourceName, sourceType, status: "ASSET_SOURCE_MISSING" };
  }
  const [stat, metadata] = await Promise.all([fs.promises.stat(sourcePath), sharp(sourcePath).metadata()]);
  const note = sourceNotes[sourceName] || { risk: "NONE", identity: "ILLUSTRATIVE_ONLY", use: "BACKGROUND_ONLY", routes: ["landing"], note: "Generated text-free visual reference." };
  return {
    sourceName,
    sourcePath: sourceName,
    sourceType,
    status: "AVAILABLE",
    sha256: sha256(sourcePath),
    width: metadata.width || null,
    height: metadata.height || null,
    aspectRatio: metadata.width && metadata.height ? Number((metadata.width / metadata.height).toFixed(4)) : null,
    format: metadata.format || path.extname(sourcePath).slice(1).toUpperCase(),
    sizeBytes: stat.size,
    alpha: Boolean(metadata.hasAlpha),
    embeddedTextRisk: note.risk,
    humanIdentityRisk: note.identity,
    recommendedUse: note.use,
    routeCandidates: note.routes,
    notes: note.note,
  };
}

async function main() {
  ensureDir(publicRoot);
  ensureDir(visualRoot);
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  ensureDir(stagingRoot);

  const inventory = [];
  for (const sourceName of suppliedNames) {
    inventory.push(await inspectSource(path.join(sourceRoot, sourceName), sourceName));
  }
  inventory.push(await inspectSource(generatedHero, path.basename(generatedHero), "GENERATED_TEXT_FREE_REFERENCE"));

  const sourceDir = path.join(stagingRoot, "originals", "source");
  const generatedDir = path.join(stagingRoot, "originals", "generated");
  for (const sourceName of suppliedNames) {
    const sourcePath = path.join(sourceRoot, sourceName);
    if (fs.existsSync(sourcePath)) copy(sourcePath, path.join(sourceDir, sourceName));
  }
  if (fs.existsSync(generatedHero)) copy(generatedHero, path.join(generatedDir, path.basename(generatedHero)));

  const webDirs = ["desktop", "tablet", "mobile", "og", "decorative", "crops", "previews"].map((name) => {
    const directory = path.join(stagingRoot, "web", name);
    ensureDir(directory);
    return [name, directory];
  });
  const web = Object.fromEntries(webDirs);
  const derivativeManifest = [];

  for (const visual of selectedVisuals) {
    const desktopName = `${visual.stem}-desktop.avif`;
    const tabletName = `${visual.stem}-tablet.avif`;
    const mobileName = `${visual.stem}-mobile.avif`;
    const ogName = `${visual.stem}-og.avif`;
    const decorativeName = `${visual.stem}-decorative.avif`;
    const desktopPath = path.join(publicRoot, desktopName);
    const tabletPath = path.join(publicRoot, tabletName);
    const mobilePath = path.join(publicRoot, mobileName);
    const ogPath = path.join(publicRoot, ogName);
    const decorativePath = path.join(publicRoot, decorativeName);
    const position = visual.route === "landing" ? "right" : "attention";
    await renderVariant(visual.source, desktopPath, 1600, 900, { position, quality: visual.route === "landing" ? 72 : 62 });
    await renderVariant(visual.source, tabletPath, 1120, 700, { position, quality: 60 });
    await renderVariant(visual.source, mobilePath, 720, 900, { position, quality: 55 });
    await renderVariant(visual.source, ogPath, 1200, 630, { position, quality: 60 });
    await renderVariant(visual.source, decorativePath, 1280, 720, { position, quality: 52, blur: 1.2, modulate: { saturation: visual.route === "landing" ? 0.82 : 0.58, brightness: 0.82 } });
    for (const [directory, name] of [[web.desktop, desktopName], [web.tablet, tabletName], [web.mobile, mobileName], [web.og, ogName], [web.decorative, decorativeName]]) copy(path.join(publicRoot, name), path.join(directory, name));
    const cropName = `${visual.stem}-prism-crop.avif`;
    await renderVariant(visual.source, path.join(web.crops, cropName), 900, 900, { fit: "cover", position: visual.route === "landing" ? "right" : "attention", quality: 58 });

    derivativeManifest.push({
      id: visual.id,
      routeRole: visual.role,
      sourceName: path.basename(visual.source),
      sourceSha256: sha256(visual.source),
      desktopSrc: `/media/khai-minh/${desktopName}`,
      tabletSrc: `/media/khai-minh/${tabletName}`,
      mobileSrc: `/media/khai-minh/${mobileName}`,
      ogSrc: `/media/khai-minh/${ogName}`,
      decorativeSrc: `/media/khai-minh/${decorativeName}`,
      width: 1600,
      height: 900,
      aspectRatio: 1600 / 900,
      priority: visual.route === "landing",
      decorative: visual.route !== "landing",
      embeddedTextRisk: visual.risk,
      humanIllustrative: visual.humanIllustrative,
      provenance: visual.note,
      fallback: "Use the live product surface with no image if the derivative cannot load.",
    });
  }

  const contactWidth = 360;
  const contactHeight = 204;
  const contactTiles = [];
  for (const visual of selectedVisuals) {
    const buffer = await sharp(visual.source).resize({ width: contactWidth, height: contactHeight, fit: "cover", position: "attention" }).jpeg({ quality: 78 }).toBuffer();
    contactTiles.push({ input: buffer, left: (contactTiles.length % 3) * contactWidth, top: Math.floor(contactTiles.length / 3) * (contactHeight + 38) + 32 });
  }
  const contactRows = Math.ceil(contactTiles.length / 3);
  await sharp({ create: { width: contactWidth * 3, height: contactRows * (contactHeight + 38), channels: 3, background: { r: 13, g: 20, b: 28 } } })
    .composite(contactTiles)
    .jpeg({ quality: 86 })
    .toFile(path.join(web.previews, "selected-visuals-contact-sheet.jpg"));

  const manifest = {
    packId: "STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10",
    generatedAt: "2026-09-10",
    sourcePolicy: "ILLUSTRATIVE_CONCEPT ART IS NON-AUTHORITATIVE",
    suppliedSourceCount: suppliedNames.length,
    inventory,
    derivatives: derivativeManifest,
    duplicateSha256Groups: Object.values(inventory.filter((item) => item.status === "AVAILABLE").reduce((groups, item) => {
      groups[item.sha256] ||= [];
      groups[item.sha256].push(item.sourceName);
      return groups;
    }, {})).filter((group) => group.length > 1),
  };

  fs.writeFileSync(path.join(visualRoot, "STUDENTHUB_KHAI_MINH_ASSET_INVENTORY_2026-09-10.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(stagingRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
  copy(path.join(visualRoot, "STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_README.md"), path.join(stagingRoot, "README.md"));
  copy(path.join(visualRoot, "STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_ROUTE_MAP.json"), path.join(stagingRoot, "route-map.json"));
  copy(path.join(visualRoot, "STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_PROVENANCE.json"), path.join(stagingRoot, "provenance.json"));
  copy(path.join(visualRoot, "STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_ASSET_USAGE_POLICY.md"), path.join(stagingRoot, "ASSET_USAGE_POLICY.md"));
  copy(path.join(web.previews, "selected-visuals-contact-sheet.jpg"), path.join(stagingRoot, "previews", "selected-visuals-contact-sheet.jpg"));

  console.log(JSON.stringify({
    suppliedSources: suppliedNames.length,
    availableSources: inventory.filter((item) => item.status === "AVAILABLE").length,
    missingSources: inventory.filter((item) => item.status === "ASSET_SOURCE_MISSING").length,
    derivatives: derivativeManifest.length,
    stagingRoot,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
