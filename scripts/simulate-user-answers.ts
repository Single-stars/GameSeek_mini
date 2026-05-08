import {
  formatPercent,
  gameById,
  goldenSeeds,
  mutateAnswers,
  rankAnswers,
  summarizeByCluster,
  summarizeCases,
  writeJsonReport,
  writeMarkdownReport,
  markdownTable,
} from "./gameseek-diagnostics-utils";

const LEVELS = [
  { id: "light", changes: 1, variantsPerSeed: 3 },
  { id: "medium", changes: 2, variantsPerSeed: 3 },
  { id: "heavy", changes: 4, variantsPerSeed: 3 },
];

const allVariantRows = [];
const byLevel: Record<string, unknown> = {};

for (const level of LEVELS) {
  const cases = [];
  const fragileSeeds = [];

  for (const seed of goldenSeeds) {
    const baseline = rankAnswers(seed.answers, seed.targetGameId);
    let misses = 0;
    let rankDropSum = 0;

    for (let variantIndex = 0; variantIndex < level.variantsPerSeed; variantIndex += 1) {
      const variant = mutateAnswers(seed.answers, level.changes, `${seed.id}:${level.id}:${variantIndex}`);
      const ranked = rankAnswers(variant.answers, seed.targetGameId);
      const rankDrop = (ranked.rank ?? 999) - (baseline.rank ?? 999);
      const row = {
        seedId: seed.id,
        targetGameId: seed.targetGameId,
        cluster: gameById.get(seed.targetGameId)?.cluster ?? "unknown",
        level: level.id,
        variantIndex,
        changedQuestionIds: variant.changedQuestionIds,
        baselineRank: baseline.rank,
        rank: ranked.rank,
        rankDrop,
        top6Hit: ranked.rank !== null && ranked.rank <= 6,
        top6: ranked.top6,
      };
      cases.push(ranked);
      allVariantRows.push(row);
      if (!row.top6Hit) misses += 1;
      rankDropSum += rankDrop;
    }

    if (misses > 0 || rankDropSum / level.variantsPerSeed >= 3) {
      fragileSeeds.push({
        seedId: seed.id,
        targetGameId: seed.targetGameId,
        baselineRank: baseline.rank,
        misses,
        averageRankDrop: rankDropSum / level.variantsPerSeed,
      });
    }
  }

  byLevel[level.id] = {
    config: level,
    global: summarizeCases(cases),
    byCluster: summarizeByCluster(cases),
    fragileSeeds: fragileSeeds.sort((a, b) => b.misses - a.misses || b.averageRankDrop - a.averageRankDrop).slice(0, 20),
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  note: "Report-only deterministic user-answer simulation. Low robustness metrics do not fail v0.3.4.",
  levels: byLevel,
  variants: allVariantRows,
};

writeJsonReport("v0.3.4-user-answer-simulation.json", report);

const md = [
  "# GameSeek Mini v0.3.4 User Answer Simulation",
  "",
  "This is a report-only diagnostic. Low robustness metrics are inputs for later calibration, not v0.3.4 failures.",
  "",
  markdownTable(
    ["Level", "Changes", "Variants/Seed", "Top1", "Top3", "Top6", "Average Rank", "Fragile Seeds"],
    LEVELS.map((level) => {
      const summary = (byLevel[level.id] as { global: ReturnType<typeof summarizeCases>; fragileSeeds: unknown[] });
      return [
        level.id,
        level.changes,
        level.variantsPerSeed,
        formatPercent(summary.global.top1Recall),
        formatPercent(summary.global.top3Recall),
        formatPercent(summary.global.top6Recall),
        summary.global.averageRank.toFixed(2),
        summary.fragileSeeds.length,
      ];
    }),
  ),
  "",
  "## Most Fragile Seeds",
  "",
  ...LEVELS.map((level) => {
    const summary = byLevel[level.id] as { fragileSeeds: Array<{ seedId: string; targetGameId: string; misses: number; averageRankDrop: number }> };
    return [
      `### ${level.id}`,
      "",
      summary.fragileSeeds.length
        ? markdownTable(
            ["Seed", "Target", "Misses", "Average Rank Drop"],
            summary.fragileSeeds.slice(0, 10).map((item) => [
              item.seedId,
              item.targetGameId,
              item.misses,
              item.averageRankDrop.toFixed(2),
            ]),
          )
        : "No fragile seeds detected.",
      "",
    ].join("\n");
  }),
].join("\n");

writeMarkdownReport("v0.3.4-user-answer-simulation.md", md);
console.log(JSON.stringify({ wrote: ["v0.3.4-user-answer-simulation.json", "v0.3.4-user-answer-simulation.md"] }, null, 2));
