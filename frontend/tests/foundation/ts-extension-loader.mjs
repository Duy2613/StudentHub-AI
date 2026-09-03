export async function resolve(specifier, context, nextResolve) {
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
