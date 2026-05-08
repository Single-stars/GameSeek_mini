# GameSeek Mini v0.2 Structure

## Scope

Mini v0.2 keeps the v0.1 recommendation behavior stable while adding structural metadata for future scaling and diagnostics.

This phase does not:
- expand the 60-game pool
- modify `src/lib/gameseek/scoring.ts`
- change the recommendation algorithm
- hand-edit generated golden seed answers
- add adaptive questions, signature rescue, popularity priors, or quality priors

## Field Semantics

### `tags`

`tags` are the current scoring-layer positive signals. They are matched against question option tags by `scoring.ts`.

Rules:
- Keep them aligned with answerable user preferences.
- Avoid adding broad tags only to force a seed above a threshold.
- In v0.2 first step, these are intentionally not recalibrated.

### `antiTags`

`antiTags` are the current scoring-layer negative signals. They are matched against user antiTags by `scoring.ts`.

Rules:
- Use sparingly because a broad antiTag can suppress valid same-cluster games.
- In v0.2 first step, these are intentionally not recalibrated.

### `discriminatorTags`

`discriminatorTags` are structural same-cluster disambiguation labels. They are not used by `scoring.ts` in v0.2.

Definition:
- A discriminator tag should identify what separates a game from nearby games in the same experience cluster.
- It should be specific enough to explain why two similar games should not always rank together.

Good examples:
- `physics_discovery_open_world`
- `agent_ability_tactical_fps`
- `calendar_school_life_rpg`
- `lane_based_deckbuilder_defense`

Weak examples:
- `open_world`
- `story`
- `action`
- `fun`

Rules:
- Required for every game from v0.2 onward.
- Each game must have at least 3 discriminator tags.
- Prefer compact snake_case phrases that describe the experience difference.
- Do not use discriminator tags as a hidden scoring workaround.

### `confusableWith`

`confusableWith` is diagnostic metadata for tests and calibration reports. It is not a user-facing recommendation list and is not used by `scoring.ts` in v0.2.

Definition:
- A game id belongs in `confusableWith` when the target and that game can suppress each other in ranking, share broad tags, or need explicit same-cluster disambiguation.

Rules:
- Values must be valid game ids.
- A game must not include itself.
- Highly confusable games should list roughly 3-6 ids.
- Distinct games may use an empty array if there is no strong known confusable target, but v0.2 currently gives every game at least one diagnostic relation.
- Bidirectionality is preferred but not required in this first structural pass; metadata tests should warn, not fail, for non-bidirectional pairs.

### `similar`

`similar` remains user-facing display metadata. It is separate from `confusableWith`.

Difference:
- `similar`: useful or recognizable alternatives shown to users.
- `confusableWith`: internal diagnostic objects that may cause ranking suppression or require sharper tests.

A game can appear in both fields, but the meaning is different.

## v0.2 First-Step Changes

Files modified:
- `src/lib/gameseek/types.ts`
- `src/lib/gameseek/games.ts`
- `docs/MINI_V02_STRUCTURE.md`

Type changes:
- `Game.discriminatorTags` is required.
- `Game.confusableWith` is required.
- Existing `cluster`, `tags`, `antiTags`, `why`, `notFor`, and `similar` semantics are preserved.

Data changes:
- All 60 games now include at least 3 discriminator tags.
- All `confusableWith` entries use game ids from the current 60-game pool.
- No scoring-layer recalibration was performed in this step.

## Verification Expectations

After this step, these commands should pass:

```powershell
npm.cmd run seed:golden
npm.cmd run test:gameseek
npm.cmd run test:gameseek:api
npm.cmd run build
git diff -- src/lib/gameseek/scoring.ts
```

Expected v0.1 baseline thresholds must remain valid:
- Top1Recall >= 0.30
- Top3Recall >= 0.50
- Top6Recall >= 0.75
- TopKMonotonicityPassed = true
- API boundary tests pass
- production build passes
- `scoring.ts` has no diff

## Script and Metadata Validation

Seed generator boundary:
- `scripts/expand-golden-seeds.ts` must treat only `tags` and `antiTags` as scoring-layer seed inputs.
- It must not read `discriminatorTags`, `confusableWith`, `why`, `notFor`, `similar`, or `cluster` when choosing answers or writing `coreTags` notes.
- This keeps v0.2 structural metadata out of golden seed generation and prevents generated seed diffs when only diagnostic fields change.

Metadata validation command:

```powershell
npm.cmd run test:gameseek:metadata
```

Metadata validation errors:
- missing cluster
- missing discriminatorTags
- fewer than 3 discriminatorTags
- missing why
- missing notFor
- confusableWith references an unknown id
- confusableWith includes self
- cluster has fewer than 2 games
- duplicate game id
- empty title
- empty tags

Metadata validation warnings:
- confusableWith is not bidirectional
- discriminatorTags strongly duplicate plain scoring tags
- why text is very short
- notFor text is very short
- a cluster is unusually large
- a game has empty confusableWith
- similar contains an id-shaped reference that does not exist
- similar includes self

Warnings are diagnostic only and do not fail the command. Errors fail the command.

## Regression Report Diagnostics

`npm.cmd run test:gameseek` keeps the v0.1 pass/fail thresholds and adds v0.2 diagnostic sections.

Preserved top-level fields:
- `total`
- `top1Recall`
- `top3Recall`
- `top6Recall`
- `topKMonotonicityPassed`
- `thresholds`
- `passed`
- `failureReasonCounts`
- `failures`

Added diagnostic fields:
- `global`: the same global metrics grouped as a stable object.
- `byCluster`: recall metrics grouped by target game cluster.
- `nearMisses`: targets outside Top6 with rank <= 10.
- `confusablePairs`: aggregated target/candidate pairs from `confusableWith` relations that appear in failed Top6 lists.
- `confusableFailureReport`: per-failure detail containing confusable Top6 hits, predicted games above target, shared Top1 tags, and missing discriminator tags.

Report boundaries:
- The report uses `tags` and `antiTags` for scoring-layer evidence.
- `discriminatorTags` are used only in `missingDiscriminatorTags` diagnostics.
- The report does not alter scoring, thresholds, generated seeds, or game/question metadata.
