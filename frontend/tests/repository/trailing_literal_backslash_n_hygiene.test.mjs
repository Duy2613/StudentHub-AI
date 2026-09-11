import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

test("tracked files do not end with a literal backslash-n corruption marker", () => {
  const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
    cwd: repositoryRoot,
    encoding: "buffer"
  }).toString("utf8").split("\0").filter(Boolean);
  const corruptFiles = trackedFiles.filter((relativePath) => {
    const bytes = readFileSync(join(repositoryRoot, relativePath));
    return bytes.length >= 2 && bytes.at(-2) === 0x5c && bytes.at(-1) === 0x6e;
  });
  assert.deepEqual(corruptFiles, []);
});
