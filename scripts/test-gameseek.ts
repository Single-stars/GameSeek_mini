import * as gamesModule from "../src/lib/gameseek/games";
import * as questionsModule from "../src/lib/gameseek/questions";
import * as scoringModule from "../src/lib/gameseek/scoring";
import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

type AnyRecord = Record<string, unknown>;
type GameLike = AnyRecord & {
  id: string;
  title?: string;
  cluster?: string;
  tags?: string[];
  antiTags?: string[];
  discriminatorTags?: string[];
  confusableWith?: string[];
};
type OptionLike = AnyRecord & { id: string; label?: string; tags?: string[]; antiTags?: string[] };
type QuestionLike = AnyRecord & { id: string; options: OptionLike[] };
type GoldenSeed = { id: string; targetGameId: string; persona: string; answers: Record<string, string> };
type FailureReason =
  | "game_tags_too_generic"
  | "question_mapping_too_weak"
  | "anti_tags_too_strong"
  | "confusable_game_suppression"
  | "seed_answer_too_generic";

type Failure = {
  seedId: string;
  targetGameId: string;
  targetTitle: string;
  rank: number | null;
  top6: string[];
  reason: FailureReason;
  evidence: string[];
};

type ClusterStats = {
  total: number;
  top1Hits: number;
  top3Hits: number;
  top6Hits: number;
  top1Recall: number;
  top3Recall: number;
  top6Recall: number;
};

type NearMiss = {
  seedId: string;
  target: string;
  rank: number;
  top6: string[];
  reason: FailureReason;
};

type ConfusablePair = {
  target: string;
  candidate: string;
  count: number;
  seedIds: string[];
};

type ConfusableFailure = {
  seedId: string;
  target: string;
  rank: number | null;
  top6: string[];
  confusableHitsInTop6: string[];
  predictedAbove: string[];
  sharedTagsWithTop1: string[];
  missingDiscriminatorTags: string[];
};

function getArray<T>(moduleValue: Record<string, unknown>, names: string[]): T[] {
  for (const name of names) {
    const value = moduleValue[name];
    if (Array.isArray(value)) return value as T[];
  }
  throw new Error(`Cannot find array export. Tried: ${names.join(", ")}`);
}

const games = getArray<GameLike>(gamesModule as Record<string, unknown>, ["games", "GAMES", "gamePool", "GAME_POOL"]);
const questions = getArray<QuestionLike>(questionsModule as Record<string, unknown>, ["questions", "QUESTIONS", "gameSeekQuestions", "GAMESEEK_QUESTIONS"]);
const goldenSeeds = getArray<GoldenSeed>(seedsModule as Record<string, unknown>, ["goldenSeeds", "GOLDEN_SEEDS", "seeds", "SEEDS"]);

const gameById = new Map(games.map((game) => [game.id, game]));
const questionById = new Map(questions.map((question) => [question.id, question]));
const optionByQuestion = new Map(questions.map((question) => [question.id, new Map(question.options.map((option) => [option.id, option]))]));
const allQuestionIds = questions.map((question) => question.id);

function normalizeTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^tag:/, "");
  if (!cleaned) return null;
  return cleaned;
}

function tagSetFromArray(values: unknown): Set<string> {
  const result = new Set<string>();
  if (!Array.isArray(values)) return result;
  for (const value of values) {
    const tag = normalizeTag(value);
    if (tag) result.add(tag);
  }
  return result;
}

function scoringTagSets(value: { tags?: unknown; antiTags?: unknown }) {
  return {
    positive: tagSetFromArray(value.tags),
    negative: tagSetFromArray(value.antiTags),
  };
}

function intersection(a: Set<string>, b: Set<string>) {
  return [...a].filter((item) => b.has(item));
}

function asAnswerString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function validateSeeds() {
  const errors: string[] = [];
  const seenTargets = new Set<string>();

  if (games.length !== 60) errors.push(`Mini v0.1 expects 60 games, got ${games.length}`);
  if (questions.length !== 12) errors.push(`Mini v0.1 expects 12 questions, got ${questions.length}`);
  for (const seed of goldenSeeds) {
    if (!gameById.has(seed.targetGameId)) errors.push(`${seed.id}: unknown targetGameId ${seed.targetGameId}`);
    if (seenTargets.has(seed.targetGameId)) errors.push(`${seed.id}: duplicate targetGameId ${seed.targetGameId}`);
    seenTargets.add(seed.targetGameId);
    if (!seed.persona || seed.persona.trim().length < 24) errors.push(`${seed.id}: persona is not human-readable enough`);

    for (const questionId of allQuestionIds) {
      const selected = asAnswerString(seed.answers[questionId]);
      if (!selected) {
        errors.push(`${seed.id}: missing single-string answer for ${questionId}`);
        continue;
      }
      if (!optionByQuestion.get(questionId)?.has(selected)) errors.push(`${seed.id}: illegal option ${questionId}:${selected}`);
    }
    for (const questionId of Object.keys(seed.answers)) {
      if (!questionById.has(questionId)) errors.push(`${seed.id}: illegal question id ${questionId}`);
    }
  }

  if (goldenSeeds.length !== games.length) errors.push(`expected one seed per game: games=${games.length}, seeds=${goldenSeeds.length}`);
  if (seenTargets.size !== games.length) errors.push(`expected ${games.length} unique targets, got ${seenTargets.size}`);

  if (errors.length) {
    throw new Error(`Golden seed validation failed:\n${errors.map((item) => `- ${item}`).join("\n")}`);
  }
}

function getRecommendationFunction(nameCandidates: string[]) {
  for (const name of nameCandidates) {
    const value = (scoringModule as AnyRecord)[name];
    if (typeof value === "function") return value as (...args: unknown[]) => unknown;
  }
  return null;
}

function normalizeRecommendations(raw: unknown): string[] {
  const container = raw as AnyRecord;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(container?.recommendations)
      ? container.recommendations
      : Array.isArray(container?.results)
        ? container.results
        : Array.isArray(container?.items)
          ? container.items
          : Array.isArray(container?.top)
            ? container.top
            : [];
  return list.map((item) => {
    const row = item as AnyRecord;
    const game = row.game as AnyRecord | undefined;
    return String(row.id ?? row.gameId ?? game?.id ?? "");
  }).filter(Boolean);
}

function callForIds(fn: (...args: unknown[]) => unknown, attempts: unknown[][]) {
  let lastError: unknown = null;
  for (const args of attempts) {
    try {
      const ids = normalizeRecommendations(fn(...args));
      if (ids.length) return ids;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Recommendation function returned no recognizable list. Last error: ${String(lastError)}`);
}

function runRanked(seed: GoldenSeed): string[] {
  const rankAll = getRecommendationFunction(["rankAll", "rankGames", "scoreAllRecommendations"]);
  if (rankAll) {
    return callForIds(rankAll, [[seed.answers], [{ answers: seed.answers }]]);
  }

  const recommend = getRecommendationFunction(["recommendGames", "recommend", "computeRecommendations", "getRecommendations", "scoreRecommendations"]);
  if (!recommend) throw new Error("Cannot find rankAll or recommendation function in scoring.ts");
  return callForIds(recommend, [[seed.answers, games.length], [{ answers: seed.answers, limit: games.length }], [seed.answers]]);
}

function selectedOptionTags(seed: GoldenSeed) {
  const positive = new Set<string>();
  const negative = new Set<string>();
  for (const [questionId, optionId] of Object.entries(seed.answers)) {
    const option = optionByQuestion.get(questionId)?.get(optionId);
    if (!option) continue;
    for (const tag of scoringTagSets(option).positive) positive.add(tag);
    for (const tag of scoringTagSets(option).negative) negative.add(tag);
  }
  return { positive, negative };
}

function tagFrequency() {
  const frequency = new Map<string, number>();
  for (const game of games) {
    for (const tag of scoringTagSets(game).positive) frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
  }
  return frequency;
}

const frequencies = tagFrequency();

function isConfusable(target: GameLike, candidateId: string) {
  const candidate = gameById.get(candidateId);
  if (!candidate) return false;
  return Boolean(target.confusableWith?.includes(candidateId) || candidate.confusableWith?.includes(target.id));
}

function explainFailure(seed: GoldenSeed, rankedIds: string[], rank: number | null): Failure {
  const target = gameById.get(seed.targetGameId);
  const topIds = rankedIds.slice(0, 6);
  if (!target) {
    return { seedId: seed.id, targetGameId: seed.targetGameId, targetTitle: seed.targetGameId, rank, top6: topIds, reason: "game_tags_too_generic", evidence: ["targetGameId not found in games.ts"] };
  }

  const targetTags = scoringTagSets(target);
  const answerTags = selectedOptionTags(seed);
  const targetPositive = targetTags.positive;
  const answerPositive = answerTags.positive;
  const shared = intersection(targetPositive, answerPositive);
  const antiHits = [...intersection(targetPositive, answerTags.negative), ...intersection(targetTags.negative, answerPositive)];
  const commonTargetTags = [...targetPositive].filter((tag) => (frequencies.get(tag) ?? 0) / games.length >= 0.35);
  const top1 = topIds[0] ? gameById.get(topIds[0]) : undefined;
  const top1Shared = top1 ? intersection(targetPositive, scoringTagSets(top1).positive) : [];

  let reason: FailureReason = "confusable_game_suppression";
  const evidence: string[] = [];

  if (antiHits.length) {
    reason = "anti_tags_too_strong";
    evidence.push(`selected/target anti-tag collision: ${antiHits.slice(0, 8).join(", ")}`);
  } else if (targetPositive.size < 3 || (commonTargetTags.length >= Math.max(3, targetPositive.size * 0.6))) {
    reason = "game_tags_too_generic";
    evidence.push(`target tags are sparse/common: targetTags=${[...targetPositive].join(", ") || "none"}; common=${commonTargetTags.join(", ") || "none"}`);
  } else if (shared.length < 2) {
    reason = "question_mapping_too_weak";
    evidence.push(`seed answers share too few tags with target: shared=${shared.join(", ") || "none"}`);
  } else if (answerPositive.size < allQuestionIds.length * 0.45) {
    reason = "seed_answer_too_generic";
    evidence.push(`answer signal is too broad/low-information: uniqueAnswerTags=${answerPositive.size}, questions=${allQuestionIds.length}`);
  } else {
    evidence.push(`top1 appears confusable with target: top1=${topIds[0] ?? "none"}, sharedTags=${top1Shared.join(", ") || "none"}`);
  }

  evidence.push(`targetTags=${[...targetPositive].slice(0, 12).join(", ") || "none"}`);
  evidence.push(`answerTags=${[...answerPositive].slice(0, 12).join(", ") || "none"}`);

  return {
    seedId: seed.id,
    targetGameId: seed.targetGameId,
    targetTitle: String(target.title ?? target.id),
    rank,
    top6: topIds,
    reason,
    evidence,
  };
}

function emptyClusterStats(): Omit<ClusterStats, "top1Recall" | "top3Recall" | "top6Recall"> {
  return { total: 0, top1Hits: 0, top3Hits: 0, top6Hits: 0 };
}

function finalizeClusterStats(stats: Omit<ClusterStats, "top1Recall" | "top3Recall" | "top6Recall">): ClusterStats {
  return {
    ...stats,
    top1Recall: stats.total ? stats.top1Hits / stats.total : 0,
    top3Recall: stats.total ? stats.top3Hits / stats.total : 0,
    top6Recall: stats.total ? stats.top6Hits / stats.total : 0,
  };
}

function buildConfusableFailure(seed: GoldenSeed, rankedIds: string[], rank: number | null): ConfusableFailure | null {
  const target = gameById.get(seed.targetGameId);
  if (!target) return null;
  const top6 = rankedIds.slice(0, 6);
  const top1 = top6[0] ? gameById.get(top6[0]) : undefined;
  const targetTags = scoringTagSets(target).positive;
  const top1Tags = top1 ? scoringTagSets(top1).positive : new Set<string>();
  const answerTags = selectedOptionTags(seed).positive;
  const predictedAbove = rank === null
    ? top6
    : rankedIds.slice(0, Math.max(0, rank - 1));

  return {
    seedId: seed.id,
    target: seed.targetGameId,
    rank,
    top6,
    confusableHitsInTop6: top6.filter((id) => isConfusable(target, id)),
    predictedAbove,
    sharedTagsWithTop1: intersection(targetTags, top1Tags).slice(0, 8),
    missingDiscriminatorTags: (target.discriminatorTags ?? []).filter((tag) => !answerTags.has(tag)).slice(0, 6),
  };
}

function main() {
  validateSeeds();

  let top1Hits = 0;
  let top3Hits = 0;
  let top6Hits = 0;
  const failures: Failure[] = [];
  const nearMisses: NearMiss[] = [];
  const confusableFailureReport: ConfusableFailure[] = [];
  const confusablePairMap = new Map<string, ConfusablePair>();
  const clusterAccumulators = new Map<string, ReturnType<typeof emptyClusterStats>>();

  for (const seed of goldenSeeds) {
    const rankedIds = runRanked(seed);
    const top6 = rankedIds.slice(0, 6);
    const rankIndex = rankedIds.indexOf(seed.targetGameId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const hit1 = rank !== null && rank <= 1;
    const hit3 = rank !== null && rank <= 3;
    const hit6 = rank !== null && rank <= 6;
    if (hit1) top1Hits += 1;
    if (hit3) top3Hits += 1;
    if (hit6) top6Hits += 1;

    const target = gameById.get(seed.targetGameId);
    const cluster = target?.cluster ?? "unknown";
    const clusterStats = clusterAccumulators.get(cluster) ?? emptyClusterStats();
    clusterStats.total += 1;
    if (hit1) clusterStats.top1Hits += 1;
    if (hit3) clusterStats.top3Hits += 1;
    if (hit6) clusterStats.top6Hits += 1;
    clusterAccumulators.set(cluster, clusterStats);

    if (!hit6) {
      const failure = explainFailure(seed, rankedIds, rank);
      failures.push(failure);
      if (rank !== null && rank <= 10) {
        nearMisses.push({ seedId: seed.id, target: seed.targetGameId, rank, top6, reason: failure.reason });
      }

      const confusableFailure = buildConfusableFailure(seed, rankedIds, rank);
      if (confusableFailure) confusableFailureReport.push(confusableFailure);

      if (target) {
        for (const candidateId of top6.filter((id) => isConfusable(target, id))) {
          const key = `${seed.targetGameId}->${candidateId}`;
          const existing = confusablePairMap.get(key) ?? { target: seed.targetGameId, candidate: candidateId, count: 0, seedIds: [] };
          existing.count += 1;
          existing.seedIds.push(seed.id);
          confusablePairMap.set(key, existing);
        }
      }
    }
  }

  const total = goldenSeeds.length;
  const top1Recall = top1Hits / total;
  const top3Recall = top3Hits / total;
  const top6Recall = top6Hits / total;
  const topKMonotonicityPassed = top1Hits <= top3Hits && top3Hits <= top6Hits;
  const failureReasonCounts = failures.reduce<Record<FailureReason, number>>((acc, failure) => {
    acc[failure.reason] = (acc[failure.reason] ?? 0) + 1;
    return acc;
  }, {} as Record<FailureReason, number>);
  const passed = top1Recall >= 0.3 && top3Recall >= 0.5 && top6Recall >= 0.75 && topKMonotonicityPassed;

  const byCluster = Object.fromEntries(
    [...clusterAccumulators.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cluster, stats]) => [cluster, finalizeClusterStats(stats)]),
  );

  const global = {
    total,
    top1Recall,
    top3Recall,
    top6Recall,
    topKMonotonicityPassed,
    thresholds: {
      top1Recall: ">= 0.30",
      top3Recall: ">= 0.50",
      top6Recall: ">= 0.75",
      topKMonotonicityPassed: true,
    },
    passed,
    failureReasonCounts,
  };

  const report = {
    ...global,
    global,
    byCluster,
    nearMisses,
    confusablePairs: [...confusablePairMap.values()].sort((a, b) => b.count - a.count || a.target.localeCompare(b.target)),
    confusableFailureReport,
    failures,
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main();
