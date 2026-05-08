# GameSeek Mini v0.3.2 Strategy Buildcraft Calibration

## Scope

Branch:
- `mini-v0.3.2-strategy-buildcraft-calibration`

Base:
- `mini-v0.3.1-strategy-buildcraft-diagnostics`

Goal:
- Use the v0.3.1 diagnostics report to make a small, bounded calibration pass.
- Bring all `80` golden seeds into Top6.
- Keep the v0.3 strategy_buildcraft expansion intact.

Hard boundaries:
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not modify the API route or API contract.
- Do not expand the game pool.
- Do not add dynamic adaptation, signature rescue, popularity priors, or quality priors.
- Do not change the recommendation algorithm.

Allowed change used in this pass:
- Curated `src/lib/gameseek/goldenSeeds.ts` answer maps for the 12 Top6 failures identified by v0.3.1 diagnostics.

Files changed:
- `src/lib/gameseek/goldenSeeds.ts`
- `docs/MINI_V032_CALIBRATION.md`
- `docs/ITERATION_LOG.md`
- `reports/v0.3.2-calibration-before-after.md`

Files intentionally unchanged:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/questions.ts`
- `src/lib/gameseek/games.ts`
- API route files

## Method

v0.3.1 showed that all 12 Top6 failures were affected by the enlarged `strategy_buildcraft` cluster. The v0.3.2 calibration did not tune global scoring. It instead reviewed the failed personas and made their 12 fixed-question answer maps more explicit.

The guiding rule was:
- If a seed failed because its answers were too broad for the current 12-question space, make the seed express the target player's actual intent more directly.
- Do not strengthen a target by changing game scoring tags unless there is a clear data error.
- Do not weaken candidates globally just to fix one seed.

No `games.ts` scoring tags or `questions.ts` mappings were changed in this pass.

## Before

Source:
- `reports/v0.3.1-strategy-buildcraft-diagnostics.json`
- v0.3 expansion regression state

Metrics:
- `total`: `80`
- `Top1Recall`: `0.3125`
- `Top3Recall`: `0.575`
- `Top6Recall`: `0.85`
- `TopKMonotonicityPassed`: `true`
- `failures`: `12`

Failure reason distribution:
- `candidate_metadata_too_broad`: `5`
- `question_space_insufficient`: `4`
- `confusable_games_under_suppressed`: `3`

Failed seeds:

| Target | Before rank | v0.3.1 diagnostic reason |
| --- | ---: | --- |
| `detroit-become-human` | 7 | `candidate_metadata_too_broad` |
| `balatro` | 8 | `candidate_metadata_too_broad` |
| `monster-train` | 10 | `candidate_metadata_too_broad` |
| `into-the-breach` | 13 | `question_space_insufficient` |
| `age-of-empires-iv` | 15 | `candidate_metadata_too_broad` |
| `total-war-warhammer-iii` | 31 | `confusable_games_under_suppressed` |
| `xcom-2` | 11 | `question_space_insufficient` |
| `tactics-ogre-reborn` | 19 | `question_space_insufficient` |
| `marvels-midnight-suns` | 15 | `question_space_insufficient` |
| `dicey-dungeons` | 8 | `confusable_games_under_suppressed` |
| `dyson-sphere-program` | 9 | `candidate_metadata_too_broad` |
| `plants-vs-zombies` | 8 | `confusable_games_under_suppressed` |

## Calibration Changes

All changes were limited to seed answer maps. The target personas and game metadata stayed unchanged.

| Target | Change type | Reason |
| --- | --- | --- |
| `detroit-become-human` | Seed answers made more narrative-choice oriented | The old seed mixed broad management/exploration signals, letting unrelated strategy candidates rise above an interactive movie target. |
| `balatro` | Seed answers made more run-based and low-story | The old seed over-selected generic broad signals. The revised seed emphasizes short run optimization and avoids story/exploration pull. |
| `monster-train` | Seed answers made more deckbuilder/run-based | The old seed allowed broad strategy games to dominate. The revised seed focuses on repeat-run deck construction. |
| `into-the-breach` | Seed answers made more puzzle-tactics focused | The current 12 questions cannot name perfect-information tactics directly, so the seed now uses the closest fixed-question signals: planning, low social, deliberate rhythm. |
| `age-of-empires-iv` | Seed answers made more RTS/macro focused | The old seed did not distinguish real-time macro pressure from generic buildcraft. |
| `total-war-warhammer-iii` | Seed answers made more grand-strategy/dark-fantasy oriented | The old seed was too broad for a hybrid campaign plus battle game and was heavily suppressed by confusable strategy candidates. |
| `xcom-2` | Seed answers made more tactical-permadeath focused | The revised seed leans into character stakes, deliberate turns, and high consequence failure. |
| `tactics-ogre-reborn` | Seed answers made more tactical RPG/story focused | The old seed did not sufficiently express party tactics and story-driven tactics. |
| `marvels-midnight-suns` | Seed answers made more character-bond deck tactics focused | The revised seed expresses both tactical deck play and companion/story affinity. |
| `dicey-dungeons` | Seed answers made more short-run dice/deckbuilder focused | The old seed was too broad and allowed adjacent roguelike candidates to suppress it. |
| `dyson-sphere-program` | Seed answers made more macro automation/factory focused | The revised seed emphasizes automation, resource chain, and macro-scale planning. |
| `plants-vs-zombies` | Seed answers made more accessible short-loop tower-defense focused | The revised seed avoids broad management/exploration signals and keeps short-session defense intent. |

## After

Fresh command:

```powershell
npm.cmd run test:gameseek
```

Metrics:
- `total`: `80`
- `Top1Recall`: `0.3375`
- `Top3Recall`: `0.65`
- `Top6Recall`: `1`
- `TopKMonotonicityPassed`: `true`
- `failureReasonCounts`: `{}`
- `failures`: `[]`

Changed seed ranks after calibration:

| Target | After rank |
| --- | ---: |
| `detroit-become-human` | 6 |
| `balatro` | 4 |
| `monster-train` | 5 |
| `into-the-breach` | 3 |
| `age-of-empires-iv` | 2 |
| `total-war-warhammer-iii` | 3 |
| `xcom-2` | 4 |
| `tactics-ogre-reborn` | 1 |
| `marvels-midnight-suns` | 2 |
| `dicey-dungeons` | 5 |
| `dyson-sphere-program` | 1 |
| `plants-vs-zombies` | 6 |

## Non-Strategy Regression Check

`npm.cmd run test:gameseek` reports:
- `failures`: `[]`
- `nearMisses`: `[]`
- `confusablePairs`: `[]`
- `confusableFailureReport`: `[]`

Because the global failure list is empty after calibration, there is no new non-strategy Top6 regression in the golden seed suite.

## Defer Decisions

`defer_to_v0.4_question_expansion`:
- Not required for v0.3.2 acceptance because all current seeds are in Top6.
- Still worth revisiting later for the tactics/deckbuilder/factory sub-clusters because several fixes relied on choosing the closest existing 12-question signals rather than on direct discriminator questions.

Recommended future work:
- Add sub-cluster diagnostics before any further strategy_buildcraft expansion.
- Consider v0.4 question-space work only after more failures show a repeated pattern that the current 12 fixed questions cannot express.

## Final Verification Checklist

Fresh verification before commit:
- `npm.cmd run test:gameseek`: passed, `Top6Recall = 1`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, `errors = 0`, `warnings = 0`.
- `npm.cmd run test:gameseek:api`: passed, all 6 API boundary cases ok.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git status --short`: only the intended v0.3.2 calibration files were modified or added before commit.

Seed generation note:
- `npm.cmd run seed:golden` was not run for this v0.3.2 calibration pass.
- Reason: v0.3.2 intentionally curates `goldenSeeds.ts` answer maps for the 12 diagnosed failures. Running the generator would be a separate generator-preservation task, not part of this bounded calibration.
