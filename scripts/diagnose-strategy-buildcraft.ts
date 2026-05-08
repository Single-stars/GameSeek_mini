import fs from "node:fs";
import path from "node:path";

import * as gamesModule from "../src/lib/gameseek/games";
import * as questionsModule from "../src/lib/gameseek/questions";
import * as scoringModule from "../src/lib/gameseek/scoring";
import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

type AnyRecord = Record<string, unknown>;
type GameLike = {
  id: string;
  title: string;
  cluster: string;
  tags: string[];
  antiTags: string[];
  discriminatorTags: string[];
  confusableWith: string[];
};
type OptionLike = {
  id: string;
  tags?: string[];
  antiTags?: string[];
};
type QuestionLike = {
  id: string;
  options: OptionLike[];
};
type GoldenSeed = {
  id: string;
  targetGameId: string;
  persona: string;
  answers: Record<string, string>;
};
type RecommendationLike = {
  game: GameLike;
  score: number;
  matchedTags: string[];
  blockedBy: string[];
};

type FailureReason =
  | "seed_too_generic"
  | "missing_discriminator_tags"
  | "overlapping_discriminator_tags"
  | "confusable_games_under_suppressed"
  | "target_metadata_too_broad"
  | "candidate_metadata_too_broad"
  | "question_space_insufficient";

type CandidateDiagnostic = {
  rank: number;
  gameId: string;
  title: string;
  score: number;
  scoreDeltaVsTarget: number;
  matchedTags: string[];
  blockedBy: string[];
  sharedTags: string[];
  sharedDiscriminatorTags: string[];
  confusableWithTarget: boolean;
  isV03AddedStrategyGame: boolean;
  primaryCluster: string;
  secondaryClusters: string[];
};

type FailureDiagnostic = {
  seedId: string;
  targetGameId: string;
  targetTitle: string;
  targetRank: number | null;
  targetScore: number | null;
  targetMatchedTags: string[];
  top6: CandidateDiagnostic[];
  targetTags: string[];
  targetDiscriminatorTags: string[];
  targetConfusableWith: string[];
  targetPrimaryCluster: string;
  targetSecondaryClusters: string[];
  selectedAnswerTags: string[];
  selectedAntiTags: string[];
  targetDiscriminatorTagsExpressedByAnswers: string[];
  targetDiscriminatorTagsMissingFromAnswers: string[];
  v03StrategyCandidatesInTop6: string[];
  confusableCandidatesInTop6: string[];
  likelyFailureReason: FailureReason;
  diagnosticFinding: string;
  recommendedAction: string;
  includedBecause: string[];
};

const V03_ADDED_STRATEGY_GAME_IDS = new Set([
  "against-the-storm",
  "oxygen-not-included",
  "anno-1800",
  "frostpunk",
  "they-are-billions",
  "age-of-empires-iv",
  "total-war-warhammer-iii",
  "xcom-2",
  "fire-emblem-engage",
  "tactics-ogre-reborn",
  "triangle-strategy",
  "marvels-midnight-suns",
  "loop-hero",
  "dicey-dungeons",
  "wildfrost",
  "griftlands",
  "peglin",
  "backpack-hero",
  "dome-keeper",
  "northgard",
]);

const COMMON_TAG_RATIO = 0.18;
const REPORT_JSON = "reports/v0.3.1-strategy-buildcraft-diagnostics.json";
const REPORT_MD = "reports/v0.3.1-strategy-buildcraft-diagnostics.md";

function pickArrayExport<T>(moduleValue: Record<string, unknown>, names: string[]): T[] {
  for (const name of names) {
    const value = moduleValue[name];
    if (Array.isArray(value)) return value as T[];
  }
  throw new Error(`Cannot find array export. Tried: ${names.join(", ")}`);
}

function pickFunctionExport<T extends (...args: never[]) => unknown>(moduleValue: Record<string, unknown>, names: string[]): T {
  for (const name of names) {
    const value = moduleValue[name];
    if (typeof value === "function") return value as T;
  }
  throw new Error(`Cannot find function export. Tried: ${names.join(", ")}`);
}

const games = pickArrayExport<GameLike>(gamesModule as Record<string, unknown>, ["games", "GAMES", "gamePool", "GAME_POOL"]);
const questions = pickArrayExport<QuestionLike>(questionsModule as Record<string, unknown>, ["questions", "QUESTIONS", "gameSeekQuestions", "GAMESEEK_QUESTIONS"]);
const goldenSeeds = pickArrayExport<GoldenSeed>(seedsModule as Record<string, unknown>, ["goldenSeeds", "GOLDEN_SEEDS", "seeds", "SEEDS"]);
const rankAll = pickFunctionExport<(answers: Record<string, string>) => RecommendationLike[]>(
  scoringModule as Record<string, unknown>,
  ["rankAll"],
);

const gameById = new Map(games.map((game) => [game.id, game]));
const optionByQuestion = new Map(questions.map((question) => [
  question.id,
  new Map(question.options.map((option) => [option.id, option])),
]));

function asSet(values: string[] | undefined) {
  return new Set((values ?? []).filter(Boolean));
}

function intersection(a: Iterable<string>, b: Iterable<string>) {
  const bSet = new Set(b);
  return [...a].filter((item) => bSet.has(item));
}

function tagFrequency() {
  const frequency = new Map<string, number>();
  for (const game of games) {
    for (const tag of game.tags ?? []) {
      frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
    }
  }
  return frequency;
}

const frequencies = tagFrequency();

function selectedSignals(seed: GoldenSeed) {
  const tags = new Set<string>();
  const antiTags = new Set<string>();

  for (const [questionId, optionId] of Object.entries(seed.answers)) {
    const option = optionByQuestion.get(questionId)?.get(optionId);
    if (!option) continue;
    for (const tag of option.tags ?? []) tags.add(tag);
    for (const tag of option.antiTags ?? []) antiTags.add(tag);
  }

  return {
    tags: [...tags].sort(),
    antiTags: [...antiTags].sort(),
  };
}

function isConfusable(target: GameLike, candidate: GameLike) {
  return target.confusableWith.includes(candidate.id) || candidate.confusableWith.includes(target.id);
}

function inferSecondaryClusters(game: GameLike) {
  const tags = asSet(game.tags);
  const result: string[] = [];

  if (["deckbuilder", "card_game", "run_based", "roguelike"].some((tag) => tags.has(tag))) result.push("deckbuilder_roguelike");
  if (["tactics", "turn_based", "perfect_information", "squad_building"].some((tag) => tags.has(tag))) result.push("tactics_turn_based");
  if (["city_builder", "colony_sim", "management", "resource_management"].some((tag) => tags.has(tag))) result.push("city_colony_management");
  if (["rts", "grand_strategy", "macro_planning", "empire_building"].some((tag) => tags.has(tag))) result.push("rts_grand_strategy");
  if (["tower_defense", "base_defense", "horde_survival"].some((tag) => tags.has(tag))) result.push("defense_survival");
  if (["factory", "automation", "resource_chain"].some((tag) => tags.has(tag))) result.push("factory_automation");
  if (["story", "dialogue", "choice_consequence", "character_bond"].some((tag) => tags.has(tag))) result.push("narrative_strategy");
  if (["short_session", "fast_feedback", "mini_games"].some((tag) => tags.has(tag))) result.push("short_loop");

  return [...new Set(result)].sort();
}

function commonTagsFor(game: GameLike) {
  return (game.tags ?? []).filter((tag) => ((frequencies.get(tag) ?? 0) / games.length) >= COMMON_TAG_RATIO);
}

function classifyFailure(input: {
  target: GameLike;
  targetRank: number | null;
  targetMatchedTags: string[];
  selectedTags: string[];
  top6: CandidateDiagnostic[];
}) {
  const targetCommonTags = commonTagsFor(input.target);
  const confusableCount = input.top6.filter((candidate) => candidate.confusableWithTarget).length;
  const v03Count = input.top6.filter((candidate) => candidate.isV03AddedStrategyGame).length;
  const sharedDiscriminatorCount = input.top6.reduce((sum, candidate) => sum + candidate.sharedDiscriminatorTags.length, 0);
  const targetDiscriminatorTags = input.target.discriminatorTags ?? [];
  const expressedDiscriminatorTags = intersection(targetDiscriminatorTags, input.selectedTags);
  const targetCommonRatio = targetCommonTags.length / Math.max(1, input.target.tags.length);
  const maxSharedTags = Math.max(0, ...input.top6.map((candidate) => candidate.sharedTags.length));

  if (confusableCount >= 2) {
    return {
      reason: "confusable_games_under_suppressed" as FailureReason,
      finding: `Top6 contains ${confusableCount} declared confusable games, so the current transparent tag ranking cannot separate close neighbors for this seed.`,
      action: "In v0.3.2, inspect the confusable relations first. Do not add algorithmic suppression yet; either tighten confusableWith or add a narrow seed/metadata distinction for the target.",
    };
  }

  if (sharedDiscriminatorCount >= 2) {
    return {
      reason: "overlapping_discriminator_tags" as FailureReason,
      finding: `Top6 shares ${sharedDiscriminatorCount} discriminator tags with the target, indicating that some discriminator tags are not actually separating this sub-cluster.`,
      action: "In v0.3.2, rewrite the overlapping discriminatorTags so they describe mechanics that separate the target from its nearest neighbors.",
    };
  }

  if (targetDiscriminatorTags.length < 3) {
    return {
      reason: "missing_discriminator_tags" as FailureReason,
      finding: "The target has fewer than three discriminatorTags, so metadata cannot support reliable sub-cluster diagnosis.",
      action: "Add 1-3 concrete discriminatorTags that describe the target's unique loop before touching scoring tags.",
    };
  }

  if (input.targetMatchedTags.length <= 3 && expressedDiscriminatorTags.length === 0) {
    return {
      reason: "question_space_insufficient" as FailureReason,
      finding: `The target only matched ${input.targetMatchedTags.length} scoring tags and none of its discriminatorTags are expressible by the current answer tags.`,
      action: "Do not force global scoring changes. If this pattern repeats, add a v0.4 strategy-specific follow-up question or make the generated seed more specific where the current 12 questions already allow it.",
    };
  }

  if (targetCommonRatio >= 0.5) {
    return {
      reason: "target_metadata_too_broad" as FailureReason,
      finding: `At least half of target tags are common tags (${targetCommonTags.join(", ")}), so the target is easy to suppress with generic strategy answers.`,
      action: "Replace 1-3 broad target scoring tags with more specific tags only if those tags are already represented by current questions; otherwise leave scoring alone and document question-space limits.",
    };
  }

  if (v03Count >= 2) {
    return {
      reason: "candidate_metadata_too_broad" as FailureReason,
      finding: `Top6 contains ${v03Count} v0.3 added strategy games above the target, indicating broad candidate tags are still pulling unrelated seeds upward.`,
      action: "For v0.3.2, review the candidates above the target and remove only demonstrably over-broad scoring tags from those candidates.",
    };
  }

  if (maxSharedTags >= 4) {
    return {
      reason: "seed_too_generic" as FailureReason,
      finding: `The strongest suppressor shares ${maxSharedTags} scoring tags with the target, but the seed does not express a target-specific discriminator.`,
      action: "Prefer seed refinement before changing scoring. Make the generated or curated seed select answers that emphasize the target's distinct loop when current questions support it.",
    };
  }

  return {
    reason: "seed_too_generic" as FailureReason,
    finding: "The failure is mainly driven by broad seed-level strategy preferences rather than a single broken metadata field.",
    action: "Use this sample as a v0.3.2 seed-specific calibration candidate before considering broader metadata or question changes.",
  };
}

function diagnoseFailure(seed: GoldenSeed, ranked: RecommendationLike[]): FailureDiagnostic {
  const target = gameById.get(seed.targetGameId);
  if (!target) throw new Error(`Unknown targetGameId: ${seed.targetGameId}`);

  const targetRankIndex = ranked.findIndex((recommendation) => recommendation.game.id === seed.targetGameId);
  const targetRank = targetRankIndex >= 0 ? targetRankIndex + 1 : null;
  const targetRecommendation = targetRankIndex >= 0 ? ranked[targetRankIndex] : null;
  const targetScore = targetRecommendation?.score ?? null;
  const selected = selectedSignals(seed);

  const top6: CandidateDiagnostic[] = ranked.slice(0, 6).map((recommendation, index) => {
    const candidate = recommendation.game;
    return {
      rank: index + 1,
      gameId: candidate.id,
      title: candidate.title,
      score: recommendation.score,
      scoreDeltaVsTarget: targetScore === null ? 0 : recommendation.score - targetScore,
      matchedTags: recommendation.matchedTags,
      blockedBy: recommendation.blockedBy,
      sharedTags: intersection(target.tags, candidate.tags).sort(),
      sharedDiscriminatorTags: intersection(target.discriminatorTags, candidate.discriminatorTags).sort(),
      confusableWithTarget: isConfusable(target, candidate),
      isV03AddedStrategyGame: V03_ADDED_STRATEGY_GAME_IDS.has(candidate.id),
      primaryCluster: candidate.cluster,
      secondaryClusters: inferSecondaryClusters(candidate),
    };
  });

  const expressedDiscriminators = intersection(target.discriminatorTags, selected.tags).sort();
  const classification = classifyFailure({
    target,
    targetRank,
    targetMatchedTags: targetRecommendation?.matchedTags ?? [],
    selectedTags: selected.tags,
    top6,
  });

  const includedBecause: string[] = [];
  if (target.cluster === "strategy_buildcraft") includedBecause.push("target_cluster_strategy_buildcraft");
  if (top6.some((candidate) => candidate.isV03AddedStrategyGame)) includedBecause.push("top6_contains_v0.3_strategy_candidate");

  return {
    seedId: seed.id,
    targetGameId: target.id,
    targetTitle: target.title,
    targetRank,
    targetScore,
    targetMatchedTags: targetRecommendation?.matchedTags ?? [],
    top6,
    targetTags: [...target.tags],
    targetDiscriminatorTags: [...target.discriminatorTags],
    targetConfusableWith: [...target.confusableWith],
    targetPrimaryCluster: target.cluster,
    targetSecondaryClusters: inferSecondaryClusters(target),
    selectedAnswerTags: selected.tags,
    selectedAntiTags: selected.antiTags,
    targetDiscriminatorTagsExpressedByAnswers: expressedDiscriminators,
    targetDiscriminatorTagsMissingFromAnswers: target.discriminatorTags.filter((tag) => !expressedDiscriminators.includes(tag)),
    v03StrategyCandidatesInTop6: top6.filter((candidate) => candidate.isV03AddedStrategyGame).map((candidate) => candidate.gameId),
    confusableCandidatesInTop6: top6.filter((candidate) => candidate.confusableWithTarget).map((candidate) => candidate.gameId),
    likelyFailureReason: classification.reason,
    diagnosticFinding: classification.finding,
    recommendedAction: classification.action,
    includedBecause,
  };
}

function failureReasonCounts(failures: FailureDiagnostic[]) {
  return failures.reduce<Record<FailureReason, number>>((acc, failure) => {
    acc[failure.likelyFailureReason] = (acc[failure.likelyFailureReason] ?? 0) + 1;
    return acc;
  }, {} as Record<FailureReason, number>);
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}

function renderMarkdown(report: {
  summary: Record<string, unknown>;
  failureReasonCounts: Record<FailureReason, number>;
  failures: FailureDiagnostic[];
}) {
  const lines: string[] = [];
  lines.push("# GameSeek Mini v0.3.1 Strategy Buildcraft Diagnostics");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- total games: ${report.summary.totalGames}`);
  lines.push(`- strategy_buildcraft games: ${report.summary.strategyBuildcraftGames}`);
  lines.push(`- all Top6 failed samples: ${report.summary.allTop6Failures}`);
  lines.push(`- strategy target Top6 failed samples: ${report.summary.strategyTargetFailures}`);
  lines.push(`- Top6 failures with v0.3 strategy candidates above target: ${report.summary.failuresWithV03StrategyCandidates}`);
  lines.push(`- reports include all current Top6 failures so v0.3.2 can separate target-cluster issues from expansion side effects.`);
  lines.push("");
  lines.push("## Failure Type Distribution");
  lines.push("");
  for (const [reason, count] of Object.entries(report.failureReasonCounts)) {
    lines.push(`- ${reason}: ${count}`);
  }
  lines.push("");
  lines.push("## Failed Samples");
  lines.push("");

  report.failures.forEach((failure, index) => {
    lines.push(`### ${index + 1}. Target: ${failure.targetGameId}`);
    lines.push("");
    lines.push(`- target title: ${failure.targetTitle}`);
    lines.push(`- target primaryCluster: ${failure.targetPrimaryCluster}`);
    lines.push(`- target secondaryClusters: ${formatList(failure.targetSecondaryClusters)}`);
    lines.push(`- target rank: ${failure.targetRank ?? "not_found"}`);
    lines.push(`- target score: ${failure.targetScore ?? "not_found"}`);
    lines.push(`- included because: ${formatList(failure.includedBecause)}`);
    lines.push(`- v0.3 strategy candidates in Top6: ${formatList(failure.v03StrategyCandidatesInTop6)}`);
    lines.push(`- confusable candidates in Top6: ${formatList(failure.confusableCandidatesInTop6)}`);
    lines.push(`- target matched tags: ${formatList(failure.targetMatchedTags)}`);
    lines.push(`- target discriminatorTags: ${formatList(failure.targetDiscriminatorTags)}`);
    lines.push(`- discriminatorTags expressed by answers: ${formatList(failure.targetDiscriminatorTagsExpressedByAnswers)}`);
    lines.push("");
    lines.push("Top6:");
    lines.push("");
    for (const candidate of failure.top6) {
      lines.push(`${candidate.rank}. ${candidate.gameId} (${candidate.score}, delta ${candidate.scoreDeltaVsTarget >= 0 ? "+" : ""}${candidate.scoreDeltaVsTarget})`);
      lines.push(`   - primaryCluster: ${candidate.primaryCluster}`);
      lines.push(`   - secondaryClusters: ${formatList(candidate.secondaryClusters)}`);
      lines.push(`   - v0.3 added strategy game: ${candidate.isV03AddedStrategyGame}`);
      lines.push(`   - confusableWithTarget: ${candidate.confusableWithTarget}`);
      lines.push(`   - sharedTags: ${formatList(candidate.sharedTags)}`);
      lines.push(`   - sharedDiscriminatorTags: ${formatList(candidate.sharedDiscriminatorTags)}`);
    }
    lines.push("");
    lines.push("Diagnostic finding:");
    lines.push("");
    lines.push(`- ${failure.likelyFailureReason}: ${failure.diagnosticFinding}`);
    lines.push("");
    lines.push("Recommended action:");
    lines.push("");
    lines.push(`- ${failure.recommendedAction}`);
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

function main() {
  const failures: FailureDiagnostic[] = [];
  let strategyBuildcraftGames = 0;

  for (const game of games) {
    if (game.cluster === "strategy_buildcraft") strategyBuildcraftGames += 1;
  }

  for (const seed of goldenSeeds) {
    const ranked = rankAll(seed.answers);
    const rankIndex = ranked.findIndex((recommendation) => recommendation.game.id === seed.targetGameId);
    const targetRank = rankIndex >= 0 ? rankIndex + 1 : null;
    if (targetRank !== null && targetRank <= 6) continue;

    const target = gameById.get(seed.targetGameId);
    if (!target) continue;
    const top6 = ranked.slice(0, 6);
    const hasV03StrategyCandidate = top6.some((recommendation) => V03_ADDED_STRATEGY_GAME_IDS.has(recommendation.game.id));

    if (target.cluster === "strategy_buildcraft" || hasV03StrategyCandidate) {
      failures.push(diagnoseFailure(seed, ranked));
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scope: {
      branch: "mini-v0.3.1-strategy-buildcraft-diagnostics",
      primaryCluster: "strategy_buildcraft",
      note: "Includes all Top6 failures whose target is strategy_buildcraft or whose Top6 contains a v0.3 added strategy_buildcraft candidate.",
      noAlgorithmChange: true,
      scoringReused: "rankAll from src/lib/gameseek/scoring.ts",
    },
    summary: {
      totalGames: games.length,
      strategyBuildcraftGames,
      allTop6Failures: failures.length,
      strategyTargetFailures: failures.filter((failure) => failure.targetPrimaryCluster === "strategy_buildcraft").length,
      failuresWithV03StrategyCandidates: failures.filter((failure) => failure.v03StrategyCandidatesInTop6.length > 0).length,
    },
    failureReasonCounts: failureReasonCounts(failures),
    failures,
  };

  const root = process.cwd();
  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  fs.writeFileSync(path.join(root, REPORT_JSON), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(root, REPORT_MD), renderMarkdown(report), "utf8");
  console.log(JSON.stringify({
    wrote: [REPORT_JSON, REPORT_MD],
    summary: report.summary,
    failureReasonCounts: report.failureReasonCounts,
  }, null, 2));
}

main();
