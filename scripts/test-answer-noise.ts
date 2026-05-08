import {
  formatPercent,
  gameById,
  goldenSeeds,
  mutateAnswers,
  rankAnswers,
  summarizeCases,
  topOverlap,
  writeJsonReport,
  writeMarkdownReport,
  markdownTable,
} from "./gameseek-diagnostics-utils";

const NOISE_LEVELS = [1, 2, 3];
const TRIALS_PER_SEED = 5;
const rows = [];
const byNoiseLevel: Record<string, unknown> = {};

for (const noiseLevel of NOISE_LEVELS) {
  const cases = [];
  let sameClusterTop1 = 0;
  let sameClusterAnyTop6 = 0;
  let overlapSum = 0;
  let rankDropSum = 0;

  for (const seed of goldenSeeds) {
    const baseline = rankAnswers(seed.answers, seed.targetGameId);
    const targetCluster = gameById.get(seed.targetGameId)?.cluster ?? "unknown";

    for (let trial = 0; trial < TRIALS_PER_SEED; trial += 1) {
      const variant = mutateAnswers(seed.answers, noiseLevel, `${seed.id}:noise:${noiseLevel}:${trial}`);
      const ranked = rankAnswers(variant.answers, seed.targetGameId);
      const top1Cluster = ranked.top1 ? gameById.get(ranked.top1)?.cluster : "unknown";
      const hasSameClusterInTop6 = ranked.top6.some((id) => gameById.get(id)?.cluster === targetCluster);
      const overlap = topOverlap(baseline.top6, ranked.top6);
      const rankDrop = (ranked.rank ?? 999) - (baseline.rank ?? 999);

      cases.push(ranked);
      if (top1Cluster === targetCluster) sameClusterTop1 += 1;
      if (hasSameClusterInTop6) sameClusterAnyTop6 += 1;
      overlapSum += overlap;
      rankDropSum += rankDrop;
      rows.push({
        seedId: seed.id,
        targetGameId: seed.targetGameId,
        noiseLevel,
        trial,
        changedQuestionIds: variant.changedQuestionIds,
        baselineRank: baseline.rank,
        rank: ranked.rank,
        rankDrop,
        top6Hit: ranked.rank !== null && ranked.rank <= 6,
        sameClusterTop1: top1Cluster === targetCluster,
        sameClusterAnyTop6: hasSameClusterInTop6,
        top6Overlap: overlap,
      });
    }
  }

  const total = cases.length || 1;
  byNoiseLevel[String(noiseLevel)] = {
    global: summarizeCases(cases),
    targetStillTop6Rate: cases.filter((item) => item.rank !== null && item.rank <= 6).length / total,
    averageRankDrop: rankDropSum / total,
    sameClusterTop1Rate: sameClusterTop1 / total,
    sameClusterAnyTop6Rate: sameClusterAnyTop6 / total,
    averageTop6Overlap: overlapSum / total,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  note: "Report-only deterministic noise test. Low robustness metrics do not fail v0.3.4.",
  trialsPerSeed: TRIALS_PER_SEED,
  byNoiseLevel,
  rows,
};

writeJsonReport("v0.3.4-answer-noise.json", report);

const md = [
  "# GameSeek Mini v0.3.4 Answer Noise Test",
  "",
  "This is a report-only diagnostic. Randomness is deterministic and seeded by seed id, noise level, and trial.",
  "",
  markdownTable(
    ["Changed Questions", "Top6 Retention", "Average Rank Drop", "Top1 Same Cluster", "Any Top6 Same Cluster", "Average Top6 Overlap"],
    NOISE_LEVELS.map((level) => {
      const item = byNoiseLevel[String(level)] as {
        targetStillTop6Rate: number;
        averageRankDrop: number;
        sameClusterTop1Rate: number;
        sameClusterAnyTop6Rate: number;
        averageTop6Overlap: number;
      };
      return [
        level,
        formatPercent(item.targetStillTop6Rate),
        item.averageRankDrop.toFixed(2),
        formatPercent(item.sameClusterTop1Rate),
        formatPercent(item.sameClusterAnyTop6Rate),
        item.averageTop6Overlap.toFixed(2),
      ];
    }),
  ),
].join("\n");

writeMarkdownReport("v0.3.4-answer-noise.md", md);
console.log(JSON.stringify({ wrote: ["v0.3.4-answer-noise.json", "v0.3.4-answer-noise.md"] }, null, 2));
