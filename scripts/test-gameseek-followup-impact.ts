import { games } from "../src/lib/gameseek/games";
import { GOLDEN_SEEDS } from "../src/lib/gameseek/goldenSeeds";
import { rankAll } from "../src/lib/gameseek/scoring";
import { rankAllWithFollowUps } from "../src/lib/gameseek/followupScoring";

type Scenario = {
  id: string;
  seedGameId: string;
  targetGameId: string;
  comparedGameId: string;
  followUpAnswers: Record<string, string>;
  expectation: "target_not_below_compared" | "target_rank_improves";
  allowConfirmationOnly?: boolean;
};

const scenarios: Scenario[] = [
  {
    id: "slay_seed_classic_card_climb_confirms_slay",
    seedGameId: "slay-the-spire",
    targetGameId: "slay-the-spire",
    comparedGameId: "monster-train",
    followUpAnswers: { F_DECKBUILDER_STYLE: "slay-the-spire" },
    expectation: "target_not_below_compared",
    allowConfirmationOnly: true,
  },
  {
    id: "slay_seed_multifloor_train_improves_monster_train",
    seedGameId: "slay-the-spire",
    targetGameId: "monster-train",
    comparedGameId: "slay-the-spire",
    followUpAnswers: { F_DECKBUILDER_STYLE: "monster-train" },
    expectation: "target_rank_improves",
  },
  {
    id: "rimworld_seed_colony_storytelling_prefers_rimworld",
    seedGameId: "rimworld",
    targetGameId: "rimworld",
    comparedGameId: "oxygen-not-included",
    followUpAnswers: { F_COLONY_MANAGEMENT_STYLE: "colony_storytelling" },
    expectation: "target_not_below_compared",
  },
  {
    id: "rimworld_seed_engineering_systems_confirms_oxygen",
    seedGameId: "rimworld",
    targetGameId: "oxygen-not-included",
    comparedGameId: "rimworld",
    followUpAnswers: { F_COLONY_MANAGEMENT_STYLE: "engineering_systems" },
    expectation: "target_not_below_compared",
    allowConfirmationOnly: true,
  },
];

const gameIds = new Set(games.map((game) => game.id));
const seedByTarget = new Map(GOLDEN_SEEDS.map((seed) => [seed.targetGameId, seed]));

function rankOf(ranked: Array<{ game: { id: string } }>, gameId: string) {
  const index = ranked.findIndex((item) => item.game.id === gameId);
  return index >= 0 ? index + 1 : null;
}

function scoreOf(ranked: Array<{ game: { id: string }; score: number }>, gameId: string) {
  return ranked.find((item) => item.game.id === gameId)?.score ?? null;
}

function topIds(ranked: Array<{ game: { id: string } }>) {
  return ranked.slice(0, 6).map((item) => item.game.id);
}

function runScenario(scenario: Scenario) {
  if (!gameIds.has(scenario.targetGameId) || !gameIds.has(scenario.comparedGameId)) {
    return {
      scenario: scenario.id,
      status: "skipped_missing_game" as const,
      passed: true,
    };
  }

  const seed = seedByTarget.get(scenario.seedGameId);
  if (!seed) {
    return {
      scenario: scenario.id,
      status: "skipped_missing_seed" as const,
      passed: true,
    };
  }

  const before = rankAll(seed.answers);
  const after = rankAllWithFollowUps(seed.answers, scenario.followUpAnswers);
  const targetBeforeRank = rankOf(before, scenario.targetGameId);
  const targetAfterRank = rankOf(after, scenario.targetGameId);
  const comparedGameBeforeRank = rankOf(before, scenario.comparedGameId);
  const comparedGameAfterRank = rankOf(after, scenario.comparedGameId);
  const targetBeforeScore = scoreOf(before, scenario.targetGameId);
  const targetAfterScore = scoreOf(after, scenario.targetGameId);
  const comparedBeforeScore = scoreOf(before, scenario.comparedGameId);
  const comparedAfterScore = scoreOf(after, scenario.comparedGameId);

  const targetRankDelta =
    targetBeforeRank !== null && targetAfterRank !== null ? targetBeforeRank - targetAfterRank : 0;
  const comparedRankDelta =
    comparedGameBeforeRank !== null && comparedGameAfterRank !== null
      ? comparedGameBeforeRank - comparedGameAfterRank
      : 0;
  const targetScoreDelta =
    targetBeforeScore !== null && targetAfterScore !== null ? targetAfterScore - targetBeforeScore : 0;
  const comparedScoreDelta =
    comparedBeforeScore !== null && comparedAfterScore !== null ? comparedAfterScore - comparedBeforeScore : 0;
  const beforeOrder =
    targetBeforeRank !== null && comparedGameBeforeRank !== null
      ? targetBeforeRank < comparedGameBeforeRank
        ? "target_first"
        : "compared_first"
      : "missing";
  const afterOrder =
    targetAfterRank !== null && comparedGameAfterRank !== null
      ? targetAfterRank < comparedGameAfterRank
        ? "target_first"
        : "compared_first"
      : "missing";
  const orderChanged = beforeOrder !== afterOrder;
  const beforeTop6 = topIds(before);
  const afterTop6 = topIds(after);
  const top6Changed = JSON.stringify(beforeTop6) !== JSON.stringify(afterTop6);
  const rankDelta = targetRankDelta;
  const hasRankDelta = targetRankDelta !== 0 || comparedRankDelta !== 0;

  const expectationPassed =
    scenario.expectation === "target_rank_improves"
      ? targetRankDelta > 0
      : targetAfterRank !== null && comparedGameAfterRank !== null && targetAfterRank <= comparedGameAfterRank;

  const impactPassed =
    hasRankDelta ||
    orderChanged ||
    (scenario.allowConfirmationOnly &&
      expectationPassed &&
      (targetScoreDelta !== 0 || comparedScoreDelta !== 0));

  return {
    scenario: scenario.id,
    status: "tested" as const,
    beforeTop6,
    afterTop6,
    targetBeforeRank,
    targetAfterRank,
    comparedGameBeforeRank,
    comparedGameAfterRank,
    orderChanged,
    rankDelta,
    targetRankDelta,
    comparedRankDelta,
    targetScoreDelta,
    comparedScoreDelta,
    top6Changed,
    confirmationOnly: !hasRankDelta && !orderChanged && scenario.allowConfirmationOnly,
    passed: expectationPassed && impactPassed,
  };
}

const results = scenarios.map(runScenario);
const tested = results.filter((result) => result.status === "tested");
const visibleRankDeltaCount = tested.filter((result) => {
  if (!("targetRankDelta" in result)) return false;
  return result.targetRankDelta !== 0 || result.comparedRankDelta !== 0 || result.orderChanged;
}).length;
const errors: string[] = [];

for (const result of tested) {
  if (!result.passed) {
    errors.push(`${result.scenario} did not produce expected follow-up impact`);
  }
}

if (visibleRankDeltaCount < 2) {
  errors.push(`expected at least 2 scenarios with visible rank delta/order change, got ${visibleRankDeltaCount}`);
}

const report = {
  passed: errors.length === 0,
  visibleRankDeltaCount,
  requiredVisibleRankDeltaCount: 2,
  results,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
