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
