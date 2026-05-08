import fs from "node:fs";
import path from "node:path";

import { games } from "../src/lib/gameseek/games";
import { GOLDEN_SEEDS } from "../src/lib/gameseek/goldenSeeds";
import { rankAll } from "../src/lib/gameseek/scoring";
import { followUpQuestions } from "../src/lib/gameseek/followupQuestions";
import { rankAllWithFollowUps } from "../src/lib/gameseek/followupScoring";
import { selectFollowUpQuestions } from "../src/lib/gameseek/followupSelector";
import type { AnswerMap, Game } from "../src/lib/gameseek/types";

type PairCase = {
  a: string;
  b: string;
  aFollowUps: Record<string, string>;
  bFollowUps: Record<string, string>;
};

type PairResult = {
  pair: string;
  status: "passed" | "failed" | "skipped_missing_game" | "skipped_missing_seed";
  aSeedRanks?: { a: number | null; b: number | null };
  bSeedRanks?: { a: number | null; b: number | null };
};

const gameById = new Map(games.map((game) => [game.id, game]));
const seedByTarget = new Map(GOLDEN_SEEDS.map((seed) => [seed.targetGameId, seed]));
const reportsDir = path.join(process.cwd(), "reports");

const pairCases: PairCase[] = [
  {
    a: "factorio",
    b: "dyson-sphere-program",
    aFollowUps: { F_FACTORY_STYLE: "factorio" },
    bFollowUps: { F_FACTORY_STYLE: "dyson-sphere-program" },
  },
  {
    a: "slay-the-spire",
    b: "monster-train",
    aFollowUps: { F_DECKBUILDER_STYLE: "slay-the-spire" },
    bFollowUps: { F_DECKBUILDER_STYLE: "monster-train" },
  },
  {
    a: "balatro",
    b: "dicey-dungeons",
    aFollowUps: { F_DECKBUILDER_STYLE: "balatro" },
    bFollowUps: { F_DECKBUILDER_STYLE: "dicey-dungeons" },
  },
  {
    a: "xcom-2",
    b: "into-the-breach",
    aFollowUps: { F_TACTICS_STYLE: "xcom-2" },
    bFollowUps: { F_TACTICS_STYLE: "into-the-breach" },
  },
  {
    a: "tactics-ogre-reborn",
    b: "marvels-midnight-suns",
    aFollowUps: { F_TACTICS_STYLE: "tactics-ogre-reborn" },
    bFollowUps: { F_TACTICS_STYLE: "marvels-midnight-suns" },
  },
  {
    a: "age-of-empires-iv",
    b: "total-war-warhammer-iii",
    aFollowUps: { F_RTS_GRAND_STYLE: "age-of-empires-iv" },
    bFollowUps: { F_RTS_GRAND_STYLE: "total-war-warhammer-iii" },
  },
  {
    a: "civilization-vi",
    b: "age-of-empires-iv",
    aFollowUps: { F_RTS_GRAND_STYLE: "civilization-vi" },
    bFollowUps: { F_RTS_GRAND_STYLE: "age-of-empires-iv" },
  },
  {
    a: "plants-vs-zombies",
    b: "bloons-td-6",
    aFollowUps: { F_DEFENSE_STYLE: "plants-vs-zombies" },
    bFollowUps: { F_DEFENSE_STYLE: "bloons-td-6" },
  },
  {
    a: "cities-skylines",
    b: "frostpunk",
    aFollowUps: { F_STRATEGY_SUBCLUSTER: "city_colony_management" },
    bFollowUps: { F_DEFENSE_STYLE: "frostpunk" },
  },
  {
    a: "rimworld",
    b: "oxygen-not-included",
    aFollowUps: { F_STRATEGY_SUBCLUSTER: "city_colony_management" },
    bFollowUps: { F_FACTORY_STYLE: "oxygen-not-included" },
  },
];

function rankOf(ranked: Array<{ game: Game }>, gameId: string) {
  const index = ranked.findIndex((item) => item.game.id === gameId);
  return index >= 0 ? index + 1 : null;
}

function assert(condition: unknown, message: string, errors: string[]) {
  if (!condition) errors.push(message);
}

function ids(ranked: Array<{ game: Game }>) {
  return ranked.map((item) => item.game.id);
}

function baselineMetrics() {
  let top1 = 0;
  let top3 = 0;
  let top6 = 0;

  for (const seed of GOLDEN_SEEDS) {
    const ranked = rankAll(seed.answers);
    const rank = rankOf(ranked, seed.targetGameId);
    if (rank !== null && rank <= 1) top1 += 1;
    if (rank !== null && rank <= 3) top3 += 1;
    if (rank !== null && rank <= 6) top6 += 1;
  }

  return {
    total: GOLDEN_SEEDS.length,
    top1Recall: top1 / GOLDEN_SEEDS.length,
    top3Recall: top3 / GOLDEN_SEEDS.length,
    top6Recall: top6 / GOLDEN_SEEDS.length,
    topKMonotonicityPassed: top1 <= top3 && top3 <= top6,
  };
}

function runPairCase(pair: PairCase): PairResult {
  if (!gameById.has(pair.a) || !gameById.has(pair.b)) {
    return { pair: `${pair.a} vs ${pair.b}`, status: "skipped_missing_game" };
  }

  const seedA = seedByTarget.get(pair.a);
  const seedB = seedByTarget.get(pair.b);
  if (!seedA || !seedB) {
    return { pair: `${pair.a} vs ${pair.b}`, status: "skipped_missing_seed" };
  }

  const rankedA = rankAllWithFollowUps(seedA.answers, pair.aFollowUps);
  const rankedB = rankAllWithFollowUps(seedB.answers, pair.bFollowUps);
  const aSeedRanks = { a: rankOf(rankedA, pair.a), b: rankOf(rankedA, pair.b) };
  const bSeedRanks = { a: rankOf(rankedB, pair.a), b: rankOf(rankedB, pair.b) };
  const passed =
    aSeedRanks.a !== null &&
    aSeedRanks.b !== null &&
    bSeedRanks.a !== null &&
    bSeedRanks.b !== null &&
    aSeedRanks.a < aSeedRanks.b &&
    bSeedRanks.b < bSeedRanks.a;

  return {
    pair: `${pair.a} vs ${pair.b}`,
    status: passed ? "passed" : "failed",
    aSeedRanks,
    bSeedRanks,
  };
}

async function callApi(payload: unknown) {
  const route = await import("../src/app/api/recommend/route");
  const request = new Request("http://localhost/api/recommend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const response = await route.POST(request as Parameters<typeof route.POST>[0]);
  return { status: response.status, body: await response.json() };
}

function writeReports(report: unknown, pairResults: PairResult[]) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "v0.4-followup-before-after.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  const improved = pairResults.filter((item) => item.status === "passed");
  const unresolved = pairResults.filter((item) => item.status === "failed");
  const skipped = pairResults.filter((item) => item.status.startsWith("skipped"));
  const table = (headers: string[], rows: string[][]) => [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

  const markdown = [
    "# GameSeek Mini v0.4 Follow-up Before/After",
    "",
    "v0.4.0 is backend-only. It adds strategy sub-clusters and follow-up reranking without replacing the base scorer.",
    "",
    "## v0.3.4 Baseline",
    "",
    "- Baseline Top6Recall: `1`",
    "- v0.3.4 confusable A/B failed pairs: `49`",
    "- v0.3.4 strategy_buildcraft high-risk confusions: `146`",
    "",
    "## v0.4 Follow-up Scenario Results",
    "",
    `- Tested existing pair scenarios: \`${improved.length + unresolved.length}\``,
    `- Improved pair scenarios: \`${improved.length}\``,
    `- Still unresolved pair scenarios: \`${unresolved.length}\``,
    `- Skipped missing-game scenarios: \`${skipped.length}\``,
    "",
    "## Improved Pairs",
    "",
    improved.length
      ? table(
          ["Pair", "A seed ranks A/B", "B seed ranks B/A"],
          improved.map((item) => [
            item.pair,
            `${item.aSeedRanks?.a}/${item.aSeedRanks?.b}`,
            `${item.bSeedRanks?.b}/${item.bSeedRanks?.a}`,
          ]),
        )
      : "None.",
    "",
    "## Still Unresolved Pairs",
    "",
    unresolved.length
      ? table(
          ["Pair", "A seed ranks A/B", "B seed ranks B/A", "Reason"],
          unresolved.map((item) => [
            item.pair,
            `${item.aSeedRanks?.a}/${item.aSeedRanks?.b}`,
            `${item.bSeedRanks?.b}/${item.bSeedRanks?.a}`,
            "Current follow-up questions do not yet distinguish this pair strongly enough without exceeding rerank caps.",
          ]),
        )
      : "None.",
    "",
    "## Skipped Pairs",
    "",
    skipped.length ? table(["Pair", "Status"], skipped.map((item) => [item.pair, item.status])) : "None.",
    "",
    "## Strategy Ambiguity",
    "",
    "The targeted pair scenarios reduce ambiguity for most existing tested strategy/factory/tactics pairs, but this report does not claim the full v0.3.4 177-pair A/B failure count is solved. Full A/B reduction should be measured in a later v0.4.1 diagnostic pass.",
    "",
    "## Next",
    "",
    "- v0.4.1: frontend integration for displaying 1-3 follow-up questions.",
    "- v0.4.1 or v0.5: add a colony-management-specific follow-up to separate RimWorld / Oxygen Not Included / Frostpunk.",
  ].join("\n");

  fs.writeFileSync(path.join(reportsDir, "v0.4-followup-before-after.md"), `${markdown}\n`, "utf8");
}

async function main() {
  const errors: string[] = [];
  const baseline = baselineMetrics();

  assert(baseline.top6Recall === 1, `baseline Top6Recall must be 1, got ${baseline.top6Recall}`, errors);
  assert(baseline.topKMonotonicityPassed, "baseline TopKMonotonicityPassed must be true", errors);

  for (const seed of GOLDEN_SEEDS) {
    const base = ids(rankAll(seed.answers));
    const emptyFollowUp = ids(rankAllWithFollowUps(seed.answers, {}));
    const missingFollowUp = ids(rankAllWithFollowUps(seed.answers));
    assert(
      JSON.stringify(base) === JSON.stringify(emptyFollowUp),
      `${seed.id}: empty followUpAnswers must match rankAll order`,
      errors,
    );
    assert(
      JSON.stringify(base) === JSON.stringify(missingFollowUp),
      `${seed.id}: missing followUpAnswers must match rankAll order`,
      errors,
    );
  }

  const strategySeed = GOLDEN_SEEDS.find((seed) => seed.targetGameId === "slay-the-spire");
  assert(Boolean(strategySeed), "expected slay-the-spire seed", errors);
  if (strategySeed) {
    const selected = selectFollowUpQuestions(rankAll(strategySeed.answers));
    const uniqueIds = new Set(selected.map((question) => question.id));
    assert(selected.length <= 3, `selectFollowUpQuestions must return <= 3, got ${selected.length}`, errors);
    assert(uniqueIds.size === selected.length, "selectFollowUpQuestions must not return duplicates", errors);
  }

  assert(followUpQuestions.length >= 6, `expected at least 6 follow-up questions, got ${followUpQuestions.length}`, errors);

  const pairResults = pairCases.map(runPairCase);
  const failedPairs = pairResults.filter((item) => item.status === "failed");
  const testedPairs = pairResults.filter((item) => item.status === "passed" || item.status === "failed");
  assert(testedPairs.length > 0, "expected at least one existing pair to be tested", errors);
  assert(failedPairs.length <= 2, `expected <= 2 failed existing pairs, got ${failedPairs.length}`, errors);

  const factorySeed = seedByTarget.get("factorio");
  if (factorySeed) {
    const ranked = rankAllWithFollowUps(factorySeed.answers, { F_STRATEGY_SUBCLUSTER: "factory_automation" });
    const top3 = ranked.slice(0, 3).map((item) => item.game);
    const unrelated = top3.filter((game) => game.cluster !== "strategy_buildcraft" && game.cluster !== "sandbox_factory");
    assert(unrelated.length === 0, `factory follow-up pushed unrelated games into Top3: ${unrelated.map((game) => game.id).join(", ")}`, errors);
  }

  const apiSeed = seedByTarget.get("factorio") ?? GOLDEN_SEEDS[0];
  const oldApi = await callApi({ answers: apiSeed.answers });
  const oldApiIds = (oldApi.body.results ?? []).map((item: { id: string }) => item.id);
  const expectedOldApiIds = rankAll(apiSeed.answers).slice(0, 6).map((item) => item.game.id);
  assert(oldApi.status === 200, `old API request must return 200, got ${oldApi.status}`, errors);
  assert(JSON.stringify(oldApiIds) === JSON.stringify(expectedOldApiIds), "old API request without followUpAnswers must match rankAll Top6", errors);
  assert("needsFollowUp" in oldApi.body, "API response should include needsFollowUp", errors);

  const newApi = await callApi({
    answers: apiSeed.answers,
    followUpAnswers: { F_STRATEGY_SUBCLUSTER: "factory_automation" },
  });
  assert(newApi.status === 200, `new API request with followUpAnswers must return 200, got ${newApi.status}`, errors);
  assert(Array.isArray(newApi.body.results) && newApi.body.results.length === 6, "new API request must return 6 results", errors);

  const report = {
    passed: errors.length === 0,
    baseline,
    followUpQuestionCount: followUpQuestions.length,
    v034Baseline: {
      confusableAbFailed: 49,
      strategyBuildcraftHighRiskConfusions: 146,
    },
    pairSummary: {
      tested: testedPairs.length,
      passed: pairResults.filter((item) => item.status === "passed").length,
      failed: failedPairs.length,
      skipped: pairResults.filter((item) => item.status.startsWith("skipped")).length,
    },
    pairResults,
    errors,
  };

  writeReports(report, pairResults);

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
