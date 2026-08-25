/**
 * StudentHub AI — Multi-Head Multi-Label Neural Trust Runtime Engine
 * 
 * Executes instantaneous (< 1.5ms) zero-LLM client/server multi-dimensional inference:
 * - 45+ Scam Types (Multi-Label Sigmoid)
 * - 25+ Psychological Tactics (Multi-Label Sigmoid)
 * - 12 Requested Actions (Multi-Label Sigmoid)
 * - 8 Attack Stages (Softmax)
 * - 4 Verdicts & Security Severity Levels (Softmax)
 */

import { multiLabelWeights } from "./multilabel_trained_weights.js";

function removeDiacritics(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function tokenize(text) {
  const clean = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>\[\]\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ").filter((w) => w.length > 0);
  const tokens = [];

  for (let i = 0; i < words.length; i++) {
    tokens.push(words[i]);
    const noMark = removeDiacritics(words[i]);
    if (noMark !== words[i]) tokens.push(noMark);

    if (i < words.length - 1) {
      tokens.push(`${words[i]}_${words[i + 1]}`);
      const noMarkBi = removeDiacritics(`${words[i]}_${words[i + 1]}`);
      if (noMarkBi !== `${words[i]}_${words[i + 1]}`) tokens.push(noMarkBi);
    }

    if (i < words.length - 2) {
      tokens.push(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
    }
  }

  return tokens;
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, z))));
}

function softmax(arr) {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  const exp = new Float32Array(arr.length);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    exp[i] = Math.exp(arr[i] - max);
    sum += exp[i];
  }
  for (let i = 0; i < arr.length; i++) {
    exp[i] /= sum || 1;
  }
  return exp;
}

export class StudentHubMultiLabelNeuralModel {
  /**
   * Performs multi-dimensional multi-task inference
   * @param {string} text - Raw input text, OCR snippet, or prompt
   * @param {object} options - Overrides / thresholds
   * @returns {object} Full structured Multi-Label Trust Intelligence Output
   */
  static predict(text = "", options = {}) {
    const startTime = performance.now();

    if (!text || typeof text !== "string" || !text.trim()) {
      return this._getDefaultResult();
    }

    const { vectorizer, weights, metadata } = multiLabelWeights;
    const { scamTypes, psychologicalTactics, attackStages, requestedActions, verdicts } = metadata.taxonomy;
    const { W_shared, b_shared, W_scam, b_scam, W_tactics, b_tactics, W_actions, b_actions, W_stages, b_stages, W_verdicts, b_verdicts } = weights;

    const inputDim = vectorizer.vocabSize;
    const hiddenDim = metadata.hiddenDimension || 160;

    // 1. Vectorize text with TF-IDF
    const tokens = tokenize(text);
    const tf = {};
    for (const t of tokens) {
      if (vectorizer.vocab[t] !== undefined) {
        tf[t] = (tf[t] || 0) + 1;
      }
    }

    const x = new Float32Array(inputDim);
    let sumSq = 0;
    for (const [t, count] of Object.entries(tf)) {
      const idx = vectorizer.vocab[t];
      const val = (1 + Math.log(count)) * vectorizer.idf[t];
      x[idx] = val;
      sumSq += val * val;
    }
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < inputDim; i++) {
        x[i] /= norm;
      }
    }

    // 2. Forward pass: Shared Backbone (ReLU)
    const h = new Float32Array(hiddenDim);
    for (let j = 0; j < hiddenDim; j++) {
      let sum = b_shared[j];
      for (let i = 0; i < inputDim; i++) {
        if (x[i] !== 0) sum += x[i] * W_shared[i][j];
      }
      h[j] = Math.max(0, sum);
    }

    // 3. Head 1: Scam Types (Sigmoid)
    const scamProbs = {};
    const detectedScams = [];
    for (let k = 0; k < scamTypes.length; k++) {
      let sum = b_scam[k];
      for (let j = 0; j < hiddenDim; j++) {
        if (h[j] !== 0) sum += h[j] * W_scam[j][k];
      }
      const p = Number(sigmoid(sum).toFixed(4));
      scamProbs[scamTypes[k]] = p;
      if (p >= (options.scamThreshold || 0.35)) {
        detectedScams.push({ type: scamTypes[k], score: p });
      }
    }
    detectedScams.sort((a, b) => b.score - a.score);

    // 4. Head 2: Psychological Tactics (Sigmoid)
    const tacticProbs = {};
    const detectedTactics = [];
    for (let k = 0; k < psychologicalTactics.length; k++) {
      let sum = b_tactics[k];
      for (let j = 0; j < hiddenDim; j++) {
        if (h[j] !== 0) sum += h[j] * W_tactics[j][k];
      }
      const p = Number(sigmoid(sum).toFixed(4));
      tacticProbs[psychologicalTactics[k]] = p;
      if (p >= (options.tacticThreshold || 0.30)) {
        detectedTactics.push({ tactic: psychologicalTactics[k], score: p });
      }
    }
    detectedTactics.sort((a, b) => b.score - a.score);

    // 5. Head 3: Requested Actions (Sigmoid)
    const actionProbs = {};
    const detectedActions = [];
    for (let k = 0; k < requestedActions.length; k++) {
      let sum = b_actions[k];
      for (let j = 0; j < hiddenDim; j++) {
        if (h[j] !== 0) sum += h[j] * W_actions[j][k];
      }
      const p = Number(sigmoid(sum).toFixed(4));
      actionProbs[requestedActions[k]] = p;
      if (p >= (options.actionThreshold || 0.35) && requestedActions[k] !== "NONE") {
        detectedActions.push({ action: requestedActions[k], score: p });
      }
    }
    detectedActions.sort((a, b) => b.score - a.score);

    // 6. Head 4: Attack Stage (Softmax)
    const stageLogits = new Float32Array(attackStages.length);
    for (let k = 0; k < attackStages.length; k++) {
      let sum = b_stages[k];
      for (let j = 0; j < hiddenDim; j++) {
        if (h[j] !== 0) sum += h[j] * W_stages[j][k];
      }
      stageLogits[k] = sum;
    }
    const stageProbs = softmax(stageLogits);
    let bestStageIdx = 0, maxStageP = -1;
    const stageDistribution = {};
    for (let k = 0; k < attackStages.length; k++) {
      const p = Number(stageProbs[k].toFixed(4));
      stageDistribution[attackStages[k]] = p;
      if (p > maxStageP) { maxStageP = p; bestStageIdx = k; }
    }
    const primaryStage = attackStages[bestStageIdx];

    // 7. Head 5: Verdict (Softmax)
    const verdictLogits = new Float32Array(verdicts.length);
    for (let k = 0; k < verdicts.length; k++) {
      let sum = b_verdicts[k];
      for (let j = 0; j < hiddenDim; j++) {
        if (h[j] !== 0) sum += h[j] * W_verdicts[j][k];
      }
      verdictLogits[k] = sum;
    }
    const verdictProbs = softmax(verdictLogits);
    let bestVerdictIdx = 0, maxVerdictP = -1;
    const verdictDistribution = {};
    for (let k = 0; k < verdicts.length; k++) {
      const p = Number(verdictProbs[k].toFixed(4));
      verdictDistribution[verdicts[k]] = p;
      if (p > maxVerdictP) { maxVerdictP = p; bestVerdictIdx = k; }
    }
    const finalVerdict = verdicts[bestVerdictIdx];

    // 8. Synthesize Target Assets & Red Flags
    const targetAssets = [];
    if (actionProbs["TRANSFER_MONEY"] > 0.35) targetAssets.push("MONEY_DEPOSIT");
    if (actionProbs["OTP"] > 0.35) targetAssets.push("OTP", "BANK_ACCOUNT");
    if (actionProbs["PASSWORD"] > 0.35 || actionProbs["PIN"] > 0.35) targetAssets.push("CREDENTIALS");
    if (actionProbs["IDENTITY_DOCUMENT"] > 0.35) targetAssets.push("IDENTITY_INFO");
    if (actionProbs["REMOTE_ACCESS"] > 0.35 || actionProbs["INSTALL_APP_APK"] > 0.35) targetAssets.push("DEVICE_CONTROL");

    const redFlags = [];
    if (tacticProbs["AUTHORITY"] > 0.30 || detectedScams.some((s) => s.type.includes("IMPERSONATION"))) redFlags.push("IMPERSONATION");
    if (tacticProbs["URGENCY"] > 0.30) redFlags.push("TIME_PRESSURE");
    if (actionProbs["OTP"] > 0.30 || actionProbs["PASSWORD"] > 0.30) redFlags.push("CREDENTIAL_REQUEST");
    if (actionProbs["TRANSFER_MONEY"] > 0.30) redFlags.push("UNUSUAL_PAYMENT");
    if (tacticProbs["ISOLATION"] > 0.30) redFlags.push("SECRECY_DEMAND");
    if (tacticProbs["LOSS_AVERSION"] > 0.30) redFlags.push("LOSS_FRAMING");
    if (tacticProbs["GREED"] > 0.30 || tacticProbs["RECIPROCITY"] > 0.30) redFlags.push("UNREALISTIC_RETURN");

    // Severity Calibration
    let severity = "INFO";
    if (finalVerdict === "SCAM") {
      severity = (actionProbs["OTP"] > 0.5 || actionProbs["TRANSFER_MONEY"] > 0.5 || actionProbs["REMOTE_ACCESS"] > 0.5) ? "CRITICAL" : "HIGH";
    } else if (finalVerdict === "SUSPICIOUS") {
      severity = "MEDIUM";
    } else if (finalVerdict === "AMBIGUOUS") {
      severity = "LOW";
    }

    // Explanatory Evidence Generation
    const evidence = [];
    if (detectedScams.length > 0) {
      evidence.push(`Phát hiện mẫu hình: ${detectedScams.slice(0, 3).map((s) => s.type).join(", ")}`);
    }
    if (detectedTactics.length > 0) {
      evidence.push(`Thao túng tâm lý: ${detectedTactics.slice(0, 3).map((t) => t.tactic).join(", ")}`);
    }
    if (detectedActions.length > 0) {
      evidence.push(`Hành vi yêu cầu: ${detectedActions.map((a) => a.action).join(", ")}`);
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      verdict: finalVerdict,
      confidence: Number(maxVerdictP.toFixed(4)),
      severity,
      scam_types: detectedScams.map((s) => s.type),
      attack_stage: primaryStage,
      psychological_tactics: detectedTactics.map((t) => t.tactic),
      requested_actions: detectedActions.map((a) => a.action),
      target_assets: Array.from(new Set(targetAssets)),
      red_flags: Array.from(new Set(redFlags)),
      evidence,
      distributions: {
        scamProbs,
        tacticProbs,
        actionProbs,
        stageDistribution,
        verdictDistribution,
      },
      latencyMs,
      metadata: {
        model: metadata.modelName,
        architecture: metadata.architecture,
        trainedSamples: metadata.trainingSamplesCount,
      },
    };
  }

  static _getDefaultResult() {
    return {
      verdict: "LEGITIMATE",
      confidence: 1.0,
      severity: "INFO",
      scam_types: [],
      attack_stage: "STAGE_1_CONTACT",
      psychological_tactics: [],
      requested_actions: [],
      target_assets: [],
      red_flags: [],
      evidence: ["Văn bản rỗng hoặc không chứa nội dung phân tích."],
      distributions: {},
      latencyMs: 0.1,
    };
  }
}
