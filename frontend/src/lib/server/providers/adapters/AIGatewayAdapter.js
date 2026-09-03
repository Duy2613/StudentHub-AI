/**
 * StudentHub AI — AIGatewayAdapter
 * 
 * Binds AI synthesis & semantic analysis (Gemini / OpenAI / Groq) into ProviderGateway.
 * CRITICAL RULE: AI is advisory only. It cannot manufacture citations, override
 * deterministic hard blocks, or upgrade L5 assurance.
 */

export class AIGatewayAdapter {
  constructor({ name = "gemini-flash", underlyingProvider = null } = {}) {
    this.name = name;
    this.underlyingProvider = underlyingProvider;
  }

  async execute(payload, { signal, timeoutMs } = {}) {
    const prompt = payload.prompt || payload.text;
    if (!prompt) return { text: "", claims: [], tokensUsed: 0 };

    if (this.underlyingProvider?.generateText) {
      const raw = await this.underlyingProvider.generateText(prompt, { signal, timeoutMs });
      return {
        text: raw.text || "",
        claims: Array.isArray(raw.claims) ? raw.claims : [],
        tokensUsed: raw.tokensUsed || Math.ceil(prompt.length / 4),
        model: raw.model || this.name,
      };
    }

    return this.nativeFallback(payload);
  }

  async nativeFallback(payload) {
    return {
      text: "Phân tích ngữ nghĩa quy tắc bản địa (Deterministic Semantic Fallback)",
      claims: [],
      tokensUsed: 0,
      status: "DEGRADED",
      provider: "NATIVE_RULE_PARSER",
      reason: "AI provider unavailable; using native deterministic parsing",
    };
  }
}
