import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../../..");
const container = process.argv[2] || "studenthub-migration-assurance-20261001";
const database = process.argv[3] || "studenthub_fresh";

function docker(args, input) {
  const result = spawnSync("docker", args, {
    cwd: root,
    input,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || ("docker exit " + result.status)).trim());
  }
  return result.stdout;
}

const exists = spawnSync("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-tAc", "SELECT 1 FROM pg_database WHERE datname = '" + database + "'"], { encoding: "utf8" });
if (exists.status !== 0) throw new Error((exists.stderr || "could not query disposable postgres").trim());
if (exists.stdout.trim() === "1") throw new Error("Refusing to overwrite existing disposable database: " + database);

docker(["exec", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", "CREATE DATABASE " + database]);

const bootstrap = [
  "CREATE ROLE anon NOLOGIN;",
  "CREATE ROLE authenticated NOLOGIN;",
  "CREATE ROLE service_role NOLOGIN BYPASSRLS;",
  "CREATE SCHEMA auth;",
  "CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb);",
  "CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';",
  "CREATE SCHEMA storage;",
  "CREATE TABLE storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL DEFAULT false, file_size_limit bigint, allowed_mime_types text[]);",
  "CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text NOT NULL REFERENCES storage.buckets(id), name text NOT NULL);",
  "CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS 'SELECT string_to_array($1, ''/'')';",
].join("\n");

docker(["exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], bootstrap);

const migrationDir = path.join(root, "database", "migrations");
const files = fs.readdirSync(migrationDir).filter((file) => /^\d+.*\.sql$/.test(file)).sort();
console.log("POSTGRES_ENGINE=17.6 IMAGE=postgres:17.6 NETWORK=none MIGRATION_COUNT=" + files.length);

for (const file of files) {
  try {
    docker(
      ["exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-U", "postgres", "-d", database],
      fs.readFileSync(path.join(migrationDir, file)),
    );
    console.log("PASS " + file);
  } catch (error) {
    console.error("FAIL " + file + "\n" + error.message);
    process.exitCode = 1;
    break;
  }
}

if (!process.exitCode) console.log("FRESH_DB_MIGRATION_CHAIN=PASS");
