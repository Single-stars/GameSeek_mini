import type { AnswerMap, Game, Recommendation } from "./types";
import { games } from "./games";
import { questions } from "./questions";

function collectUserSignals(answers: AnswerMap) {
  const tags = new Map<string, number>();
  const antiTags = new Map<string, number>();

  for (const q of questions) {
    const selectedId = answers[q.id];
    if (!selectedId) continue;

    const option = q.options.find(o => o.id === selectedId);
    if (!option) continue;

    for (const tag of option.tags ?? []) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }

    for (const tag of option.antiTags ?? []) {
      antiTags.set(tag, (antiTags.get(tag) ?? 0) + 1);
    }
  }

  return { tags, antiTags };
}

function scoreGame(game: Game, answers: AnswerMap): Recommendation {
  const { tags, antiTags } = collectUserSignals(answers);

  let score = 0;
  const matchedTags: string[] = [];
  const blockedBy: string[] = [];

  for (const tag of game.tags) {
    const weight = tags.get(tag) ?? 0;
    if (weight > 0) {
      score += weight * 10;
      matchedTags.push(tag);
    }
  }

  for (const antiTag of game.antiTags) {
    const penalty = antiTags.get(antiTag) ?? 0;
    if (penalty > 0) {
      score -= penalty * 18;
      blockedBy.push(antiTag);
    }
  }

  for (const tag of game.tags) {
    const penalty = antiTags.get(tag) ?? 0;
    if (penalty > 0) {
      score -= penalty * 12;
      blockedBy.push(tag);
    }
  }

  const uniqueBlockedBy = [...new Set(blockedBy)];

  return {
    game,
    score,
    matchedTags,
    blockedBy: uniqueBlockedBy,
    explanation: buildExplanation(game, matchedTags, uniqueBlockedBy)
  };
}

function buildExplanation(game: Game, matchedTags: string[], blockedBy: string[]) {
  const explanation: string[] = [];

  if (matchedTags.length > 0) {
    explanation.push(`匹配到你的偏好：${matchedTags.slice(0, 5).join(" / ")}`);
  }

  explanation.push(...game.why);

  if (blockedBy.length > 0) {
    explanation.push(`但要注意：它也触碰了你不太想要的点：${blockedBy.slice(0, 3).join(" / ")}`);
  }

  return explanation;
}

export function recommend(answers: AnswerMap, limit = 6): Recommendation[] {
  return games
    .map(game => scoreGame(game, answers))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function rankAll(answers: AnswerMap): Recommendation[] {
  return games
    .map(game => scoreGame(game, answers))
    .sort((a, b) => b.score - a.score);
}
