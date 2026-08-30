import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3100";
const OUTPUT_DIR = path.resolve(process.cwd(), "test-results", "visual-audit-screenshots");

const ROUTES = [
  { id: "landing", name: "Landing (/)", path: "/" },
  { id: "login", name: "Login (/login)", path: "/login" },
  { id: "onboarding", name: "Onboarding (/onboarding)", path: "/onboarding" },
  { id: "trust", name: "Trust Engine (/trust)", path: "/trust" },
  { id: "community", name: "Community (/community)", path: "/community" },
  { id: "expert", name: "Expert Network (/expert)", path: "/expert" },
  { id: "dashboard", name: "Command Center (/dashboard)", path: "/dashboard" },
  { id: "academic", name: "Academic 360 (/academic)", path: "/academic" },
  { id: "profile", name: "Profile (/profile)", path: "/profile" },
  { id: "settings", name: "Settings (/settings)", path: "/settings" }
];

const VIEWPORTS = [
  { name: "mobile_360", width: 360, height: 800 },
  { name: "mobile_390", width: 390, height: 844 },
  { name: "mobile_430", width: 430, height: 932 },
  { name: "tablet_768", width: 768, height: 1024 },
  { name: "tablet_1024", width: 1024, height: 768 },
  { name: "desktop_1280", width: 1280, height: 800 },
  { name: "desktop_1440", width: 1440, height: 900 },
  { name: "desktop_1920", width: 1920, height: 1080 }
];

async function runAudit() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("======================================================================");
  console.log("🎨 STUDENTHUB AI — VISUAL DIRECTOR AUDIT & SCREENSHOT SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log("======================================================================\n");

  const browser = await chromium.launch();
  const report = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Inspecting Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(route.id === "landing" ? 2200 : 500); // Allow opening sequence and animations to settle

        const filename = `${route.id}_${vp.name}.png`;
        const filePath = path.join(OUTPUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: false });

        // Measure layout metrics & overflow
        const metrics = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const overflow = scrollWidth - clientWidth;
          const bodyFont = window.getComputedStyle(document.body).fontFamily;
          const h1 = document.querySelector("h1");
          const h1Font = h1 ? window.getComputedStyle(h1).fontFamily : null;
          const h1Size = h1 ? window.getComputedStyle(h1).fontSize : null;

          return {
            overflow: Math.max(0, overflow),
            bodyFont,
            h1Font,
            h1Size
          };
        });

        report.push({
          route: route.name,
          viewport: `${vp.width}x${vp.height}`,
          overflow: metrics.overflow,
          bodyFont: metrics.bodyFont?.slice(0, 30),
          h1Size: metrics.h1Size,
          screenshot: filename
        });

        console.log(`✔ [${route.name}] [${vp.name}] Captured -> ${filename} (Overflow: ${metrics.overflow}px)`);
      } catch (err) {
        console.error(`✖ [${route.name}] [${vp.name}] Failed: ${err.message}`);
      }
    }
    await context.close();
  }

  await browser.close();

  console.log("\n======================================================================");
  console.log("VISUAL AUDIT SUMMARY (Representative Viewports):");
  console.table(report.filter(r => r.viewport === "1440x900" || r.viewport === "390x844"));
  console.log("======================================================================");
}

runAudit().catch(console.error);
