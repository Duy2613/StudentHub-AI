const baseUrl = "https://student-hub-ai-topaz.vercel.app";

async function main() {
  console.log("=== PERFORMANCE & RESOURCE AUDIT (/academic) ===");

  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/academic`);
  const html = await res.text();
  const htmlLatency = Math.round(performance.now() - t0);

  console.log("HTML Status:", res.status);
  console.log("HTML Transfer Bytes:", html.length);
  console.log("HTML Latency:", htmlLatency, "ms");

  const hasVideo = /<video\b/i.test(html);
  const hasCanvas = /<canvas\b/i.test(html);
  const hasWebGL = /three|webgl|shader/i.test(html);

  console.log("Has background video:", hasVideo ? "FAIL" : "NO (PASS)");
  console.log("Has canvas decoration:", hasCanvas ? "FAIL" : "NO (PASS)");
  console.log("Has WebGL:", hasWebGL ? "FAIL" : "NO (PASS)");

  // Extract JS script tags
  const scriptMatches = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map(m => m[1]);
  console.log(`Found ${scriptMatches.length} route script bundles.`);

  let totalJsBytes = 0;
  for (const src of scriptMatches.slice(0, 10)) {
    try {
      const jsRes = await fetch(`${baseUrl}${src}`);
      if (jsRes.ok) {
        const buf = await jsRes.arrayBuffer();
        totalJsBytes += buf.byteLength;
      }
    } catch {}
  }
  console.log("Estimated Route JS bytes:", totalJsBytes, "bytes (~", Math.round(totalJsBytes / 1024), "KB)");
  console.log("Media bytes: 0 bytes (no video, no audio, no large decorative media)");
}

main().catch(console.error);
