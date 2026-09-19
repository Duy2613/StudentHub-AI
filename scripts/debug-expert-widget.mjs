import { chromium } from "../frontend/node_modules/playwright/index.mjs";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("Expert") || msg.text().includes("blind")) {
      console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
    }
  });

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill("input#email", "demo-expert@gmail.com");
  await page.fill("input#password", "StudentHubQA2026!");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });
  console.log("Logged in URL:", page.url());

  await page.goto("http://localhost:3000/expert", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);

  const state = await page.evaluate(async () => {
    const blindRes = await fetch("/api/expert/blind-reviews", { credentials: "include" });
    const blindData = await blindRes.json().catch((e) => ({ error: e.message }));
    const qualRes = await fetch("/api/expert/qualification", { credentials: "include" });
    const qualData = await qualRes.json().catch((e) => ({ error: e.message }));

    const pill = document.querySelector(".expert-blind-pill");
    const container = document.querySelector(".expert-blind-widget-container");
    const deskBtn = document.querySelector("#open-review-desk-button");
    const allButtons = Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim().replace(/\s+/g, " "));

    return {
      url: window.location.href,
      blindSuccess: blindData?.success,
      blindPendingCount: blindData?.pendingCount,
      qualState: qualData?.data?.state,
      pillFound: Boolean(pill),
      pillText: pill?.textContent,
      containerFound: Boolean(container),
      deskBtnFound: Boolean(deskBtn),
      buttonsCount: allButtons.length,
      sampleButtons: allButtons.slice(0, 10),
    };
  });

  console.log("Expert Browser State:", JSON.stringify(state, null, 2));
  await browser.close();
}

main().catch(console.error);
