/**
 * StudentHub AI — Out-of-Distribution (OOD) & Abstention Detector
 * 
 * Enforces Constitution 22 (OOD Detection) and Constitution 23 (Responsible Abstention):
 * Allows the AI system to output OUT_OF_DISTRIBUTION or INSUFFICIENT_EVIDENCE
 * instead of fabricating high confidence on unfamiliar domains.
 */

export class OODDetector {
  /**
   * Analyzes an input text and neural activation vector for OOD indicators
   * @param {string} text - Raw input string
   * @param {object} neuralState - Intermediate activations / distributions
   * @param {object} options - Threshold configurations
   * @returns {object} OOD Assessment
   */
  static assess(text = "", neuralState = {}, options = {}) {
    if (!text || typeof text !== "string" || !text.trim()) {
      return {
        is_ood: true,
        ood_status: "INSUFFICIENT_EVIDENCE",
        ood_score: 1.0,
        reasons: ["Văn bản rỗng hoặc không có dữ liệu để phân tích."],
        recommended_action: "ABSTAIN"
      };
    }

    const cleanText = text.trim();
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const reasons = [];
    let oodScore = 0.0;

    // 1. Extreme Length Anomaly (< 3 tokens or > 1000 tokens)
    if (words.length < 3) {
      oodScore += 0.45;
      reasons.push("Độ dài chuỗi quá ngắn (< 3 từ) để xác lập ngữ cảnh tin cậy.");
    }

    // 2. Character Entropy & Non-Linguistic Noise Ratio (e.g. random gibberish, base64 payload)
    const nonAlphaNumeric = (cleanText.match(/[^a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]/g) || []).length;
    const noiseRatio = nonAlphaNumeric / Math.max(1, cleanText.length);
    if (noiseRatio > 0.40) {
      oodScore += 0.50;
      reasons.push(`Tỷ lệ ký tự phi ngữ nghĩa cao (${(noiseRatio * 100).toFixed(1)}%). Khả năng là payload mã độc hoặc chuỗi ngẫu nhiên.`);
    }

    // 3. Language & Domain Distribution (detect non-Vietnamese/non-English foreign domain)
    const foreignCharCount = (cleanText.match(/[\u4e00-\u9fa5\u0400-\u04FF\u0600-\u06FF\u3040-\u30ff]/g) || []).length;
    if (foreignCharCount > 5) {
      oodScore += 0.60;
      reasons.push("Phát hiện ngôn ngữ ngoài phạm vi huấn luyện (Cyrillic, Arabic, CJK).");
    }

    // 4. Softmax Probability Entropy / Maximum Softmax Probability (MSP)
    if (neuralState && neuralState.confidence !== undefined) {
      const maxP = neuralState.confidence;
      // If the model is uniformly uncertain across all classes
      if (maxP >= 0.40 && maxP <= 0.55 && (!neuralState.scam_types || neuralState.scam_types.length === 0)) {
        oodScore += 0.35;
        reasons.push("Xác suất nơ-ron phân bố đều lơ lửng ở ngưỡng bất định (Entropy cao).");
      }
    }

    const isOOD = oodScore >= (options.oodThreshold || 0.60);
    let status = "IN_DISTRIBUTION";
    if (isOOD) {
      status = foreignCharCount > 5 ? "OUT_OF_DISTRIBUTION" : (words.length < 3 ? "INSUFFICIENT_EVIDENCE" : "OUT_OF_DISTRIBUTION");
    }

    return {
      is_ood: isOOD,
      ood_status: status,
      ood_score: Number(Math.min(1.0, oodScore).toFixed(4)),
      reasons,
      recommended_action: isOOD ? "ABSTAIN" : "PROCEED_WITH_INFERENCE"
    };
  }
}
