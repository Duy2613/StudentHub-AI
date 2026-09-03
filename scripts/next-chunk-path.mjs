import { join, resolve, sep } from "node:path";

export function resolveNextChunkPath(frontendRoot, chunk) {
  const rawChunk = String(chunk ?? "");
  const segments = rawChunk.split(/[\\/]+/).filter(Boolean);

  if (
    segments.length === 0 ||
    rawChunk.startsWith("/") ||
    rawChunk.startsWith("\\") ||
    /^[A-Za-z]:/.test(rawChunk) ||
    segments.some((segment) => segment === "." || segment === ".." || /^[A-Za-z]:$/.test(segment))
  ) {
    throw new Error("Invalid Next.js chunk path: " + chunk);
  }

  const nextRoot = resolve(frontendRoot, ".next");
  const resolvedPath = resolve(join(nextRoot, ...segments));
  const nextRootPrefix = nextRoot.endsWith(sep) ? nextRoot : nextRoot + sep;

  if (resolvedPath !== nextRoot && !resolvedPath.startsWith(nextRootPrefix)) {
    throw new Error("Invalid Next.js chunk path: " + chunk);
  }

  return resolvedPath;
}
