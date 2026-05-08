import type { AnswerMap, Game, GameSubCluster, Recommendation } from "./types";
import { rankAll } from "./scoring";
import { getFollowUpQuestion, type FollowUpAnswerMap } from "./followupQuestions";

export type FollowUpRecommendation = Recommendation & {
  baseScore: number;
  followUpDelta: number;
};

const MAX_FOLLOWUP_BONUS = 16;
const MIN_FOLLOWUP_PENALTY = -12;
const CLOSE_EXPLICIT_PAIR_SPREAD = 4;

type ExplicitGamePreferences = {
  boosted: Set<string>;
  penalized: Set<string>;
};

function clampDelta(delta: number) {
  return Math.max(MIN_FOLLOWUP_PENALTY, Math.min(MAX_FOLLOWUP_BONUS, delta));
}

function hasAny(values: string[], targetValues: string[] | undefined) {
  if (!targetValues?.length) return false;
  const set = new Set(values);
  return targetValues.some((value) => set.has(value));
}

function scoreFollowUpsForGame(game: Game, followUpAnswers: FollowUpAnswerMap) {
  let delta = 0;

  for (const [questionId, optionId] of Object.entries(followUpAnswers)) {
    const question = getFollowUpQuestion(questionId);
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option) continue;
    const explicitGamePenalty = option.gamePenalties?.[game.id] ?? 0;
    const explicitlyPenalized = explicitGamePenalty < 0;

    if (!explicitlyPenalized) {
      for (const [subCluster, boost] of Object.entries(option.subClusterBoosts ?? {})) {
        if (game.primarySubCluster === subCluster) {
          delta += boost;
        } else if (game.secondarySubClusters?.includes(subCluster as GameSubCluster)) {
          delta += Math.min(4, boost);
        }
      }

      for (const tag of option.tagBoosts ?? []) {
        if (game.tags.includes(tag)) delta += 2;
      }
    }

    for (const tag of option.tagPenalties ?? []) {
      if (game.tags.includes(tag)) delta -= 2;
    }

    delta += option.gameBoosts?.[game.id] ?? 0;
    delta += option.gamePenalties?.[game.id] ?? 0;
  }

  return clampDelta(delta);
}

function collectExplicitGamePreferences(followUpAnswers: FollowUpAnswerMap): ExplicitGamePreferences {
  const boosted = new Set<string>();
  const penalized = new Set<string>();

  for (const [questionId, optionId] of Object.entries(followUpAnswers)) {
    const question = getFollowUpQuestion(questionId);
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!option) continue;

    for (const [gameId, boost] of Object.entries(option.gameBoosts ?? {})) {
      if (boost > 0) boosted.add(gameId);
      if (boost < 0) penalized.add(gameId);
    }

    for (const [gameId, penalty] of Object.entries(option.gamePenalties ?? {})) {
      if (penalty > 0) boosted.add(gameId);
      if (penalty < 0) penalized.add(gameId);
    }
  }

  return { boosted, penalized };
}

function compareCloseExplicitPair(
  a: FollowUpRecommendation,
  b: FollowUpRecommendation,
  preferences: ExplicitGamePreferences,
) {
  const aPreferredOverB = preferences.boosted.has(a.game.id) && preferences.penalized.has(b.game.id);
  const bPreferredOverA = preferences.boosted.has(b.game.id) && preferences.penalized.has(a.game.id);

  if (aPreferredOverB && !bPreferredOverA) return -1;
  if (bPreferredOverA && !aPreferredOverB) return 1;
  return 0;
}

export function rankAllWithFollowUps(baseAnswers: AnswerMap, followUpAnswers?: FollowUpAnswerMap): FollowUpRecommendation[] {
  const baseRanked = rankAll(baseAnswers);
  if (!followUpAnswers || Object.keys(followUpAnswers).length === 0) {
    return baseRanked.map((item) => ({ ...item, baseScore: item.score, followUpDelta: 0 }));
  }

  const explicitPreferences = collectExplicitGamePreferences(followUpAnswers);

  return baseRanked
    .map((item, baseIndex) => {
      const followUpDelta = scoreFollowUpsForGame(item.game, followUpAnswers);
      return {
        ...item,
        baseScore: item.score,
        followUpDelta,
        score: item.score + followUpDelta,
        baseIndex,
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) {
        if (Math.abs(scoreDiff) <= CLOSE_EXPLICIT_PAIR_SPREAD) {
          const explicitPairOrder = compareCloseExplicitPair(a, b, explicitPreferences);
          if (explicitPairOrder !== 0) return explicitPairOrder;
        }
        return scoreDiff;
      }

      return b.baseScore - a.baseScore || a.baseIndex - b.baseIndex;
    })
    .map(({ baseIndex: _baseIndex, ...item }) => item);
}

export function wouldFollowUpPushUnrelatedTop3(ranked: FollowUpRecommendation[]) {
  const top3 = ranked.slice(0, 3).map((item) => item.game);
  const topSubClusters = top3.flatMap((game) => [game.primarySubCluster, ...(game.secondarySubClusters ?? [])].filter(Boolean));
  return !hasAny(topSubClusters as string[], ["factory_automation", "deckbuilder_roguelike", "tactics_turn_based", "rts_grand_strategy", "defense_survival", "city_colony_management"]);
}
