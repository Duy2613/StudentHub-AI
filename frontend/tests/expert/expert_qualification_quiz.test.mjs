import assert from "node:assert/strict";
import { test } from "node:test";

import {
  QUIZ_PASS_SCORE,
  QUIZ_VERSION,
  drawQuizQuestionIds,
  getPublicQuizQuestions,
  gradeQuiz,
} from "../../src/lib/server/expert/ExpertQualificationQuiz.js";

test("qualification quiz is versioned, shuffled by a supplied CSPRNG boundary, and redacts answer keys", () => {
  const questionIds = drawQuizQuestionIds({ count: 6, sourceRandomInt: (max) => max - 1 });
  assert.equal(questionIds.length, 6);
  assert.equal(new Set(questionIds).size, questionIds.length);
  const questions = getPublicQuizQuestions(questionIds);
  assert.equal(questions.length, questionIds.length);
  assert.equal(questions.some((question) => Object.hasOwn(question, "correctOption")), false);
  assert.equal(questions.some((question) => question.choices.some((choice) => Object.hasOwn(choice, "correct"))), false);
});

test("quiz grading returns a bounded score and requires the configured threshold", () => {
  const questionIds = drawQuizQuestionIds({ count: 6, sourceRandomInt: () => 0 });
  const wrongAnswers = Object.fromEntries(questionIds.map((questionId) => [questionId, "not-an-option"]));
  const failed = gradeQuiz({ questionIds, answers: wrongAnswers });
  assert.equal(failed.quizVersion, QUIZ_VERSION);
  assert.equal(failed.score, 0);
  assert.equal(failed.passed, false);

  const publicQuestions = getPublicQuizQuestions(questionIds);
  const answerMap = Object.fromEntries(publicQuestions.map((question, index) => [question.questionId, ["b", "c", "a", "b", "c", "d"][index]]));
  const graded = gradeQuiz({ questionIds, answers: answerMap });
  assert.equal(graded.score >= 0 && graded.score <= 1, true);
  assert.equal(graded.passed, graded.score >= QUIZ_PASS_SCORE);
});

