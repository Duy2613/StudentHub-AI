import test from "node:test";
import assert from "node:assert/strict";
import { MetricForensics } from "./MetricForensics.js";

test("MetricForensics uses exact CP bounds and query-specific IR denominators", () => {
  const zero = MetricForensics.clopperPearsonCI(0, 45);
  assert.equal(zero.low, 0);
  assert.equal(zero.high, 0.0787);

  const oneOfTen = MetricForensics.clopperPearsonCI(1, 10);
  assert.equal(oneOfTen.low, 0.0025);
  assert.equal(oneOfTen.high, 0.445);

  const all = MetricForensics.clopperPearsonCI(45, 45);
  assert.equal(all.low, 0.9213);
  assert.equal(all.high, 1);

  const ranked = [{ relevant: false }, { relevant: true }, { relevant: false }];
  const judge = (item) => item.relevant ? 1 : 0;
  assert.equal(MetricForensics.computeRecallAtK(ranked, judge, 3, 1), 1);
  assert.equal(MetricForensics.computePrecisionAtK(ranked, judge, 3), 0.3333);
  assert.equal(MetricForensics.computeMRR(ranked, judge, 3), 0.5);
  assert.equal(MetricForensics.computeNDCGAtK(ranked, judge, 3, 1), 0.6309);
});

test("MetricForensics covers calibration and predicted-only classes", () => {
  assert.equal(MetricForensics.computeECE([
    { confidence: 0.9, isCorrect: true },
    { confidence: 0.9, isCorrect: false },
  ], 10), 0.4);
  assert.equal(MetricForensics.computeBrierScore([
    { confidence: 0.9, isCorrect: true },
    { confidence: 0.9, isCorrect: false },
  ]), 0.41);

  const macro = MetricForensics.computeMacroF1(["SUPPORTED"], {
    SUPPORTED: { tp: 1, fp: 0, fn: 0 },
    HIGH_RISK: { tp: 0, fp: 1, fn: 1 },
  });
  assert.equal(macro.perClass.HIGH_RISK.f1, 0);
  assert.equal(macro.macroF1, 0.5);
});

