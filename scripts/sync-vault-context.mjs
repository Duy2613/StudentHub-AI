// scripts/sync-vault-context.mjs
// Tự động quét các routes, components, database schemas và đồng bộ vào Obsidian Vault

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const vaultDir = path.join(rootDir, "docs", "vault");

console.log("🔄 Đang đồng bộ ngữ cảnh dự án vào Obsidian Knowledge Vault...");

// 1. Quét Routes Frontend
const appDir = path.join(rootDir, "frontend", "src", "app");
const getDirectories = (srcPath) =>
  fs.existsSync(srcPath)
    ? fs
        .readdirSync(srcPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
    : [];

const routes = getDirectories(appDir).filter(
  (name) => !name.startsWith("(") && !name.startsWith("_")
);

// 2. Quét UI Components
const uiDir = path.join(rootDir, "frontend", "src", "components", "ui");
const uiComponents = fs.existsSync(uiDir)
  ? fs
      .readdirSync(uiDir)
      .filter((file) => file.endsWith(".jsx") || file.endsWith(".tsx"))
  : [];

// 3. Cập nhật Registry vào Vault
const componentRegistryFile = path.join(
  vaultDir,
  "02 - 🎨 Design & Refero Systems",
  "UI-Component-Registry.md"
);

const componentContent = `# 📦 Danh Mục UI Components (Auto-Synced)
> **Vault Node**: \`UI-Component-Registry\` | **Last Synced**: ${new Date().toLocaleString(
  "vi-VN"
)}

---

## 🎨 Atomic UI Components (${uiComponents.length} components)

| Component | File Path | Công Nghệ / Thư Viện |
| :--- | :--- | :--- |
${uiComponents
  .map(
    (c) =>
      `| **\`${c.replace(
        /\.(jsx|tsx)$/,
        ""
      )}\`** | \`src/components/ui/${c}\` | Framer Motion / Tailwind / Lucide |`
  )
  .join("\n")}

---

## 🌐 Các Trang & Routes Ứng Dụng (${routes.length} routes)
${routes.map((r) => `- \`/${r}\`: Module **${r.toUpperCase()}**`).join("\n")}
`;

fs.writeFileSync(componentRegistryFile, componentContent, "utf-8");
console.log("✅ Đã đồng bộ UI-Component-Registry.md thành công!");
