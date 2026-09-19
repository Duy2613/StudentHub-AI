import fs from 'node:fs';

const filePath = 'scripts/recording-suite/record-trust-v3-suite.mjs';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = 'button:has-text("Phân tích độ tin cậy"), button[type="submit"]';
const repl1 = '.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]';

const target2 = 'input[data-testid="trust-url-input"], input[type="text"]';
const repl2 = '.master-ultra-text-field textarea, textarea';

const before1 = content.split(target1).length - 1;
const before2 = content.split(target2).length - 1;

content = content.replaceAll(target1, repl1);
content = content.replaceAll(target2, repl2);

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced ${before1} instances of target1 and ${before2} instances of target2.`);
