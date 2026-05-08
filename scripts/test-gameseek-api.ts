import * as questionsModule from "../src/lib/gameseek/questions";
import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

type AnyRecord = Record<string, unknown>;
type QuestionLike = { id: string; options: { id: string }[] };
type SeedLike = { answers: Record<string, string> };

function getArray<T>(moduleValue: Record<string, unknown>, names: string[]): T[] {
  for (const name of names) {
    const value = moduleValue[name];
    if (Array.isArray(value)) return value as T[];
  }
  throw new Error(`Cannot find array export. Tried: ${names.join(", ")}`);
}

const questions = getArray<QuestionLike>(questionsModule as Record<string, unknown>, ["questions", "QUESTIONS", "gameSeekQuestions", "GAMESEEK_QUESTIONS"]);
const goldenSeeds = getArray<SeedLike>(seedsModule as Record<string, unknown>, ["goldenSeeds", "GOLDEN_SEEDS", "seeds", "SEEDS"]);

const firstQuestion = questions[0];
const firstOption = firstQuestion?.options?.[0];
if (!firstQuestion || !firstOption) throw new Error("No question/option data available for API boundary tests");

function oneAnswer() {
  return { [firstQuestion.id]: firstOption.id };
}

function fullAnswer() {
  return goldenSeeds[0]?.answers ?? Object.fromEntries(questions.map((q) => [q.id, q.options[0].id]));
}

type BoundaryCase = {
  name: string;
  payload: unknown;
  expected: "no_5xx" | "4xx";
};

const cases: BoundaryCase[] = [
  { name: "empty answers", payload: { answers: {} }, expected: "no_5xx" },
  { name: "illegal question id", payload: { answers: { __illegal_question__: firstOption.id } }, expected: "4xx" },
  { name: "illegal option id", payload: { answers: { [firstQuestion.id]: "__illegal_option__" } }, expected: "4xx" },
  { name: "array answer should be rejected", payload: { answers: { [firstQuestion.id]: [firstOption.id] } }, expected: "4xx" },
  { name: "only one answer", payload: { answers: oneAnswer() }, expected: "no_5xx" },
  { name: "full 12 answers", payload: { answers: fullAnswer() }, expected: "no_5xx" },
];

async function callDirect(payload: unknown) {
  try {
    const route = await import("../src/app/api/recommend/route");
    const handler = (route as AnyRecord).POST;
    if (typeof handler !== "function") throw new Error("POST export not found");
    const request = new Request("http://localhost/api/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = await handler(request);
    return { status: Number(response.status), body: await response.text() };
  } catch (directError) {
    const baseUrl = process.env.GAMESEEK_API_BASE_URL ?? "http://127.0.0.1:3000";
    const response = await fetch(`${baseUrl}/api/recommend`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { status: response.status, body: await response.text(), directError: String(directError) };
  }
}

async function main() {
  const results = [];
  for (const item of cases) {
    const response = await callDirect(item.payload);
    const ok = item.expected === "4xx"
      ? response.status >= 400 && response.status < 500
      : response.status < 500;
    results.push({ name: item.name, expected: item.expected, status: response.status, ok });
  }

  const passed = results.every((item) => item.ok);
  console.log(JSON.stringify({ passed, results }, null, 2));
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
