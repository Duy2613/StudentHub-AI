import assert from "node:assert/strict";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(testDir, "..", "..");
const nextBin = join(frontendRoot, "node_modules", "next", "dist", "bin", "next");

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, output) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/demo/superflows`);
      if (response.status < 500) return;
    } catch {
      // Next is still compiling its first route.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Canonical API smoke server did not become ready.\n${output()}`);
}

test("canonical v1 APIs expose honest public contracts and fail closed for personal data", { timeout: 90_000 }, async () => {
  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const output = [];
  const server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: frontendRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", STUDENTHUB_PERSISTENCE_ADAPTER: "memory" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => output.push(chunk.toString()));
  server.stderr.on("data", (chunk) => output.push(chunk.toString()));

  try {
    await waitForServer(baseUrl, () => output.join(""));

    const publicCases = [
      ["/api/v1/community?topic=TOEIC_SUBMISSION_TIME", "community.v1"],
      ["/api/v1/experts", "experts.v1"],
      ["/api/v1/search?q=TOEIC", "search.v1"],
    ];
    for (const [path, contractVersion] of publicCases) {
      const response = await fetch(`${baseUrl}${path}`);
      const body = await response.json();
      assert.equal(response.status, 200, path);
      assert.equal(body.success, true, path);
      assert.equal(body.contractVersion, contractVersion, path);
    }

    const trustResponse = await fetch(`${baseUrl}/api/v1/trust`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "text", content: "Kiểm tra nội dung trước khi tin." }),
    });
    const trustBody = await trustResponse.json();
    assert.equal(trustResponse.status, 200);
    assert.equal(trustBody.contractVersion, "trust.v1");
    assert.equal(trustBody.demo, false);
    assert.ok(trustBody.data.layer1);

    for (const path of ["/api/v1/academic", "/api/v1/dashboard", "/api/v1/notifications"]) {
      const response = await fetch(`${baseUrl}${path}`);
      const body = await response.json();
      assert.equal(response.status, 401, path);
      assert.equal(body.error?.code, "UNAUTHORIZED", path);
    }
  } finally {
    server.kill();
  }
});
