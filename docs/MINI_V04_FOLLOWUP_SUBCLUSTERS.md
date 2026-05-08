# GameSeek Mini v0.4 Backend Follow-up Sub-clusters

## Scope

Branch:
- `mini-v0.4-strategy-followup-subclusters`

Base:
- `mini-v0.3.4-recommendation-robustness-diagnostics`

Goal:
- Add backend-only follow-up questions.
- Split overloaded strategy recommendations with sub-cluster metadata.
- Rerank close/confusable games after the existing `rankAll` output.

This phase does not add games, does not replace the original 12 questions, and does not rewrite the base scoring system.

## Why v0.4 Does Not Expand The Pool

v0.3.4 showed that the current issue is not game count. The most important weaknesses were:
- Real-user answer variation lowers Top6 stability.
- Noise in 2-3 answers causes meaningful rank movement.
- Confusable A/B still had `49` failed pairs.
- `strategy_buildcraft` is overloaded with `28` games.

Adding more games before solving the overloaded strategy bucket would increase ambiguity. v0.4 therefore adds targeted follow-up structure first.

## Sub-cluster Metadata

New type:
- `GameSubCluster`

New optional `Game` fields:
- `primarySubCluster?: GameSubCluster`
- `secondarySubClusters?: GameSubCluster[]`

Rules:
- Every `strategy_buildcraft` game must have exactly one `primarySubCluster`.
- `secondarySubClusters` can contain at most 2 entries.
- Non-strategy games may omit sub-cluster metadata, but closely related existing games such as `factorio`, `dyson-sphere-program`, `rimworld`, and `plants-vs-zombies` can carry it for follow-up reranking.

Sub-clusters:
- `factory_automation`
- `city_colony_management`
- `deckbuilder_roguelike`
- `tactics_turn_based`
- `rts_grand_strategy`
- `defense_survival`
- `short_loop_strategy`
- `narrative_strategy`
- `puzzle_strategy`
- `hybrid_strategy`

Metadata validation was updated to enforce these rules for `strategy_buildcraft`.

## Follow-up Questions

New file:
- `src/lib/gameseek/followupQuestions.ts`

Questions:
- `F_STRATEGY_SUBCLUSTER`
- `F_STRATEGY_TIME_MODE`
- `F_STRATEGY_SCALE`
- `F_DECKBUILDER_STYLE`
- `F_TACTICS_STYLE`
- `F_FACTORY_STYLE`
- `F_RTS_GRAND_STYLE`
- `F_DEFENSE_STYLE`

These questions do not replace the original 12 fixed questions. They are optional second-stage questions used only when the first-stage result looks ambiguous.

## Follow-up Selector

New file:
- `src/lib/gameseek/followupSelector.ts`

Selector behavior:
- Reads the first-stage ranked list.
- Looks only at the current Top6.
- Returns at most 3 follow-up questions.
- Does not return duplicates.
- Does not force follow-up when Top6 has no obvious strategy overload, confusable pair, or close mixed-subcluster ambiguity.

Trigger signals:
- Top6 has at least 3 `strategy_buildcraft` games.
- Top6 contains a `confusableWith` pair.
- Top1-to-Top6 score spread is narrow and sub-clusters are mixed.

## Follow-up Rerank

New file:
- `src/lib/gameseek/followupScoring.ts`

The rerank layer does not replace `rankAll`.

Flow:
1. Run existing `rankAll(baseAnswers)`.
2. If `followUpAnswers` are missing or empty, return the same order with zero follow-up effect.
3. If follow-up answers exist, add bounded deltas and sort again.

Bounds:
- Follow-up total bonus cap: `+16`
- Follow-up total penalty floor: `-12`

Purpose:
- Move close/confusable strategy games relative to each other.
- Avoid letting unrelated games jump into Top3.

## API Compatibility

Old request remains valid:

```json
{
  "answers": {}
}
```

New optional request:

```json
{
  "answers": {},
  "followUpAnswers": {}
}
```

Response additions:
- `recommendations`
- `needsFollowUp`
- `followUpQuestions`
- `diagnostic`

Compatibility rule:
- When `followUpAnswers` is absent or empty, result ordering matches the original `rankAll` Top6.

## Pair Results

Report:
- `reports/v0.4-followup-before-after.json`
- `reports/v0.4-followup-before-after.md`

Existing pair scenarios tested:
- `8`

Improved:
- `6`

Still unresolved:
- `2`

Skipped because game is not in the current 80-game pool:
- `2`

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

Skipped:
- `plants-vs-zombies` vs `bloons-td-6`
- `cities-skylines` vs `frostpunk`

Interpretation:
- v0.4 improves most targeted existing pair scenarios.
- It does not claim to solve all `177` v0.3.4 confusable A/B pairs.
- The unresolved pairs need more specific follow-up design or v0.4.1/v0.5 treatment.

## Remaining Work

Recommended v0.4.1:
- Frontend integration.
- Show 1-3 follow-up questions after the 12 core questions when `needsFollowUp = true`.
- Re-submit with `followUpAnswers`.
- Explain that follow-up is being used to distinguish similar games.

Recommended v0.5:
- Add colony-management-specific follow-up coverage for `RimWorld`, `Oxygen Not Included`, `Frostpunk`, and `Against the Storm`.
- Consider a more precise card-battler distinction for `Slay the Spire` vs `Monster Train`.

## Verification

Fresh final verification:

```powershell
npm.cmd run test:gameseek
npm.cmd run test:gameseek:metadata
npm.cmd run test:gameseek:api
npm.cmd run test:gameseek:followups
npm.cmd run test:gameseek:robustness
npm.cmd run build
git diff -- src/lib/gameseek/goldenSeeds.ts
git diff -- src/lib/gameseek/scoring.ts
git diff -- src/lib/gameseek/questions.ts
git status --short
```

Result:
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

Note:
- `test:gameseek:robustness` regenerates v0.3.4 JSON reports. Those timestamp/report churn files were restored after verification so v0.4 only commits the new v0.4 before/after report.
