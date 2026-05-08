import fs from "node:fs";
import path from "node:path";

import * as gamesModule from "../src/lib/gameseek/games";
import * as questionsModule from "../src/lib/gameseek/questions";
import * as scoringModule from "../src/lib/gameseek/scoring";
import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

export type AnyRecord = Record<string, unknown>;

export type GameLike = AnyRecord & {
  id: string;
  title: string;
  cluster: string;
  tags: string[];
  antiTags: string[];
  discriminatorTags: string[];
  confusableWith: string[];
};

export type OptionLike = {
  id: string;
  text?: string;
  tags?: string[];
  antiTags?: string[];
};

export type QuestionLike = {
  id: string;
  prompt?: string;
  options: OptionLike[];
};

export type GoldenSeedLike = {
  id: string;
  targetGameId: string;
  persona?: string;
  answers: Record<string, string>;
  curated?: boolean;
};

export type RankedCase = {
  seedId: string;
  targetGameId: string;
  cluster: string;
  rank: number | null;
  score: number | null;
  top1: string | null;
  top6: string[];
};

export type RecallSummary = {
  total: number;
  top1Recall: number;
  top3Recall: number;
  top6Recall: number;
  averageRank: number;
};

export const ROOT = process.cwd();
export const REPORTS_DIR = path.join(ROOT, "reports");

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

export const games = pickArrayExport<GameLike>(gamesModule as AnyRecord, ["games", "GAMES", "gamePool", "GAME_POOL"]);
export const questions = pickArrayExport<QuestionLike>(questionsModule as AnyRecord, [
  "questions",
  "QUESTIONS",
  "gameSeekQuestions",
  "GAMESEEK_QUESTIONS",
]);
export const goldenSeeds = pickArrayExport<GoldenSeedLike>(seedsModule as AnyRecord, [
  "goldenSeeds",
  "GOLDEN_SEEDS",
  "seeds",
  "SEEDS",
]);

const rankAll = pickFunctionExport<(answers: Record<string, string>) => Array<{ game: GameLike; score: number }>>(
  scoringModule as AnyRecord,
  ["rankAll"],
);

export const gameById = new Map(games.map((game) => [game.id, game]));
export const seedByTarget = new Map(goldenSeeds.map((seed) => [seed.targetGameId, seed]));
export const questionById = new Map(questions.map((question) => [question.id, question]));
export const optionIdsByQuestion = new Map(
  questions.map((question) => [question.id, new Set(question.options.map((option) => option.id))]),
);

export function ensureReportsDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export function writeJsonReport(fileName: string, value: unknown) {
  ensureReportsDir();
  const filePath = path.join(REPORTS_DIR, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

export function writeMarkdownReport(fileName: string, value: string) {
  ensureReportsDir();
  const filePath = path.join(REPORTS_DIR, fileName);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
  return filePath;
}

export function rankAnswers(answers: Record<string, string>, targetGameId: string): RankedCase & {
  rankedIds: string[];
  rankedScores: Record<string, number>;
} {
  const ranked = rankAll(answers);
  const rankedIds = ranked.map((item) => item.game.id);
  const rankIndex = rankedIds.indexOf(targetGameId);
  const target = rankIndex >= 0 ? ranked[rankIndex] : null;
  const targetGame = gameById.get(targetGameId);

  return {
    seedId: `seed-${targetGameId}`,
    targetGameId,
    cluster: targetGame?.cluster ?? "unknown",
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    score: target?.score ?? null,
    top1: ranked[0]?.game.id ?? null,
    top6: rankedIds.slice(0, 6),
    rankedIds,
    rankedScores: Object.fromEntries(ranked.map((item) => [item.game.id, item.score])),
  };
}

export function rankSeed(seed: GoldenSeedLike) {
  return { ...rankAnswers(seed.answers, seed.targetGameId), seedId: seed.id };
}

export function summarizeCases(cases: RankedCase[]): RecallSummary {
  const total = cases.length || 1;
  const fallbackRank = games.length + 1;
  const top1 = cases.filter((item) => item.rank !== null && item.rank <= 1).length;
  const top3 = cases.filter((item) => item.rank !== null && item.rank <= 3).length;
  const top6 = cases.filter((item) => item.rank !== null && item.rank <= 6).length;
  const rankSum = cases.reduce((sum, item) => sum + (item.rank ?? fallbackRank), 0);

  return {
    total: cases.length,
    top1Recall: top1 / total,
    top3Recall: top3 / total,
    top6Recall: top6 / total,
    averageRank: rankSum / total,
  };
}

export function summarizeByCluster(cases: RankedCase[]) {
  const groups = new Map<string, RankedCase[]>();
  for (const item of cases) {
    const rows = groups.get(item.cluster) ?? [];
    rows.push(item);
    groups.set(item.cluster, rows);
  }

  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cluster, rows]) => [cluster, summarizeCases(rows)]),
  );
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeterministic<T>(items: T[], seed: string) {
  const random = seededRandom(seed);
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function mutateAnswers(baseAnswers: Record<string, string>, changeCount: number, seed: string) {
  const answers = { ...baseAnswers };
  const random = seededRandom(seed);
  const questionIds = shuffleDeterministic(questions.map((question) => question.id), `${seed}:questions`).slice(0, changeCount);

  for (const questionId of questionIds) {
    const question = questionById.get(questionId);
    if (!question) continue;
    const candidates = question.options.filter((option) => option.id !== answers[questionId]);
    if (!candidates.length) continue;
    const selected = candidates[Math.floor(random() * candidates.length)];
    answers[questionId] = selected.id;
  }

  return { answers, changedQuestionIds: questionIds };
}

export function topOverlap(a: string[], b: string[]) {
  const bSet = new Set(b);
  return a.filter((id) => bSet.has(id)).length;
}

export function sharedTags(a: GameLike, b: GameLike) {
  const bTags = new Set(b.tags ?? []);
  return (a.tags ?? []).filter((tag) => bTags.has(tag));
}

export function sharedDiscriminatorTags(a: GameLike, b: GameLike) {
  const bTags = new Set(b.discriminatorTags ?? []);
  return (a.discriminatorTags ?? []).filter((tag) => bTags.has(tag));
}

export function getBaselineCases() {
  return goldenSeeds.map(rankSeed);
}

export function markdownTable(headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (value: string | number) => String(value).replace(/\|/g, "\\|");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function getAnswerDistribution(question: QuestionLike) {
  const counts = new Map(question.options.map((option) => [option.id, 0]));
  for (const seed of goldenSeeds) {
    const answer = seed.answers[question.id];
    counts.set(answer, (counts.get(answer) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
