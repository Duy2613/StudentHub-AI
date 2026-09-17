import { createRequire } from "node:module";
import { resolve, join } from "node:path";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const req = createRequire(join(frontendDir, "package.json"));
const { loadEnvConfig } = req("@next/env");
loadEnvConfig(frontendDir);

const pg = req("pg");
const { Pool } = pg;

const caRaw = process.env.DATABASE_SSL_CA;
const ca = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, ...(ca ? { ca } : {}) },
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Get demo users
    const usersRes = await client.query(`
      SELECT id, email, role 
      FROM auth.users 
      WHERE email IN ('demo-user@gmail.com', 'demo-expert@gmail.com')
      ORDER BY email;
    `);

    console.log("Found demo users in database:", usersRes.rows.map(u => ({ email: u.email, id: u.id })));

    let demoUser = usersRes.rows.find(u => u.email === "demo-user@gmail.com");
    let demoExpert = usersRes.rows.find(u => u.email === "demo-expert@gmail.com");

    if (!demoUser || !demoExpert) {
      throw new Error("Demo user or Demo expert not found in auth.users");
    }

    const demoUserId = demoUser.id;
    const demoExpertId = demoExpert.id;

    // Helper to run query as authenticated user
    async function asUser(userId, callback) {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL ROLE authenticated");
        await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId]);
        const res = await callback();
        await client.query("COMMIT");
        return res;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("\n--- Testing RLS for Demo User ---");

    // Clean up any prior test timetables for demo-user
    await client.query("DELETE FROM public.user_timetables WHERE user_id = $1 AND name = 'QA Controlled Timetable'", [demoUserId]);

    // Create controlled timetable as demo-user
    let timetableId = null;
    await asUser(demoUserId, async () => {
      const insertRes = await client.query(`
        INSERT INTO public.user_timetables (user_id, name, academic_term, source_type, status, is_active)
        VALUES ($1, 'QA Controlled Timetable', 'Học kỳ 1 2026-2027', 'MANUAL', 'ACTIVE', true)
        RETURNING id, name, academic_term, source_type, status, is_active, user_id;
      `, [demoUserId]);
      timetableId = insertRes.rows[0].id;
      console.log("Demo user successfully created timetable:", insertRes.rows[0].id);

      // Add entries
      await client.query(`
        INSERT INTO public.timetable_entries (timetable_id, user_id, course_name, course_code, day_of_week, start_time, end_time, room)
        VALUES 
          ($1, $2, 'Trí tuệ nhân tạo', 'AI301', 2, '07:30', '11:00', 'A1-302'),
          ($1, $2, 'Hệ phân tán', 'DS401', 4, '13:00', '16:30', 'B2-204');
      `, [timetableId, demoUserId]);
      console.log("Demo user inserted 2 entries.");
    });

    // Verify demo-user can read own timetable
    let demoUserReadCount = 0;
    await asUser(demoUserId, async () => {
      const readRes = await client.query(`
        SELECT t.id, t.name, t.source_type, t.status, t.is_active, count(e.id) as entry_count
        FROM public.user_timetables t
        LEFT JOIN public.timetable_entries e ON e.timetable_id = t.id
        WHERE t.id = $1
        GROUP BY t.id;
      `, [timetableId]);
      demoUserReadCount = readRes.rows.length;
      console.log("Demo user reading own timetable result:", readRes.rows[0]);
    });

    if (demoUserReadCount !== 1) {
      throw new Error("Demo user could not read own timetable under RLS!");
    }

    console.log("\n--- Testing RLS Cross-User Isolation (Demo Expert -> Demo User Timetable) ---");

    // Now test demo-expert attempting to access demo-user's timetable
    let expertReadCount = 0;
    let expertInsertDenied = false;
    let expertUpdateDenied = false;
    let expertDeleteDenied = false;

    await asUser(demoExpertId, async () => {
      // 1. SELECT by id
      const expertReadRes = await client.query(`
        SELECT * FROM public.user_timetables WHERE id = $1;
      `, [timetableId]);
      expertReadCount = expertReadRes.rows.length;

      // 2. SELECT entries
      const expertEntriesRes = await client.query(`
        SELECT * FROM public.timetable_entries WHERE timetable_id = $1;
      `, [timetableId]);
      console.log("Expert entries read count (expected 0):", expertEntriesRes.rows.length);

      // 3. UPDATE demo-user timetable
      const updateRes = await client.query(`
        UPDATE public.user_timetables SET name = 'HACKED' WHERE id = $1 RETURNING id;
      `, [timetableId]);
      expertUpdateDenied = updateRes.rows.length === 0;

      // 4. DELETE demo-user timetable
      const deleteRes = await client.query(`
        DELETE FROM public.user_timetables WHERE id = $1 RETURNING id;
      `, [timetableId]);
      expertDeleteDenied = deleteRes.rows.length === 0;

      // 5. INSERT entry into demo-user timetable
      try {
        await client.query(`
          INSERT INTO public.timetable_entries (timetable_id, user_id, course_name, day_of_week)
          VALUES ($1, $2, 'Malicious Injection', 1);
        `, [timetableId, demoExpertId]);
      } catch (err) {
        // FK or RLS policy violation
        expertInsertDenied = true;
      }
    });

    console.log("\nRLS Isolation Verification Results:");
    console.log("- Expert read demo-user timetable rows:", expertReadCount, "(must be 0)");
    console.log("- Expert update denied:", expertUpdateDenied);
    console.log("- Expert delete denied:", expertDeleteDenied);
    console.log("- Expert insert denied:", expertInsertDenied);

    const crossUserDenied = (expertReadCount === 0 && expertUpdateDenied && expertDeleteDenied && expertInsertDenied);
    console.log("CROSS_USER_TIMETABLE_ACCESS:", crossUserDenied ? "DENIED" : "FAIL");

    // Fetch final controlled QA timetable proof
    const finalProofRes = await client.query(`
      SELECT t.id as timetable_id, count(e.id) as entry_count, t.source_type, t.status, t.is_active, t.user_id
      FROM public.user_timetables t
      JOIN public.timetable_entries e ON e.timetable_id = t.id
      WHERE t.id = $1
      GROUP BY t.id;
    `, [timetableId]);

    const proof = finalProofRes.rows[0];
    console.log("\n==================================================");
    console.log("DATABASE PROOF:");
    console.log("TIMETABLE_ID:", proof.timetable_id);
    console.log("ENTRY_COUNT:", proof.entry_count);
    console.log("SOURCE_TYPE:", proof.source_type);
    console.log("STATUS:", proof.status);
    console.log("IS_ACTIVE:", proof.is_active);
    console.log("USER_ID_MATCHES_DEMO_USER:", proof.user_id === demoUserId);
    console.log("==================================================");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
