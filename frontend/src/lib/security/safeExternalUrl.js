export function safeExternalUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function safeInternalPath(value) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : undefined;
}
