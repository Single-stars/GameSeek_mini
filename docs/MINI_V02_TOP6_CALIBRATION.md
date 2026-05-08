# GameSeek Mini v0.2 Top6 Calibration

## Scope

Goal: calibrate the existing 60-game Mini v0.2 pool until golden seed `Top6Recall` reaches `1.0`.

Project-level iteration record:
- `docs/ITERATION_LOG.md`

Future calibration changes must read `docs/ITERATION_LOG.md` and this document before editing. After calibration, record the changed tags, affected seeds, verification output, and remaining risks in Markdown before closing the task.

Allowed files for this calibration:
- `src/lib/gameseek/games.ts`
- `src/lib/gameseek/questions.ts`
- `docs/MINI_V02_TOP6_CALIBRATION.md`

Hard boundaries:
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not change the recommendation algorithm.
- Do not expand the game pool.
- Do not hand-edit `src/lib/gameseek/goldenSeeds.ts`.
- Do not add adaptive questions, signature rescue, popularity priors, or quality priors.

## Baseline Before Top6 100 Calibration

Starting v0.2 diagnostic baseline:
- `Top1Recall`: `0.30`
- `Top3Recall`: `0.5333333333333333`
- `Top6Recall`: `0.8166666666666667`
- `TopKMonotonicityPassed`: `true`
- Failure reason: `confusable_game_suppression`

## Iteration 1: Broaden Concrete Question Mappings

File changed:
- `src/lib/gameseek/questions.ts`

Question tag changes:
- `Q02_LOOP.A`: added `hero_shooter`
- `Q02_LOOP.B`: added `lane_strategy`
- `Q03_MASTERY.B`: added `4x_strategy`, `empire_building`, `macro_planning`, `perfect_information`
- `Q03_MASTERY.C`: added `logic`, `rule_manipulation`
- `Q04_SOCIAL.C`: added `two_player`, `puzzle_platforming`
- `Q06_FAILURE.C`: added `failure_pressure`
- `Q07_STORY.A`: added `choice_consequence`
- `Q08_EXPLORATION.A`: added `sandbox_rpg`
- `Q09_CREATE_MANAGE.C`: added `crafting`
- `Q10_RHYTHM.A`: added `tower_defense`

Observed result:
- `Top1Recall`: `0.31666666666666665`
- `Top3Recall`: `0.5666666666666667`
- `Top6Recall`: `0.8666666666666667`
- Remaining failures: `8`

## Iteration 2: Add Missing Concrete Same-Option Signals

File changed:
- `src/lib/gameseek/questions.ts`

Question tag changes:
- `Q02_LOOP.A`: added `melee_action`, `combo`
- `Q02_LOOP.B`: added `deckbuilder`
- `Q03_MASTERY.C`: added `visual_trick`
- `Q04_SOCIAL.D`: added `objective`
- `Q07_STORY.A`: added `philosophical`
- `Q09_CREATE_MANAGE.B`: added `house_building`, `character_creation`
- `Q10_RHYTHM.A`: added `auto_attack`

Observed result after `npm.cmd run seed:golden` and `npm.cmd run test:gameseek`:
- `Top1Recall`: `0.35`
- `Top3Recall`: `0.65`
- `Top6Recall`: `0.9666666666666667`
- Remaining failures: `2`
- Remaining failed targets: `dont-starve`, `dyson-sphere-program`

Failure diagnosis:
- `dont-starve` ranked `7`, tied at the Top6 cutoff. Its seed selected self-directed discovery and survival/resource planning options, but the answer signals did not include `self_directed`.
- `dyson-sphere-program` ranked `7`, tied at the Top6 cutoff. Its seed selected factory/resource optimization options, but `Q09_CREATE_MANAGE.C` did not reinforce the macro planning signal that distinguishes large-scale factory planning.

## Iteration 3: Resolve Final Rank-7 Ties

File changed:
- `src/lib/gameseek/questions.ts`

Question tag changes:
- `Q01_MOTIVE.C`: added `self_directed`
- `Q09_CREATE_MANAGE.C`: added `macro_planning`

Rationale:
- `self_directed` matches the option text "探索、发现秘密、自己理解规则" and gives survival sandbox targets like `dont-starve` the missing self-directed discovery signal.
- `macro_planning` matches the option text "生产链、自动化、资源优化" and gives macro-scale factory targets like `dyson-sphere-program` the missing production-chain planning signal.

Verification result:
- `Top1Recall`: `0.35`
- `Top3Recall`: `0.6666666666666666`
- `Top6Recall`: `0.9833333333333333`
- Remaining failure: `sky`

Regression note:
- Adding `self_directed` fixed `dont-starve` and `macro_planning` fixed `dyson-sphere-program`.
- `sky` moved to rank `7` because open exploration candidates gained enough score to tie or exceed it.

## Iteration 4: Restore Soft Social Cozy Signal

File changed:
- `src/lib/gameseek/questions.ts`

Question tag change:
- `Q11_TONE.B`: added `soft_social`

Rationale:
- `soft_social` matches the option text "安静、治愈、陪伴".
- The tag is currently specific to `sky`, so it targets the missing soft-social companionship signal without broadly boosting all cozy games.

Verification result:
- `Top1Recall`: `0.3333333333333333`
- `Top3Recall`: `0.6833333333333333`
- `Top6Recall`: `1`
- `TopKMonotonicityPassed`: `true`
- `failureReasonCounts`: `{}`
- `failures`: `[]`

## Final Verification Checklist

Commands:
- `npm.cmd run seed:golden`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`

Status:
- `npm.cmd run seed:golden` completed successfully during calibration verification.
- `npm.cmd run test:gameseek` after generated seeds:
  - `Top1Recall`: `0.3333333333333333`
  - `Top3Recall`: `0.6833333333333333`
  - `Top6Recall`: `1`
  - `TopKMonotonicityPassed`: `true`
  - `failureReasonCounts`: `{}`
  - `failures`: `[]`
- `src/lib/gameseek/goldenSeeds.ts` was restored to avoid committing generated seed changes in this calibration-only step.
- Current tracked `goldenSeeds.ts` plus calibrated `questions.ts` also yields `Top6Recall = 1`.
- `npm.cmd run test:gameseek:metadata`: passed, with warnings only.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.

## Final Changed Files

Tracked changes kept for this calibration:
- `src/lib/gameseek/questions.ts`
- `docs/MINI_V02_TOP6_CALIBRATION.md`

No retained changes:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/games.ts`
- `src/lib/gameseek/goldenSeeds.ts`
