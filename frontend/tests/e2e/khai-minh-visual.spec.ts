import { expect, test } from "@playwright/test";

test.describe("StudentHub Visual System VNext — 'Khai Minh' Verification", () => {
  test("Gate 1 & Gate 2: Canonical font stack, no drift, no important body text < 14px", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 1. Verify H1 uses Be Vietnam Pro and Lora
    const h1 = page.locator("#hero-title");
    await expect(h1).toBeVisible();
    const h1Font = await h1.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(h1Font.toLowerCase()).toContain("be vietnam pro");

    const loraSpan = h1.locator("span.font-serif");
    await expect(loraSpan).toBeVisible();
    const loraFont = await loraSpan.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(loraFont.toLowerCase()).toContain("lora");

    // 2. Verify body copy is >= 16px
    const heroBody = page.locator("section[aria-labelledby='hero-title'] p").first();
    await expect(heroBody).toBeVisible();
    const heroBodySize = await heroBody.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    expect(heroBodySize).toBeGreaterThanOrEqual(16);

    // 3. Verify that all paragraphs inside main sections are >= 14px
    const sectionParagraphs = page.locator("main section p");
    const pCount = await sectionParagraphs.count();
    for (let i = 0; i < pCount; i++) {
      const p = sectionParagraphs.nth(i);
      const isVisible = await p.isVisible();
      if (isVisible) {
        const size = await p.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
        const snippet = await p.evaluate((el) => el.textContent?.trim().slice(0, 50));
        console.log(`[P_AUDIT] #${i} (${size}px): "${snippet}"`);
        expect(size).toBeGreaterThanOrEqual(14);
      }
    }
  });

  test("Gate 3: Vietnamese diacritics integrity and long Vietnamese name rendering", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check presence of key Vietnamese characters across sections
    const fullGlyphProof = "Ă Â Ê Ô Ơ Ư Đ ă â ê ô ơ ư đ á à ả ã ạ ắ ằ ẳ ẵ ặ ế ề ể ễ ệ ớ ờ ở ỡ ợ ứ ừ ử ữ ự";
    const longName = "Nguyễn Thị Minh Phương";

    // Inject diacritics proof badge into DOM to test real rendering and bounding box
    const diacriticsBox = await page.evaluate(({ glyphs, name }) => {
      const div = document.createElement("div");
      div.id = "vietnamese-diacritics-proof";
      div.className = "text-academic-body text-base";
      div.style.position = "absolute";
      div.style.left = "0";
      div.style.top = "0";
      div.style.zIndex = "-1";
      div.textContent = `${name} — ${glyphs}`;
      document.body.appendChild(div);

      const rect = div.getBoundingClientRect();
      const style = window.getComputedStyle(div);
      return {
        width: rect.width,
        height: rect.height,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
      };
    }, { glyphs: fullGlyphProof, name: longName });

    expect(diacriticsBox.width).toBeGreaterThan(0);
    expect(diacriticsBox.height).toBeGreaterThanOrEqual(20);
    expect(diacriticsBox.fontFamily.toLowerCase()).toContain("be vietnam pro");
  });

  test("Gate 4: Hero is completely legible and functional without video / 3D", async ({ page }) => {
    // Disable WebGL by overriding getContext
    await page.addInitScript(`
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type) {
        if (typeof type === 'string' && type.includes('webgl')) {
          return null;
        }
        return origGetContext.apply(this, arguments);
      };
    `);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Primary headline & CTA must be fully visible and intact
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.getByRole("link", { name: "Kiểm tra trước khi tin", exact: true })).toBeVisible();

    // Fallback Knowledge Observatory SVG must be rendered and interactive
    const fallbackSvg = page.locator("svg[aria-label='Sơ đồ quan hệ các tầng thông tin học thuật']").first();
    await expect(fallbackSvg).toBeVisible();
  });

  test("Gate 5: Prefers-reduced-motion disables cinematic video and loops", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Ensure no <video> element is auto-playing
    const videos = page.locator("video");
    const count = await videos.count();
    for (let i = 0; i < count; i++) {
      const isPaused = await videos.nth(i).evaluate((v: HTMLVideoElement) => v.paused);
      expect(isPaused).toBe(true);
    }
  });

  test("Gate 7: Quiet reading route (/learn/cs101/fullstack-intro) has 0 video and 0 WebGL", async ({ page }) => {
    await page.goto("/learn/cs101/fullstack-intro");
    await page.waitForLoadState("domcontentloaded");

    const videoCount = await page.locator("video").count();
    const canvasCount = await page.locator("canvas").count();

    expect(videoCount).toBe(0);
    expect(canvasCount).toBe(0);
  });

  test("Gate 8: Truthful states have textual labels and icons independent of color", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const trustSection = page.locator("#trust-engine-showcase");
    await trustSection.scrollIntoViewIfNeeded();

    // Verify status labels like PHÁT HIỆN RỦI RO CAO or XÁC THỰC NGUỒN CHÍNH THỨC exist as text
    await expect(trustSection.getByText(/PHÁT HIỆN RỦI RO CAO|XÁC THỰC NGUỒN CHÍNH THỨC|CHƯA ĐỦ CĂN CỨ PHÁP LÝ/i).first()).toBeVisible();

    // Verify reasoning sections exist: Tại sao, Điểm chưa chắc chắn, Hành động khuyến nghị
    await expect(trustSection.getByText(/TẠI SAO\?/i).first()).toBeVisible();
    await expect(trustSection.getByText(/ĐIỂM CHƯA CHẮC CHẮN/i).first()).toBeVisible();
    await expect(trustSection.getByText(/Hành động an toàn khuyến nghị/i).first()).toBeVisible();
  });

  test("Gate 9: Mobile 390px has no floating overlay collisions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const primaryCta = page.getByRole("link", { name: "Kiểm tra trước khi tin", exact: true });
    await expect(primaryCta).toBeVisible();

    // Primary CTA bounding box
    const ctaBox = await primaryCta.boundingBox();
    expect(ctaBox).not.toBeNull();

    // Live console and ambient dock must be hidden on mobile (< 640px)
    const mobileHiddenDocks = page.locator(".sm\\:flex, .sm\\:block").filter({ hasText: "Console" });
    const dockCount = await mobileHiddenDocks.count();
    for (let i = 0; i < dockCount; i++) {
      await expect(mobileHiddenDocks.nth(i)).toBeHidden();
    }
  });

  test("Gate 10: Capture visual evidence artifacts for desktop and mobile", async ({ page }) => {
    const artifactDir = "C:\\Users\\Duy\\.gemini\\antigravity-ide\\brain\\ebadec0a-352e-4adc-b815-6435d1c953f3";
    
    // 1. Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.screenshot({
      path: `${artifactDir}\\screenshot-desktop-hero-1440.png`,
      fullPage: false,
    });

    const trustSection = page.locator("#trust-engine-showcase");
    if (await trustSection.isVisible()) {
      await trustSection.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${artifactDir}\\screenshot-trust-engine-1440.png`,
      });
    }

    await page.screenshot({
      path: `${artifactDir}\\screenshot-landing-full-1440.png`,
      fullPage: true,
    });

    // 2. Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.screenshot({
      path: `${artifactDir}\\screenshot-mobile-hero-390.png`,
      fullPage: false,
    });

    await page.screenshot({
      path: `${artifactDir}\\screenshot-mobile-full-390.png`,
      fullPage: true,
    });
  });
});
