import {
  gameById,
  games,
  rankAnswers,
  seedByTarget,
  sharedDiscriminatorTags,
  sharedTags,
  writeJsonReport,
  writeMarkdownReport,
  markdownTable,
} from "./gameseek-diagnostics-utils";

type Pair = { a: string; b: string };
type SkippedPair = { from: string; to: string; reason: string };

const pairs: Pair[] = [];
const skippedPairs: SkippedPair[] = [];
const seen = new Set<string>();

for (const game of games) {
  for (const targetId of game.confusableWith ?? []) {
    if (targetId === game.id) {
      skippedPairs.push({ from: game.id, to: targetId, reason: "self_loop" });
      continue;
    }
    if (!gameById.has(targetId)) {
      skippedPairs.push({ from: game.id, to: targetId, reason: "unknown_game" });
      continue;
    }
    const [a, b] = [game.id, targetId].sort();
    const key = `${a}::${b}`;
    if (seen.has(key)) {
      skippedPairs.push({ from: game.id, to: targetId, reason: "duplicate_reverse_pair" });
      continue;
    }
    if (!seedByTarget.has(a) || !seedByTarget.has(b)) {
      skippedPairs.push({ from: game.id, to: targetId, reason: "missing_seed" });
      continue;
    }
    seen.add(key);
    pairs.push({ a, b });
  }
}

const results = pairs.map((pair) => {
  const seedA = seedByTarget.get(pair.a);
  const seedB = seedByTarget.get(pair.b);
  if (!seedA || !seedB) throw new Error(`Missing seed for pair ${pair.a}/${pair.b}`);

  const aUnderA = rankAnswers(seedA.answers, pair.a);
  const bUnderA = rankAnswers(seedA.answers, pair.b);
  const bUnderB = rankAnswers(seedB.answers, pair.b);
  const aUnderB = rankAnswers(seedB.answers, pair.a);
  const gameA = gameById.get(pair.a);
  const gameB = gameById.get(pair.b);
  if (!gameA || !gameB) throw new Error(`Missing game for pair ${pair.a}/${pair.b}`);

  const aBeatsBOnASeed = (aUnderA.rank ?? 999) < (bUnderA.rank ?? 999);
  const bBeatsAOnBSeed = (bUnderB.rank ?? 999) < (aUnderB.rank ?? 999);
  const targetTop6Both = (aUnderA.rank ?? 999) <= 6 && (bUnderB.rank ?? 999) <= 6;
  const scoreTieA = aUnderA.score === bUnderA.score;
  const scoreTieB = bUnderB.score === aUnderB.score;

  let status: "passed" | "weak_pass" | "failed" | "indistinguishable" = "failed";
  if (scoreTieA && scoreTieB) status = "indistinguishable";
  else if (aBeatsBOnASeed && bBeatsAOnBSeed && targetTop6Both) status = "passed";
  else if (aBeatsBOnASeed && bBeatsAOnBSeed) status = "weak_pass";

  return {
    pair,
    status,
    aSeed: {
      targetRank: aUnderA.rank,
      confusableRank: bUnderA.rank,
      targetScore: aUnderA.score,
      confusableScore: bUnderA.score,
      targetBeatsConfusable: aBeatsBOnASeed,
    },
    bSeed: {
      targetRank: bUnderB.rank,
      confusableRank: aUnderB.rank,
      targetScore: bUnderB.score,
      confusableScore: aUnderB.score,
      targetBeatsConfusable: bBeatsAOnBSeed,
    },
    sharedTags: sharedTags(gameA, gameB),
    sharedDiscriminatorTags: sharedDiscriminatorTags(gameA, gameB),
  };
});

const statusCounts = results.reduce<Record<string, number>>((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  note: "Report-only confusable A/B diagnostic. Weak or failed pairs are optimization inputs, not v0.3.4 failures.",
  pairs: results.length,
  statusCounts,
  skippedPairs,
  results,
};

writeJsonReport("v0.3.4-confusable-ab.json", report);

const md = [
  "# GameSeek Mini v0.3.4 Confusable A/B Test",
  "",
  "Pairs are built from `confusableWith`, de-duplicated, and evaluated in both directions.",
  "",
  markdownTable(
    ["Status", "Count"],
    Object.entries(statusCounts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => [status, count]),
  ),
  "",
  "## Weak / Failed / Indistinguishable Pairs",
  "",
  markdownTable(
    ["A", "B", "Status", "A seed ranks A/B", "B seed ranks B/A", "Shared Tags"],
    results
      .filter((item) => item.status !== "passed")
      .slice(0, 40)
      .map((item) => [
        item.pair.a,
        item.pair.b,
        item.status,
        `${item.aSeed.targetRank}/${item.aSeed.confusableRank}`,
        `${item.bSeed.targetRank}/${item.bSeed.confusableRank}`,
        item.sharedTags.slice(0, 6).join(", ") || "none",
      ]),
  ),
  "",
  "## Skipped Pairs",
  "",
  markdownTable(
    ["From", "To", "Reason"],
    skippedPairs.slice(0, 80).map((item) => [item.from, item.to, item.reason]),
  ),
].join("\n");

writeMarkdownReport("v0.3.4-confusable-ab.md", md);
console.log(JSON.stringify({ wrote: ["v0.3.4-confusable-ab.json", "v0.3.4-confusable-ab.md"], pairs: results.length }, null, 2));
