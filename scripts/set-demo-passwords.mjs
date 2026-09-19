import "../frontend/src/lib/server/env/canonicalEnv.js";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const frontendRequire = createRequire(join(resolve(process.cwd(), "frontend"), "package.json"));
const { createClient } = frontendRequire("@supabase/supabase-js");

async function setDemoPasswords() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing supabase configuration");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const client = createClient(supabaseUrl, anonKey);

  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("List users failed");
    process.exit(1);
  }

  const demoAccounts = [
    "demo-user@gmail.com",
    "demo-expert@gmail.com",
    "demo-user1@gmail.com",
    "demo-user2@gmail.com",
    "demo-user3@gmail.com",
    "demo-expert1@gmail.com",
    "demo-expert2@gmail.com",
    "demo-expert3@gmail.com",
  ];

  // Standard deterministic test password for QA demo accounts
  const testPassword = process.env.DEMO_QA_PASSWORD || "StudentHubQA2026!";

  for (const email of demoAccounts) {
    const user = users.find((u) => u.email === email);
    if (!user) {
      console.warn("User not found:", email);
      continue;
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: testPassword,
      email_confirm: true,
    });
    if (updateError) {
      console.error("Failed to update password for:", email);
    } else {
      // Test signing in
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email,
        password: testPassword,
      });
      if (signInError || !signInData?.session) {
        console.error("Failed test signin for:", email);
      } else {
        console.log("Account ready and password verified:", email);
      }
    }
  }
}

setDemoPasswords().catch(console.error);
