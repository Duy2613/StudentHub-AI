export async function resolve(specifier, context, nextResolve) {
  // Next.js enforces this compile-time server boundary. Hermetic Node tests
  // have no Next compiler and cannot import the deliberately throwing marker.
  if (specifier === "server-only" && process.env.STUDENTHUB_HERMETIC_TEST_MODE === "1" && process.env.NODE_ENV === "test") {
    return { url: "data:text/javascript,export {};", shortCircuit: true };
  }
  if (specifier.startsWith(".")) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      if (error?.code !== "ERR_MODULE_NOT_FOUND" || /\.[a-z]+$/i.test(specifier)) throw error;
      for (const extension of [".ts", ".js", ".jsx"]) {
        try {
          return await nextResolve(`${specifier}${extension}`, context);
        } catch {
          // Try the next source extension.
        }
      }
      throw error;
    }
  }
  return nextResolve(specifier, context);
}
