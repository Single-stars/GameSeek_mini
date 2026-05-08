import fs from "node:fs";
import path from "node:path";

import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

type AnyRecord = Record<string, unknown>;
type SeedLike = { targetGameId: string; answers: Record<string, string> };
type ApiResponse = {
  results?: unknown;
  recommendations?: unknown;
  needsFollowUp?: unknown;
  followUpQuestions?: unknown;
  diagnostic?: unknown;
};

function getArray<T>(moduleValue: Record<string, unknown>, names: string[]): T[] {
  for (const name of names) {
    const value = moduleValue[name];
    if (Array.isArray(value)) return value as T[];
  }
  throw new Error(`Cannot find array export. Tried: ${names.join(", ")}`);
}

const goldenSeeds = getArray<SeedLike>(seedsModule as Record<string, unknown>, [
  "goldenSeeds",
  "GOLDEN_SEEDS",
  "seeds",
  "SEEDS",
]);

async function callApi(payload: unknown): Promise<{ status: number; body: ApiResponse }> {
  const route = await import("../src/app/api/recommend/route");
  const handler = (route as AnyRecord).POST ?? ((route as AnyRecord).default as AnyRecord | undefined)?.POST;
  if (typeof handler !== "function") throw new Error("POST export not found");

  const request = new Request("http://localhost/api/recommend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const response = await handler(request);
  return { status: Number(response.status), body: await response.json() };
}

function assert(condition: unknown, message: string, errors: string[]) {
  if (!condition) errors.push(message);
}

function recommendationsFrom(body: ApiResponse) {
  return Array.isArray(body.recommendations)
    ? body.recommendations
    : Array.isArray(body.results)
      ? body.results
      : [];
}

function followUpQuestionsFrom(body: ApiResponse) {
  return Array.isArray(body.followUpQuestions) ? body.followUpQuestions as AnyRecord[] : [];
}

async function main() {
  const errors: string[] = [];
  const pagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  const pageSource = fs.readFileSync(pagePath, "utf8");

  const followUpSeed = goldenSeeds.find((seed) => seed.targetGameId === "slay-the-spire") ?? goldenSeeds[0];
  const noFollowUpSeed = goldenSeeds.find((seed) => seed.targetGameId === "lol-wild-rift") ?? goldenSeeds[0];

  const initial = await callApi({ answers: followUpSeed.answers });
  const initialRecommendations = recommendationsFrom(initial.body);
  const followUpQuestions = followUpQuestionsFrom(initial.body);

  assert(initial.status === 200, `initial API request must return 200, got ${initial.status}`, errors);
  assert(initialRecommendations.length > 0, "initial API response must include recommendations/results", errors);
  assert(typeof initial.body.needsFollowUp === "boolean", "initial API response should include needsFollowUp boolean", errors);
  if (initial.body.needsFollowUp) {
    assert(Array.isArray(initial.body.followUpQuestions), "needsFollowUp response must include followUpQuestions array", errors);
    for (const question of followUpQuestions) {
      assert(typeof question.id === "string" && question.id.length > 0, "follow-up question must have id", errors);
      assert(typeof question.text === "string" && question.text.length > 0, `follow-up question ${String(question.id)} must have text`, errors);
      assert(Array.isArray(question.options) && question.options.length > 0, `follow-up question ${String(question.id)} must have options`, errors);
      for (const option of question.options as AnyRecord[]) {
        assert(typeof option.id === "string" && option.id.length > 0, `follow-up option in ${String(question.id)} must have id`, errors);
        assert(typeof option.label === "string" && option.label.length > 0, `follow-up option in ${String(question.id)} must have label`, errors);
      }
    }
  }

  const followUpAnswers = Object.fromEntries(
    followUpQuestions.map((question) => {
      const options = question.options as AnyRecord[];
      return [question.id as string, options[0]?.id as string];
    }),
  );
  const final = await callApi({ answers: followUpSeed.answers, followUpAnswers });
  assert(final.status === 200, `follow-up API request must return 200, got ${final.status}`, errors);
  assert(recommendationsFrom(final.body).length > 0, "follow-up API response must include recommendations/results", errors);

  const noFollowUp = await callApi({ answers: noFollowUpSeed.answers });
  assert(noFollowUp.status === 200, `no-follow-up API request must return 200, got ${noFollowUp.status}`, errors);
  assert(recommendationsFrom(noFollowUp.body).length > 0, "old request path must still show recommendations", errors);

  const requiredPageMarkers = [
    'type Phase =',
    '"answering_core"',
    '"loading_initial"',
    '"answering_followups"',
    '"loading_final"',
    '"final_results"',
    "followUpAnswers",
    "submitCoreAnswers",
    "submitFollowUpAnswers",
    "skipFollowUps",
    "为了更准，再回答几个追问题",
    "跳过追问",
  ];

  for (const marker of requiredPageMarkers) {
    assert(pageSource.includes(marker), `page.tsx must include frontend follow-up marker: ${marker}`, errors);
  }

  const report = {
    passed: errors.length === 0,
    api: {
      initialStatus: initial.status,
      initialRecommendations: initialRecommendations.length,
      needsFollowUp: initial.body.needsFollowUp,
      followUpQuestionCount: followUpQuestions.length,
      finalStatus: final.status,
      finalRecommendations: recommendationsFrom(final.body).length,
      oldRequestStatus: noFollowUp.status,
      oldRequestRecommendations: recommendationsFrom(noFollowUp.body).length,
    },
    pageMarkersChecked: requiredPageMarkers,
    errors,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
