import { questions } from "./questions";
import type { AnswerMap } from "./types";

type ValidationOk = {
  ok: true;
  answers: AnswerMap;
};

type ValidationError = {
  ok: false;
  status: 400;
  error: string;
  details?: Record<string, unknown>;
};

export type ValidateAnswersResult = ValidationOk | ValidationError;

const optionIdsByQuestionId = new Map(
  questions.map((question) => [
    question.id,
    new Set(question.options.map((option) => option.id)),
  ]),
);

function fail(error: string, details?: Record<string, unknown>): ValidationError {
  return { ok: false, status: 400, error, details };
}

/**
 * Validate the public API answer payload without changing scoring.ts.
 * Contract: answers is an object of { [questionId]: optionId }, where optionId is a single string.
 * Empty answers are valid and should produce a normal recommendation response instead of a 5xx.
 */
export function validateAnswerMap(input: unknown): ValidateAnswersResult {
  if (input == null) return { ok: true, answers: {} as AnswerMap };
  if (typeof input !== "object" || Array.isArray(input)) {
    return fail("answers must be an object", { receivedType: Array.isArray(input) ? "array" : typeof input });
  }

  const answers: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(input as Record<string, unknown>)) {
    const allowedOptions = optionIdsByQuestionId.get(questionId);
    if (!allowedOptions) {
      return fail("illegal question id", { questionId });
    }
    if (typeof optionId !== "string" || optionId.length === 0) {
      return fail("answer must be a single option id string", { questionId, receivedValue: optionId });
    }
    if (!allowedOptions.has(optionId)) {
      return fail("illegal option id", { questionId, optionId });
    }
    answers[questionId] = optionId;
  }

  return { ok: true, answers: answers as AnswerMap };
}
