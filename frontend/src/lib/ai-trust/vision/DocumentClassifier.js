/**
 * StudentHub AI — DocumentClassifier
 *
 * P2 Document Intelligence: Classifies document type and input format
 * based on OCR text patterns, layout signals, and visual indicators.
 *
 * Two classification axes:
 *
 * 1. DOCUMENT TYPE — What is this document about?
 *    BANK_RECEIPT, BANK_STATEMENT, PAYMENT_RECEIPT, INVOICE, GOVERNMENT_NOTICE,
 *    ID_DOCUMENT, CHAT_SCREENSHOT, EMAIL_SCREENSHOT, SOCIAL_MEDIA_SCREENSHOT, etc.
 *
 * 2. INPUT FORMAT — What form is this content in?
 *    NATIVE_DOCUMENT, SCANNED_DOCUMENT, SCREENSHOT, PHOTO_OF_DOCUMENT,
 *    SCREENSHOT_OF_SCREEN, COMPOSITE_IMAGE
 *
 * WHY this matters for fraud detection:
 *   - A "bank receipt" screenshot can be fabricated in seconds
 *   - An "official government notice" as a PHOTO_OF_DOCUMENT warrants more scrutiny
 *     than the same content as a proper NATIVE_DOCUMENT
 *   - SCREENSHOT_OF_SCREENSHOT → degradation pipeline typical in scam campaigns
 *   - Document type tells the downstream forensics layer what to look for
 */

export const DOCUMENT_TYPES = {
  // Banking & Financial
  BANK_RECEIPT: "BANK_RECEIPT",
  BANK_STATEMENT: "BANK_STATEMENT",
  PAYMENT_RECEIPT: "PAYMENT_RECEIPT",
  PAYMENT_CONFIRMATION: "PAYMENT_CONFIRMATION",
  TRANSFER_CONFIRMATION: "TRANSFER_CONFIRMATION",
  INVOICE: "INVOICE",
  PROFIT_SCREENSHOT: "PROFIT_SCREENSHOT",     // Fake investment profit screenshots

  // Government & Legal
  GOVERNMENT_NOTICE: "GOVERNMENT_NOTICE",
  FINE_NOTICE: "FINE_NOTICE",
  COURT_DOCUMENT: "COURT_DOCUMENT",
  TAX_DOCUMENT: "TAX_DOCUMENT",
  LEGAL_DOCUMENT: "LEGAL_DOCUMENT",

  // Identity
  ID_DOCUMENT: "ID_DOCUMENT",               // CCCD, passport, driver license
  SELFIE_WITH_ID: "SELFIE_WITH_ID",

  // Employment & Business
  EMPLOYMENT_OFFER: "EMPLOYMENT_OFFER",
  EMPLOYMENT_CONTRACT: "EMPLOYMENT_CONTRACT",
  SALARY_SLIP: "SALARY_SLIP",

  // E-commerce & Delivery
  DELIVERY_DOCUMENT: "DELIVERY_DOCUMENT",
  ORDER_CONFIRMATION: "ORDER_CONFIRMATION",
  REFUND_DOCUMENT: "REFUND_DOCUMENT",

  // Communications
  CHAT_SCREENSHOT: "CHAT_SCREENSHOT",
  EMAIL_SCREENSHOT: "EMAIL_SCREENSHOT",
  SMS_SCREENSHOT: "SMS_SCREENSHOT",
  SOCIAL_MEDIA_SCREENSHOT: "SOCIAL_MEDIA_SCREENSHOT",
  WEBPAGE_SCREENSHOT: "WEBPAGE_SCREENSHOT",

  // Crypto / Investment
  CRYPTO_PORTFOLIO: "CRYPTO_PORTFOLIO",
  INVESTMENT_REPORT: "INVESTMENT_REPORT",
  WITHDRAWAL_BLOCK_NOTICE: "WITHDRAWAL_BLOCK_NOTICE",

  UNKNOWN: "UNKNOWN",
};

export const INPUT_FORMATS = {
  NATIVE_DOCUMENT: "NATIVE_DOCUMENT",         // PDF, Word, original digital file
  SCANNED_DOCUMENT: "SCANNED_DOCUMENT",       // Physical document scanned to PDF/image
  PHOTO_OF_DOCUMENT: "PHOTO_OF_DOCUMENT",     // Photo of physical document (with depth)
  SCREENSHOT: "SCREENSHOT",                   // Screen capture of digital content
  SCREENSHOT_OF_SCREEN: "SCREENSHOT_OF_SCREEN", // Photo of a screen showing content
  COMPOSITE_IMAGE: "COMPOSITE_IMAGE",         // Multiple elements combined
  UNKNOWN: "UNKNOWN",
};

// ─── Document Type Classifiers ─────────────────────────────────────────────────

const DOC_TYPE_PATTERNS = [
  {
    type: DOCUMENT_TYPES.BANK_RECEIPT,
    weight: 1.0,
    patterns: [
      /biên\s+lai\s+(giao\s+dịch|chuyển\s+tiền)|transaction\s+receipt/gi,
      /số\s+tài\s+khoản\s+thụ\s+hưởng|beneficiary\s+account/gi,
      /ngân\s+hàng\s+(vietcombank|techcombank|mbbank|vpbank|bidv|agribank)/gi,
      /giao\s+dịch\s+thành\s+công|transaction\s+successful/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.BANK_STATEMENT,
    weight: 1.0,
    patterns: [
      /sao\s+kê\s+tài\s+khoản|account\s+statement/gi,
      /số\s+dư\s+cuối\s+kỳ|closing\s+balance/gi,
      /lịch\s+sử\s+giao\s+dịch|transaction\s+history/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.PAYMENT_CONFIRMATION,
    weight: 0.9,
    patterns: [
      /xác\s+nhận\s+thanh\s+toán|payment\s+confirmed/gi,
      /đã\s+thanh\s+toán\s+thành\s+công/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.GOVERNMENT_NOTICE,
    weight: 1.0,
    patterns: [
      /bộ\s+(công\s+an|tài\s+chính|tư\s+pháp)|ủy\s+ban\s+nhân\s+dân/gi,
      /thông\s+báo\s+(chính\s+thức|khẩn)|quyết\s+định\s+số/gi,
      /cộng\s+hòa\s+xã\s+hội\s+chủ\s+nghĩa\s+việt\s+nam/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.FINE_NOTICE,
    weight: 0.95,
    patterns: [
      /quyết\s+định\s+xử\s+phạt|biên\s+bản\s+vi\s+phạm/gi,
      /tiền\s+phạt|nộp\s+phạt\s+trong\s+vòng/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.ID_DOCUMENT,
    weight: 1.0,
    patterns: [
      /căn\s+cước\s+công\s+dân|chứng\s+minh\s+nhân\s+dân/gi,
      /citizen\s+identification|national\s+id/gi,
      /hộ\s+chiếu|passport|ngày\s+sinh|date\s+of\s+birth/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.INVOICE,
    weight: 1.0,
    patterns: [
      /hóa\s+đơn\s+(tài\s+chính|điện\s+tử|giá\s+trị\s+gia\s+tăng)/gi,
      /invoice\s+number|inv\s*#|vat\s+invoice/gi,
      /mã\s+số\s+thuế|tax\s+code/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.EMPLOYMENT_OFFER,
    weight: 0.9,
    patterns: [
      /thư\s+mời\s+nhận\s+việc|offer\s+letter/gi,
      /chúc\s+mừng\s+bạn\s+đã\s+được\s+tuyển\s+chọn/gi,
      /congratulations.*you\s+have\s+been\s+selected/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.PROFIT_SCREENSHOT,
    weight: 0.85,
    patterns: [
      /lợi\s+nhuận\s+hôm\s+nay|today['']s\s+profit/gi,
      /tổng\s+thu\s+nhập|total\s+earnings/gi,
      /rút\s+tiền\s+về\s+tài\s+khoản|withdraw\s+to\s+bank/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.WITHDRAWAL_BLOCK_NOTICE,
    weight: 0.95,
    patterns: [
      /tài\s+khoản\s+(đang\s+bị\s+tạm\s+khóa|bị\s+đóng\s+băng)/gi,
      /để\s+rút\s+tiền\s+cần\s+nộp\s+phí/gi,
      /account\s+(frozen|locked)\s+.*\s+(fee|tax)\s+required/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.CHAT_SCREENSHOT,
    weight: 0.8,
    patterns: [
      /zalo|messenger|telegram|whatsapp|chat\s+conversation/gi,
      /hôm\s+qua\s+lúc|yesterday\s+at\s+\d+:\d+/gi,
    ],
  },
  {
    type: DOCUMENT_TYPES.DELIVERY_DOCUMENT,
    weight: 0.9,
    patterns: [
      /mã\s+vận\s+đơn|tracking\s+number|shipment\s+id/gi,
      /đơn\s+hàng\s+đang\s+(giao|vận\s+chuyển)|your\s+order\s+is\s+(shipped|out\s+for\s+delivery)/gi,
      /giao\s+hàng\s+tiết\s+kiệm|j&t|ghtk|vnpost|viettelpost/gi,
    ],
  },
];

// ─── Input Format Signals ─────────────────────────────────────────────────────

const FORMAT_SIGNALS = {
  // Signals suggesting it's a screenshot (clean UI elements, no paper texture)
  SCREENSHOT_INDICATORS: [
    /\d{1,2}:\d{2}\s*(am|pm)?/i,    // Status bar time
    /wifi|lte|4g|5g/i,               // Signal indicators in status bar
    /battery\s+\d+%/i,
  ],

  // Signals suggesting photo of physical document (uneven lighting, perspective)
  PHOTO_INDICATORS: [
    /scanned?\s+(by|with|using)/i,
    /printed\s+on/i,
  ],
};

export class DocumentClassifier {
  /**
   * Classifies document type and input format from OCR text.
   *
   * @param {object} params
   * @param {string} params.ocrText - Full OCR extracted text
   * @param {number} [params.ocrConfidence] - OCR confidence score [0-1]
   * @param {Array<object>} [params.ocrBlocks] - Structured OCR blocks if available
   * @param {string} [params.mimeType] - File MIME type if available
   * @param {number[]} [params.magicBytes] - File magic bytes
   * @returns {{
   *   documentType: string,
   *   documentTypeConfidence: number,
   *   inputFormat: string,
   *   inputFormatConfidence: number,
   *   allCandidates: Array<object>,
   *   forensicFlags: string[]
   * }}
   */
  static classify({ ocrText = "", ocrConfidence = 0.8, ocrBlocks = [], mimeType = null, magicBytes = [] }) {
    const forensicFlags = [];

    // ── Document Type Classification ──────────────────────────────────────────
    const candidates = [];

    for (const { type, weight, patterns } of DOC_TYPE_PATTERNS) {
      let matchScore = 0;
      const matchedPatterns = [];

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(ocrText);
        if (match) {
          matchScore += weight;
          matchedPatterns.push(match[0].slice(0, 80));
        }
      }

      if (matchScore > 0) {
        candidates.push({
          type,
          score: matchScore,
          confidence: Math.min(0.50 + matchScore * 0.25, 0.95),
          matchedPatterns,
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const primaryType = candidates[0]?.type || DOCUMENT_TYPES.UNKNOWN;
    const typeConfidence = candidates[0]?.confidence || 0.20;

    // ── Input Format Classification ────────────────────────────────────────────
    let inputFormat = INPUT_FORMATS.UNKNOWN;
    let formatConfidence = 0.40;

    if (mimeType === "application/pdf") {
      inputFormat = INPUT_FORMATS.NATIVE_DOCUMENT;
      formatConfidence = 0.85;
    } else if (mimeType?.startsWith("image/")) {
      // Check OCR text for screenshot indicators
      const hasScreenshotSignals = FORMAT_SIGNALS.SCREENSHOT_INDICATORS.some((p) => p.test(ocrText));
      const hasPhotoSignals = FORMAT_SIGNALS.PHOTO_INDICATORS.some((p) => p.test(ocrText));

      if (hasScreenshotSignals) {
        inputFormat = INPUT_FORMATS.SCREENSHOT;
        formatConfidence = 0.72;
      } else if (hasPhotoSignals) {
        inputFormat = INPUT_FORMATS.PHOTO_OF_DOCUMENT;
        formatConfidence = 0.65;
      } else if (ocrConfidence < 0.50) {
        // Low OCR confidence on image → likely photo of screen/document
        inputFormat = INPUT_FORMATS.SCREENSHOT_OF_SCREEN;
        formatConfidence = 0.55;
        forensicFlags.push("LOW_OCR_CONFIDENCE_ON_IMAGE");
      } else {
        inputFormat = INPUT_FORMATS.SCREENSHOT;
        formatConfidence = 0.60;
      }
    }

    // ── Forensic Flags ────────────────────────────────────────────────────────

    // Flag high-risk document types
    const highRiskDocumentTypes = [
      DOCUMENT_TYPES.PROFIT_SCREENSHOT,
      DOCUMENT_TYPES.WITHDRAWAL_BLOCK_NOTICE,
      DOCUMENT_TYPES.FINE_NOTICE,
    ];
    if (highRiskDocumentTypes.includes(primaryType)) {
      forensicFlags.push("HIGH_RISK_DOCUMENT_TYPE");
    }

    // Flag screenshot of financial document (easy to fabricate)
    if (inputFormat === INPUT_FORMATS.SCREENSHOT &&
        [DOCUMENT_TYPES.BANK_RECEIPT, DOCUMENT_TYPES.PAYMENT_CONFIRMATION, DOCUMENT_TYPES.PROFIT_SCREENSHOT].includes(primaryType)) {
      forensicFlags.push("SCREENSHOT_FINANCIAL_DOCUMENT_FABRICATION_RISK");
    }

    // Flag government document as screenshot (suspicious)
    if (inputFormat === INPUT_FORMATS.SCREENSHOT &&
        [DOCUMENT_TYPES.GOVERNMENT_NOTICE, DOCUMENT_TYPES.COURT_DOCUMENT, DOCUMENT_TYPES.FINE_NOTICE].includes(primaryType)) {
      forensicFlags.push("GOVERNMENT_DOCUMENT_AS_SCREENSHOT");
    }

    return {
      documentType: primaryType,
      documentTypeConfidence: Number(typeConfidence.toFixed(2)),
      inputFormat,
      inputFormatConfidence: Number(formatConfidence.toFixed(2)),
      allCandidates: candidates.slice(0, 3), // Top 3 candidates
      forensicFlags,
    };
  }
}
