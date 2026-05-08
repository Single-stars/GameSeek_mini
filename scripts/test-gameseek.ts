import { goldenSeeds } from "../src/lib/gameseek/goldenSeeds";
import { rankAll } from "../src/lib/gameseek/scoring";

let top1 = 0;
let top3 = 0;
let top6 = 0;

const failures: any[] = [];

for (const seed of goldenSeeds) {
  const ranked = rankAll(seed.answers);
  const ids = ranked.map(r => r.game.id);

  const rank = ids.indexOf(seed.targetGameId) + 1;

  if (rank === 1) top1++;
  if (rank > 0 && rank <= 3) top3++;
  if (rank > 0 && rank <= 6) top6++;

  if (rank === 0 || rank > 6) {
    failures.push({
      seedId: seed.id,
      targetGameId: seed.targetGameId,
      rank: rank === 0 ? null : rank,
      top6: ranked.slice(0, 6).map(r => ({
        id: r.game.id,
        title: r.game.title,
        score: r.score,
        matchedTags: r.matchedTags,
        blockedBy: r.blockedBy
      })),
      description: seed.description
    });
  }
}

const total = goldenSeeds.length;

const report = {
  total,
  top1Recall: top1 / total,
  top3Recall: top3 / total,
  top6Recall: top6 / total,
  topKMonotonicityPassed: top6 >= top3 && top3 >= top1,
  failures
};

console.log(JSON.stringify(report, null, 2));

if (!report.topKMonotonicityPassed) {
  process.exit(1);
}

if (report.top6Recall < 0.7) {
  console.error("Top6 recall below 0.7");
  process.exit(1);
}
