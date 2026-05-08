import * as gamesModule from "../src/lib/gameseek/games";
import * as questionsModule from "../src/lib/gameseek/questions";
import * as seedsModule from "../src/lib/gameseek/goldenSeeds";

type AnyRecord = Record<string, unknown>;
type GameLike = { id: string };
type OptionLike = { id: string };
type QuestionLike = { id: string; options: OptionLike[] };
type GoldenSeedLike = {
  id: string;
  targetGameId: string;
  answers: Record<string, unknown>;
  curated?: boolean;
  calibrationVersion?: string;
  calibrationReason?: string;
  originalFailureRank?: number;
  calibratedRank?: number;
};

const V032_CURATED_TARGETS = new Set([
  "detroit-become-human",
  "balatro",
  "monster-train",
  "into-the-breach",
  "age-of-empires-iv",
  "total-war-warhammer-iii",
  "xcom-2",
  "tactics-ogre-reborn",
  "marvels-midnight-suns",
  "dicey-dungeons",
  "dyson-sphere-program",
  "plants-vs-zombies",
]);

function pickArrayExport<T>(moduleValue: Record<string, unknown>, names: string[]): T[] {
  for (const name of names) {
    const value = moduleValue[name];
    if (Array.isArray(value)) return value as T[];
  }
  throw new Error(`Cannot find array export. Tried: ${names.join(", ")}`);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function main() {
  const games = pickArrayExport<GameLike>(gamesModule as AnyRecord, ["games", "GAMES", "gamePool", "GAME_POOL"]);
  const questions = pickArrayExport<QuestionLike>(questionsModule as AnyRecord, [
    "questions",
    "QUESTIONS",
    "gameSeekQuestions",
    "GAMESEEK_QUESTIONS",
  ]);
  const goldenSeeds = pickArrayExport<GoldenSeedLike>(seedsModule as AnyRecord, [
    "goldenSeeds",
    "GOLDEN_SEEDS",
    "seeds",
    "SEEDS",
  ]);

  const errors: string[] = [];
  const gameIds = new Set(games.map((game) => game.id));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const optionIdsByQuestion = new Map(
    questions.map((question) => [question.id, new Set(question.options.map((option) => option.id))]),
  );
  const seenTargets = new Set<string>();

  if (goldenSeeds.length !== games.length) {
    errors.push(`goldenSeeds.length must equal games.length: seeds=${goldenSeeds.length}, games=${games.length}`);
  }

  for (const seed of goldenSeeds) {
    if (!gameIds.has(seed.targetGameId)) {
      errors.push(`${seed.id}: unknown targetGameId ${seed.targetGameId}`);
    }

    if (seenTargets.has(seed.targetGameId)) {
      errors.push(`${seed.id}: duplicate targetGameId ${seed.targetGameId}`);
    }
    seenTargets.add(seed.targetGameId);

    for (const question of questions) {
      const selected = seed.answers?.[question.id];
      if (typeof selected !== "string" || selected.length === 0) {
        errors.push(`${seed.id}: missing single-string answer for ${question.id}`);
        continue;
      }
      if (!optionIdsByQuestion.get(question.id)?.has(selected)) {
        errors.push(`${seed.id}: illegal option ${question.id}:${selected}`);
      }
    }

    for (const questionId of Object.keys(seed.answers ?? {})) {
      if (!questionById.has(questionId)) {
        errors.push(`${seed.id}: illegal question id ${questionId}`);
      }
    }

    if (V032_CURATED_TARGETS.has(seed.targetGameId) && seed.curated !== true) {
      errors.push(`${seed.id}: v0.3.2 calibrated seed must be marked curated`);
    }

    if (seed.curated === true) {
      if (seed.calibrationVersion !== "v0.3.2") {
        errors.push(`${seed.id}: curated seed must have calibrationVersion \"v0.3.2\"`);
      }
      if (typeof seed.calibrationReason !== "string" || seed.calibrationReason.trim().length < 16) {
        errors.push(`${seed.id}: curated seed must have a human-readable calibrationReason`);
      }
      if (!isPositiveInteger(seed.originalFailureRank)) {
        errors.push(`${seed.id}: curated seed must have positive integer originalFailureRank`);
      }
      if (!isPositiveInteger(seed.calibratedRank)) {
        errors.push(`${seed.id}: curated seed must have positive integer calibratedRank`);
      } else if (seed.calibratedRank > 6) {
        errors.push(`${seed.id}: calibratedRank must be <= 6, got ${seed.calibratedRank}`);
      }
    }
  }

  for (const targetGameId of V032_CURATED_TARGETS) {
    if (!seenTargets.has(targetGameId)) {
      errors.push(`missing v0.3.2 curated target seed: ${targetGameId}`);
    }
  }

  const report = {
    passed: errors.length === 0,
    summary: {
      games: games.length,
      seeds: goldenSeeds.length,
      questions: questions.length,
      curatedSeeds: goldenSeeds.filter((seed) => seed.curated === true).length,
      errors: errors.length,
    },
    errors,
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main();
