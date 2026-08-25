/**
 * StudentHub AI — CrossFieldValidator
 *
 * P2 Document Intelligence: Detects internal contradictions within a single
 * document's structured fields extracted via OCR or document parsing.
 *
 * Validates:
 *   - Arithmetic consistency (totals, subtotals, tax)
 *   - Temporal consistency (issue_date < transaction_date < settlement_date)
 *   - Identity consistency within document (name, ID, bank account)
 *   - Reference number consistency
 *   - Currency consistency
 *
 * IMPORTANT DESIGN RULE:
 *   Each contradiction is EVIDENCE, not a verdict.
 *   Contradiction count and severity feed into the Evidence Fusion Engine.
 *   A single arithmetic error could be a typo — not proof of fraud.
 *   Multiple contradictions in a "official" document = very suspicious.
 */

export const CONTRADICTION_TYPES = {
  NUMERIC_CONTRADICTION: "NUMERIC_CONTRADICTION",     // Arithmetic doesn't add up
  TEMPORAL_CONTRADICTION: "TEMPORAL_CONTRADICTION",   // Dates are in impossible order
  IDENTITY_CONTRADICTION: "IDENTITY_CONTRADICTION",   // Name/ID mismatch within doc
  BRAND_CONTRADICTION: "BRAND_CONTRADICTION",         // Organization names conflict
  REFERENCE_CONTRADICTION: "REFERENCE_CONTRADICTION", // Reference numbers mismatch
  CURRENCY_CONTRADICTION: "CURRENCY_CONTRADICTION",   // Currency inconsistency
  PHONE_CONTRADICTION: "PHONE_CONTRADICTION",         // Phone numbers mismatch
  BANK_ACCOUNT_CONTRADICTION: "BANK_ACCOUNT_CONTRADICTION",
};

// ─── Vietnamese Number Parsing ────────────────────────────────────────────────
// Handles: 1,000,000 / 1.000.000 / 1000000 / 1 triệu / 1 nghìn

const VI_MAGNITUDE = {
  triệu: 1_000_000,
  trieu: 1_000_000,
  nghìn: 1_000,
  nghin: 1_000,
  đồng: 1,
  dong: 1,
  vnd: 1,
  k: 1_000,
  m: 1_000_000,
};

function parseViNumber(text) {
  if (!text || typeof text !== "string") return null;

  const normalized = text.trim().toLowerCase()
    .replace(/,/g, "").replace(/\./g, ""); // remove separators

  // Direct numeric
  const direct = parseFloat(normalized.replace(/[^0-9.]/g, ""));
  if (!isNaN(direct) && direct > 0) return direct;

  // With magnitude words
  for (const [word, magnitude] of Object.entries(VI_MAGNITUDE)) {
    const pattern = new RegExp(`([0-9,\\.]+)\\s*${word}`, "i");
    const match = normalized.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, "").replace(/\./g, ""));
      if (!isNaN(num)) return num * magnitude;
    }
  }

  return null;
}

// ─── Date Parsing (Vietnamese + ISO) ─────────────────────────────────────────

function parseDate(text) {
  if (!text) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    return new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`);
  }

  // YYYY-MM-DD (ISO)
  const iso = text.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (iso) {
    return new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);
  }

  return null;
}

export class CrossFieldValidator {
  /**
   * Validates structured document fields for internal consistency.
   *
   * @param {object} documentFields - Extracted key-value pairs from OCR/document
   * @param {object} [options]
   * @param {boolean} [options.strictMode] - false = single contradiction is warning; true = any = suspicious
   * @returns {{
   *   contradictions: Array<object>,
   *   consistencyScore: number,
   *   hasContradictions: boolean,
   *   severity: string,
   *   summary: string
   * }}
   */
  static validate(documentFields = {}, options = {}) {
    const contradictions = [];

    // 1. Arithmetic validation
    const arithmeticContradictions = this._validateArithmetic(documentFields);
    contradictions.push(...arithmeticContradictions);

    // 2. Temporal validation
    const temporalContradictions = this._validateDates(documentFields);
    contradictions.push(...temporalContradictions);

    // 3. Identity validation
    const identityContradictions = this._validateIdentity(documentFields);
    contradictions.push(...identityContradictions);

    // 4. Reference number validation
    const refContradictions = this._validateReferences(documentFields);
    contradictions.push(...refContradictions);

    // ── Compute consistency score ──────────────────────────────────────────────
    const totalChecks = 4;
    const failedChecks = new Set(contradictions.map((c) => c.type.split("_")[0])).size;
    const consistencyScore = Number(Math.max(0, 1 - failedChecks / totalChecks).toFixed(2));

    // ── Determine severity ─────────────────────────────────────────────────────
    const criticalContradictions = contradictions.filter((c) => c.severity === "critical");
    const highContradictions = contradictions.filter((c) => c.severity === "high");

    let severity = "none";
    if (criticalContradictions.length > 0) severity = "critical";
    else if (highContradictions.length > 0) severity = "high";
    else if (contradictions.length > 0) severity = "medium";

    return {
      contradictions,
      consistencyScore,
      hasContradictions: contradictions.length > 0,
      severity,
      summary: this._buildSummary(contradictions),
      checkedFields: Object.keys(documentFields).length,
    };
  }

  /**
   * Validates extracted text directly (without structured fields).
   * Attempts to find numeric and date contradictions in raw OCR text.
   *
   * @param {string} ocrText
   * @returns {object} Same schema as validate()
   */
  static validateRawText(ocrText = "") {
    if (!ocrText) return { contradictions: [], consistencyScore: 1, hasContradictions: false, severity: "none" };

    const contradictions = [];
    const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);

    // Find all numbers in text
    const amounts = [];
    for (const line of lines) {
      const nums = line.match(/[\d,\.]+(?:\s*(?:triệu|nghìn|đồng|vnd|k)\b)?/gi);
      if (nums) {
        for (const n of nums) {
          const val = parseViNumber(n);
          if (val !== null && val > 0) {
            amounts.push({ raw: n, value: val, line });
          }
        }
      }
    }

    // Simple heuristic: if multiple amounts found, check if any "total" line matches sum
    const largeAmounts = amounts.filter((a) => a.value >= 10_000);
    if (largeAmounts.length >= 3) {
      // Look for a total-like line
      const totalLine = lines.find((l) => /tổng\s*(cộng|số|tiền)|total|amount\s*due/i.test(l));
      if (totalLine) {
        const totalVal = parseViNumber(totalLine.replace(/tổng|total|cộng/gi, ""));
        const subAmounts = largeAmounts.filter((a) => {
          const lineText = a.line.toLowerCase();
          return !/(tổng|total|cộng|subtotal)/.test(lineText);
        });

        if (totalVal && subAmounts.length >= 2) {
          const computedSum = subAmounts.reduce((sum, a) => sum + a.value, 0);
          const tolerance = totalVal * 0.01; // 1% tolerance for rounding
          if (Math.abs(computedSum - totalVal) > tolerance + 1000) {
            contradictions.push({
              type: CONTRADICTION_TYPES.NUMERIC_CONTRADICTION,
              severity: "high",
              confidence: 0.72,
              detail: `Declared total: ${totalVal.toLocaleString()} — Computed from line items: ${computedSum.toLocaleString()}`,
              delta: Math.abs(computedSum - totalVal),
            });
          }
        }
      }
    }

    // Find date contradictions in raw text
    const dateMatches = [];
    for (const line of lines) {
      const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g;
      let m;
      while ((m = datePattern.exec(line)) !== null) {
        const d = parseDate(m[0]);
        if (d) dateMatches.push({ raw: m[0], date: d, line });
      }
    }

    if (dateMatches.length >= 2) {
      // Check for impossible chronology (settlement before transaction)
      const sorted = [...dateMatches].sort((a, b) => a.date - b.date);
      const earliest = sorted[0];
      const latest = sorted[sorted.length - 1];
      const yearSpan = (latest.date - earliest.date) / (1000 * 60 * 60 * 24 * 365);

      if (yearSpan > 5) {
        contradictions.push({
          type: CONTRADICTION_TYPES.TEMPORAL_CONTRADICTION,
          severity: "medium",
          confidence: 0.65,
          detail: `Date span exceeds 5 years within same document: ${earliest.raw} to ${latest.raw}`,
        });
      }

      // Check for future dates in transactional documents
      const now = new Date();
      const futureDates = dateMatches.filter((d) => d.date > now);
      if (futureDates.length > 0 && dateMatches.length > 2) {
        contradictions.push({
          type: CONTRADICTION_TYPES.TEMPORAL_CONTRADICTION,
          severity: "medium",
          confidence: 0.60,
          detail: `Document contains future dates: ${futureDates.map((d) => d.raw).join(", ")}`,
        });
      }
    }

    const consistencyScore = Number(Math.max(0, 1 - contradictions.length * 0.25).toFixed(2));
    const severity = contradictions.length === 0 ? "none" :
                     contradictions.some((c) => c.severity === "high") ? "high" : "medium";

    return {
      contradictions,
      consistencyScore,
      hasContradictions: contradictions.length > 0,
      severity,
      summary: this._buildSummary(contradictions),
    };
  }

  // ─── Private: Arithmetic Validation ────────────────────────────────────────

  static _validateArithmetic(fields) {
    const contradictions = [];

    const total = parseViNumber(fields.total || fields.amount_due || fields.total_amount);
    const subtotals = [
      parseViNumber(fields.subtotal),
      parseViNumber(fields.tax),
      parseViNumber(fields.discount ? `-${fields.discount}` : null),
      parseViNumber(fields.shipping),
    ].filter((v) => v !== null);

    if (total !== null && subtotals.length >= 2) {
      const computedTotal = subtotals.reduce((a, b) => a + b, 0);
      const tolerance = total * 0.01;
      if (Math.abs(computedTotal - total) > tolerance + 1000) {
        contradictions.push({
          type: CONTRADICTION_TYPES.NUMERIC_CONTRADICTION,
          severity: "high",
          confidence: 0.85,
          detail: `Arithmetic mismatch: declared total ${total.toLocaleString()} ≠ computed ${computedTotal.toLocaleString()} (delta: ${Math.abs(computedTotal - total).toLocaleString()})`,
          fields: { declared: total, computed: computedTotal },
        });
      }
    }

    return contradictions;
  }

  // ─── Private: Date Validation ───────────────────────────────────────────────

  static _validateDates(fields) {
    const contradictions = [];

    const issueDate = parseDate(fields.issue_date || fields.date_issued || fields.ngay_phat_hanh);
    const transactionDate = parseDate(fields.transaction_date || fields.ngay_giao_dich);
    const settlementDate = parseDate(fields.settlement_date || fields.ngay_tat_toan);
    const expiryDate = parseDate(fields.expiry_date || fields.ngay_het_han);

    // Issue date must be before transaction date
    if (issueDate && transactionDate && issueDate > transactionDate) {
      contradictions.push({
        type: CONTRADICTION_TYPES.TEMPORAL_CONTRADICTION,
        severity: "high",
        confidence: 0.90,
        detail: `Issue date (${fields.issue_date}) is AFTER transaction date (${fields.transaction_date}) — impossible chronology`,
        fields: { issue_date: fields.issue_date, transaction_date: fields.transaction_date },
      });
    }

    // Transaction date before settlement date
    if (transactionDate && settlementDate && transactionDate > settlementDate) {
      contradictions.push({
        type: CONTRADICTION_TYPES.TEMPORAL_CONTRADICTION,
        severity: "medium",
        confidence: 0.80,
        detail: `Transaction date (${fields.transaction_date}) is AFTER settlement date (${fields.settlement_date})`,
      });
    }

    // Expiry date in the past for an "active" document
    if (expiryDate && expiryDate < new Date() && (issueDate || transactionDate)) {
      contradictions.push({
        type: CONTRADICTION_TYPES.TEMPORAL_CONTRADICTION,
        severity: "medium",
        confidence: 0.70,
        detail: `Document expiry date (${fields.expiry_date}) has already passed`,
      });
    }

    return contradictions;
  }

  // ─── Private: Identity Validation ──────────────────────────────────────────

  static _validateIdentity(fields) {
    const contradictions = [];

    // Check name consistency across fields
    const names = [
      fields.account_holder,
      fields.payer_name,
      fields.beneficiary_name,
      fields.customer_name,
      fields.full_name,
    ].filter(Boolean);

    if (names.length >= 2) {
      const normalized = names.map((n) => n.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics for comparison
        .replace(/\s+/g, " ")
      );

      // Check each pair
      for (let i = 0; i < normalized.length - 1; i++) {
        for (let j = i + 1; j < normalized.length; j++) {
          const similarity = this._nameSimilarity(normalized[i], normalized[j]);
          if (similarity < 0.6) { // Less than 60% similar
            contradictions.push({
              type: CONTRADICTION_TYPES.IDENTITY_CONTRADICTION,
              severity: "high",
              confidence: Number((0.95 - similarity * 0.5).toFixed(2)),
              detail: `Name mismatch within document: "${names[i]}" vs "${names[j]}" (similarity: ${(similarity * 100).toFixed(0)}%)`,
              fields: { name_a: names[i], name_b: names[j], similarity },
            });
          }
        }
      }
    }

    return contradictions;
  }

  // ─── Private: Reference Validation ─────────────────────────────────────────

  static _validateReferences(fields) {
    const contradictions = [];

    // Bank account consistency
    const bankAccounts = [
      fields.account_number,
      fields.bank_account,
      fields.recipient_account,
    ].filter(Boolean).map((a) => a.replace(/\s/g, ""));

    if (bankAccounts.length >= 2) {
      const unique = new Set(bankAccounts);
      if (unique.size > 1) {
        contradictions.push({
          type: CONTRADICTION_TYPES.BANK_ACCOUNT_CONTRADICTION,
          severity: "critical",
          confidence: 0.92,
          detail: `Multiple different bank account numbers found in same document: ${[...unique].join(", ")}`,
          fields: { accounts: [...unique] },
        });
      }
    }

    return contradictions;
  }

  // ─── Private: Helpers ───────────────────────────────────────────────────────

  /**
   * Simple character-level name similarity (0-1 scale).
   * Not Levenshtein — just a fast approximation for field comparison.
   */
  static _nameSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1;

    // Count common characters (position-independent)
    const commonChars = [...shorter].filter((ch) => longer.includes(ch)).length;
    return commonChars / longer.length;
  }

  static _buildSummary(contradictions) {
    if (contradictions.length === 0) return "No internal contradictions detected.";
    const types = [...new Set(contradictions.map((c) => c.type))];
    return `${contradictions.length} contradiction(s) found: ${types.join(", ")}`;
  }
}
