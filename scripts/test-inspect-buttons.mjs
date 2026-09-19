import { chromium } from "../frontend/node_modules/playwright/index.mjs";

async function checkButtons() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto("http://localhost:3000/trust?mode=text", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const buttons = await p.$$eval("button", (btns) =>
    btns.map((btn) => ({
      text: btn.innerText.trim(),
      className: btn.className,
      id: btn.id,
      role: btn.getAttribute("role"),
      disabled: btn.disabled,
    }))
  );
  console.log("Found buttons:", JSON.stringify(buttons, null, 2));
  await b.close();
}

checkButtons().catch(console.error);
