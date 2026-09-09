import fs from "fs";
const content = fs.readFileSync("frontend/.env.local", "utf8");
const lines = content.split(/\r?\n/);
let caStr = "";
for (const l of lines) {
  if (l.startsWith("DATABASE_SSL_CA=")) {
    caStr = l.slice("DATABASE_SSL_CA=".length).trim();
  }
}
console.log("caStr length:", caStr.length);
console.log("caStr has BEGIN:", caStr.includes("BEGIN CERTIFICATE"));
console.log("caStr has literal backslash-n:", caStr.includes("\\n"));
console.log("caStr starts with quote:", caStr.startsWith('"') || caStr.startsWith("'"));

// Also check Supabase SDK package export
try {
  const supabasePkg = JSON.parse(fs.readFileSync("frontend/node_modules/@supabase/supabase-js/package.json", "utf8"));
  console.log("Supabase exports:", supabasePkg.main, supabasePkg.module, supabasePkg.exports);
} catch (e) {
  console.log("Supabase pkg err:", e.message);
}
