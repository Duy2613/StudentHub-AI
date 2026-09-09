/**
 * StudentHub AI — MetricForensics
 *
 * Implements mathematically verified statistical evaluation metrics:
 * 1. Exact Clopper-Pearson Confidence Intervals (valid for zero-event cases k=0 and k=n)
 * 2. Wilson Score Confidence Intervals
 * 3. Grounded NDCG@K (normalizing strictly over query gold relevance, preventing inflation)
 * 4. Expected Calibration Error (ECE) with equal-width binning
 * 5. Brier Score (mean squared error of probability predictions)
 * 6. Macro F1, Precision@K, Recall@K, MRR with verified denominators
 */

/**
 * Regularized incomplete beta function approximation via continued fraction
 * Used for exact Clopper-Pearson calculation across 0 < k < n.
 */
function betacf(a, b, x) {
  const MAXIT = 100;
  const EPS = 3.0e-7;
  const FPMIN = 1.0e-30;

  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return h;
}

function logGamma(x) {
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function incBeta(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x));
  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
}

function invertBeta(a, b, targetP) {
  let low = 0.0;
  let high = 1.0;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const val = incBeta(a, b, mid);
    if (val < targetP) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

export class MetricForensics {
  /**
   * Exact Clopper-Pearson 95% Confidence Interval for binomial proportion k/n.
   * Handles zero-event k=0 and k=n with exact statistical bounds:
   * - k=0: [0.0, 1 - (alpha/2)^(1/n)] -> for n=45, alpha=0.05: [0.0, 0.0787] (approximately 0% - 7.9%)
   * - k=n: [(alpha/2)^(1/n), 1.0] -> for n=45, alpha=0.05: [0.9213, 1.0] (approximately 92.1% - 100%)
   * For 0 < k < n, the bounds are beta-distribution quantiles (not Wilson).
   */
  static clopperPearsonCI(k, n, confidence = 0.95) {
    if (!Number.isInteger(n) || n <= 0 || !Number.isInteger(k) || k < 0 || k > n) {
      throw new RangeError("clopperPearsonCI requires integer 0 <= k <= n and n > 0.");
    }
    if (!Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) {
      throw new RangeError("confidence must be between 0 and 1.");
    }

    const alpha = 1.0 - confidence;
    const point = k / n;

    let low = 0.0;
    let high = 1.0;

    if (k === 0) {
      low = 0.0;
      high = 1.0 - Math.pow(alpha / 2, 1.0 / n);
    } else if (k === n) {
      low = Math.pow(alpha / 2, 1.0 / n);
      high = 1.0;
    } else {
      // CP bounds are the inverse regularized incomplete beta quantiles:
      // L = Beta^-1(alpha/2; k, n-k+1), U = Beta^-1(1-alpha/2; k+1, n-k).
      low = invertBeta(k, n - k + 1, alpha / 2);
      high = invertBeta(k + 1, n - k, 1 - alpha / 2);
    }

    return {
      numerator: k,
      denominator: n,
      point: Number(point.toFixed(4)),
      low: Number(Math.max(0, low).toFixed(4)),
      high: Number(Math.min(1, high).toFixed(4)),
      formatted: `${(point * 100).toFixed(2)}% [95% CI: ${(low * 100).toFixed(2)}% - ${(high * 100).toFixed(2)}%]`
    };
  }

  /**
   * Wilson Score Interval for binomial proportion k/n.
   */
  static wilsonCI(k, n, confidence = 0.95) {
    if (!Number.isInteger(n) || n <= 0 || !Number.isInteger(k) || k < 0 || k > n) {
      throw new RangeError("wilsonCI requires integer 0 <= k <= n and n > 0.");
    }
    if (!Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) {
      throw new RangeError("confidence must be between 0 and 1.");
    }
    const z = confidence === 0.95 ? 1.95996 : 2.5758; // 95% or 99%
    const p = k / n;
    const denominator = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / denominator;
    const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / denominator;

    const low = Math.max(0, center - margin);
    const high = Math.min(1, center + margin);

    return {
      numerator: k,
      denominator: n,
      point: Number(p.toFixed(4)),
      low: Number(low.toFixed(4)),
      high: Number(high.toFixed(4)),
      formatted: `${(p * 100).toFixed(2)}% [Wilson 95% CI: ${(low * 100).toFixed(2)}% - ${(high * 100).toFixed(2)}%]`
    };
  }

  /**
   * Mathematically correct NDCG@K.
   * Normalizes DCG against the IDEAL DCG (IDCG) formed by the gold relevant items for this specific query.
   * Relevance is 0 for any retrieved document that is NOT relevant to the specific query intent,
   * regardless of whether it is a generic .edu.vn or .gov.vn portal.
   *
   * @param {Array<object>} retrieved
   * @param {Function} relevanceJudge - fn(doc, rank) returning relevance level (e.g. 1 or 0)
   * @param {number} k - evaluation cut-off (e.g. 5)
   * @param {number} totalGoldRelevantCount - number of known relevant documents in corpus for this query
   */
  static computeNDCGAtK(retrieved = [], relevanceJudge, k = 5, totalGoldRelevantCount = 1) {
    const evalLength = Math.min(retrieved.length, k);
    let dcg = 0;

    for (let i = 0; i < evalLength; i++) {
      const rel = relevanceJudge(retrieved[i], i);
      if (rel > 0) {
        // Binary or graded relevance: (2^rel - 1) / log2(i + 2)
        const gain = Math.pow(2, rel) - 1;
        dcg += gain / Math.log2(i + 2);
      }
    }

    // IDCG: Ideal ranking where top min(totalGoldRelevantCount, k) items have highest relevance (e.g. 1)
    const idealCount = Math.min(totalGoldRelevantCount, k);
    let idcg = 0;
    for (let i = 0; i < idealCount; i++) {
      const gain = Math.pow(2, 1) - 1; // binary rel=1
      idcg += gain / Math.log2(i + 2);
    }

    if (idcg <= 0) {
      return dcg > 0 ? 1.0 : 0.0;
    }

    return Number(Math.min(1.0, dcg / idcg).toFixed(4));
  }

  /**
   * Recall@K for one query. `totalGoldRelevantCount` must come from the
   * query-specific relevance annotation, never from a generic domain count.
   */
  static computeRecallAtK(retrieved = [], relevanceJudge, k = 5, totalGoldRelevantCount = 0) {
    if (typeof relevanceJudge !== "function") throw new TypeError("relevanceJudge must be a function.");
    if (!Number.isFinite(totalGoldRelevantCount) || totalGoldRelevantCount < 0) {
      throw new RangeError("totalGoldRelevantCount must be a non-negative number.");
    }
    if (totalGoldRelevantCount === 0) return 0;
    const hits = retrieved.slice(0, Math.max(0, k)).reduce((count, item, index) => (
      count + (relevanceJudge(item, index) > 0 ? 1 : 0)
    ), 0);
    return Number(Math.min(1, hits / totalGoldRelevantCount).toFixed(4));
  }

  /**
   * Precision@K for one query. The denominator is the requested cutoff K,
   * which keeps short result lists from receiving an inflated score.
   */
  static computePrecisionAtK(retrieved = [], relevanceJudge, k = 5) {
    if (typeof relevanceJudge !== "function") throw new TypeError("relevanceJudge must be a function.");
    if (!Number.isFinite(k) || k <= 0) return 0;
    const cutoff = Math.floor(k);
    const hits = retrieved.slice(0, cutoff).reduce((count, item, index) => (
      count + (relevanceJudge(item, index) > 0 ? 1 : 0)
    ), 0);
    return Number((hits / cutoff).toFixed(4));
  }

  /**
   * Mean reciprocal rank for one query. Returns zero when no result is relevant.
   */
  static computeMRR(retrieved = [], relevanceJudge, k = retrieved.length) {
    if (typeof relevanceJudge !== "function") throw new TypeError("relevanceJudge must be a function.");
    const cutoff = Math.max(0, Math.floor(k));
    for (let index = 0; index < Math.min(retrieved.length, cutoff); index++) {
      if (relevanceJudge(retrieved[index], index) > 0) return Number((1 / (index + 1)).toFixed(4));
    }
    return 0;
  }

  /**
   * Expected Calibration Error (ECE).
   * Partitions probability predictions into equal-width confidence bins,
   * measuring weighted difference between average confidence and empirical accuracy.
   */
  static computeECE(predictions = [], numBins = 10) {
    // predictions: Array<{ confidence: number, isCorrect: boolean }>
    if (predictions.length === 0) return 0.0;

    const bins = Array.from({ length: numBins }, () => ({
      count: 0,
      confSum: 0,
      accSum: 0
    }));

    for (const p of predictions) {
      const conf = Math.max(0.0, Math.min(1.0, p.confidence));
      let binIdx = Math.floor(conf * numBins);
      if (binIdx >= numBins) binIdx = numBins - 1;

      bins[binIdx].count += 1;
      bins[binIdx].confSum += conf;
      bins[binIdx].accSum += (p.isCorrect ? 1.0 : 0.0);
    }

    const N = predictions.length;
    let ece = 0.0;

    for (const b of bins) {
      if (b.count > 0) {
        const binConf = b.confSum / b.count;
        const binAcc = b.accSum / b.count;
        ece += (b.count / N) * Math.abs(binAcc - binConf);
      }
    }

    return Number(ece.toFixed(4));
  }

  /**
   * Brier Score: Mean Squared Error of predicted confidence against true binary outcome.
   */
  static computeBrierScore(predictions = []) {
    if (predictions.length === 0) return 0.0;
    let sumSq = 0;
    for (const p of predictions) {
      const y = p.isCorrect ? 1.0 : 0.0;
      const conf = Math.max(0.0, Math.min(1.0, p.confidence));
      sumSq += Math.pow(conf - y, 2);
    }
    return Number((sumSq / predictions.length).toFixed(4));
  }

  /**
   * Verified Macro F1 across multi-class predictions.
   */
  static computeMacroF1(classLabels, confusionMatrix) {
    // confusionMatrix: { [label]: { tp: 0, fp: 0, fn: 0 } }
    let f1Sum = 0;
    let validClasses = 0;

    const perClass = {};
    const labels = [...new Set([
      ...(Array.isArray(classLabels) ? classLabels : []),
      ...Object.keys(confusionMatrix || {}),
    ])];

    for (const label of labels) {
      const st = confusionMatrix[label] || { tp: 0, fp: 0, fn: 0 };
      const prec = (st.tp + st.fp > 0) ? (st.tp / (st.tp + st.fp)) : 0;
      const rec = (st.tp + st.fn > 0) ? (st.tp / (st.tp + st.fn)) : 0;
      const f1 = (prec + rec > 0) ? ((2 * prec * rec) / (prec + rec)) : 0;

      perClass[label] = {
        precision: Number(prec.toFixed(4)),
        recall: Number(rec.toFixed(4)),
        f1: Number(f1.toFixed(4)),
        tp: st.tp,
        fp: st.fp,
        fn: st.fn
      };

      f1Sum += f1;
      validClasses++;
    }

    const macro = validClasses > 0 ? (f1Sum / validClasses) : 0;
    return {
      macroF1: Number(macro.toFixed(4)),
      perClass
    };
  }
}
