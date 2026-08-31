import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3100";

const ROUTES = [
  { name: "Landing (/)", path: "/" },
  { name: "Trust Engine (/trust)", path: "/trust" },
  { name: "Community Intelligence (/community)", path: "/community" },
  { name: "Expert Network (/expert)", path: "/expert" },
  { name: "Command Center (/dashboard)", path: "/dashboard" },
  { name: "Academic 360 (/academic)", path: "/academic" }
];

async function measure() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log("======================================================================");
  console.log("🚀 STUDENTHUB AI — REAL BROWSER RUNTIME PERFORMANCE BENCHMARK");
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log("======================================================================");

  const results = [];

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    try {
      const startTime = Date.now();
      await page.goto(url, { waitUntil: "networkidle" });
      const elapsed = Date.now() - startTime;

      const performanceTiming = JSON.parse(
        await page.evaluate(() => {
          const navEntries = performance.getEntriesByType("navigation");
          const paintEntries = performance.getEntriesByType("paint");
          const nav = navEntries.length > 0 ? navEntries[0] : null;
          const fcpEntry = paintEntries.find(p => p.name === "first-contentful-paint");

          return JSON.stringify({
            domInteractive: nav ? Math.round(nav.domInteractive) : null,
            domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
            loadComplete: nav ? Math.round(nav.loadEventEnd) : null,
            fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
            transferSize: nav ? nav.transferSize : null
          });
        })
      );

      results.push({
        name: route.name,
        path: route.path,
        elapsedMs: elapsed,
        ...performanceTiming
      });

      console.log(`✔ [${route.name}] Loaded in ${elapsed}ms | FCP: ${performanceTiming.fcp}ms | DCL: ${performanceTiming.domContentLoaded}ms | Load: ${performanceTiming.loadComplete}ms`);
    } catch (err) {
      console.error(`✖ [${route.name}] Failed: ${err.message}`);
    }
  }

  await browser.close();

  console.log("\n======================================================================");
  console.log("SUMMARY TABLE:");
  console.table(results.map(r => ({
    Route: r.name,
    "FCP (ms)": r.fcp,
    "DOM Interactive (ms)": r.domInteractive,
    "DOM Content Loaded (ms)": r.domContentLoaded,
    "Full Load (ms)": r.loadComplete,
    "Wall Clock (ms)": r.elapsedMs
  })));
  console.log("======================================================================");
}

measure().catch(console.error);
