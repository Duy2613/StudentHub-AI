const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const obsFfmpeg = 'C:\\Users\\Duy\\AppData\\Local\\Overwolf\\Extensions\\ncfplpkmiejjaklknfnkgcpapnhkggmlcppckhcb\\270.0.25\\obs\\bin\\64bit\\ffmpeg.exe';
const ffmpegPath = fs.existsSync(obsFfmpeg) ? obsFfmpeg : 'C:\\Users\\Duy\\AppData\\Local\\ms-playwright\\ffmpeg-1011\\ffmpeg-win64.exe';

const mediaFiles = [
  { path: 'frontend/public/media/home/home-campus-atlas.webm', type: 'video', expected: { w: 1920, h: 1080, fps: 24, dur: 10.0, format: 'webm', codec: 'vp9' } },
  { path: 'frontend/public/media/home/home-campus-atlas-mobile.webm', type: 'video', expected: { w: 1080, h: 1920, fps: 24, dur: 10.0, format: 'webm', codec: 'vp9' } },
  { path: 'frontend/public/media/home/home-campus-atlas-poster.avif', type: 'image', expected: { w: 1920, h: 1080, format: 'avif' } },
  { path: 'frontend/public/media/trust/trust-evidence-specimen.avif', type: 'image', expected: { w: 2400, h: 1500, format: 'avif' } },
  { path: 'frontend/public/media/trust/trust-evidence-specimen-mobile.avif', type: 'image', expected: { w: 1200, h: 1600, format: 'avif' } },
  { path: 'frontend/public/media/auth/auth-architectural-monolith.avif', type: 'image', expected: { w: 1600, h: 2000, format: 'avif' } },
  { path: 'frontend/public/media/academic/academic-course-topography.avif', type: 'image', expected: { w: 2000, h: 1125, format: 'avif' } }
];

let sharp;
try {
  sharp = require(path.resolve('frontend/node_modules/sharp'));
} catch (e) {
  console.error('Sharp load failed:', e.message);
}

async function verifyAll() {
  console.log('=== VERIFYING ENCODERS & TOOLS ===');
  try {
    let codecOutput = '';
    try {
      execSync(`"${ffmpegPath}" -codecs`, { stdio: 'pipe' });
    } catch (e) {
      codecOutput = (e.stdout || e.stderr || '').toString();
    }
    const lines = codecOutput.split('\n').filter(l => /vp8|vp9|vpx/i.test(l));
    console.log('VP8/VP9 codecs in playwright ffmpeg:');
    lines.forEach(l => console.log('  ', l.trim()));
  } catch (e) {
    console.log('Codec check err:', e.message);
  }

  // Also check if system has ffmpeg
  try {
    const sysFfmpeg = execSync('where.exe ffmpeg', { stdio: 'pipe' }).toString().trim();
    console.log('System ffmpeg located at:', sysFfmpeg);
  } catch (e) {
    console.log('No system ffmpeg found in PATH');
  }

  console.log('\n=== VERIFYING 7 PHYSICAL MEDIA FILES ===');

  for (const item of mediaFiles) {
    const fullPath = path.resolve(item.path);
    if (!fs.existsSync(fullPath)) {
      console.log(`FAIL - FILE MISSING: ${item.path}`);
      continue;
    }
    const stat = fs.statSync(fullPath);
    console.log(`\nChecking: ${item.path} (${stat.size} bytes)`);

    if (item.type === 'image') {
      try {
        const metadata = await sharp(fullPath).metadata();
        console.log(`  Format: ${metadata.format}`);
        console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
        console.log(`  Decode test: SUCCESS (channels: ${metadata.channels}, space: ${metadata.space})`);
      } catch (err) {
        console.log(`  Decode test: FAILED - ${err.message}`);
      }
    } else if (item.type === 'video') {
      try {
        // Run ffmpeg -i to inspect stream details
        let inspectOutput = '';
        try {
          execSync(`"${ffmpegPath}" -i "${fullPath}"`, { stdio: 'pipe' });
        } catch (e) {
          inspectOutput = e.stderr.toString();
        }

        console.log('  FFmpeg Output excerpt:');
        const lines = inspectOutput.split('\n').filter(l => l.includes('Duration:') || l.includes('Stream #0:'));
        lines.forEach(l => console.log('   ', l.trim()));

        // Check audio streams
        const hasAudio = inspectOutput.includes('Audio:');
        console.log(`  Audio streams: ${hasAudio ? 'DETECTED' : '0 (SILENT)'}`);

        // Try decoding a frame to test decode success
        const tempTestFrame = path.resolve('scripts/temp-test-frame.png');
        try {
          execSync(`"${ffmpegPath}" -y -i "${fullPath}" -frames:v 1 -c:v png "${tempTestFrame}"`, { stdio: 'pipe' });
          if (fs.existsSync(tempTestFrame) && fs.statSync(tempTestFrame).size > 0) {
            console.log(`  Decode test: SUCCESS (frame extracted: ${fs.statSync(tempTestFrame).size} bytes)`);
            fs.unlinkSync(tempTestFrame);
          } else {
            console.log('  Decode test: FAILED - 0 bytes extracted');
          }
        } catch (decErr) {
          console.log(`  Decode test: FAILED - ${decErr.message}`);
        }
      } catch (err) {
        console.log(`  Video check error: ${err.message}`);
      }
    }
  }
}

verifyAll();
\n