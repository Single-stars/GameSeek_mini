# GameSeek Mini v0.3.1 Strategy Diagnostics

Date:
- `2026-05-08`

Branch:
- `mini-v0.3.1-strategy-buildcraft-diagnostics`

## Goal

v0.3.1 is a diagnostics-only phase for the v0.3 `strategy_buildcraft` expansion.

The goal is not to raise `Top6Recall` immediately. The goal is to explain the current Top6 failures before any v0.3.2 calibration:
- Are the games genuinely too similar?
- Are generated golden seeds too generic?
- Are `discriminatorTags` too weak or overlapping?
- Are v0.3 candidate games still too broad?
- Are the current 12 fixed questions insufficient for strategy sub-cluster distinction?

## Hard Boundaries

This phase does not change:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/questions.ts`
- API route or API contract
- recommendation algorithm
- game pool size
- game tags / antiTags
- golden seed answers

This phase adds diagnostics only.

## Files Added

Script:
- `scripts/diagnose-strategy-buildcraft.ts`

Reports:
- `reports/v0.3.1-strategy-buildcraft-diagnostics.json`
- `reports/v0.3.1-strategy-buildcraft-diagnostics.md`

Documentation:
- `docs/MINI_V031_DIAGNOSTICS.md`
- `docs/ITERATION_LOG.md`

## Method

The diagnostic script reuses existing project logic:
- `games` from `src/lib/gameseek/games.ts`
- `goldenSeeds` from `src/lib/gameseek/goldenSeeds.ts`
- `questions` from `src/lib/gameseek/questions.ts`
- `rankAll` from `src/lib/gameseek/scoring.ts`

It does not copy or reimplement scoring.

The report includes all current Top6 failures that meet either condition:
- the target game is in `strategy_buildcraft`
- the Top6 contains a v0.3-added `strategy_buildcraft` candidate

This captures the full current failure set while still keeping the diagnostic focus on the strategy expansion.

## Summary

Current diagnostic output:
- `totalGames`: `80`
- `strategyBuildcraftGames`: `28`
- `allTop6Failures`: `12`
- `strategyTargetFailures`: `9`
- `failuresWithV03StrategyCandidates`: `12`

Failure type distribution:
- `candidate_metadata_too_broad`: `5`
- `question_space_insufficient`: `4`
- `confusable_games_under_suppressed`: `3`

## Failed Samples

The 12 diagnosed Top6 failures are:

| Target | Target Cluster | Rank | Likely Failure Reason |
| --- | --- | ---: | --- |
| `detroit-become-human` | `narrative_roleplay` | 7 | `candidate_metadata_too_broad` |
| `balatro` | `strategy_buildcraft` | 8 | `candidate_metadata_too_broad` |
| `monster-train` | `strategy_buildcraft` | 10 | `candidate_metadata_too_broad` |
| `into-the-breach` | `strategy_buildcraft` | 13 | `question_space_insufficient` |
| `age-of-empires-iv` | `strategy_buildcraft` | 15 | `candidate_metadata_too_broad` |
| `total-war-warhammer-iii` | `strategy_buildcraft` | 31 | `confusable_games_under_suppressed` |
| `xcom-2` | `strategy_buildcraft` | 11 | `question_space_insufficient` |
| `tactics-ogre-reborn` | `strategy_buildcraft` | 19 | `question_space_insufficient` |
| `marvels-midnight-suns` | `strategy_buildcraft` | 15 | `question_space_insufficient` |
| `dicey-dungeons` | `strategy_buildcraft` | 8 | `confusable_games_under_suppressed` |
| `dyson-sphere-program` | `sandbox_factory` | 9 | `candidate_metadata_too_broad` |
| `plants-vs-zombies` | `short_loop_casual` | 8 | `confusable_games_under_suppressed` |

## Diagnostic Findings

Finding 1:
- All 12 Top6 failures have at least one v0.3-added `strategy_buildcraft` candidate above the target.

Finding 2:
- 9 of the 12 failures are strategy targets. The other 3 are expansion side effects where new strategy games suppress non-strategy targets.

Finding 3:
- `candidate_metadata_too_broad` appears in 5 cases. These are the safest candidates for v0.3.2 tag cleanup, but cleanup should be limited to demonstrably over-broad candidate tags.

Finding 4:
- `question_space_insufficient` appears in 4 cases, mainly tactical / card-tactical targets. These should not be forced through scoring changes until the team decides whether the current 12 questions can express tactical sub-cluster differences.

Finding 5:
- `confusable_games_under_suppressed` appears in 3 cases. These should first be reviewed as metadata / confusableWith issues, not as an instruction to add algorithmic suppression.

## Recommended Actions For v0.3.2

Action 1:
- Do not modify `scoring.ts`.

Action 2:
- Start with `candidate_metadata_too_broad` failures:
  - `detroit-become-human`
  - `balatro`
  - `monster-train`
  - `age-of-empires-iv`
  - `dyson-sphere-program`

Action 3:
- For each of those, inspect only the candidates above target and remove broad scoring tags from candidates where the report shows weak or zero shared target semantics.

Action 4:
- Treat `question_space_insufficient` failures as potential v0.4 question-space evidence unless there is an obvious seed refinement inside the current 12 answers.

Action 5:
- Treat `confusable_games_under_suppressed` failures as metadata review candidates. Tighten `confusableWith` and `discriminatorTags` before considering any algorithmic suppression.

## Verification

Required commands for v0.3.1:

```powershell
npm.cmd run test:gameseek
npm.cmd run test:gameseek:metadata
npm.cmd run test:gameseek:api
npm.cmd run build
git diff -- src/lib/gameseek/scoring.ts
git diff -- src/lib/gameseek/questions.ts
git status --short
```

Expected:
- `test:gameseek` passes at current v0.3 thresholds.
- `metadata errors = 0`
- `metadata warnings = 0`
- API tests pass.
- Build passes.
- `scoring.ts` has no diff.
- `questions.ts` has no diff.
- Working tree is clean after commit.
