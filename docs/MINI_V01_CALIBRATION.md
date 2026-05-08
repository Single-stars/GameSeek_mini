# Mini v0.1 Calibration Log

## Rules
- Do not edit `src/lib/gameseek/scoring.ts`.
- Do not change the recommendation algorithm.
- Do not add adaptive flow, signature rescue, popularity priors, or quality priors.
- Do not hand-tune `src/lib/gameseek/goldenSeeds.ts` to inflate metrics.
- Allowed calibration edits: `src/lib/gameseek/games.ts` tags/antiTags and `src/lib/gameseek/questions.ts` option tags/antiTags.
- Regenerate `goldenSeeds.ts` with `npm.cmd run seed:golden` after calibration edits so generated seeds stay derived from games/questions.

## Baseline After Fixed v0.1 Patch
Command: `npm.cmd run test:gameseek`

```json
{
  "total": 60,
  "top1Recall": 0.23333333333333334,
  "top3Recall": 0.4,
  "top6Recall": 0.7166666666666667,
  "topKMonotonicityPassed": true,
  "passed": false,
  "failureReasonCounts": {
    "confusable_game_suppression": 12,
    "question_mapping_too_weak": 5
  }
}
```

## Iterations

### Diagnostic Error
- Temp analysis script in %TEMP% could not resolve ../src/...; rerun from repo root using a temporary root-level script and delete it after use.

### Iteration 1 - Specific Positive Tag Calibration

Hypothesis:
- Many failures are caused by seed generation ties selecting broad PVP/factory/mystery options, not by scoring algorithm behavior.
- Adding concrete positive tags to relevant question options and target games should make generated seeds choose semantically closer answers and raise target scores without touching `scoring.ts`.

Edits:
- `questions.ts`: added explicit mappings for battle royale, cinematic/branching story, deckbuilder/lane strategy, 4X planning, resource management/systemic survival/colony sim, local multiplayer/mini games/randomness, spatial physics puzzle, tower defense/light strategy.
- `games.ts`: added specific tags for the 17 failed targets, including solo where needed to avoid PVP tie-selection for single-player experiences.
- No antiTags were added in this iteration.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`
3. `npm.cmd run test:gameseek:api`
4. `npm.cmd run build`

Result:
- `test:gameseek` worsened: Top1 0.2167, Top3 0.4833, Top6 0.6667, failure count 20.
- Root cause of failed iteration: question option tags were too broad. Broad tags such as cinematic/story/resource/management/local-party were injected into many generated answers and boosted unrelated games.
Decision:
- Revert Iteration 1 broad edits in `games.ts` and `questions.ts` because the hypothesis was falsified.
- Next iteration will be narrower: primarily add concrete target game tags and only a few exact question mappings from the user's requested weak-map list.

### Iteration 2 - Solo Disambiguation Only

Hypothesis:
- A large subset of failures comes from generated seeds selecting Q04_D (PVP/team) on single-player targets due tie-breaking.
- Adding `solo` to clearly single-player failed targets should make generated seeds select Q04_A, adding target-positive `solo` and using existing Q04_A antiTags to suppress PVP/team competitors.

Edits:
- Added `solo` to single-player failed targets: RDR2, Skyrim, Baldur's Gate 3, Final Fantasy XVI, Detroit, Star Rail, Monster Train, Vampire Survivors, Civilization VI, The Sims 4, Don't Starve, RimWorld, Portal 2, Plants vs Zombies.
- No `questions.ts` changes.
- No antiTags added.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`

Result:
- `test:gameseek` improved materially: Top1 0.25, Top3 0.4667, Top6 0.8667, TopK true.
- Top6 target is now satisfied; remaining gap is Top1 (+3 hits needed) and Top3 (+2 hits needed).
- Failures reduced from 17 to 8.
Remaining Top6 failures:
- apex-legends, peace-elite, detroit-become-human, star-rail, dont-starve, rimworld, super-mario-party, portal-2.
Next decision:
- Inspect rank distribution before further edits. Focus on small concrete tags that move near-miss seeds into Top3/Top1 without broad question pollution.

### Iteration 3 - Narrow Weak-Mapping Tags

Hypothesis:
- Top6 is already above threshold, so remaining work is Top1/Top3 precision.
- Add exact mappings only where question text strongly supports them:
  - `battle_royale` to challenge/action/excitement options for Apex and Peace Elite.
  - `interactive_movie`, `branching_story`, `cinematic_choice`, `cinematic` to story options for Detroit.
  - `spatial_logic`, `physics` to puzzle/knowledge options for Portal 2.
  - `resource_management`, `colony_sim`, `systemic`, `survival` to resource-collapse/optimization options for RimWorld and Don't Starve.
  - `local_multiplayer`, `mini_games`, `party`, `randomness` to fixed-friend/party options for Super Mario Party.
- Add a few target-game positive tags for near-miss Top1 cases: RDR2 gets `story`, Final Fantasy XVI gets `combat_mastery`, Slay the Spire gets `optimization`.

Edits:
- `questions.ts`: narrow mappings above.
- `games.ts`: three near-miss positive tags.
- No antiTags added.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`

Result:
- `test:gameseek`: Top1 0.25, Top3 0.5333, Top6 0.8333, TopK true.
- Top3 and Top6 now pass; Top1 still needs +3 hits.
- New issue: adding story/cinematic tags to Q01_B made some non-story generated seeds pick story-heavy answers, causing new confusions. Do not further broaden Q01.
Next decision:
- Inspect latest rank2/rank3 list and improve Top1 by adding concrete game tags to near-miss targets only.

### Iteration 4 - Top1 Near-Miss Game Tags

Hypothesis:
- Top3 and Top6 already pass; Top1 needs +3 hits.
- Several targets are rank2/rank3 with equal or near-equal scores. Adding semantically accurate game tags already present in their generated answer signal should raise target score without broadening user question mappings.

Edits:
- Apex Legends: added `ranked`, `reflex`.
- Peace Elite: added `ranked`, `reflex`.
- RDR2: added `character_bond`, `long_session`.
- Detroit: added `story`, `dialogue`.
- Super Mario Party: added `fast_feedback`, `chaos_fun`.
- Portal 2: added `observation`.
- No question edits.
- No antiTags added.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`

Result:
- Iteration 4 worsened: Top1 0.2333, Top3 0.4833, Top6 0.7333.
- Cause: near-miss game tags such as `story`, `dialogue`, `fast_feedback`, and `chaos_fun` made some target games into broad competitors for unrelated seeds.
Decision:
- Revert Iteration 4 only.
- Keep Iteration 2 and Iteration 3, which previously had Top3/Top6 passing.
- Before new edits, simulate candidate tag changes against current generated seeds to avoid broad-regression guesses.

### Iteration 5 - Remove Over-Broad Q01 Story Mapping

Hypothesis:
- `interactive_movie`, `branching_story`, `cinematic_choice`, and `cinematic` are too specific for Q01_B, which is a high-level story/world motivation answer selected by many unrelated seeds.
- Keeping those tags only in Q07_A should preserve Detroit-style mapping without making every story/world seed boost cinematic interactive games.

Edits:
- Removed `interactive_movie`, `branching_story`, `cinematic_choice`, `cinematic` from Q01_B.
- Kept Q07_A cinematic/interactive mapping.
- No game edits.
- No antiTags added.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`

Result:
- `test:gameseek`: Top1 0.2667, Top3 0.5333, Top6 0.8167.
- Remaining goal: Top1 needs +2 hits. Top3/Top6 already pass.
Next decision:
- Inspect current rank2/rank3 near-misses and pick low-regression candidates.

### Iteration 6 - Ranked Battle Royale Tie Break

Hypothesis:
- Apex Legends and Peace Elite are rank2/rank3 with the same 70 score as VALORANT. Both are ranked competitive battle royale games.
- Adding `ranked` to those two games should add one targeted match from Q04_D and may convert two near-misses into Top1 hits.

Edits:
- Apex Legends: added `ranked`.
- Peace Elite: added `ranked`.
- No question edits.
- No antiTags added.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`

Result:
- `test:gameseek`: Top1 0.2833, Top3 0.5333, Top6 0.8167.
- Remaining goal: Top1 needs +1 hit.
Next decision:
- Inspect current rank2 targets and add one low-regression specific tag.

### Iteration 7 - Persona Single-Player Tie Break

Hypothesis:
- Persona 5 Royal is rank2 with score 60 behind a 70-score top1. It is clearly a single-player long-form RPG/social-sim experience.
- Adding `solo` should make the generated seed select Q04_A and add one clean target match, likely converting it into a Top1 hit without broadly strengthening a confusable competitor.

Edits:
- Persona 5 Royal: added `solo`.
- No question edits.
- No antiTags added.

Verification plan:
1. `npm.cmd run seed:golden`
2. `npm.cmd run test:gameseek`
3. `npm.cmd run test:gameseek:api`
4. `npm.cmd run build`

Result:
- `seed:golden`: regenerated 60 seeds from 12 questions.
- `test:gameseek`: Top1 0.3000, Top3 0.5333, Top6 0.8167, TopK true, passed true.
- `test:gameseek:api`: passed true.
  - empty answers: 200
  - illegal question id: 400
  - illegal option id: 400
  - array answer should be rejected: 400
  - only one answer: 200
  - full 12 answers: 200
- `build`: passed. Next.js production build completed successfully.

Current calibration status:
- Target thresholds met: Top1 >= 0.30, Top3 >= 0.50, Top6 >= 0.75, TopK monotonicity true.
- Remaining diagnostic failures: 11 seeds still fall outside Top6, all classified as `confusable_game_suppression`.
- No further tag edits made after threshold pass.

Next decision:
- Stop v0.1 calibration at this threshold unless the next phase explicitly targets residual Top6 failures.
- If continuing, treat the remaining 11 as a separate v0.1.1 calibration pass, not an unbounded extension of this round.

