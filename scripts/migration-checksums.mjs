import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const migDir = "database/migrations";
const files = readdirSync(migDir).filter(f => f.endsWith(".sql")).sort();

console.log("============================================================");
console.log("📜 DATABASE MIGRATIONS & CHECKSUM AUDIT");
console.log("============================================================");

const inventory = [];
for (const file of files) {
  const content = readFileSync(join(migDir, file));
  const sha256 = createHash("sha256").update(content).digest("hex");
  console.log(`Migration: ${file}`);
  console.log(`  Size:    ${content.length} bytes`);
  console.log(`  SHA-256: ${sha256}\n`);
  inventory.push({ file, size: content.length, sha256 });
}

console.log(`Total Migration Files: ${inventory.length}`);
console.log("============================================================\n");
