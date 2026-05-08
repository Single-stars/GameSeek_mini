import {
  gameById,
  games,
  markdownTable,
  sharedTags,
  writeJsonReport,
  writeMarkdownReport,
} from "./gameseek-diagnostics-utils";

const SUBCLUSTER_RULES = [
  { id: "deckbuilder_roguelike", tags: ["deckbuilder", "run_based", "roguelike", "dice", "card"] },
  { id: "factory_automation", tags: ["factory", "automation", "resource_chain", "optimization"] },
  { id: "tactics_turn_based", tags: ["turn_based", "perfect_information", "squad_building", "party_building"] },
  { id: "city_colony_management", tags: ["colony_sim", "management", "resource_management", "building"] },
  { id: "rts_grand_strategy", tags: ["rts", "4x_strategy", "macro_planning", "empire_building", "grand_strategy"] },
  { id: "defense_survival", tags: ["tower_defense", "survival", "resource_pressure", "failure_pressure"] },
  { id: "narrative_strategy", tags: ["story", "choice_consequence", "character_bond", "dialogue"] },
  { id: "short_loop", tags: ["short_session", "fast_feedback", "auto_attack", "mini_games"] },
];

function suggestedSubclusters(game: { tags: string[]; discriminatorTags?: string[] }) {
  const tagText = [...(game.tags ?? []), ...(game.discriminatorTags ?? [])].join(" ");
  return SUBCLUSTER_RULES
    .map((rule) => ({ id: rule.id, hits: rule.tags.filter((tag) => tagText.includes(tag)) }))
    .filter((item) => item.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length || a.id.localeCompare(b.id));
}

const gameSuggestions = games.map((game) => ({
  id: game.id,
  title: game.title,
  cluster: game.cluster,
  suggestedSubclusters: suggestedSubclusters(game).slice(0, 3),
}));

const subclusterCounts = new Map<string, number>();
for (const item of gameSuggestions) {
  for (const subcluster of item.suggestedSubclusters) {
    subclusterCounts.set(subcluster.id, (subclusterCounts.get(subcluster.id) ?? 0) + 1);
  }
}

const highRiskConfusions = [];
for (const game of games) {
  for (const targetId of game.confusableWith ?? []) {
    const target = gameById.get(targetId);
    if (!target || target.id <= game.id) continue;
    const shared = sharedTags(game, target);
    const sameCluster = game.cluster === target.cluster;
    if (sameCluster || shared.length >= 3) {
      highRiskConfusions.push({
        a: game.id,
        b: target.id,
        sameCluster,
        sharedTags: shared,
        aSuggestedSubclusters: suggestedSubclusters(game).map((item) => item.id),
        bSuggestedSubclusters: suggestedSubclusters(target).map((item) => item.id),
      });
    }
  }
}

const clusterCounts = games.reduce<Record<string, number>>((acc, game) => {
  acc[game.cluster] = (acc[game.cluster] ?? 0) + 1;
  return acc;
}, {});

const overloadedClusters = Object.entries(clusterCounts)
  .filter(([, count]) => count > Math.max(12, games.length * 0.25))
  .map(([cluster, count]) => ({ cluster, count }));

const recommendedNewQuestions = [
  {
    topic: "strategy_buildcraft subtype",
    reason: "The strategy_buildcraft cluster is intentionally large and needs finer report-only subtype separation.",
    options: ["deckbuilder runs", "factory automation", "turn tactics", "macro empire / RTS"],
  },
  {
    topic: "failure consequence",
    reason: "Tactics, roguelike, survival, and cozy management respond differently to failure but share broad planning tags.",
    options: ["restart run", "reload tactical mistake", "recover colony crisis", "low-stakes retry"],
  },
  {
    topic: "session scale",
    reason: "Short-loop strategy and long-session macro planning can share optimization tags but differ strongly in user intent.",
    options: ["5-15 minute loop", "single tactical mission", "multi-hour city/factory plan", "open-ended sandbox"],
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  note: "Report-only sub-cluster suggestions. No games.ts fields are changed by this script.",
  subclusterCounts: Object.fromEntries([...subclusterCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
  overloadedClusters,
  highRiskConfusions,
  recommendedNewQuestions,
  gameSuggestions,
};

writeJsonReport("v0.3.4-subcluster-analysis.json", report);

const md = [
  "# GameSeek Mini v0.3.4 Sub-cluster Analysis",
  "",
  "This is report-only. It does not write back to `games.ts`.",
  "",
  "## Suggested Sub-cluster Counts",
  "",
  markdownTable(
    ["Sub-cluster", "Games"],
    [...subclusterCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, count]) => [id, count]),
  ),
  "",
  "## Overloaded Clusters",
  "",
  overloadedClusters.length
    ? markdownTable(["Cluster", "Games"], overloadedClusters.map((item) => [item.cluster, item.count]))
    : "No overloaded clusters under the generic threshold.",
  "",
  "## High-risk Confusions",
  "",
  markdownTable(
    ["A", "B", "Same Cluster", "Shared Tags"],
    highRiskConfusions.slice(0, 40).map((item) => [
      item.a,
      item.b,
      item.sameCluster ? "yes" : "no",
      item.sharedTags.slice(0, 8).join(", ") || "none",
    ]),
  ),
  "",
  "## Recommended New Questions",
  "",
  ...recommendedNewQuestions.map((item) => `- ${item.topic}: ${item.reason} Options: ${item.options.join(" / ")}`),
].join("\n");

writeMarkdownReport("v0.3.4-subcluster-analysis.md", md);
console.log(JSON.stringify({ wrote: ["v0.3.4-subcluster-analysis.json", "v0.3.4-subcluster-analysis.md"] }, null, 2));
