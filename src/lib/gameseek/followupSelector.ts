import type { GameSubCluster, Recommendation } from "./types";
import { followUpQuestions, type FollowUpQuestion } from "./followupQuestions";

export type FollowUpDiagnostic = {
  topCluster?: string;
  topSubClusters: GameSubCluster[];
  reason?: string;
};

function questionById(id: string) {
  return followUpQuestions.find((question) => question.id === id);
}

function pushUnique(result: FollowUpQuestion[], id: string) {
  if (result.length >= 3) return;
  if (result.some((question) => question.id === id)) return;
  const question = questionById(id);
  if (question) result.push(question);
}

function top6SubClusters(top6: Recommendation[]) {
  return top6.flatMap((item) => [
    item.game.primarySubCluster,
    ...(item.game.secondarySubClusters ?? []),
  ]).filter(Boolean) as GameSubCluster[];
}

function hasConfusablePair(top6: Recommendation[]) {
  const ids = top6.map((item) => item.game.id);
  const idSet = new Set(ids);
  return top6.some((item) => item.game.confusableWith.some((id) => idSet.has(id)));
}

export function getFollowUpDiagnostic(ranked: Recommendation[]): FollowUpDiagnostic {
  const top6 = ranked.slice(0, 6);
  const clusterCounts = new Map<string, number>();
  for (const item of top6) {
    clusterCounts.set(item.game.cluster, (clusterCounts.get(item.game.cluster) ?? 0) + 1);
  }
  const topCluster = [...clusterCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSubClusters = [...new Set(top6SubClusters(top6))];
  const spread = top6.length >= 6 ? top6[0].score - top6[5].score : 999;
  const strategyCount = top6.filter((item) => item.game.cluster === "strategy_buildcraft").length;

  let reason: string | undefined;
  if (strategyCount >= 3) reason = "strategy_buildcraft_overloaded_top6";
  else if (hasConfusablePair(top6)) reason = "confusable_pair_in_top6";
  else if (spread <= 12 && topSubClusters.length >= 2) reason = "narrow_score_spread_with_subcluster_mix";

  return { topCluster, topSubClusters, reason };
}

export function selectFollowUpQuestions(ranked: Recommendation[]): FollowUpQuestion[] {
  const top6 = ranked.slice(0, 6);
  const result: FollowUpQuestion[] = [];
  const strategyCount = top6.filter((item) => item.game.cluster === "strategy_buildcraft").length;
  const subClusters = new Set(top6SubClusters(top6));
  const spread = top6.length >= 6 ? top6[0].score - top6[5].score : 999;
  const hasConfusion = hasConfusablePair(top6);

  if (strategyCount < 3 && !hasConfusion && !(spread <= 12 && subClusters.size >= 2)) {
    return result;
  }

  if (strategyCount >= 3 || subClusters.size >= 3) {
    pushUnique(result, "F_STRATEGY_SUBCLUSTER");
  }

  if (subClusters.has("deckbuilder_roguelike")) pushUnique(result, "F_DECKBUILDER_STYLE");
  if (subClusters.has("tactics_turn_based") || subClusters.has("puzzle_strategy")) pushUnique(result, "F_TACTICS_STYLE");
  if (subClusters.has("factory_automation")) pushUnique(result, "F_FACTORY_STYLE");
  if (subClusters.has("rts_grand_strategy")) pushUnique(result, "F_RTS_GRAND_STYLE");
  if (subClusters.has("defense_survival")) pushUnique(result, "F_DEFENSE_STYLE");

  if (result.length < 3 && strategyCount >= 3) pushUnique(result, "F_STRATEGY_TIME_MODE");
  if (result.length < 3 && strategyCount >= 3) pushUnique(result, "F_STRATEGY_SCALE");

  return result;
}
