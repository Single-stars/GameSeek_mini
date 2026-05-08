import * as gamesModule from "../src/lib/gameseek/games";
import * as questionsModule from "../src/lib/gameseek/questions";
import * as scoringModule from "../src/lib/gameseek/scoring";
import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

type AnyRecord = Record<string, unknown>;
type GameLike = AnyRecord & { id: string; title?: string; tags?: string[]; antiTags?: string[] };
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

function extractTags(value: unknown, positive: Set<string>, negative: Set<string>, keyHint = "") {
  if (value == null) return;
  if (typeof value === "string") {
    const tag = normalizeTag(value);
    if (!tag) return;
    if (/anti|avoid|risk|forbid|exclude|negative/i.test(keyHint)) negative.add(tag);
    else positive.add(tag);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractTags(item, positive, negative, keyHint);
    return;
  }
  if (typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as AnyRecord)) {
    if (/label|text|title|summary|description|persona|note/i.test(key)) continue;
    if (/antiTags|anti_tags|avoidTags|avoid_tags|excludeTags|risks|risk/i.test(key)) extractTags(child, positive, negative, "anti");
    else if (/tags|tag|anchors|anchor|soft|rule|delta|profileDelta/i.test(key)) extractTags(child, positive, negative, key);
  }
}

function tagSets(value: unknown) {
  const positive = new Set<string>();
  const negative = new Set<string>();
  extractTags(value, positive, negative);
  return { positive, negative };
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

function getRecommendFunction() {
  const candidates = [
    "recommendGames",
    "recommend",
    "computeRecommendations",
    "getRecommendations",
    "scoreRecommendations",
  ];
  for (const name of candidates) {
    const value = (scoringModule as AnyRecord)[name];
    if (typeof value === "function") return value as (...args: unknown[]) => unknown;
  }
  throw new Error(`Cannot find recommendation function in scoring.ts. Tried: ${candidates.join(", ")}`);
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

function runRecommend(seed: GoldenSeed): string[] {
  const recommend = getRecommendFunction();
  const attempts: unknown[][] = [
    [seed.answers, 6],
    [{ answers: seed.answers, limit: 6 }],
    [seed.answers],
  ];
  let lastError: unknown = null;
  for (const args of attempts) {
    try {
      const ids = normalizeRecommendations(recommend(...args));
      if (ids.length) return ids;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Recommendation function returned no recognizable list for ${seed.id}. Last error: ${String(lastError)}`);
}

function selectedOptionTags(seed: GoldenSeed) {
  const positive = new Set<string>();
  const negative = new Set<string>();
  for (const [questionId, optionId] of Object.entries(seed.answers)) {
    const option = optionByQuestion.get(questionId)?.get(optionId);
    if (option) extractTags(option, positive, negative);
  }
  return { positive, negative };
}

function tagFrequency() {
  const frequency = new Map<string, number>();
  for (const game of games) {
    for (const tag of tagSets(game).positive) frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
  }
  return frequency;
}

const frequencies = tagFrequency();

function explainFailure(seed: GoldenSeed, topIds: string[], rank: number | null): Failure {
  const target = gameById.get(seed.targetGameId);
  if (!target) {
    return { seedId: seed.id, targetGameId: seed.targetGameId, targetTitle: seed.targetGameId, rank, top6: topIds, reason: "game_tags_too_generic", evidence: ["targetGameId not found in games.ts"] };
  }

  const targetTags = tagSets(target);
  const answerTags = selectedOptionTags(seed);
  const targetPositive = targetTags.positive;
  const answerPositive = answerTags.positive;
  const shared = intersection(targetPositive, answerPositive);
  const antiHits = [...intersection(targetPositive, answerTags.negative), ...intersection(targetTags.negative, answerPositive)];
  const commonTargetTags = [...targetPositive].filter((tag) => (frequencies.get(tag) ?? 0) / games.length >= 0.35);
  const top1 = topIds[0] ? gameById.get(topIds[0]) : undefined;
  const top1Shared = top1 ? intersection(targetPositive, tagSets(top1).positive) : [];

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
    top6: topIds.slice(0, 6),
    reason,
    evidence,
  };
}

function main() {
  validateSeeds();

  let top1Hits = 0;
  let top3Hits = 0;
  let top6Hits = 0;
  const failures: Failure[] = [];

  for (const seed of goldenSeeds) {
    const ids = runRecommend(seed);
    const rankIndex = ids.indexOf(seed.targetGameId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const hit1 = rank !== null && rank <= 1;
    const hit3 = rank !== null && rank <= 3;
    const hit6 = rank !== null && rank <= 6;
    if (hit1) top1Hits += 1;
    if (hit3) top3Hits += 1;
    if (hit6) top6Hits += 1;
    if (!hit6) failures.push(explainFailure(seed, ids, rank));
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

  const report = {
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
    passed: top1Recall >= 0.3 && top3Recall >= 0.5 && top6Recall >= 0.75 && topKMonotonicityPassed,
    failureReasonCounts,
    failures,
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main();
