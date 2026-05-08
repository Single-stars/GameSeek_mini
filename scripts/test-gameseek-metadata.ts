import { games } from "../src/lib/gameseek/games";
import type { Game, GameCluster, GameSubCluster } from "../src/lib/gameseek/types";

type Issue = {
  type: string;
  game?: string;
  target?: string;
  cluster?: string;
  message?: string;
  value?: unknown;
};

const CLUSTERS: GameCluster[] = [
  "competitive_pvp",
  "open_world_explore",
  "narrative_roleplay",
  "strategy_buildcraft",
  "cozy_management",
  "sandbox_factory",
  "coop_party",
  "puzzle_observation",
  "short_loop_casual",
];

const UNUSUALLY_LARGE_CLUSTER_LIMITS: Partial<Record<GameCluster, number>> = {
  strategy_buildcraft: 30,
};

const SUB_CLUSTERS: GameSubCluster[] = [
  "factory_automation",
  "city_colony_management",
  "deckbuilder_roguelike",
  "tactics_turn_based",
  "rts_grand_strategy",
  "defense_survival",
  "short_loop_strategy",
  "narrative_strategy",
  "puzzle_strategy",
  "hybrid_strategy",
];

const errors: Issue[] = [];
const warnings: Issue[] = [];
const ids = new Set<string>();
const duplicateIds = new Set<string>();

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function looksLikeGameId(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(value);
}

function pushError(issue: Issue) {
  errors.push(issue);
}

function pushWarning(issue: Issue) {
  warnings.push(issue);
}

for (const game of games as Game[]) {
  if (ids.has(game.id)) duplicateIds.add(game.id);
  ids.add(game.id);
}

for (const id of duplicateIds) {
  pushError({ type: "duplicate_game_id", game: id });
}

const byCluster = Object.fromEntries(CLUSTERS.map((cluster) => [cluster, 0])) as Record<GameCluster, number>;

for (const game of games as Game[]) {
  const gameId = isNonEmptyString(game.id) ? game.id : "<missing-id>";

  if (!isNonEmptyString(game.title)) {
    pushError({ type: "empty_title", game: gameId });
  }

  if (!isNonEmptyString(game.cluster) || !CLUSTERS.includes(game.cluster as GameCluster)) {
    pushError({ type: "missing_cluster", game: gameId, value: game.cluster });
  } else {
    byCluster[game.cluster as GameCluster] += 1;
  }

  if (!isNonEmptyStringArray(game.tags)) {
    pushError({ type: "empty_tags", game: gameId });
  }

  if (game.cluster === "strategy_buildcraft") {
    if (!isNonEmptyString(game.primarySubCluster)) {
      pushError({ type: "missing_primarySubCluster", game: gameId });
    } else if (!SUB_CLUSTERS.includes(game.primarySubCluster as GameSubCluster)) {
      pushError({ type: "invalid_primarySubCluster", game: gameId, value: game.primarySubCluster });
    }
  } else if (game.primarySubCluster != null && !SUB_CLUSTERS.includes(game.primarySubCluster as GameSubCluster)) {
    pushError({ type: "invalid_primarySubCluster", game: gameId, value: game.primarySubCluster });
  }

  if (game.secondarySubClusters != null) {
    if (!Array.isArray(game.secondarySubClusters)) {
      pushError({ type: "invalid_secondarySubClusters", game: gameId, value: game.secondarySubClusters });
    } else {
      if (game.secondarySubClusters.length > 2) {
        pushError({ type: "too_many_secondarySubClusters", game: gameId, value: game.secondarySubClusters });
      }
      for (const subCluster of game.secondarySubClusters) {
        if (!SUB_CLUSTERS.includes(subCluster)) {
          pushError({ type: "invalid_secondarySubCluster", game: gameId, value: subCluster });
        }
      }
    }
  }

  if (!Array.isArray(game.discriminatorTags)) {
    pushError({ type: "missing_discriminatorTags", game: gameId });
  } else if (game.discriminatorTags.filter(isNonEmptyString).length < 3) {
    pushError({
      type: "fewer_than_3_discriminatorTags",
      game: gameId,
      value: game.discriminatorTags,
    });
  }

  if (!isNonEmptyStringArray(game.why)) {
    pushError({ type: "missing_why", game: gameId });
  } else if (game.why.join(" ").trim().length < 16) {
    pushWarning({ type: "why_too_short", game: gameId, value: game.why });
  }

  if (!isNonEmptyStringArray(game.notFor)) {
    pushError({ type: "missing_notFor", game: gameId });
  } else if (game.notFor.join(" ").trim().length < 16) {
    pushWarning({ type: "notFor_too_short", game: gameId, value: game.notFor });
  }

  if (!Array.isArray(game.confusableWith)) {
    pushError({ type: "missing_confusableWith", game: gameId });
  } else {
    if (game.confusableWith.length === 0) {
      pushWarning({ type: "empty_confusableWith", game: gameId });
    }
    for (const target of game.confusableWith) {
      if (!isNonEmptyString(target) || !ids.has(target)) {
        pushError({ type: "confusable_unknown_id", game: gameId, target: String(target) });
      } else if (target === game.id) {
        pushError({ type: "confusable_includes_self", game: gameId, target });
      } else {
        const targetGame = games.find((candidate) => candidate.id === target);
        if (targetGame && !targetGame.confusableWith.includes(game.id)) {
          pushWarning({ type: "confusable_not_bidirectional", game: gameId, target });
        }
      }
    }
  }

  const tagSet = new Set((game.tags ?? []).map((tag) => tag.trim()).filter(Boolean));
  const duplicateDiscriminators = (game.discriminatorTags ?? []).filter((tag) => tagSet.has(tag));
  if (duplicateDiscriminators.length >= 2 || duplicateDiscriminators.length / Math.max(1, game.discriminatorTags?.length ?? 1) >= 0.5) {
    pushWarning({
      type: "discriminatorTags_strongly_duplicate_tags",
      game: gameId,
      value: duplicateDiscriminators,
    });
  }

  if (Array.isArray(game.similar)) {
    for (const target of game.similar) {
      if (!isNonEmptyString(target)) continue;
      if (target === game.id) {
        pushWarning({ type: "similar_includes_self", game: gameId, target });
      } else if (looksLikeGameId(target) && !ids.has(target)) {
        pushWarning({ type: "similar_unknown_id", game: gameId, target });
      }
    }
  }
}

for (const [cluster, count] of Object.entries(byCluster)) {
  if (count < 2) {
    pushError({ type: "cluster_has_fewer_than_2_games", cluster, value: count });
  }
  const limit =
    UNUSUALLY_LARGE_CLUSTER_LIMITS[cluster as GameCluster] ??
    Math.max(12, games.length * 0.25);
  if (count > limit) {
    pushWarning({ type: "cluster_unusually_large", cluster, value: count });
  }
}

const report = {
  passed: errors.length === 0,
  summary: {
    games: games.length,
    clusters: Object.values(byCluster).filter((count) => count > 0).length,
    errors: errors.length,
    warnings: warnings.length,
  },
  errors,
  warnings,
  byCluster,
};

console.log(JSON.stringify(report, null, 2));

if (!report.passed) {
  process.exitCode = 1;
}
