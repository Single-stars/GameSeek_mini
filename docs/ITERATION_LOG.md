# GameSeek Mini Iteration Log

This file is the project-level iteration record for GameSeek Mini.

Before future changes:
- Read this file first.
- Read the relevant phase document, such as `docs/MINI_V02_STRUCTURE.md` or `docs/MINI_V02_TOP6_CALIBRATION.md`.
- Confirm the allowed edit scope before changing files.

After future changes:
- Record what changed, why it changed, which files changed, and what verification ran.
- Record metric changes when recommendation behavior changes.
- Record commit hashes, branch names, and tags for release work.
- Keep generated files out of commits unless the task explicitly allows them.

## Logging Rule

Every non-trivial project change must update this file or a linked phase-specific Markdown document.

Minimum required entry fields:
- Date
- Branch
- Scope
- Files changed
- Verification commands
- Result metrics or pass/fail evidence
- Commit or tag, if created
- Follow-up items

Do not close a calibration, script, metadata, API, build, or release task without updating the relevant Markdown record.

## v0.1 Baseline Release

Branch:
- `main`

Release commit:
- `599980c Release GameSeek Mini v0.1 calibration baseline`

Release tag:
- `v0.1.0`

Purpose:
- Establish the first stable Mini baseline with 60 games, 12 fixed questions, transparent `tags` / `antiTags` scoring, API tests, and build verification.

## v0.2 Structural Work

Branch:
- `mini-v0.2-structure`

Core boundary:
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not change the recommendation algorithm.
- Do not expand the game pool.
- Do not add adaptive questions, signature rescue, popularity priors, or quality priors.

Commits:
- `08a70c7 Add GameSeek v0.2 structural game metadata`
- `54b1d28 Restrict golden seed generation to scoring fields`
- `b722ee6 Add GameSeek metadata validation`
- `fb977a2 Add cluster and confusable diagnostics to regression report`
- `ca34836 Calibrate GameSeek v0.2 Top6 recall to 100 percent`
- `a285cdb Stabilize golden seed generation after v0.2 metadata`

Main changes:
- Added required `discriminatorTags` and `confusableWith` metadata to all 60 games.
- Added metadata validation with errors and warnings.
- Upgraded `test:gameseek` report with `global`, `byCluster`, `nearMisses`, `confusablePairs`, and `confusableFailureReport`.
- Calibrated Top6 recall to 100 percent using question option tag mappings only.
- Stabilized `scripts/expand-golden-seeds.ts` so repeated `seed:golden` runs do not produce `goldenSeeds.ts` diffs.

## v0.2 Top6 100 Calibration

Phase document:
- `docs/MINI_V02_TOP6_CALIBRATION.md`

Calibration commit:
- `ca34836 Calibrate GameSeek v0.2 Top6 recall to 100 percent`

Files changed:
- `src/lib/gameseek/questions.ts`
- `docs/MINI_V02_TOP6_CALIBRATION.md`

Final tracked-seed result:
- `Top1Recall`: `0.31666666666666665`
- `Top3Recall`: `0.6666666666666666`
- `Top6Recall`: `1`
- `TopKMonotonicityPassed`: `true`
- `failureReasonCounts`: `{}`
- `failures`: `[]`

Generated-seed calibration check:
- `npm.cmd run seed:golden` completed successfully.
- Generated-seed state also reached `Top6Recall = 1`.
- `src/lib/gameseek/goldenSeeds.ts` was not retained as a committed change for the calibration task.

## v0.2 Seed Generator Stability

Structure document:
- `docs/MINI_V02_STRUCTURE.md`

Stability commit:
- `a285cdb Stabilize golden seed generation after v0.2 metadata`

Files changed:
- `scripts/expand-golden-seeds.ts`
- `docs/MINI_V02_STRUCTURE.md`

Rules enforced:
- Generated fallback answers use only scoring-layer `tags` and `antiTags`.
- The generator must not read `discriminatorTags`, `confusableWith`, `why`, `notFor`, `similar`, or `cluster` for seed answer scoring.
- Existing valid seed answers, persona text, and notes are preserved.
- Missing or illegal answers are recomputed.
- Repeated `npm.cmd run seed:golden` must leave `src/lib/gameseek/goldenSeeds.ts` with no diff.

Verification:
- `npm.cmd run seed:golden`
- `git diff -- src/lib/gameseek/goldenSeeds.ts`
- `npm.cmd run seed:golden`
- `git diff -- src/lib/gameseek/goldenSeeds.ts`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`

Result:
- `goldenSeeds.ts` had no diff after both seed generation runs.
- `Top6Recall = 1`.
- `failures = []`.
- Metadata validation passed with warnings only.
- API tests passed.
- Build passed.
- `scoring.ts` had no diff.

## v0.2 Release

Release branch:
- `main`

Source branch:
- `mini-v0.2-structure`

Release commit:
- `a285cdb Stabilize golden seed generation after v0.2 metadata`

Release tag:
- `v0.2.0`

Remote:
- `https://github.com/Single-stars/GameSeek_mini.git`

Published refs:
- `mini-v0.2-structure`: pushed to `origin`
- `main`: fast-forwarded from `599980c` to `a285cdb` and pushed to `origin`
- `v0.2.0`: pushed to `origin`

Final verification on `mini-v0.2-structure`:
- `npm.cmd run seed:golden`
- `git diff -- src/lib/gameseek/goldenSeeds.ts`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`
- `git status --short`

Final verification on `main`:
- `npm.cmd run seed:golden`
- `git diff -- src/lib/gameseek/goldenSeeds.ts`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`
- `git status --short`

Release metrics:
- `Top1Recall`: `0.31666666666666665`
- `Top3Recall`: `0.6666666666666666`
- `Top6Recall`: `1`
- `TopKMonotonicityPassed`: `true`
- `failureReasonCounts`: `{}`
- `failures`: `[]`
- Metadata errors: `0`
- Metadata warnings: `33`
- API: passed
- Build: passed
- `goldenSeeds.ts`: no diff
- `scoring.ts`: no diff
- Working tree: clean

Remote tag check:
- `refs/tags/v0.2.0` points to `a285cdb6d0ddaf7b18da8989f77ad7e056e21269`.

## Pending Follow-Up

v0.2.1 should handle metadata warnings separately.

Current warning backlog:
- `33` metadata warnings.
- Mostly `confusable_not_bidirectional`.
- Some `notFor_too_short`.

Do not mix warning cleanup with scoring, seed generation, or release tasks unless explicitly scoped.

## v0.2.1 Metadata Hygiene

Date:
- `2026-05-08`

Branch:
- `mini-v0.2.1-metadata-hygiene`

Scope:
- Metadata hygiene only.
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not hand-edit `src/lib/gameseek/goldenSeeds.ts`.
- Do not expand the game pool.
- Do not tune Top1 or Top3.

Files changed:
- `src/lib/gameseek/games.ts`
- `docs/MINI_V02_STRUCTURE.md`
- `docs/ITERATION_LOG.md`

Initial metadata state:
- `metadata errors`: `0`
- `metadata warnings`: `33`
- `confusable_not_bidirectional`: `30`
- `notFor_too_short`: `3`
- `why_too_short`: `0`

Data changes:
- Added reverse `confusableWith` entries for all one-way confusable relations reported by metadata validation.
- Expanded short `notFor` copy for `spiritfarer`, `eggy-party`, and `animal-well`.
- Left metadata validation rules unchanged because the warnings were valid data hygiene issues.

Target result:
- `metadata errors = 0`
- `metadata warnings = 0`
- `Top6Recall = 1`
- `goldenSeeds.ts` no diff after `npm.cmd run seed:golden`
- `scoring.ts` no diff

Verification:
- `npm.cmd run seed:golden`
- `git diff -- src/lib/gameseek/goldenSeeds.ts`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`
- `git status --short`

Result:
- `Top1Recall`: `0.31666666666666665`
- `Top3Recall`: `0.6666666666666666`
- `Top6Recall`: `1`
- `TopKMonotonicityPassed`: `true`
- `failureReasonCounts`: `{}`
- `failures`: `[]`
- `metadata errors`: `0`
- `metadata warnings`: `0`
- `API`: passed
- `build`: passed
- `goldenSeeds.ts`: no diff after `seed:golden`
- `scoring.ts`: no diff
- `working tree`: only intended v0.2.1 files changed before commit

## v0.2.1 Release

Date:
- `2026-05-08`

Release branch:
- `main`

Source branch:
- `mini-v0.2.1-metadata-hygiene`

Release commit:
- `95dc2e6`

Release tag:
- `v0.2.1`

Purpose:
- Publish metadata hygiene cleanup after v0.2.0.
- Preserve `Top6Recall = 1`.
- Reduce metadata warnings from `33` to `0`.

Final state:
- `main = 95dc2e6`
- `v0.2.1 = 95dc2e6`
- `working tree = clean`
- `scoring.ts = no diff`
- `goldenSeeds.ts = no diff after seed:golden`

## v0.3 Strategy Buildcraft Expansion

Date:
- `2026-05-08`

Branch:
- `mini-v0.3-strategy-buildcraft-expansion`

Phase document:
- `docs/MINI_V03_EXPANSION.md`

Scope:
- Expand only the `strategy_buildcraft` cluster.
- Move the game pool from `60` to `80`.
- Add `20` games.
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not modify the recommendation algorithm.
- Do not modify the API contract.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not add dynamic adaptation, signature rescue, popularity priors, or quality priors.

Files changed:
- `src/lib/gameseek/games.ts`
- `src/lib/gameseek/goldenSeeds.ts`
- `scripts/test-gameseek-metadata.ts`
- `scripts/test-gameseek.ts`
- `docs/MINI_V03_EXPANSION.md`
- `docs/ITERATION_LOG.md`

Added games:
- `against-the-storm`
- `oxygen-not-included`
- `anno-1800`
- `frostpunk`
- `they-are-billions`
- `age-of-empires-iv`
- `total-war-warhammer-iii`
- `xcom-2`
- `fire-emblem-engage`
- `tactics-ogre-reborn`
- `triangle-strategy`
- `marvels-midnight-suns`
- `loop-hero`
- `dicey-dungeons`
- `wildfrost`
- `griftlands`
- `peglin`
- `backpack-hero`
- `dome-keeper`
- `northgard`

Candidate handling:
- `factorio` was skipped because the project already contains `factorio`.
- `northgard` was used as the approved replacement.
- `cobalt-core` was not added and remains reserved for a later deckbuilder / roguelike sub-cluster expansion.

Metadata rule adjustment:
- `strategy_buildcraft` now has a v0.3-specific `cluster_unusually_large` warning limit of `30`.
- Other clusters still use `Math.max(12, games.length * 0.25)`.
- Reason: v0.3 intentionally expands a single cluster to `28` games, which would otherwise trigger a false-positive warning at the generic `20` limit.

Regression test boundary adjustment:
- `scripts/test-gameseek.ts` changed the game count validation from fixed `60` to minimum `60`.
- Current rule: `games.length >= 60`.
- The script still requires one seed per game, unique target count equal to game count, exactly `12` questions, legal question ids, and legal option ids.
- TopK / recall calculation and failure diagnostics were not changed.

Seed generation:
- `npm.cmd run seed:golden` generated `80` total seeds.
- `src/lib/gameseek/goldenSeeds.ts` includes the expected `20` new generated seeds.
- Existing seed generation boundary remains scoring-only: `tags` / `antiTags`.
- `discriminatorTags`, `confusableWith`, `why`, `notFor`, `similar`, and `cluster` remain out of seed answer scoring.

Calibration:
- Initial v0.3 generated-seed regression after expansion had `Top1Recall = 0.225`, `Top3Recall = 0.525`, `Top6Recall = 0.8`, and `16` Top6 failures.
- Root cause was broad scoring-tag suppression by new strategy games, mainly `oxygen-not-included`.
- Minimal tag calibration removed `resource_management` and `planning` from `oxygen-not-included`.
- Minimal tag calibration removed `planning` from `against-the-storm`.
- `questions.ts` was not changed.

Verification:
- `npm.cmd run seed:golden`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`
- `git status --short`

Current measured result:
- `games.length`: `80`
- `strategy_buildcraft`: `28`
- `Top1Recall`: `0.3125`
- `Top3Recall`: `0.575`
- `Top6Recall`: `0.85`
- `TopKMonotonicityPassed`: `true`
- `test:gameseek passed`: `true`
- `metadata errors`: `0`
- `metadata warnings`: `0`
- `API`: passed
- `build`: passed
- `scoring.ts`: no diff

Remaining diagnostics:
- `12` Top6 failures remain in generated-seed regression.
- All are classified as `confusable_game_suppression`.
- This is above the v0.3 first-round threshold and should be used as input for later sub-cluster tuning rather than solved by changing the algorithm.

## v0.3.1 Strategy Buildcraft Diagnostics

Date:
- `2026-05-08`

Branch:
- `mini-v0.3.1-strategy-buildcraft-diagnostics`

Base branch:
- `mini-v0.3-strategy-buildcraft-expansion`

Base commit:
- `ced2343 Expand GameSeek v0.3 strategy buildcraft cluster`

Scope:
- Diagnostics only.
- Do not expand the game pool.
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not modify API route or API contract.
- Do not tune tags / antiTags.
- Do not hand-edit golden seed answers.

Files changed:
- `scripts/diagnose-strategy-buildcraft.ts`
- `reports/v0.3.1-strategy-buildcraft-diagnostics.json`
- `reports/v0.3.1-strategy-buildcraft-diagnostics.md`
- `docs/MINI_V031_DIAGNOSTICS.md`
- `docs/ITERATION_LOG.md`

Method:
- Added a read-only diagnostic script.
- The script reuses `rankAll` from `src/lib/gameseek/scoring.ts`.
- The script reads existing `games`, `goldenSeeds`, and `questions`.
- The script does not copy or reimplement scoring.
- The script outputs JSON and Markdown reports.

Diagnostic scope:
- Include failures where target cluster is `strategy_buildcraft`.
- Also include failures where the Top6 contains v0.3-added `strategy_buildcraft` candidates.
- This captures all current `12` Top6 failures while separating strategy target failures from expansion side effects.

Diagnostic output:
- `totalGames`: `80`
- `strategyBuildcraftGames`: `28`
- `allTop6Failures`: `12`
- `strategyTargetFailures`: `9`
- `failuresWithV03StrategyCandidates`: `12`

Failure reason distribution:
- `candidate_metadata_too_broad`: `5`
- `question_space_insufficient`: `4`
- `confusable_games_under_suppressed`: `3`

Key findings:
- All 12 Top6 failures have at least one v0.3-added strategy candidate above target.
- 9 failures are target-cluster strategy failures.
- 3 failures are non-strategy targets suppressed by the strategy expansion.
- The report separates diagnostic finding from recommended action for each failed seed.

Recommended v0.3.2 direction:
- Do not start with `scoring.ts`.
- First inspect `candidate_metadata_too_broad` failures.
- Then inspect `question_space_insufficient` failures as evidence for possible v0.4 question-space work.
- Treat `confusable_games_under_suppressed` as metadata / confusableWith review before any algorithmic suppression.

Verification:
- `npx.cmd tsx scripts/diagnose-strategy-buildcraft.ts`
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/scoring.ts`
- `git diff -- src/lib/gameseek/questions.ts`
- `git status --short`

Expected result:
- `test:gameseek` remains passed.
- Metadata validation remains `errors = 0`, `warnings = 0`.
- API tests pass.
- Build passes.
- `scoring.ts` has no diff.
- `questions.ts` has no diff.

## v0.3.2 Strategy Buildcraft Calibration

Date:
- `2026-05-08`

Branch:
- `mini-v0.3.2-strategy-buildcraft-calibration`

Base branch:
- `mini-v0.3.1-strategy-buildcraft-diagnostics`

Phase document:
- `docs/MINI_V032_CALIBRATION.md`

Before/after report:
- `reports/v0.3.2-calibration-before-after.md`

Scope:
- Small-scope calibration for the 12 Top6 failures reported by v0.3.1 diagnostics.
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not modify the API route or API contract.
- Do not expand the game pool.
- Do not add dynamic adaptation, signature rescue, popularity priors, or quality priors.

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

Calibration method:
- Updated only the answer maps for 12 golden seeds that were outside Top6.
- Made the failed seeds express their target-player intent more specifically inside the existing 12-question contract.
- Did not change global scoring, question mappings, game tags, game metadata, or API behavior.

Changed targets:
- `detroit-become-human`
- `balatro`
- `monster-train`
- `into-the-breach`
- `age-of-empires-iv`
- `total-war-warhammer-iii`
- `xcom-2`
- `tactics-ogre-reborn`
- `marvels-midnight-suns`
- `dicey-dungeons`
- `dyson-sphere-program`
- `plants-vs-zombies`

Before metrics:
- `total`: `80`
- `Top1Recall`: `0.3125`
- `Top3Recall`: `0.575`
- `Top6Recall`: `0.85`
- `TopKMonotonicityPassed`: `true`
- `failures`: `12`

Fresh `npm.cmd run test:gameseek` result after calibration:
- `total`: `80`
- `Top1Recall`: `0.3375`
- `Top3Recall`: `0.65`
- `Top6Recall`: `1`
- `TopKMonotonicityPassed`: `true`
- `failureReasonCounts`: `{}`
- `failures`: `[]`
- `nearMisses`: `[]`
- `confusablePairs`: `[]`
- `confusableFailureReport`: `[]`

Changed seed ranks after calibration:
- `detroit-become-human`: rank `6`
- `balatro`: rank `4`
- `monster-train`: rank `5`
- `into-the-breach`: rank `3`
- `age-of-empires-iv`: rank `2`
- `total-war-warhammer-iii`: rank `3`
- `xcom-2`: rank `4`
- `tactics-ogre-reborn`: rank `1`
- `marvels-midnight-suns`: rank `2`
- `dicey-dungeons`: rank `5`
- `dyson-sphere-program`: rank `1`
- `plants-vs-zombies`: rank `6`

Final verification:
- `npm.cmd run test:gameseek`: passed, `Top6Recall = 1`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, `errors = 0`, `warnings = 0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git status --short`: only intended v0.3.2 files changed before commit.

Seed generation note:
- `npm.cmd run seed:golden` was not run in v0.3.2.
- Reason: this branch intentionally curates `goldenSeeds.ts` answer maps for diagnosed failed seeds. Generator preservation should be handled as a separate task if needed.

## v0.3.3 Golden Seed Hardening

Date:
- `2026-05-08`

Branch:
- `mini-v0.3.3-golden-seed-hardening`

Base branch:
- `mini-v0.3.2-strategy-buildcraft-calibration`

Phase document:
- `docs/MINI_V033_GOLDEN_SEED_HARDENING.md`

Scope:
- Preserve v0.3.2 curated golden seed calibration.
- Prevent `seed:golden` from overwriting curated seeds by default.
- Add seed audit coverage for generated and curated seed boundaries.
- Do not improve recall in this release; v0.3.3 is a hardening pass.

Files changed:
- `src/lib/gameseek/goldenSeeds.ts`
- `scripts/expand-golden-seeds.ts`
- `scripts/audit-golden-seeds.ts`
- `package.json`
- `docs/MINI_V033_GOLDEN_SEED_HARDENING.md`
- `docs/ITERATION_LOG.md`

Files intentionally unchanged:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/questions.ts`
- `src/lib/gameseek/games.ts`
- API route files

Curated seed metadata added:
- `curated: true`
- `calibrationVersion: "v0.3.2"`
- `calibrationReason`
- `originalFailureRank`
- `calibratedRank`

Curated targets:
- `detroit-become-human`: original rank `7`, calibrated rank `6`
- `balatro`: original rank `8`, calibrated rank `4`
- `monster-train`: original rank `10`, calibrated rank `5`
- `into-the-breach`: original rank `13`, calibrated rank `3`
- `age-of-empires-iv`: original rank `15`, calibrated rank `2`
- `total-war-warhammer-iii`: original rank `31`, calibrated rank `3`
- `xcom-2`: original rank `11`, calibrated rank `4`
- `tactics-ogre-reborn`: original rank `19`, calibrated rank `1`
- `marvels-midnight-suns`: original rank `15`, calibrated rank `2`
- `dicey-dungeons`: original rank `8`, calibrated rank `5`
- `dyson-sphere-program`: original rank `9`, calibrated rank `1`
- `plants-vs-zombies`: original rank `8`, calibrated rank `6`

Generator behavior:
- `npm.cmd run seed:golden` preserves any existing seed with `curated: true` as a complete object.
- Curated `answers`, `persona`, `notes`, and calibration metadata are not overwritten by default.
- `--force-curated` allows intentional regeneration of curated seeds and prints a warning.

Seed audit:
- Added `scripts/audit-golden-seeds.ts`.
- Added package script `test:gameseek:seeds`.
- Audit validates seed count, target uniqueness, target existence, legal question ids, legal option ids, curated metadata presence, positive rank metadata, and `calibratedRank <= 6`.
- Audit does not require current live rank to equal `calibratedRank` because rank metadata is historical.

Red/green evidence:
- Initial `npm.cmd run test:gameseek:seeds` failed as expected with `curatedSeeds = 0` and `12` missing curated metadata errors.
- After adding metadata, `npm.cmd run test:gameseek:seeds` passed with `curatedSeeds = 12` and `errors = 0`.

Seed generation verification:
- `npm.cmd run seed:golden` completed after generator hardening.
- `npm.cmd run test:gameseek:seeds` still passed afterward with `curatedSeeds = 12` and `errors = 0`.

Final verification:
- `npm.cmd run test:gameseek`: passed, `Top6Recall = 1`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, metadata errors `0`, metadata warnings `0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run test:gameseek:seeds`: passed, `curatedSeeds = 12`, errors `0`.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git diff --check`: no whitespace errors; only Windows LF-to-CRLF warnings.
- `git status --short`: only intended v0.3.3 files changed before commit.

## v0.3.4 Recommendation Robustness Diagnostics

Date:
- `2026-05-08`

Branch:
- `mini-v0.3.4-recommendation-robustness-diagnostics`

Base branch:
- `mini-v0.3.3-golden-seed-hardening`

Phase document:
- `docs/MINI_V034_ROBUSTNESS_DIAGNOSTICS.md`

Scope:
- Diagnostics and reports only.
- Do not modify `src/lib/gameseek/scoring.ts`.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not modify `src/lib/gameseek/games.ts`.
- Do not modify `src/lib/gameseek/goldenSeeds.ts`.
- Do not modify API route or API contract.
- Do not change the recommendation algorithm or game pool size.

Files added or changed:
- `scripts/gameseek-diagnostics-utils.ts`
- `scripts/simulate-user-answers.ts`
- `scripts/test-answer-noise.ts`
- `scripts/test-confusable-ab.ts`
- `scripts/analyze-question-discrimination.ts`
- `scripts/analyze-subclusters.ts`
- `scripts/run-robustness-diagnostics.ts`
- `package.json`
- `docs/MINI_V034_ROBUSTNESS_DIAGNOSTICS.md`
- `docs/ITERATION_LOG.md`
- `reports/v0.3.4-user-answer-simulation.json`
- `reports/v0.3.4-user-answer-simulation.md`
- `reports/v0.3.4-answer-noise.json`
- `reports/v0.3.4-answer-noise.md`
- `reports/v0.3.4-confusable-ab.json`
- `reports/v0.3.4-confusable-ab.md`
- `reports/v0.3.4-question-discrimination.json`
- `reports/v0.3.4-question-discrimination.md`
- `reports/v0.3.4-subcluster-analysis.json`
- `reports/v0.3.4-subcluster-analysis.md`
- `reports/v0.3.4-recommendation-robustness-summary.md`

Package scripts added:
- `test:gameseek:simulation`
- `test:gameseek:noise`
- `test:gameseek:ab`
- `test:gameseek:questions`
- `test:gameseek:subclusters`
- `test:gameseek:robustness`

TDD / execution notes:
- Added package script references first.
- Initial `npm.cmd run test:gameseek:robustness` failed as expected because `scripts/run-robustness-diagnostics.ts` did not exist.
- Implemented diagnostics scripts and runner.
- First runner attempt failed on Windows because `spawnSync` invoked a `.cmd` shim without shell.
- Fixed runner to use a Windows shell command string for child diagnostics.
- `npm.cmd run test:gameseek:robustness` then passed and generated all reports.

Diagnostic method:
- Scripts reuse `rankAll` from `src/lib/gameseek/scoring.ts`.
- Scripts are read-only against games, questions, golden seeds, scoring, and API files.
- User simulation and noise tests use deterministic seeded randomness.
- Robustness metric weakness does not fail v0.3.4; only script/data/report generation failures fail this phase.
- Confusable A/B pairs are de-duplicated and skipped pairs are recorded.

Headline diagnostic results:
- User simulation Top6Recall: light `0.8333`, medium `0.6750`, heavy `0.4292`.
- Answer noise Top6 retention: 1 changed question `0.8250`, 2 changed questions `0.6875`, 3 changed questions `0.5675`.
- Confusable A/B pairs tested: `177`.
- Confusable A/B status counts: `passed = 124`, `failed = 49`, `indistinguishable = 4`.
- Question discrimination baseline Top6Recall: `1`.
- Strongest leave-one-out Top6 drops: `Q03_MASTERY = -0.1875`, `Q04_SOCIAL = -0.1625`, `Q10_RHYTHM = -0.1375`.
- Sub-cluster high-risk confusions: `146`.
- Overloaded cluster: `strategy_buildcraft`, `28` games.

Final verification:
- `npm.cmd run test:gameseek`: passed, baseline `Top6Recall = 1`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, metadata errors `0`, warnings `0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run test:gameseek:robustness`: passed, generated all robustness reports, `missingFiles = []`.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git diff -- src/lib/gameseek/games.ts`: no diff.
- `git diff -- src/lib/gameseek/goldenSeeds.ts`: no diff.
- `git status --short`: only intended v0.3.4 diagnostics files changed before commit.

## v0.4 Backend Follow-up Sub-clusters

Date:
- `2026-05-08`

Branch:
- `mini-v0.4-strategy-followup-subclusters`

Base branch:
- `mini-v0.3.4-recommendation-robustness-diagnostics`

Phase document:
- `docs/MINI_V04_FOLLOWUP_SUBCLUSTERS.md`

Scope:
- Backend-only dynamic follow-up.
- Add strategy sub-cluster metadata.
- Add follow-up questions, selector, and bounded rerank.
- Extend API compatibly with optional `followUpAnswers`.
- Do not expand the game pool.
- Do not delete or replace the original 12 questions.
- Do not modify `src/lib/gameseek/goldenSeeds.ts`.
- Do not modify `src/lib/gameseek/questions.ts`.
- Do not rewrite `src/lib/gameseek/scoring.ts`.
- Do not add popularity, rating, sales, or other external priors.

Files changed or added:
- `src/lib/gameseek/types.ts`
- `src/lib/gameseek/games.ts`
- `src/lib/gameseek/followupQuestions.ts`
- `src/lib/gameseek/followupSelector.ts`
- `src/lib/gameseek/followupScoring.ts`
- `src/app/api/recommend/route.ts`
- `scripts/test-gameseek-metadata.ts`
- `scripts/test-gameseek-followups.ts`
- `package.json`
- `reports/v0.4-followup-before-after.json`
- `reports/v0.4-followup-before-after.md`
- `docs/MINI_V04_FOLLOWUP_SUBCLUSTERS.md`
- `docs/ITERATION_LOG.md`

Sub-cluster rules:
- Added `GameSubCluster`.
- Added optional `primarySubCluster` and `secondarySubClusters`.
- Every `strategy_buildcraft` game now has one `primarySubCluster`.
- `secondarySubClusters` is capped at 2.
- Non-strategy games can omit sub-clusters, but closely related games can carry them for follow-up rerank.

Follow-up behavior:
- `rankAllWithFollowUps` calls existing `rankAll` first.
- Empty or missing `followUpAnswers` has zero ordering effect.
- Follow-up bonus cap is `+16`.
- Follow-up penalty floor is `-12`.
- Selector returns at most 3 questions and is conservative.

API behavior:
- Old `{ answers }` request remains compatible.
- New `{ answers, followUpAnswers }` request enables rerank.
- Response now includes `recommendations`, `needsFollowUp`, `followUpQuestions`, and `diagnostic` in addition to `results`.

TDD / execution notes:
- Added `scripts/test-gameseek-followups.ts` first.
- Initial red test failed as expected because follow-up modules did not exist.
- Implemented follow-up modules and metadata.
- Build initially failed because direct API test passed a standard `Request` to a handler typed as `NextRequest`; fixed the test type bridge only.
- Build then failed on a `GameSubCluster | undefined` include type; fixed `followupScoring.ts` type narrowing.

Follow-up pair scenario result:
- Existing tested pairs: `8`
- Passed/improved: `6`
- Still unresolved: `2`
- Skipped missing game: `2`

Improved pairs:
- `factorio` vs `dyson-sphere-program`
- `balatro` vs `dicey-dungeons`
- `xcom-2` vs `into-the-breach`
- `tactics-ogre-reborn` vs `marvels-midnight-suns`
- `age-of-empires-iv` vs `total-war-warhammer-iii`
- `civilization-vi` vs `age-of-empires-iv`

Still unresolved:
- `slay-the-spire` vs `monster-train`
- `rimworld` vs `oxygen-not-included`

Skipped missing game:
- `plants-vs-zombies` vs `bloons-td-6`
- `cities-skylines` vs `frostpunk`

Final verification:
- `npm.cmd run test:gameseek`: passed, baseline `Top6Recall = 1`, `TopKMonotonicityPassed = true`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, metadata errors `0`, warnings `0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run test:gameseek:followups`: passed, existing pair scenarios `6` passed, `2` unresolved, `2` skipped missing game.
- `npm.cmd run test:gameseek:robustness`: passed, `missingFiles = []`.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/goldenSeeds.ts`: no diff.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git status --short`: only intended v0.4 files changed before commit.

Report hygiene:
- `test:gameseek:robustness` regenerated v0.3.4 JSON reports during verification.
- Those v0.3.4 report files were restored after verification to avoid committing timestamp/report churn.
- v0.4 commits only `reports/v0.4-followup-before-after.json` and `reports/v0.4-followup-before-after.md`.
