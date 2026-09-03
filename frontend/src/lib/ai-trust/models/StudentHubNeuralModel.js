import trainedModelData from "./trained_weights.js";

function removeDiacritics(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function tokenize(text) {
  if (!text) return [];
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s\dà-ỹÀ-Ỹ.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const words = clean.split(" ").filter((w) => w.length > 1);
  const ngrams = [...words];

  for (let i = 0; i < words.length - 1; i++) {
    ngrams.push(`${words[i]}_${words[i + 1]}`);
  }

  for (const w of words) {
    const raw = removeDiacritics(w);
    if (raw !== w) ngrams.push(`raw:${raw}`);
  }

  return ngrams;
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / (sum || 1));
}

export class StudentHubNeuralModel {
  static modelData = trainedModelData;

  /**
   * Performs sub-2ms neural inference
   * @param {string} text - User input or OCR extracted text
   * @param {object} [metadata] - Additional metadata (URL, file info)
   * @returns {object} Inference result with probabilities and risk scores
   */
  static predict(text = "", metadata = {}) {
    const startTime = performance.now();
    const combinedInput = `${text} ${metadata.ocrText || ""} ${metadata.url || ""}`.trim();

    if (!combinedInput) {
      return {
        primaryCategory: "AUTHENTIC_ACADEMIC",
        threatScore: 0.0,
        confidence: 0.99,
        riskLevel: "NONE",
        recommendedAction: "ALLOW",
        urgencyScore: 0.0,
        probabilities: {},
        detectedKeywords: [],
        latencyMs: 0.05,
      };
    }

    const { vocab, idf, vocabSize } = this.modelData.vectorizer;
    const { W1, b1, W2, b2 } = this.modelData.weights;
    const categories = this.modelData.metadata.categories;
    const numClasses = categories.length;
    const hiddenDim = b1.length;

    // 1. Vectorize (TF-IDF)
    const tokens = tokenize(combinedInput);
    const vector = new Float32Array(vocabSize);
    const tf = {};
    const matchedTokens = [];

    for (const t of tokens) {
      if (vocab[t] !== undefined) {
        tf[t] = (tf[t] || 0) + 1;
        if (!matchedTokens.includes(t)) matchedTokens.push(t);
      }
    }

    let norm = 0;
    for (const t in tf) {
      const idx = vocab[t];
      const tfidf = (tf[t] / tokens.length) * idf[t];
      vector[idx] = tfidf;
      norm += tfidf * tfidf;
    }

    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vocabSize; i++) {
        vector[i] /= norm;
      }
    }

    // 2. Forward Propagation: Input -> Hidden (ReLU)
    const h = new Float32Array(hiddenDim);
    for (let j = 0; j < hiddenDim; j++) {
      let sum = b1[j];
      for (let i = 0; i < vocabSize; i++) {
        if (vector[i] !== 0) sum += vector[i] * W1[i][j];
      }
      h[j] = Math.max(0, sum); // ReLU
    }

    // 3. Hidden -> Output Logits (Softmax)
    const logits = new Array(numClasses).fill(0);
    for (let k = 0; k < numClasses; k++) {
      let sum = b2[k];
      for (let j = 0; j < hiddenDim; j++) {
        sum += h[j] * W2[j][k];
      }
      logits[k] = sum;
    }

    const probs = softmax(logits);
    const probMap = {};
    let maxProb = -1;
    let maxIdx = 0;

    categories.forEach((cat, idx) => {
      probMap[cat] = Number(probs[idx].toFixed(4));
      if (probs[idx] > maxProb) {
        maxProb = probs[idx];
        maxIdx = idx;
      }
    });

    const primaryCategory = categories[maxIdx];
    const isAuthentic =
      primaryCategory === "AUTHENTIC_ACADEMIC" ||
      primaryCategory === "AUTHENTIC_ACADEMIC_GOV" ||
      primaryCategory === "BENIGN_DEVELOPER_TECH";
    const threatScore = isAuthentic ? Number((1 - maxProb).toFixed(4)) : Number(maxProb.toFixed(4));

    // Urgency & Coercion Estimation
    let urgencyScore = 0.1;
    if (/khẩn cấp|ngay lập tức|trong 24 giờ|24h|hạn chót|trước 17h|khóa tài khoản|đình chỉ|bôi nhọ|tống tiền/i.test(combinedInput)) {
      urgencyScore = 0.95;
    } else if (/gấp|nhanh chóng|cọc trước|mở khóa|cần ngay/i.test(combinedInput)) {
      urgencyScore = 0.75;
    }

    // Action Recommendation & Risk
    let recommendedAction = "ALLOW";
    let riskLevel = "NONE";
    if (!isAuthentic) {
      if (threatScore >= 0.70) {
        recommendedAction = "BLOCK";
        riskLevel = "CRITICAL";
      } else if (threatScore >= 0.40) {
        recommendedAction = "RESTRICT";
        riskLevel = "HIGH";
      } else if (threatScore >= 0.20) {
        recommendedAction = "ALLOW_WITH_WARNING";
        riskLevel = "MEDIUM";
      }
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      primaryCategory,
      threatScore,
      confidence: Number(maxProb.toFixed(4)),
      riskLevel,
      recommendedAction,
      urgencyScore,
      probabilities: probMap,
      detectedKeywords: matchedTokens.slice(0, 12),
      latencyMs,
      modelMetadata: this.modelData.metadata,
    };
  }
}
