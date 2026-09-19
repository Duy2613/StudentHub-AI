import fs from 'node:fs';

const filePath = 'scripts/recording-suite/record-trust-v3-suite.mjs';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replaceAll('button:has-text("QR")', 'button[role="tab"]:has-text("QR")');
content = content.replaceAll('button:has-text("Văn bản")', 'button[role="tab"]:has-text("Văn bản")');
content = content.replaceAll('button:has-text("URL")', 'button[role="tab"]:has-text("URL")');
content = content.replaceAll('button:has-text("Ảnh chụp")', 'button[role="tab"]:has-text("Ảnh chụp")');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated tab locators across recording suite.");
