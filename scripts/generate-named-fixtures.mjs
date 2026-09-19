import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';
import jsQR from 'jsqr';

const OUT_DIR = path.resolve('fixtures/trust-multimodal');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function decodeQr(buffer) {
  const image = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const code = jsQR(new Uint8ClampedArray(image.data), image.info.width, image.info.height);
  return code ? code.data : null;
}

async function decodeMultiQr(buffer) {
  const meta = await sharp(buffer).metadata();
  const halfW = Math.floor(meta.width / 2);
  const leftBuf = await sharp(buffer).extract({ left: 0, top: 0, width: halfW, height: meta.height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rightBuf = await sharp(buffer).extract({ left: halfW, top: 0, width: meta.width - halfW, height: meta.height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const left = jsQR(new Uint8ClampedArray(leftBuf.data), leftBuf.info.width, leftBuf.info.height);
  const right = jsQR(new Uint8ClampedArray(rightBuf.data), rightBuf.info.width, rightBuf.info.height);
  const res = [];
  if (left) res.push(left.data);
  if (right) res.push(right.data);
  return res;
}

const qrSpecs = [
  { name: '01-https.png', payload: 'https://example.com/', type: 'URL' },
  { name: '02-text.png', payload: 'StudentHub Trust QR test', type: 'TEXT' },
  { name: '03-vietnamese-text.png', payload: 'Thông báo học bổng sinh viên', type: 'TEXT' },
  { name: '04-http.png', payload: 'http://example.com/scholarship', type: 'URL' },
  { name: '05-rotated-90.png', payload: 'https://example.com/rotated-90', rotate: 90, type: 'URL' },
  { name: '06-rotated-180.png', payload: 'https://example.com/rotated-180', rotate: 180, type: 'URL' },
  { name: '07-rotated-270.png', payload: 'https://example.com/rotated-270', rotate: 270, type: 'URL' },
  { name: '08-inverted.png', payload: 'https://example.com/inverted-qr', invert: true, type: 'URL' },
  { name: '09-low-resolution.png', payload: 'https://example.com/low-res', width: 120, type: 'URL' },
  { name: '10-blurred-but-readable.png', payload: 'https://example.com/blurred-readable', blur: 0.6, type: 'URL' },
  { name: '12-localhost.png', payload: 'http://127.0.0.1:3000', type: 'SSRF_LOCAL' },
  { name: '13-metadata.png', payload: 'http://169.254.169.254/', type: 'SSRF_METADATA' },
  { name: '14-private-ip.png', payload: 'http://192.168.1.1/', type: 'SSRF_PRIVATE' },
  { name: '15-javascript.png', payload: 'javascript:alert(1)', type: 'DANGEROUS_SCHEME' },
  { name: '16-data.png', payload: 'data:text/html,<script>alert(1)</script>', type: 'DANGEROUS_SCHEME' },
  { name: '17-file.png', payload: 'file:///etc/passwd', type: 'DANGEROUS_SCHEME' },
  { name: '18-credentials.png', payload: 'https://user:password@example.com/', type: 'CREDENTIAL_EMBEDDED' },
  { name: '19-punycode.png', payload: 'https://xn--e1afmkfd.xn--p1ai/', type: 'PUNYCODE' },
];

async function main() {
  console.log('Generating standardized QR fixtures...');
  const manifest = [];

  for (const spec of qrSpecs) {
    let buf = await QRCode.toBuffer(spec.payload, {
      errorCorrectionLevel: 'M',
      width: spec.width || 320,
      margin: 4,
      color: { dark: '#000000', light: '#ffffff' },
    });

    let pipe = sharp(buf);
    if (spec.rotate) {
      pipe = pipe.rotate(spec.rotate);
    }
    if (spec.invert) {
      pipe = pipe.negate({ alpha: false });
    }
    if (spec.blur) {
      pipe = pipe.blur(spec.blur);
    }
    const finalBuf = await pipe.png().toBuffer();
    const filePath = path.join(OUT_DIR, spec.name);
    fs.writeFileSync(filePath, finalBuf);

    // Independently decode
    let decoded = null;
    if (spec.rotate) {
      // Decode with rotation support
      const rpipe = sharp(finalBuf).rotate(360 - spec.rotate);
      decoded = await decodeQr(await rpipe.toBuffer());
    } else if (spec.invert) {
      const ipipe = sharp(finalBuf).negate({ alpha: false });
      decoded = await decodeQr(await ipipe.toBuffer());
    } else {
      decoded = await decodeQr(finalBuf);
    }

    const pass = decoded === spec.payload;
    manifest.push({
      name: spec.name,
      expected: spec.payload,
      decoded,
      pass: pass ? 'PASS' : 'FAIL',
      type: spec.type,
      size: finalBuf.length,
    });
    console.log(`[QR] ${spec.name}: ${pass ? 'PASS' : 'FAIL'} (${decoded})`);
  }

  // 11-multi-qr.png (2 separate QR codes side by side)
  const q1Buf = await QRCode.toBuffer('https://example.com/first-qr', { width: 220, margin: 2 });
  const q2Buf = await QRCode.toBuffer('https://example.com/second-qr', { width: 220, margin: 2 });
  const multiBuf = await sharp({
    create: { width: 500, height: 260, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([
      { input: q1Buf, left: 15, top: 20 },
      { input: q2Buf, left: 265, top: 20 },
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, '11-multi-qr.png'), multiBuf);
  const multiDecoded = await decodeMultiQr(multiBuf);
  const multiPass = multiDecoded.length === 2 && multiDecoded[0] === 'https://example.com/first-qr' && multiDecoded[1] === 'https://example.com/second-qr';
  manifest.push({
    name: '11-multi-qr.png',
    expected: 'https://example.com/first-qr | https://example.com/second-qr',
    decoded: multiDecoded.join(' | '),
    pass: multiPass ? 'PASS' : 'FAIL',
    type: 'MULTI_QR',
    size: multiBuf.length,
  });
  console.log(`[QR] 11-multi-qr.png: ${multiPass ? 'PASS' : 'FAIL'} (${multiDecoded.join(', ')})`);

  // 20-malformed-image.png (corrupt file)
  const malformedBuf = Buffer.from('NOT_A_VALID_PNG_OR_JPEG_IMAGE_HEADER_0x00112233');
  fs.writeFileSync(path.join(OUT_DIR, '20-malformed-image.png'), malformedBuf);
  manifest.push({
    name: '20-malformed-image.png',
    expected: 'INVALID_IMAGE',
    decoded: null,
    pass: 'PASS',
    type: 'CORRUPTED',
    size: malformedBuf.length,
  });
  console.log(`[QR] 20-malformed-image.png: PASS (CORRUPTED)`);

  // Valid Image Fixtures:
  // real-photo.jpg
  if (fs.existsSync(path.join(OUT_DIR, 'real_camera_photo.jpg'))) {
    fs.copyFileSync(path.join(OUT_DIR, 'real_camera_photo.jpg'), path.join(OUT_DIR, 'real-photo.jpg'));
  }
  // screenshot-text.png
  if (fs.existsSync(path.join(OUT_DIR, 'screenshot_scholarship_scam.png'))) {
    fs.copyFileSync(path.join(OUT_DIR, 'screenshot_scholarship_scam.png'), path.join(OUT_DIR, 'screenshot-text.png'));
  }
  // suspicious-message.png
  if (fs.existsSync(path.join(OUT_DIR, 'screenshot_payment_scam.png'))) {
    fs.copyFileSync(path.join(OUT_DIR, 'screenshot_payment_scam.png'), path.join(OUT_DIR, 'suspicious-message.png'));
  }
  // ai-generated.png
  const aiGenerated = await sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 30, g: 45, b: 70 } },
  })
    .composite([
      {
        input: Buffer.from(`<svg width="400" height="300">
          <text x="50%" y="40%" font-family="Arial" font-size="20" fill="#ffffff" text-anchor="middle">StudentHub AI Simulation</text>
          <text x="50%" y="60%" font-family="Arial" font-size="14" fill="#a0aec0" text-anchor="middle">Generated Neural Content 2026</text>
        </svg>`),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, 'ai-generated.png'), aiGenerated);

  // recompressed.jpg
  const recompressed = await sharp(aiGenerated).jpeg({ quality: 40 }).toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, 'recompressed.jpg'), recompressed);

  // no-metadata.jpg
  const noMeta = await sharp(aiGenerated).strip().jpeg({ quality: 85 }).toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, 'no-metadata.jpg'), noMeta);

  // qr-containing-image.png
  if (fs.existsSync(path.join(OUT_DIR, 'combined_image_qr_text_url.png'))) {
    fs.copyFileSync(path.join(OUT_DIR, 'combined_image_qr_text_url.png'), path.join(OUT_DIR, 'qr-containing-image.png'));
  }

  fs.writeFileSync(path.join(OUT_DIR, 'qr-matrix-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Finished generating all fixtures. Manifest written with ${manifest.length} items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
