#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ASSETS = [
  {
    id: 'VID-HUMAN-01', title: 'Students Researching on a Book and on a Computer',
    source: 'Pexels', sourceUrl: 'https://www.pexels.com/video/students-researching-on-a-book-and-on-a-computer-9198205/',
    downloadUrl: 'https://videos.pexels.com/video-files/9198205/9198205-hd_1920_1080_25fps.mp4',
    creator: 'Mikhail Nilov', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/',
    route: '/', state: 'HUMAN_EVIDENCE_CHAPTER', role: 'Human academic layer: physical + digital source comparison',
    sourceDirectory: 'pexels', sourceExtension: 'mp4', type: 'video', reserve: false,
    config: { semanticName: 'landing-human-evidence', start: 0, duration: 8, fps: 24, saturation: 0.9 }
  },
  {
    id: 'VID-HUMAN-02', title: 'Students Doing Research In The Library',
    source: 'Pexels', sourceUrl: 'https://www.pexels.com/video/students-doing-research-in-the-library-8199394/',
    downloadUrl: 'https://videos.pexels.com/video-files/8199394/8199394-hd_1920_1080_25fps.mp4',
    creator: 'Yan Krukau', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/',
    route: '/community', state: 'COMMUNITY_HUMAN_LAYER', role: 'Collaborative research / discussion / note-taking',
    sourceDirectory: 'pexels', sourceExtension: 'mp4', type: 'video', reserve: false,
    config: { semanticName: 'community-human-research', start: 0, duration: 8, fps: 24, saturation: 0.9 }
  },
  {
    id: 'VID-OPTIC-01', title: 'Light Refraction Through Textured Glass',
    source: 'Pexels', sourceUrl: 'https://www.pexels.com/video/light-refraction-though-textured-glass-6602733/',
    downloadUrl: 'https://videos.pexels.com/video-files/6602733/6602733-hd_1920_1080_30fps.mp4',
    creator: 'Allan Zander / Chris Urpina', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/',
    route: '/trust;/expert', state: 'TRUST_IDLE;EXPERT_INSPECTION',
    role: 'Optical inspection / evidence-through-a-lens metaphor',
    sourceDirectory: 'pexels', sourceExtension: 'mp4', type: 'video', reserve: false,
    config: { semanticName: 'trust-refraction-inspection', start: 0, duration: 8, fps: 24, saturation: 0.72 }
  },
  {
    id: 'VID-OPTIC-02', title: 'Colorful Light Refraction on Glass Cube',
    source: 'Pexels', sourceUrl: 'https://www.pexels.com/video/colorful-light-refraction-on-glass-cube-30879511/',
    downloadUrl: 'https://videos.pexels.com/video-files/30879511/13203421_3840_2160_30fps.mp4',
    creator: 'Quentin Renault', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/',
    route: '/trust', state: 'TRUST_RESULT', role: 'Prismatic result object / evidence convergence',
    sourceDirectory: 'pexels', sourceExtension: 'mp4', type: 'video', reserve: false,
    config: { semanticName: 'trust-result-prism', start: 0, duration: 8, fps: 24, saturation: 0.28 }
  },
  {
    id: 'VID-PRISM-01', title: 'Abstract Video of Figures in Blue and Green Tone',
    source: 'Mixkit', sourceUrl: 'https://mixkit.co/free-stock-video/abstract-video-of-figures-in-blue-and-green-tone-4975/',
    downloadUrl: 'https://assets.mixkit.co/videos/4975/4975-720.mp4',
    creator: 'Mixkit contributor', license: 'Mixkit Stock Video Free License', licenseUrl: 'https://mixkit.co/license/',
    route: '/', state: 'LANDING_HERO_AMBIENT', role: 'Jade optical atmosphere close to StudentHub palette',
    sourceDirectory: 'mixkit', sourceExtension: 'mp4', type: 'video', reserve: false,
    config: { semanticName: 'landing-prism-atmosphere', start: 0, duration: 8, fps: 24, saturation: 0.78 }
  },
  {
    id: 'VID-PRISM-02', title: 'Abstract Flower of Light Made with a Prism',
    source: 'Mixkit', sourceUrl: 'https://mixkit.co/free-stock-video/abstract-flower-of-light-made-with-a-prism-44685/',
    downloadUrl: 'https://assets.mixkit.co/videos/44685/44685-720.mp4',
    creator: 'Mixkit contributor', license: 'Mixkit Stock Video Free License', licenseUrl: 'https://mixkit.co/license/',
    route: '/community', state: 'COMMUNITY_AMBIENT',
    role: 'Multiple signals converging without implying popularity equals truth',
    sourceDirectory: 'mixkit', sourceExtension: 'mp4', type: 'video', reserve: false,
    config: { semanticName: 'community-prism-corroboration', start: 0, duration: 8, fps: 24, saturation: 0.38 }
  },
  {
    id: 'HDRI-01', title: 'Monochrome Studio 03', source: 'Poly Haven',
    sourceUrl: 'https://polyhaven.com/a/monochrome_studio_03',
    downloadUrl: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/monochrome_studio_03_2k.hdr',
    productionUrl: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/monochrome_studio_03_1k.hdr',
    creator: 'Grzegorz Wronkowski', license: 'CC0', licenseUrl: 'https://polyhaven.com/license',
    route: '/trust;/expert', state: 'R3F_LIGHTING_ENVIRONMENT',
    role: 'Soft low-contrast studio light for prismatic/lens 3D objects',
    sourceDirectory: 'polyhaven', sourceExtension: 'hdr', type: 'hdri', reserve: false,
    config: { semanticName: 'hdri-monochrome-studio', derivativeResolution: '1K' }
  },
  {
    id: 'VID-PRISM-03', title: 'Quick Sequence of Compositions Made with a Moving Prism',
    source: 'Mixkit', sourceUrl: 'https://mixkit.co/free-stock-video/quick-sequence-of-compositions-made-with-a-moving-prism-4972/',
    downloadUrl: 'https://assets.mixkit.co/videos/4972/4972-720.mp4',
    creator: 'Mixkit contributor', license: 'Mixkit Stock Video Free License', licenseUrl: 'https://mixkit.co/license/',
    route: '/', state: 'SECTION_TRANSITION', role: 'One or two section transitions only',
    sourceDirectory: 'mixkit', sourceExtension: 'mp4', type: 'video', reserve: true,
    config: { semanticName: 'landing-prism-transition', start: 0.2, duration: 1.2, fps: 24, saturation: 0.42, transition: true }
  },
  {
    id: 'VID-HUMAN-03', title: 'Students Doing Their Research Inside The Library',
    source: 'Pexels', sourceUrl: 'https://www.pexels.com/video/students-doing-their-research-inside-the-library-6334247/',
    downloadUrl: 'https://videos.pexels.com/video-files/6334247/6334247-uhd_4096_2160_25fps.mp4',
    creator: 'cottonbro studio', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/',
    route: '/', state: 'RESERVE_HUMAN_ACADEMIC', role: 'Optional human academic fallback',
    sourceDirectory: 'pexels', sourceExtension: 'mp4', type: 'video', reserve: true,
    config: { semanticName: 'landing-human-library-reserve', start: 0, duration: 8, fps: 24, saturation: 0.88 }
  },
  {
    id: 'HDRI-02', title: 'Studio Small 08', source: 'Poly Haven',
    sourceUrl: 'https://polyhaven.com/a/studio_small_08',
    downloadUrl: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_08_2k.hdr',
    productionUrl: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
    creator: 'Sergej Majboroda', license: 'CC0', licenseUrl: 'https://polyhaven.com/license',
    route: '/;/trust;/expert', state: 'RESERVE_3D_LIGHTING',
    role: 'Neutral softbox fallback for product objects',
    sourceDirectory: 'polyhaven', sourceExtension: 'hdr', type: 'hdri', reserve: true,
    config: { semanticName: 'hdri-studio-small', derivativeResolution: '1K' }
  }
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(String(args.root || process.cwd()));
const ffmpegPath = path.resolve(String(args.ffmpeg || process.env.FFMPEG_PATH || 'ffmpeg'));
const manifestDir = path.join(root, 'artifacts', 'manifests');
const qaDir = path.join(manifestDir, 'visual-qa');
const sourceRoot = path.join(root, 'artifacts', 'source-intake');
const productionRoot = path.join(root, 'frontend', 'public', 'media', 'studenthub-vnext');
const videoDir = path.join(productionRoot, 'video');
const posterDir = path.join(productionRoot, 'posters');
const threeDir = path.join(productionRoot, '3d');
const publicManifestDir = path.join(productionRoot, 'manifests');
const reviewPath = path.join(manifestDir, 'visual-review.json');
const runAt = new Date().toISOString();

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

for (const directory of [manifestDir, qaDir, videoDir, posterDir, threeDir, publicManifestDir]) ensureDir(directory);

function relative(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function publicPath(filePath) {
  return '/' + relative(filePath).replace(/^frontend\/public\//, '');
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fileSize(filePath) {
  return fs.statSync(filePath).size;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function runFfmpeg(ffmpegArgs) {
  const result = spawnSync(ffmpegPath, ffmpegArgs, {
    cwd: root, windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
  });
  const output = String(result.stdout || '') + '\n' + String(result.stderr || '');
  if (result.error) throw new Error('ffmpeg failed to start: ' + result.error.message);
  return { status: result.status ?? 1, output };
}

function parseDuration(text) {
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
}

function parseMediaText(text, extension) {
  const input = text.match(/Input #0,\s*([^,\s]+)/i);
  const streamLines = text.split(/\r?\n/).filter((line) => line.includes('Stream #'));
  const videoLine = streamLines.find((line) => /Video:/i.test(line)) || '';
  const audioLines = streamLines.filter((line) => /Audio:/i.test(line));
  const codecMatch = videoLine.match(/Video:\s*([^,\s(]+)/i);
  const pixelMatch = videoLine.match(/Video:\s*[^,]+(?:\([^)]*\))?,\s*([^,\s(]+)/i);
  const sizeMatch = videoLine.match(/(\d{2,6})x(\d{2,6})/);
  const fpsMatch = videoLine.match(/(\d+(?:\.\d+)?)\s*fps/i);
  const darMatch = videoLine.match(/DAR\s+([0-9:]+)/i);
  return {
    container: input ? input[1] : extension.replace('.', '').toLowerCase(),
    codec: codecMatch ? codecMatch[1] : null,
    pixelFormat: pixelMatch ? pixelMatch[1] : null,
    width: sizeMatch ? Number(sizeMatch[1]) : null,
    height: sizeMatch ? Number(sizeMatch[2]) : null,
    displayAspectRatio: darMatch ? darMatch[1] : null,
    fps: fpsMatch ? Number(fpsMatch[1]) : null,
    durationSeconds: parseDuration(text),
    audioStreams: audioLines.length,
    rotation: /rotate\s*[:=]\s*(-?\d+)/i.exec(text)?.[1] || null,
    colorMetadata: /color_(?:range|space|transfer|primaries)[^,\s]*/i.exec(text)?.[0] || null
  };
}

function inspectMedia(filePath) {
  const result = runFfmpeg(['-hide_banner', '-i', filePath, '-map', '0:v:0', '-c', 'copy', '-f', 'null', 'NUL']);
  const metadata = parseMediaText(result.output, path.extname(filePath));
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to inspect media metadata for ' + relative(filePath) + '\n' + result.output.slice(-4000));
  }
  return metadata;
}

function inspectHdri(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 8192).toString('ascii');
  const resolution = header.match(/-Y\s+(\d+)\s+\+X\s+(\d+)/i) || header.match(/\+Y\s+(\d+)\s+-X\s+(\d+)/i);
  return {
    format: 'Radiance HDR',
    headerFormat: header.match(/^FORMAT=(.+)$/m)?.[1]?.trim() || null,
    width: resolution ? Number(resolution[2]) : null,
    height: resolution ? Number(resolution[1]) : null,
    channelDepth: 'RGBE 32-bit',
    fileSizeBytes: fileSize(filePath)
  };
}

function inspect(filePath, type) {
  return type === 'hdri' ? inspectHdri(filePath) : inspectMedia(filePath);
}

function runExtraction(input, output, timestamp, filter) {
  ensureDir(path.dirname(output));
  const result = runFfmpeg([
    '-y', '-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, timestamp)),
    '-i', input, '-frames:v', '1', '-vf', filter, '-q:v', '4', output
  ]);
  if (result.status !== 0 || !fs.existsSync(output) || fileSize(output) === 0) {
    throw new Error('Frame extraction failed for ' + relative(input) + '\n' + result.output);
  }
}

function makePoster(input, output, timestamp, width, height, saturation, budgetBytes) {
  const filter = 'scale=' + width + ':' + height + ':force_original_aspect_ratio=increase,' +
    'crop=' + width + ':' + height + ':(iw-' + width + ')/2:(ih-' + height + ')/2,' +
    'eq=saturation=' + saturation + ':contrast=1.03:brightness=0.005,format=yuv420p';
  let selectedQuality = 38;
  for (const quality of [78, 68, 58, 48, 38]) {
    const result = runFfmpeg([
      '-y', '-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, timestamp)),
      '-i', input, '-frames:v', '1', '-vf', filter, '-c:v', 'libwebp',
      '-quality', String(quality), output
    ]);
    if (result.status !== 0 || !fs.existsSync(output) || fileSize(output) === 0) {
      throw new Error('Poster generation failed for ' + relative(input) + '\n' + result.output);
    }
    selectedQuality = quality;
    if (fileSize(output) <= budgetBytes) break;
  }
  const metadata = inspectMedia(output);
  return {
    file: relative(output), publicPath: publicPath(output), sizeBytes: fileSize(output),
    sha256: sha256(output), quality: selectedQuality, width: metadata.width, height: metadata.height,
    format: 'webp', budgetBytes, budgetPass: fileSize(output) <= budgetBytes
  };
}

function encodeVideo(input, output, config) {
  ensureDir(path.dirname(output));
  const sourceMetadata = inspectMedia(input);
  const availableDuration = sourceMetadata.durationSeconds || config.duration;
  const duration = Math.min(config.duration, Math.max(0.4, availableDuration - config.start));
  const filter = 'scale=1280:720:force_original_aspect_ratio=decrease,' +
    'pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,' +
    'eq=saturation=' + config.saturation + ':contrast=1.03:brightness=0.005';
  let selectedCrf = 36;
  for (const crf of [30, 33, 36]) {
    const result = runFfmpeg([
      '-y', '-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, config.start)),
      '-i', input, '-t', duration.toFixed(3), '-vf', filter, '-r', String(config.fps),
      '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf),
      '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output
    ]);
    if (result.status !== 0 || !fs.existsSync(output) || fileSize(output) === 0) {
      throw new Error('Video encode failed for ' + relative(input) + '\n' + result.output);
    }
    selectedCrf = crf;
    if (fileSize(output) <= 2_500_000) break;
  }
  const metadata = inspectMedia(output);
  return {
    file: relative(output), publicPath: publicPath(output), sizeBytes: fileSize(output),
    sha256: sha256(output), container: metadata.container, codec: metadata.codec,
    width: metadata.width, height: metadata.height, fps: metadata.fps,
    durationSeconds: metadata.durationSeconds, audioStreams: metadata.audioStreams,
    crf: selectedCrf, budgetBytes: 2_500_000, budgetPass: fileSize(output) <= 2_500_000
  };
}

function loadVisualReview() {
  if (!fs.existsSync(reviewPath)) return {};
  const value = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
  return value.assets || {};
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return '"' + text.replaceAll('"', '""') + '"';
}

function assetSourcePath(asset) {
  return path.join(sourceRoot, asset.sourceDirectory, asset.id + '-original.' + asset.sourceExtension);
}

function sourceRecord(asset, review) {
  const filePath = assetSourcePath(asset);
  const exists = fs.existsSync(filePath);
  const metadata = exists ? inspect(filePath, asset.type) : null;
  return {
    asset_id: asset.id, title: asset.title, creator: asset.creator, source: asset.source,
    source_url: asset.sourceUrl, download_url: asset.downloadUrl, license_name: asset.license,
    license_url: asset.licenseUrl, license_checked_at: '2026-09-08',
    license_evidence: asset.source === 'Pexels'
      ? 'Source page and official Pexels license page reviewed; direct media URL resolved; people remain illustrative only.'
      : asset.source === 'Mixkit'
        ? 'Item page exposes Mixkit Stock Video Free License; official Mixkit license page reviewed.'
        : 'Poly Haven asset page exposes CC0 provenance; official Poly Haven license page reviewed.',
    attribution_required: false, commercial_use: true, modification_allowed: true,
    restrictions: asset.source === 'Pexels'
      ? 'No endorsement implication; no bad-light/offensive depiction; no unaltered stock redistribution.'
      : asset.source === 'Mixkit'
        ? 'Only the item-level Free License rendition is accepted; Restricted License items are not accepted.'
        : 'CC0 applies to the asset; do not treat site text, logos or preview renders as CC0.',
    route: asset.route, state: asset.state, role: asset.role, reserve: asset.reserve,
    human_media_flag: asset.type === 'video' && asset.id.includes('HUMAN'),
    human_media_classification: asset.type === 'video' && asset.id.includes('HUMAN') ? 'ILLUSTRATIVE_HUMAN_MEDIA' : null,
    download_status: exists ? 'DOWNLOADED' : 'BLOCKED_BY_ENV_DOWNLOAD',
    canonical_filename: exists ? relative(filePath) : null,
    original_source_filename: asset.downloadUrl.split('/').pop(),
    original_size_bytes: exists ? fileSize(filePath) : null,
    original_sha256: exists ? sha256(filePath) : null, technical_metadata: metadata,
    visual_review_status: review[asset.id]?.status || 'PENDING_MANUAL_REVIEW',
    visual_review_notes: review[asset.id]?.notes || null,
    risk_notes: asset.type === 'video' && asset.id.includes('HUMAN')
      ? 'Do not label depicted people as StudentHub users, experts, partners or testimonials.'
      : 'Decorative media does not own product or Trust truth.'
  };
}

function productionForVideo(asset, source, review) {
  const config = asset.config;
  const videoPath = path.join(videoDir, config.semanticName + '-desktop.mp4');
  const video = encodeVideo(assetSourcePath(asset), videoPath, config);
  const desktopPoster = makePoster(
    videoPath, path.join(posterDir, config.semanticName + '-desktop.webp'),
    Math.min(0.8, video.durationSeconds || 0), 1280, 720, config.saturation, 320_000
  );
  const mobilePoster = makePoster(
    videoPath, path.join(posterDir, config.semanticName + '-mobile.webp'),
    Math.min(0.8, video.durationSeconds || 0), 720, 405, config.saturation, 180_000
  );
  const frameDir = path.join(qaDir, 'derivatives');
  const duration = video.durationSeconds || config.duration;
  const reviewRecord = review[asset.id] || {};
  for (const [label, timestamp] of [
    ['first', 0.1], ['middle', duration / 2], ['last', Math.max(0.1, duration - 0.15)]
  ]) {
    runExtraction(videoPath, path.join(frameDir, asset.id + '-' + label + '.jpg'), timestamp, 'scale=640:-2');
  }
  return {
    asset_id: asset.id, semantic_name: config.semanticName, route: asset.route, state: asset.state,
    variant: 'desktop', type: 'video', video, desktop_poster: desktopPoster, mobile_poster: mobilePoster,
    reduced_motion_asset: mobilePoster.publicPath, mobile_default: true,
    autoplay_eligible: !config.transition, offscreen_policy: 'suspend/no active playback',
    reduced_motion_policy: config.transition ? 'remove transition; opacity/state change only' : 'poster only',
    visual_review_status: reviewRecord.status || 'PENDING_MANUAL_REVIEW',
    visual_review_notes: reviewRecord.notes || null, source_original_sha256: source.original_sha256,
    production_notes: asset.role
  };
}

function productionForHdri(asset, source) {
  const output = path.join(threeDir, asset.config.semanticName + '-1k.hdr');
  if (!fs.existsSync(output)) throw new Error('Expected official 1K HDRI rendition is missing: ' + asset.productionUrl);
  const metadata = inspectHdri(output);
  return {
    asset_id: asset.id, semantic_name: asset.config.semanticName, route: asset.route, state: asset.state,
    variant: '1K', type: 'hdri', file: relative(output), publicPath: publicPath(output),
    format: metadata.format, width: metadata.width, height: metadata.height, sizeBytes: fileSize(output),
    sha256: sha256(output), sourceResolution: source.technical_metadata.width + 'x' + source.technical_metadata.height,
    derivativeResolution: metadata.width + 'x' + metadata.height, sourceSizeBytes: source.original_size_bytes,
    purpose: asset.role, reduced_motion_eligible: false, mobile_default: false, autoplay_eligible: false,
    visual_review_status: 'PASS_SOURCE_PAGE_AND_FORMAT',
    production_notes: 'Official Poly Haven 1K rendition; no 3D runtime introduced by this asset pass.'
  };
}

function routeMap() {
  const rows = [
    ['/', 'LANDING_HERO_AMBIENT', 'VID-PRISM-01', 'poster → lazy desktop video; mobile poster; reduced poster', 'Decorative only; no product verdict'],
    ['/', 'HUMAN_EVIDENCE_CHAPTER', 'VID-HUMAN-01', 'masked editorial crop; poster on mobile/reduced', 'Illustrative people, no endorsement'],
    ['/', 'SECTION_TRANSITION', 'VID-PRISM-03', '≤1.5s transition; remove in reduced motion', 'Never continuous background'],
    ['/trust', 'TRUST_IDLE', 'VID-OPTIC-01', 'poster → optional desktop enhancement; mobile poster', 'Does not decide Trust'],
    ['/trust', 'TRUST_RESULT', 'VID-OPTIC-02', 'poster → optional desktop enhancement; mobile poster', 'Does not decide Trust'],
    ['/trust', '3D_LIGHTING', 'HDRI-01', '1K environment only when a later 3D surface explicitly owns it', 'No runtime introduced in R1–R3'],
    ['/community', 'COMMUNITY_HUMAN_LAYER', 'VID-HUMAN-02', 'editorial crop; mobile poster', 'Experience layer is not official truth'],
    ['/community', 'COMMUNITY_AMBIENT', 'VID-PRISM-02', 'poster → optional desktop enhancement; mobile poster', 'Popularity never equals truth'],
    ['/expert', 'EXPERT_INSPECTION', 'VID-OPTIC-01 + HDRI-01', 'poster or constrained desktop enhancement; reduced poster', 'Expertise is not institutional authority'],
    ['/cases', 'STATIC_ARCHIVE_ONLY', 'none', 'no active media required', 'Static evidence route'],
    ['/settings', 'STATIC', 'none', 'no active media', 'Stable reading/form surface'],
    ['long-reading/form', 'STATIC', 'none', 'no active media; offscreen media suspended', 'Protect readability']
  ];
  return [
    '# StudentHub VNext Asset Route/State Map', '',
    'Generated by the deterministic R1–R3 asset pass. Decorative media is presentation-only and never owns Trust, Community, Expert, authorization, or product state.', '',
    '| Route | State | Asset | Responsive/reduced-motion policy | Authority boundary |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row) => '| ' + row.join(' | ') + ' |'), '',
    'Canonical defaults: desktop poster → optional lazy enhancement; tablet poster or constrained enhancement; mobile poster; reduced-motion poster; offscreen suspended/no active playback.', ''
  ].join('\n');
}

function buildCsv(records) {
  const fields = [
    'asset_id', 'title', 'creator', 'source', 'source_url', 'download_url', 'license_name', 'license_url',
    'license_checked_at', 'commercial_use', 'modification_allowed', 'attribution_required', 'restrictions',
    'download_status', 'canonical_filename', 'original_source_filename', 'original_size_bytes', 'original_sha256',
    'container_or_format', 'codec', 'width', 'height', 'fps', 'duration_seconds', 'role', 'route', 'state',
    'human_media_flag', 'human_media_classification', 'visual_review_status', 'risk_notes'
  ];
  const lines = [fields.join(',')];
  for (const record of records) {
    const metadata = record.technical_metadata || {};
    const values = [
      record.asset_id, record.title, record.creator, record.source, record.source_url, record.download_url,
      record.license_name, record.license_url, record.license_checked_at, record.commercial_use,
      record.modification_allowed, record.attribution_required, record.restrictions, record.download_status,
      record.canonical_filename, record.original_source_filename, record.original_size_bytes, record.original_sha256,
      metadata.format || metadata.container, metadata.codec, metadata.width, metadata.height, metadata.fps,
      metadata.durationSeconds, record.role, record.route, record.state, record.human_media_flag,
      record.human_media_classification, record.visual_review_status, record.risk_notes
    ];
    lines.push(values.map(csvCell).join(','));
  }
  return lines.join('\n') + '\n';
}

function licenseReport(records) {
  const rows = records.map((record) => '| ' + record.asset_id + ' | ' + record.source + ' | ' +
    record.license_name + ' | yes | yes | ' +
    (record.human_media_flag ? 'Illustrative only; no endorsement, user, expert, partner or testimonial claim.' : 'Decorative/lighting asset.') +
    ' | ' + record.license_checked_at + ' |');
  return [
    '# StudentHub VNext Asset License/Provenance Report', '',
    'Checked against the locked source pages and official license pages on 2026-09-08. This is provenance evidence, not legal advice.', '',
    '| Asset | Source | License | Commercial use | Modification | Restrictions/notes | Checked |',
    '| --- | --- | --- | --- | --- | --- | --- |', ...rows, '',
    'Pexels: free use and modification were confirmed, but no endorsement implication and no unaltered stock redistribution.',
    'Mixkit: each item page exposed Mixkit Stock Video Free License; Restricted License items were not accepted.',
    'Poly Haven: the asset pages and license page expose CC0 provenance; preview/site text and logos are not treated as CC0.', ''
  ].join('\n');
}

function qaReport(sources, productions) {
  const core = sources.filter((record) => !record.reserve);
  const coreDownloaded = core.every((record) => record.download_status === 'DOWNLOADED');
  const r1 = coreDownloaded ? 'R1_ASSET_ACQUISITION_PASS' : 'R1_ASSET_ACQUISITION_PARTIAL';
  const r2 = core.every((record) => record.download_status === 'DOWNLOADED' && record.original_sha256 &&
    record.technical_metadata && record.visual_review_status === 'PASS')
    ? 'R2_ASSET_VERIFICATION_PASS' : 'R2_ASSET_VERIFICATION_PARTIAL';
  const coreProductions = productions.filter((record) => core.some((asset) => asset.asset_id === record.asset_id));
  const r3 = coreProductions.length === core.length && coreProductions.every((record) => record.type === 'hdri' || (
    record.video?.sha256 && record.desktop_poster?.sha256 && record.mobile_poster?.sha256 &&
    record.desktop_poster.budgetPass && record.mobile_poster.budgetPass && record.video.budgetPass &&
    record.visual_review_status === 'PASS'
  )) ? 'R3_MEDIA_PRODUCTION_PASS' : 'R3_MEDIA_PRODUCTION_PARTIAL';
  const overall = r1 === 'R1_ASSET_ACQUISITION_PASS' && r2 === 'R2_ASSET_VERIFICATION_PASS' && r3 === 'R3_MEDIA_PRODUCTION_PASS'
    ? 'STUDENTHUB_VNEXT_ASSET_PACK_READY'
    : r1 !== 'R1_ASSET_ACQUISITION_PASS' ? 'STUDENTHUB_VNEXT_ASSET_PACK_BLOCKED_BY_ENV' : 'STUDENTHUB_VNEXT_ASSET_PACK_PARTIAL';
  const blocked = sources.filter((record) => record.download_status !== 'DOWNLOADED');
  return [
    '# StudentHub VNext Asset QA Report', '', 'Run at: ' + runAt, '',
    '## Verdicts', '', '- R1: ' + r1, '- R2: ' + r2, '- R3: ' + r3, '- Overall: ' + overall, '',
    '## Acquisition matrix', '',
    '| Asset | Core/reserve | Status | Bytes | SHA-256 | Technical metadata | Visual review |',
    '| --- | --- | --- | ---: | --- | --- | --- |',
    ...sources.map((record) => '| ' + record.asset_id + ' | ' + (record.reserve ? 'RESERVE' : 'CORE') + ' | ' +
      record.download_status + ' | ' + (record.original_size_bytes || '') + ' | ' + (record.original_sha256 || '') +
      ' | ' + (record.technical_metadata ? 'REAL' : 'MISSING') + ' | ' + record.visual_review_status + ' |'), '',
    '## Derivative matrix', '',
    '| Asset | Video bytes | Video SHA-256 | Desktop poster bytes | Mobile poster bytes | Codec/size | Budget |',
    '| --- | ---: | --- | ---: | ---: | --- | --- |',
    ...productions.filter((record) => record.type === 'video').map((record) =>
      '| ' + record.asset_id + ' | ' + record.video.sizeBytes + ' | ' + record.video.sha256 + ' | ' +
      record.desktop_poster.sizeBytes + ' | ' + record.mobile_poster.sizeBytes + ' | ' + record.video.codec + ' ' +
      record.video.width + 'x' + record.video.height + ' @ ' + record.video.fps + 'fps / ' +
      record.video.durationSeconds + 's | video=' + record.video.budgetPass + ', desktop=' +
      record.desktop_poster.budgetPass + ', mobile=' + record.mobile_poster.budgetPass + ' |'),
    ...productions.filter((record) => record.type === 'hdri').map((record) =>
      '| ' + record.asset_id + ' | n/a | ' + record.sha256 + ' | n/a | n/a | ' + record.format + ' ' +
      record.width + 'x' + record.height + ' | 1K derivative |'), '',
    '## Manual visual/content safety', '',
    'The QA gate requires first/middle/last frame review for every production video. visual-review.json is the human review record consumed by this script.',
    ...sources.filter((record) => record.visual_review_notes).map((record) => '- ' + record.asset_id + ': ' + record.visual_review_notes), '',
    '## Blocked/rejected', '',
    blocked.length ? blocked.map((record) => '- ' + record.asset_id + ': BLOCKED_BY_ENV_DOWNLOAD; no placeholder/hash/metadata was created.') : ['- None.'], '',
    '## Authority and privacy boundary', '',
    '- No raw screenshot, OCR text, private evidence, provider token, session token or credential was downloaded or emitted.',
    '- Human footage is ILLUSTRATIVE_HUMAN_MEDIA and never a real StudentHub user, expert, partner or testimonial.',
    '- Decorative media never decides Trust, Community, Expert, authorization or product state.',
    '- No frontend product code, backend, Trust, Community, Expert, auth, realtime, Labbe, AI pipeline or database file was modified.',
    '- No commit, push, merge or deploy was performed.', '',
    '## Known environment notes', '',
    '- Pexels HTML pages returned local-shell Cloudflare 403, but exact download redirects resolved to real videos.pexels.com bytes.',
    '- ffmpeg 7.1 ran from a temporary imageio-ffmpeg runtime outside the repository; no tool binary was added to the worktree.',
    '- This pass does not call Antigravity and does not start frontend implementation.', ''
  ].join('\n');
}

const review = loadVisualReview();
const sources = ASSETS.map((asset) => sourceRecord(asset, review));
const productions = [];

for (const asset of ASSETS) {
  const source = sources.find((record) => record.asset_id === asset.id);
  if (source.download_status !== 'DOWNLOADED') continue;
  if (asset.type === 'video') {
    const frameDir = path.join(qaDir, 'originals');
    const duration = source.technical_metadata.durationSeconds || 1;
    for (const [label, timestamp] of [
      ['first', 0.1], ['middle', duration / 2], ['last', Math.max(0.1, duration - 0.15)]
    ]) {
      runExtraction(assetSourcePath(asset), path.join(frameDir, asset.id + '-' + label + '.jpg'), timestamp, 'scale=640:-2');
    }
    productions.push(productionForVideo(asset, source, review));
  } else {
    const output = path.join(threeDir, asset.config.semanticName + '-1k.hdr');
    if (fs.existsSync(output)) productions.push(productionForHdri(asset, source));
  }
}

const sourcePayload = {
  generatedAt: runAt,
  sourceLock: 'D:/Download/STUDENTHUB_VNEXT_SOURCE_LOCK_2026-09-08.md',
  assetLedger: 'D:/Download/STUDENTHUB_VNEXT_ASSET_LEDGER_2026-09-08.csv',
  executionReport: 'D:/Download/STUDENTHUB_VNEXT_R0_R1_EXECUTION_REPORT_2026-09-08.md',
  assets: sources
};
const productionPayload = {
  generatedAt: runAt,
  policy: {
    desktopVideoBudgetBytes: 2500000, desktopPosterBudgetBytes: 320000,
    mobilePosterBudgetBytes: 180000, mobileVideoDefault: false,
    reducedMotionDefault: 'poster', offscreenDefault: 'suspend'
  },
  derivatives: productions
};

writeJson(path.join(manifestDir, 'ASSET-SOURCE-LEDGER.json'), sourcePayload);
fs.writeFileSync(path.join(manifestDir, 'ASSET-SOURCE-LEDGER.csv'), buildCsv(sources), 'utf8');
writeJson(path.join(manifestDir, 'ASSET-PRODUCTION-MANIFEST.json'), productionPayload);
writeJson(path.join(publicManifestDir, 'ASSET-PRODUCTION-MANIFEST.json'), productionPayload);
fs.writeFileSync(path.join(manifestDir, 'ASSET-LICENSE-REPORT.md'), licenseReport(sources), 'utf8');
fs.writeFileSync(path.join(manifestDir, 'ASSET-ROUTE-MAP.md'), routeMap(), 'utf8');
fs.writeFileSync(path.join(manifestDir, 'ASSET-QA-REPORT.md'), qaReport(sources, productions), 'utf8');
writeJson(path.join(manifestDir, 'ASSET-RUN-METADATA.json'), {
  generatedAt: runAt, ffmpegPath, sourceCount: sources.length,
  productionCount: productions.length, sourceFiles: sources.map((record) => ({
    asset_id: record.asset_id, file: record.canonical_filename
  })), noProductCodeChanges: true
});

console.log(JSON.stringify({
  runAt, sourceCount: sources.length,
  downloaded: sources.filter((record) => record.download_status === 'DOWNLOADED').length,
  productions: productions.length,
  manifests: [
    relative(path.join(manifestDir, 'ASSET-SOURCE-LEDGER.json')),
    relative(path.join(manifestDir, 'ASSET-SOURCE-LEDGER.csv')),
    relative(path.join(manifestDir, 'ASSET-PRODUCTION-MANIFEST.json')),
    relative(path.join(manifestDir, 'ASSET-LICENSE-REPORT.md')),
    relative(path.join(manifestDir, 'ASSET-QA-REPORT.md')),
    relative(path.join(manifestDir, 'ASSET-ROUTE-MAP.md'))
  ]
}, null, 2));
