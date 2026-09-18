/**
 * StudentHub AI — ImageAdvisoryService (Multimodal AI Advisory)
 * 
 * Invokes Owner AIGatewayService with canonical MULTIMODAL capability:
 * - Provides visual context & artifact scene description
 * - Interprets semantic meaning of visible OCR text and document structure
 * - Explains detector disagreements or ambiguities in human terms
 * 
 * STRICT INVARIANT:
 * - Gemini is NOT primary authenticity detection authority.
 * - Gemini findings are explicitly labeled ADVISORY.
 * - Gemini MUST NOT invent forensic probability scores (e.g. "95% deepfake").
 * - Returns structured advisory insights only.
 */

import { AIGatewayService, AI_CAPABILITY } from "../../../ai-gateway/index.js";

const ADVISORY_SYSTEM_PROMPT = `Bạn là Chuyên gia Tư vấn Bối cảnh Hình ảnh (Image Context & Visual Advisory Reviewer) thuộc Hệ thống AI Trust của StudentHub AI.
Vai trò của bạn:
1. Mô tả khách quan nội dung thị giác nhìn thấy trong hình ảnh (loại tài liệu, đối tượng, bố cục, logo).
2. Diễn giải ý nghĩa ngữ cảnh của các đoạn văn bản hoặc thông báo xuất hiện trong ảnh.
3. Cung cấp góc nhìn bổ trợ khách quan nếu có mâu thuẫn giữa các chỉ số kỹ thuật.

QUY TẮC BẮT BUỘC:
- Bạn KHÔNG PHẢI là detector thẩm định tính thật/giả hay deepfake.
- TUYỆT ĐỐI KHÔNG tự tạo hoặc phán đoán các chỉ số xác suất deepfake hay xác suất ảnh giả (ví dụ: không được ghi "95% deepfake").
- Tất cả nhận định của bạn chỉ mang tính chất THAM VẤN BỐI CẢNH (ADVISORY), không thay thế các detector chuyên dụng hay chính sách deterministic.`;

const ADVISORY_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    visualContext: {
      type: "string",
      description: "Mô tả khách quan nội dung thị giác nhìn thấy (loại văn bản, đối tượng, hình chụp, ảnh chụp màn hình, v.v.).",
    },
    ocrInterpretation: {
      type: "string",
      description: "Ý nghĩa thực tế của các thông tin chữ nhìn thấy (thông báo tuyển sinh, biên lai học phí, lịch thi, v.v.).",
    },
    semanticExplanation: {
      type: "string",
      description: "Giải thích ngắn gọn ngữ cảnh đời sống sinh viên của tài liệu/ảnh.",
    },
    sceneElements: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách các phần tử thị giác chính trong ảnh.",
    },
    observedAnomalies: {
      type: "array",
      items: { type: "string" },
      description: "Các điểm bất thường về mặt thị giác nhìn thấy bằng mắt thường (font chữ lệch, vùng nhòe bất thường, bố cục cắt ghép rõ).",
    },
  },
  required: ["visualContext", "ocrInterpretation", "semanticExplanation"],
  additionalProperties: false,
};

export class ImageAdvisoryService {
  constructor({ gateway = AIGatewayService } = {}) {
    this.gateway = gateway;
  }

  /**
   * Generates advisory contextual review for an image.
   * 
   * @param {object} params
   * @param {Buffer|Uint8Array} params.bytes
   * @param {string} [params.mimeType="image/jpeg"]
   * @param {string} [params.ocrText=""]
   * @param {string} [params.requestId="adv-img"]
   * @returns {Promise<object>} { status, advisory, durationMs, modelUsed, warnings }
   */
  async advise({
    bytes,
    mimeType = "image/jpeg",
    ocrText = "",
    requestId = "adv-img",
  }) {
    if (!bytes || bytes.length === 0) {
      return {
        status: "NOT_RUN",
        advisory: null,
        durationMs: 0,
        modelUsed: null,
        warnings: ["Thiếu dữ liệu tệp ảnh."],
      };
    }

    const start = Date.now();
    try {
      const inputParts = [
        {
          type: "image",
          mime_type: mimeType,
          data: Buffer.from(bytes).toString("base64"),
        },
      ];

      const userPrompt = `Hãy cung cấp bản tham vấn bối cảnh cho hình ảnh này.${ocrText ? ` Văn bản OCR đã bóc tách: "${ocrText.slice(0, 1000)}".` : ""}`;

      const result = await this.gateway.generateStructured({
        capability: AI_CAPABILITY.MULTIMODAL,
        systemPrompt: ADVISORY_SYSTEM_PROMPT,
        userPrompt,
        inputParts,
        responseSchema: ADVISORY_RESPONSE_SCHEMA,
        validate: (value) => Boolean(value && typeof value.visualContext === "string"),
        options: {
          requestId,
          perModelTimeoutMs: 5000,
          totalBudgetMs: 12000,
          maxOutputTokens: 2000,
          responseSchema: ADVISORY_RESPONSE_SCHEMA,
        },
      });

      const durationMs = Date.now() - start;

      if (!result?.ok || !result.json) {
        return {
          status: "UNAVAILABLE",
          advisory: {
            role: "ADVISORY",
            visualContext: "Dịch vụ tham vấn bối cảnh tạm thời chưa phản hồi.",
            ocrInterpretation: ocrText ? "Văn bản đã bóc tách sẵn có." : "Không có văn bản OCR.",
            semanticExplanation: "Chưa thể diễn giải bối cảnh.",
            sceneElements: [],
            observedAnomalies: [],
          },
          durationMs,
          modelUsed: result?.executedModel || null,
          warnings: ["Gemini multimodal advisory không phản hồi hoặc đã hết quota."],
        };
      }

      return {
        status: "COMPLETED",
        advisory: {
          role: "ADVISORY",
          visualContext: String(result.json.visualContext || "").slice(0, 1000),
          ocrInterpretation: String(result.json.ocrInterpretation || "").slice(0, 1000),
          semanticExplanation: String(result.json.semanticExplanation || "").slice(0, 1000),
          sceneElements: Array.isArray(result.json.sceneElements) ? result.json.sceneElements.slice(0, 10) : [],
          observedAnomalies: Array.isArray(result.json.observedAnomalies) ? result.json.observedAnomalies.slice(0, 10) : [],
        },
        durationMs,
        modelUsed: result.executedModel || result.model || "gemini_multimodal",
        warnings: [],
      };
    } catch {
      return {
        status: "FAILED",
        advisory: null,
        durationMs: Date.now() - start,
        modelUsed: null,
        warnings: ["Lỗi trong quá trình gọi Gemini multimodal advisory."],
      };
    }
  }
}
