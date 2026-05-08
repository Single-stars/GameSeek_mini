import fs from "node:fs";
import path from "node:path";

import * as gamesModule from "../src/lib/gameseek/games";
import * as goldenSeedsModule from "../src/lib/gameseek/goldenSeeds";
import * as questionsModule from "../src/lib/gameseek/questions";

/**
 * Mini v0.1 helper: expand golden seeds to one full-answer seed per game.
 *
 * Usage from project root:
 *   npx tsx scripts/expand-golden-seeds.ts
 *
 * This script intentionally does not touch scoring.ts. It reads current games/questions
 * and writes src/lib/gameseek/goldenSeeds.ts using the existing AnswerMap contract:
 *   Record<questionId, optionId>
 */

type AnyRecord = Record<string, unknown>;
type GameLike = AnyRecord & {
  id: string;
  title?: string;
  titleEn?: string;
  summary?: string;
  tags?: string[];
  antiTags?: string[];
};
type OptionLike = AnyRecord & {
  id: string;
  label?: string;
  tags?: string[];
  antiTags?: string[];
};
type QuestionLike = AnyRecord & {
  id: string;
  text?: string;
  title?: string;
  options: OptionLike[];
};
type GoldenSeed = {
  id: string;
  targetGameId: string;
  persona: string;
  answers: Record<string, string>;
  notes: string[];
  curated?: boolean;
  calibrationVersion?: string;
  calibrationReason?: string;
  originalFailureRank?: number;
  calibratedRank?: number;
};

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/gameseek/goldenSeeds.ts");
const FORCE_CURATED = process.argv.includes("--force-curated");

if (FORCE_CURATED) {
  console.warn(
    "WARNING: --force-curated will allow generated answers to overwrite curated golden seeds and remove curated calibration metadata.",
  );
}

function pickArrayExport<T>(moduleValue: Record<string, unknown>, names: string[]): T[] {
  for (const name of names) {
    const value = moduleValue[name];
    if (Array.isArray(value)) return value as T[];
  }
  throw new Error(`Cannot find array export. Tried: ${names.join(", ")}`);
}

const games = pickArrayExport<GameLike>(gamesModule as Record<string, unknown>, ["games", "GAMES", "gamePool", "GAME_POOL"]);
const questions = pickArrayExport<QuestionLike>(questionsModule as Record<string, unknown>, ["questions", "QUESTIONS", "gameSeekQuestions", "GAMESEEK_QUESTIONS"]);
const existingSeeds = pickArrayExport<GoldenSeed>(goldenSeedsModule as Record<string, unknown>, ["goldenSeeds", "GOLDEN_SEEDS"]);
const existingSeedByTarget = new Map(existingSeeds.map((seed) => [seed.targetGameId, seed]));

const GENERIC_TAGS = new Set([
  "game", "games", "fun", "good", "popular", "mainstream", "singleplayer", "multiplayer",
  "pc", "console", "mobile", "online", "offline", "buy_to_play", "free_iap",
]);

function normalizeTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^tag:/, "");
  if (!cleaned || GENERIC_TAGS.has(cleaned)) return null;
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
    if (/label|text|title|summary|description|explain|persona|note/i.test(key)) continue;
    if (/antiTags|anti_tags|avoidTags|avoid_tags|excludeTags|risks|risk/i.test(key)) {
      extractTags(child, positive, negative, "anti");
    } else if (/tags|tag|anchors|anchor|soft|rule|delta|profileDelta/i.test(key)) {
      extractTags(child, positive, negative, key);
    }
  }
}

function tagSets(value: unknown) {
  const positive = new Set<string>();
  const negative = new Set<string>();
  if (value && typeof value === "object") {
    const record = value as AnyRecord;
    extractTags(record.tags, positive, negative, "tags");
    extractTags(record.antiTags, positive, negative, "anti");
  }
  return { positive, negative };
}

function intersectionSize(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const item of a) if (b.has(item)) count += 1;
  return count;
}

function gameTitle(game: GameLike) {
  return String(game.title ?? game.titleEn ?? game.id);
}

function tagsForPersona(tags: string[]) {
  const labelMap: Record<string, string> = {
    moba: "MOBA 对抗", pvp: "强对抗", ranked: "排位成长", team: "团队配合",
    shooter: "射击手感", fps: "第一人称射击", battle_royale: "生存淘汰",
    open_world: "开放世界", exploration: "探索发现", adventure: "冒险探索",
    rpg: "角色成长", jrpg: "日式 RPG", story: "剧情沉浸", narrative: "叙事体验",
    gacha: "长期收集", strategy: "策略规划", tactics: "战术决策",
    tower_defense: "塔防解题", party: "派对混乱", ugc: "UGC 创作", casual: "轻松上手",
    social: "社交陪伴", farming: "田园经营", life_sim: "生活模拟", cozy: "治愈低压",
    sandbox: "沙盒自由", survival: "生存推进", crafting: "采集制作",
    roguelike: "反复构筑", roguelite: "反复构筑", card: "卡牌构筑", deckbuilder: "牌组构筑",
    puzzle: "逻辑解谜", platformer: "平台跳跃", action: "动作反馈", arpg: "动作角色成长",
    management: "经营管理", sim: "模拟系统", racing: "竞速驾驶", sports: "体育竞技",
    horror: "恐怖压迫", rhythm: "节奏操作", metroidvania: "探索成长",
  };
  return tags.slice(0, 5).map((tag) => labelMap[tag] ?? tag.replace(/_/g, " "));
}

function optionScore(game: GameLike, question: QuestionLike, option: OptionLike) {
  const gameSets = tagSets(game);
  const optionSets = tagSets(option);
  const direct = intersectionSize(gameSets.positive, optionSets.positive) * 6;
  const optionAntiPenalty = intersectionSize(gameSets.positive, optionSets.negative) * 9;
  const gameAntiPenalty = intersectionSize(gameSets.negative, optionSets.positive) * 4;
  const specificity = Math.min(4, Math.max(0, optionSets.positive.size - 1)) * 0.35;

  // Small deterministic tie-breaker so generated seeds are stable across runs.
  const tie = (`${game.id}:${question.id}:${option.id}`.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 97) / 1000;
  return direct + specificity - optionAntiPenalty - gameAntiPenalty + tie;
}

function chooseAnswer(game: GameLike, question: QuestionLike): string {
  if (!question.options?.length) {
    throw new Error(`Question ${question.id} has no options`);
  }
  const ranked = [...question.options]
    .map((option) => ({ option, score: optionScore(game, question, option) }))
    .sort((a, b) => b.score - a.score || a.option.id.localeCompare(b.option.id));
  return ranked[0].option.id;
}

function existingAnswerFor(game: GameLike, question: QuestionLike): string | null {
  const existingSeed = existingSeedByTarget.get(game.id);
  const selected = existingSeed?.answers?.[question.id];
  if (typeof selected !== "string") return null;
  if (!question.options.some((option) => option.id === selected)) return null;
  return selected;
}

function existingPersonaFor(game: GameLike): string | null {
  const existingSeed = existingSeedByTarget.get(game.id);
  if (typeof existingSeed?.persona !== "string") return null;
  if (existingSeed.persona.length < 24) return null;
  return existingSeed.persona;
}

function existingNotesFor(game: GameLike): string[] | null {
  const existingSeed = existingSeedByTarget.get(game.id);
  if (!Array.isArray(existingSeed?.notes)) return null;
  if (!existingSeed.notes.every((note) => typeof note === "string")) return null;
  return existingSeed.notes;
}

function buildPersona(game: GameLike) {
  const tagList = [...tagSets(game).positive];
  const traits = tagsForPersona(tagList);
  const title = gameTitle(game);
  if (traits.length >= 3) {
    return `核心目标玩家：想玩《${title}》这类${traits.slice(0, 3).join("、")}体验；能接受它的主要节奏和门槛，最在意玩法是否对味，而不是平台、价格或热度。`;
  }
  if (game.summary) {
    return `核心目标玩家：被《${title}》的核心体验吸引，偏好${String(game.summary).replace(/[。.!！]$/, "")}；希望推荐结果围绕这种玩法画像命中。`;
  }
  return `核心目标玩家：明确想要《${title}》代表的核心玩法体验，希望系统把它识别为最贴近口味的目标游戏。`;
}

function buildSeed(game: GameLike): GoldenSeed {
  const existingSeed = existingSeedByTarget.get(game.id);
  if (existingSeed?.curated === true && !FORCE_CURATED) {
    return existingSeed;
  }

  const answers: Record<string, string> = {};
  for (const question of questions) {
    answers[question.id] = existingAnswerFor(game, question) ?? chooseAnswer(game, question);
  }

  const positiveTags = [...tagSets(game).positive].slice(0, 8);
  const antiTags = [...tagSets(game).negative].slice(0, 6);
  return {
    id: `seed-${game.id}`,
    targetGameId: game.id,
    persona: existingPersonaFor(game) ?? buildPersona(game),
    answers,
    notes: existingNotesFor(game) ?? [
      `target=${gameTitle(game)}`,
      `coreTags=${positiveTags.join(", ") || "none"}`,
      `avoidSignals=${antiTags.join(", ") || "none"}`,
    ],
  };
}

function assertSeeds(seeds: GoldenSeed[]) {
  const gameIds = new Set(games.map((game) => game.id));
  const questionIds = new Set(questions.map((question) => question.id));
  const optionIdsByQuestion = new Map(questions.map((question) => [question.id, new Set(question.options.map((option) => option.id))]));

  if (seeds.length !== games.length) {
    throw new Error(`Expected ${games.length} seeds, got ${seeds.length}`);
  }
  for (const seed of seeds) {
    if (!gameIds.has(seed.targetGameId)) throw new Error(`Unknown targetGameId: ${seed.targetGameId}`);
    if (!seed.persona || seed.persona.length < 24) throw new Error(`Persona too short for ${seed.targetGameId}`);
    for (const questionId of questionIds) {
      const selected = seed.answers[questionId];
      if (typeof selected !== "string" || !selected) throw new Error(`${seed.targetGameId} missing string answer for ${questionId}`);
      if (!optionIdsByQuestion.get(questionId)?.has(selected)) {
        throw new Error(`${seed.targetGameId} has illegal option ${questionId}:${selected}`);
      }
    }
    for (const questionId of Object.keys(seed.answers)) {
      if (!questionIds.has(questionId)) throw new Error(`${seed.targetGameId} has illegal question id ${questionId}`);
    }
  }
}

const seeds = games.map(buildSeed);
assertSeeds(seeds);

const source = `import type { AnswerMap } from "./types";

export type GoldenSeed = {
  id: string;
  targetGameId: string;
  persona: string;
  answers: AnswerMap;
  notes: string[];
  curated?: boolean;
  calibrationVersion?: string;
  calibrationReason?: string;
  originalFailureRank?: number;
  calibratedRank?: number;
};

// Generated by scripts/expand-golden-seeds.ts.
// One full-answer core target-player seed per game.
// Curated seeds are preserved by default; use --force-curated only for intentional regeneration.
// Do not edit scoring.ts for seed fixes.
export const goldenSeeds: GoldenSeed[] = ${JSON.stringify(seeds, null, 2)};

export const GOLDEN_SEEDS = goldenSeeds;
`;

fs.writeFileSync(OUT, source, "utf8");
console.log(JSON.stringify({ wrote: path.relative(ROOT, OUT), total: seeds.length, questions: questions.length }, null, 2));
