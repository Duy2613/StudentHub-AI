import fs from 'node:fs';

const filePath = 'scripts/recording-suite/record-trust-v3-suite.mjs';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replaceAll(
  "await page.waitForSelector('.master-ultra-overview', { timeout: 25000 });",
  "await page.waitForTimeout(5000);\n  await page.waitForSelector('.master-ultra-overview, [aria-label=\"Trust case / analysis complete\"]', { timeout: 45000 });"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated timeouts across recording suite.");
