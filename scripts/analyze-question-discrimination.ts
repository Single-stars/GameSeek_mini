import {
  formatPercent,
  getAnswerDistribution,
  goldenSeeds,
  questions,
  rankAnswers,
  rankSeed,
  summarizeByCluster,
  summarizeCases,
  writeJsonReport,
  writeMarkdownReport,
  markdownTable,
} from "./gameseek-diagnostics-utils";

const baselineCases = goldenSeeds.map(rankSeed);
const baseline = summarizeCases(baselineCases);
const baselineByCluster = summarizeByCluster(baselineCases);

const questionReports = questions.map((question) => {
  const leaveOneOutCases = goldenSeeds.map((seed) => {
    const answers = { ...seed.answers };
    delete answers[question.id];
    return { ...rankAnswers(answers, seed.targetGameId), seedId: seed.id };
  });
  const leaveOneOut = summarizeCases(leaveOneOutCases);
  const leaveOneOutByCluster = summarizeByCluster(leaveOneOutCases);

  const clusterDeltas = Object.fromEntries(
    Object.entries(baselineByCluster).map(([cluster, clusterBaseline]) => {
      const row = leaveOneOutByCluster[cluster] ?? { top6Recall: 0 };
      return [cluster, row.top6Recall - clusterBaseline.top6Recall];
    }),
  );

  return {
    questionId: question.id,
    prompt: question.prompt,
    answerDistribution: getAnswerDistribution(question),
    leaveOneOut,
    deltas: {
      top1Recall: leaveOneOut.top1Recall - baseline.top1Recall,
      top3Recall: leaveOneOut.top3Recall - baseline.top3Recall,
      top6Recall: leaveOneOut.top6Recall - baseline.top6Recall,
      averageRank: leaveOneOut.averageRank - baseline.averageRank,
    },
    clusterTop6RecallDelta: clusterDeltas,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  note: "Report-only question discrimination diagnostic. Negative deltas indicate questions that carry more ranking signal.",
  baseline,
  questions: questionReports,
};

writeJsonReport("v0.3.4-question-discrimination.json", report);

const md = [
  "# GameSeek Mini v0.3.4 Question Discrimination",
  "",
  "Leave-one-question-out diagnostics omit one answer at a time and compare against the current baseline.",
  "",
  `Baseline Top6Recall: ${formatPercent(baseline.top6Recall)}`,
  "",
  markdownTable(
    ["Question", "Top1 Delta", "Top3 Delta", "Top6 Delta", "Average Rank Delta", "Answer Distribution"],
    questionReports.map((item) => [
      item.questionId,
      item.deltas.top1Recall.toFixed(4),
      item.deltas.top3Recall.toFixed(4),
      item.deltas.top6Recall.toFixed(4),
      item.deltas.averageRank.toFixed(2),
      Object.entries(item.answerDistribution).map(([key, value]) => `${key}:${value}`).join(" "),
    ]),
  ),
].join("\n");

writeMarkdownReport("v0.3.4-question-discrimination.md", md);
console.log(JSON.stringify({ wrote: ["v0.3.4-question-discrimination.json", "v0.3.4-question-discrimination.md"] }, null, 2));
