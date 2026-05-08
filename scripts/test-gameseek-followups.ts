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
  hardAssertion?: boolean;
  v040Status: "passed" | "failed" | "skipped_missing_game";
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
    v040Status: "passed",
  },
  {
    a: "slay-the-spire",
    b: "monster-train",
    aFollowUps: { F_DECKBUILDER_STYLE: "slay-the-spire" },
    bFollowUps: { F_DECKBUILDER_STYLE: "monster-train" },
    hardAssertion: true,
    v040Status: "failed",
  },
  {
    a: "balatro",
    b: "dicey-dungeons",
    aFollowUps: { F_DECKBUILDER_STYLE: "balatro" },
    bFollowUps: { F_DECKBUILDER_STYLE: "dicey-dungeons" },
    v040Status: "passed",
  },
  {
    a: "xcom-2",
    b: "into-the-breach",
    aFollowUps: { F_TACTICS_STYLE: "xcom-2" },
    bFollowUps: { F_TACTICS_STYLE: "into-the-breach" },
    v040Status: "passed",
  },
  {
    a: "tactics-ogre-reborn",
    b: "marvels-midnight-suns",
    aFollowUps: { F_TACTICS_STYLE: "tactics-ogre-reborn" },
    bFollowUps: { F_TACTICS_STYLE: "marvels-midnight-suns" },
    v040Status: "passed",
  },
  {
    a: "age-of-empires-iv",
    b: "total-war-warhammer-iii",
    aFollowUps: { F_RTS_GRAND_STYLE: "age-of-empires-iv" },
    bFollowUps: { F_RTS_GRAND_STYLE: "total-war-warhammer-iii" },
    v040Status: "passed",
  },
  {
    a: "civilization-vi",
    b: "age-of-empires-iv",
    aFollowUps: { F_RTS_GRAND_STYLE: "civilization-vi" },
    bFollowUps: { F_RTS_GRAND_STYLE: "age-of-empires-iv" },
    v040Status: "passed",
  },
  {
    a: "plants-vs-zombies",
    b: "bloons-td-6",
    aFollowUps: { F_DEFENSE_STYLE: "plants-vs-zombies" },
    bFollowUps: { F_DEFENSE_STYLE: "bloons-td-6" },
    v040Status: "skipped_missing_game",
  },
  {
    a: "cities-skylines",
    b: "frostpunk",
    aFollowUps: { F_STRATEGY_SUBCLUSTER: "city_colony_management" },
    bFollowUps: { F_DEFENSE_STYLE: "frostpunk" },
    v040Status: "skipped_missing_game",
  },
  {
    a: "rimworld",
    b: "oxygen-not-included",
    aFollowUps: { F_COLONY_MANAGEMENT_STYLE: "colony_storytelling" },
    bFollowUps: { F_COLONY_MANAGEMENT_STYLE: "engineering_systems" },
    hardAssertion: true,
    v040Status: "failed",
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
    path.join(reportsDir, "v0.4.1-followup-pair-hardening.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  const improved = pairResults.filter((item) => item.status === "passed");
  const unresolved = pairResults.filter((item) => item.status === "failed");
  const skipped = pairResults.filter((item) => item.status.startsWith("skipped"));
  const fixedSinceV040 = pairResults.filter((item) => {
    const pairCase = pairCases.find((candidate) => `${candidate.a} vs ${candidate.b}` === item.pair);
    return pairCase?.v040Status === "failed" && item.status === "passed";
  });
  const regressions = pairResults.filter((item) => {
    const pairCase = pairCases.find((candidate) => `${candidate.a} vs ${candidate.b}` === item.pair);
    return pairCase?.v040Status === "passed" && item.status !== "passed";
  });
  const table = (headers: string[], rows: string[][]) => [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

  const markdown = [
    "# GameSeek Mini v0.4.1 Follow-up Pair Hardening",
    "",
    "v0.4.1 hardens the two unresolved backend-only follow-up pair scenarios from v0.4.0 without changing the base scorer, the original 12 questions, golden seeds, game pool, API contract, or frontend.",
    "",
    "## v0.4.0 Pair Status",
    "",
    "- Passed pair scenarios: `6`",
    "- Failed pair scenarios: `2`",
    "- Skipped missing-game scenarios: `2`",
    "",
    "## v0.4.1 Pair Status",
    "",
    `- Tested existing pair scenarios: \`${improved.length + unresolved.length}\``,
    `- Passed pair scenarios: \`${improved.length}\``,
    `- Still failed pair scenarios: \`${unresolved.length}\``,
    `- Skipped missing-game scenarios: \`${skipped.length}\``,
    `- Fixed since v0.4.0: \`${fixedSinceV040.length}\``,
    `- Regressions from v0.4.0 passed pairs: \`${regressions.length}\``,
    "",
    "## Fixed Pairs",
    "",
    fixedSinceV040.length
      ? table(
          ["Pair", "A seed ranks A/B", "B seed ranks B/A"],
          fixedSinceV040.map((item) => [
            item.pair,
            `${item.aSeedRanks?.a}/${item.aSeedRanks?.b}`,
            `${item.bSeedRanks?.b}/${item.bSeedRanks?.a}`,
          ]),
        )
      : "None.",
    "",
    "## Passed Pairs",
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
    "## Regressions",
    "",
    regressions.length ? table(["Pair", "Status"], regressions.map((item) => [item.pair, item.status])) : "None.",
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
    "## Rerank Boundary",
    "",
    "- `rankAllWithFollowUps` still calls `rankAll` first.",
    "- Empty or missing `followUpAnswers` still has zero ordering effect.",
    "- Follow-up bonus cap remains `+16`.",
    "- Follow-up penalty floor remains `-12`.",
    "- This hardening only adjusts follow-up pair distinction, not the base scoring algorithm.",
    "",
    "## Next",
    "",
    "- v0.4.2: frontend integration for displaying 1-3 follow-up questions.",
    "- v0.5: broader robustness work if full 177-pair A/B diagnostics still show high-risk ambiguity.",
  ].join("\n");

  fs.writeFileSync(path.join(reportsDir, "v0.4.1-followup-pair-hardening.md"), `${markdown}\n`, "utf8");
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
  const hardFailedPairs = pairResults.filter((item) => {
    const pairCase = pairCases.find((candidate) => `${candidate.a} vs ${candidate.b}` === item.pair);
    return pairCase?.hardAssertion && item.status !== "passed";
  });
  const regressions = pairResults.filter((item) => {
    const pairCase = pairCases.find((candidate) => `${candidate.a} vs ${candidate.b}` === item.pair);
    return pairCase?.v040Status === "passed" && item.status !== "passed";
  });
  assert(testedPairs.length > 0, "expected at least one existing pair to be tested", errors);
  assert(failedPairs.length === 0, `expected 0 failed existing pairs, got ${failedPairs.length}`, errors);
  assert(hardFailedPairs.length === 0, `hard assertion pair failed: ${hardFailedPairs.map((item) => item.pair).join(", ")}`, errors);
  assert(regressions.length === 0, `v0.4.0 passed pair regressed: ${regressions.map((item) => item.pair).join(", ")}`, errors);

  const deckbuilderSeed = seedByTarget.get("slay-the-spire");
  if (deckbuilderSeed) {
    const selected = selectFollowUpQuestions(rankAll(deckbuilderSeed.answers)).map((question) => question.id);
    assert(
      selected.includes("F_DECKBUILDER_STYLE"),
      `deckbuilder confusion should select F_DECKBUILDER_STYLE, got ${selected.join(", ")}`,
      errors,
    );
  }

  const colonySeed = seedByTarget.get("rimworld");
  if (colonySeed) {
    const selected = selectFollowUpQuestions(rankAll(colonySeed.answers)).map((question) => question.id);
    assert(
      selected.includes("F_COLONY_MANAGEMENT_STYLE"),
      `colony-management confusion should select F_COLONY_MANAGEMENT_STYLE, got ${selected.join(", ")}`,
      errors,
    );
  }

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
    v040PairSummary: {
      tested: 8,
      passed: 6,
      failed: 2,
      skipped: 2,
      unresolvedPairs: ["slay-the-spire vs monster-train", "rimworld vs oxygen-not-included"],
    },
    pairSummary: {
      tested: testedPairs.length,
      passed: pairResults.filter((item) => item.status === "passed").length,
      failed: failedPairs.length,
      skipped: pairResults.filter((item) => item.status.startsWith("skipped")).length,
      fixedSinceV040: pairResults.filter((item) => {
        const pairCase = pairCases.find((candidate) => `${candidate.a} vs ${candidate.b}` === item.pair);
        return pairCase?.v040Status === "failed" && item.status === "passed";
      }).length,
      regressions: regressions.length,
    },
    rerankBoundary: {
      callsRankAllFirst: true,
      zeroEffectWhenFollowUpAnswersEmpty: true,
      maxFollowUpBonus: 16,
      minFollowUpPenalty: -12,
      closeExplicitPairSpread: 4,
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
