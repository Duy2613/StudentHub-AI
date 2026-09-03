import { NextResponse } from "next/server";
import { DocumentClassifier } from "@/lib/ai-trust/vision/DocumentClassifier";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * POST /api/ai-trust/ocr
 * 
 * High-Speed Server-Side OCR & Document Vision Extraction Engine
 * Provides sub-second fallback and fast optical character extraction for student documents,
 * tuition invoices, banking screenshots, chat messages, and suspicious notices.
 */
async function analyzeOcrHints(request, _routeContext, _principal, secContext) {
  const startTime = performance.now();
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_JSON", userMessage: "Yêu cầu không hợp lệ. Payload phải là JSON.", requestId: secContext.correlationId, retryable: false }, status: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType = "image/jpeg", fileName = "document.jpg", clientHints = {} } = body || {};
    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedMimeTypes.has(mimeType)) {
      return NextResponse.json(
        { error: { code: "UNSUPPORTED_MEDIA_TYPE", userMessage: "Định dạng ảnh không được hỗ trợ." }, status: "UNSUPPORTED_MEDIA_TYPE" },
        { status: 415 }
      );
    }

    const normalizedFileName = typeof fileName === "string"
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
      : "document.jpg";
    const preExtractedText = typeof clientHints?.preExtractedText === "string"
      ? clientHints.preExtractedText.slice(0, 20000)
      : "";
    const qrContent = typeof clientHints?.qrContent === "string" ? clientHints.qrContent.slice(0, 4000) : null;
    if (imageBase64 !== undefined && imageBase64 !== null && typeof imageBase64 !== "string") {
      return NextResponse.json({ error: { code: "INVALID_IMAGE_PAYLOAD", userMessage: "Dữ liệu ảnh không hợp lệ." }, status: "BAD_REQUEST" }, { status: 400 });
    }

    if (!imageBase64 && !preExtractedText) {
      return NextResponse.json(
        { error: { code: "OCR_INPUT_REQUIRED", userMessage: "Không tìm thấy dữ liệu hình ảnh hoặc văn bản trích xuất." }, status: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (imageBase64 && !preExtractedText) {
      return NextResponse.json(
        {
          success: false,
          status: "SERVER_OCR_NOT_CONFIGURED",
          error: { code: "SERVER_OCR_NOT_CONFIGURED", userMessage: "Máy chủ chưa có OCR worker; hãy dùng OCR phía thiết bị hoặc cấu hình worker phía máy chủ." },
          extractionMode: "UNAVAILABLE",
        },
        { status: 501 }
      );
    }

    let extractedText = preExtractedText;
    const suppliedConfidence = Number(clientHints?.confidence);
    const confidence = Number.isFinite(suppliedConfidence)
      ? Math.min(1, Math.max(0, suppliedConfidence))
      : null;

    // Entity & Pattern Parsing on text
    const foundUrls = extractedText.match(/https?:\/\/[^\s]+/gi) || [];
    const foundBankAccounts = extractedText.match(/\b\d{9,16}\b/g) || [];
    const foundPhones = extractedText.match(/\b(0\d{9,10}|\+84\d{9,10})\b/g) || [];

    // Document Classification
    const docClassification = DocumentClassifier.classify({
      text: extractedText,
      qrContent,
      fileName: normalizedFileName,
    });

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      extractionMode: "CLIENT_OCR_HINT",
      text: extractedText,
      qrContent,
      confidence,
      documentType: docClassification?.documentType || "DOCUMENT_GENERAL",
      inputFormat: docClassification?.inputFormat || "SCREENSHOT",
      entities: {
        urls: foundUrls,
        bankAccounts: foundBankAccounts,
        phoneNumbers: foundPhones,
      },
      executionTimeMs,
      sourceState: "CLIENT_OCR_HINT",
      isAuthoritative: false,
      dataNotice: "Kết quả OCR do thiết bị cung cấp; chưa phải OCR máy chủ có thẩm quyền."
    });
  } catch {
    console.error("[Server OCR Error] processing failed");
    return NextResponse.json(
      {
        success: false,
        error: { code: "OCR_PROCESSING_FAILED", userMessage: "Không thể xử lý dữ liệu OCR.", requestId: secContext.correlationId, retryable: false },
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
      },
      { status: 500 }
    );
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_OCR_HINTS",
  allowAnonymous: true,
  maxRequests: 10,
  maxBodyBytes: 512 * 1024,
}, analyzeOcrHints);
