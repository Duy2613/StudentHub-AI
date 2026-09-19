import { chromium } from "../frontend/node_modules/playwright/index.mjs";

async function testClick() {
  const b = await chromium.launch({ headless: true });
  const context = await b.newContext();
  const p = await context.newPage();

  p.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  p.on("request", (req) => console.log(`[BROWSER REQ] ${req.method()} ${req.url()}`));
  p.on("response", (res) => console.log(`[BROWSER RES] ${res.status()} ${res.url()}`));

  // 1. Login
  console.log("Navigating to login...");
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await p.fill('input#email', "demo-user@gmail.com");
  await p.fill('input#password', "StudentHubQA2026!");
  await p.click('button[type="submit"]');
  await p.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15_000 });
  console.log("Logged in:", p.url());

  // 2. Trust page
  console.log("Navigating to /trust?mode=text...");
  await p.goto("http://localhost:3000/trust?mode=text", { waitUntil: "networkidle" });

  // Wait 2 seconds for dynamic imports to fully hydrate
  await p.waitForTimeout(2000);

  // Check which component is mounted
  const hasMasterUltra = await p.evaluate(() => Boolean(document.querySelector('.master-ultra-composer')));
  const hasCriticalInput = await p.evaluate(() => Boolean(document.querySelector('.vnext-trust-composer')));
  console.log(`Mounted: hasMasterUltra=${hasMasterUltra}, hasCriticalInput=${hasCriticalInput}`);

  // Switch to text mode
  const textBtn = p.locator('button[role="tab"]:has-text("Văn bản")');
  await textBtn.click();
  await p.waitForTimeout(500);

  // Find textarea
  const textarea = p.locator('textarea');
  await textarea.fill("Thực phẩm chức năng X chữa khỏi tiểu đường sau 7 ngày.");
  await p.waitForTimeout(500);

  // Find analyze button
  const submitBtn = p.locator('button.master-ultra-submit, button.primary-action.trust-submit');
  const btnInfo = await submitBtn.evaluate((b) => ({
    className: b.className,
    disabled: b.disabled,
    text: b.innerText.trim(),
  }));
  console.log("Button info:", btnInfo);

  // Check provider bundle
  const providerInfo = await p.evaluate(async () => {
    try {
      const { getRuntimeProviderBundle, RUNTIME_PROVIDER_MODE } = await import("/src/lib/backend/runtimeProvider.js");
      const bundle = getRuntimeProviderBundle();
      return {
        RUNTIME_PROVIDER_MODE,
        bundleMode: bundle.mode,
        sourceMode: bundle.sourceMode,
        trustConstructor: bundle.trust?.constructor?.name,
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log("Provider Info in browser:", JSON.stringify(providerInfo, null, 2));

  // Click button
  console.log("Clicking submit button...");
  await submitBtn.click();
  console.log("Clicked! Waiting 8s for pipeline events and requests...");
  await p.waitForTimeout(8000);

  // Check state after click
  const afterInfo = await p.evaluate(() => {
    const rail = Array.from(document.querySelectorAll('.master-ultra-rail-item, .pipeline-list li')).map((el) => ({
      text: el.innerText.replace(/\s+/g, ' ').trim(),
      status: el.getAttribute('data-status'),
      className: el.className,
    }));
    return { rail };
  });
  console.log("After click pipeline state:", JSON.stringify(afterInfo, null, 2));

  await b.close();
}

testClick().catch(console.error);
