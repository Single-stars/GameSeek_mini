# GameSeek Mini v0.4.1 Follow-up Pair Hardening

## Scope

Branch:
- `mini-v0.4.1-followup-pair-hardening`

Base:
- `main`
- `v0.4.0`

Goal:
- Harden the two unresolved backend-only follow-up pair scenarios from v0.4.0.
- Keep the work limited to follow-up questions, selector, rerank, tests, reports, and documentation.

Out of scope:
- No pool expansion.
- No frontend integration.
- No `goldenSeeds.ts` answer-map edits.
- No original 12-question edits.
- No `scoring.ts` main-logic rewrite.
- No popularity, rating, sales, or other external priors.
- No API contract break.

## Why v0.4.1 Does Not Expand The Pool

v0.4.0 already proved the backend follow-up mechanism can improve high-confusion strategy pairs. The next bottleneck is not game count. The remaining problem is that two existing pairs still need sharper follow-up distinctions:
- `slay-the-spire` vs `monster-train`
- `rimworld` vs `oxygen-not-included`

Adding more games before hardening these pair distinctions would add ambiguity to an already overloaded strategy space.

## Why Pair Hardening Before Frontend

The frontend should not expose a follow-up flow until the backend can answer the most important follow-up distinctions reliably. v0.4.1 therefore improves backend pair behavior first. v0.4.2 can then integrate the UI against a more stable follow-up contract.

## Slay The Spire vs Monster Train

v0.4.0 issue:
- The Monster Train seed still ranked `slay-the-spire` above `monster-train`.

v0.4.1 distinction:
- `slay-the-spire`: classic card climb, single-character deckbuilding, route and relic synergy.
- `monster-train`: multi-floor battlefield, summoned units, lane defense, train protection.

Implementation:
- Strengthened `F_DECKBUILDER_STYLE` option labels and game-level direction.
- Preserved the `+16` follow-up bonus cap and `-12` penalty floor.
- Added a narrow explicit pair-order override after capped deltas only when the two post-delta scores are within 4 points and one game is explicitly boosted while the other is explicitly penalized.

Reasoning:
- The base Monster Train seed has a large base-score gap in favor of Slay the Spire. The capped delta can reduce the gap to a close pair, but cannot always reverse it by numeric score alone without exceeding the cap. The close explicit pair-order override is therefore limited to already-close explicitly declared pairs.

## RimWorld vs Oxygen Not Included

v0.4.0 issue:
- The RimWorld seed still ranked `oxygen-not-included` above `rimworld`.
- There was no colony-management-specific follow-up question.

v0.4.1 distinction:
- `rimworld`: colonist personalities, random events, character stories, disaster narrative.
- `oxygen-not-included`: gas, liquid, heat, power, pipes, automation, engineering simulation.

Implementation:
- Added `F_COLONY_MANAGEMENT_STYLE`.
- Added options for colony storytelling, engineering systems, city economy, and survival disaster pressure.
- Updated selector priority so RimWorld/Oxygen or city-colony confusion returns the colony-management follow-up.

## Selector Rules

The selector remains conservative:
- Returns at most 3 follow-up questions.
- Does not return duplicates.
- Does not force follow-up when Top6 has no strategy overload, confusable pair, or close mixed-subcluster ambiguity.
- Prioritizes `F_DECKBUILDER_STYLE` for Slay/Monster or deckbuilder confusion.
- Prioritizes `F_COLONY_MANAGEMENT_STYLE` for RimWorld/Oxygen or city-colony confusion.

## Rerank Boundary

`rankAllWithFollowUps` still:
- Calls existing `rankAll` first.
- Has zero effect when `followUpAnswers` are missing or empty.
- Applies bounded follow-up deltas.
- Keeps max follow-up bonus at `+16`.
- Keeps min follow-up penalty at `-12`.
- Does not replace the base scoring system.

Additional v0.4.1 rule:
- When a selected option explicitly penalizes a game, that game does not also receive broad sub-cluster or tag boosts from the same option. This prevents a same-subcluster broad boost from canceling the explicit pair distinction.
- A close explicit pair-order override can only apply when post-delta scores are within 4 points.

## Pair Results

Report:
- `reports/v0.4.1-followup-pair-hardening.json`
- `reports/v0.4.1-followup-pair-hardening.md`

v0.4.0:
- Passed pair scenarios: `6`
- Failed pair scenarios: `2`
- Skipped missing-game scenarios: `2`

v0.4.1:
- Tested existing pair scenarios: `8`
- Passed pair scenarios: `8`
- Failed pair scenarios: `0`
- Skipped missing-game scenarios: `2`
- Fixed since v0.4.0: `2`
- Regressions from v0.4.0 passed pairs: `0`

Fixed:
- `slay-the-spire` vs `monster-train`
- `rimworld` vs `oxygen-not-included`

Still skipped because the current 80-game pool is missing one side:
- `plants-vs-zombies` vs `bloons-td-6`
- `cities-skylines` vs `frostpunk`

## TDD Notes

Red:
- `scripts/test-gameseek-followups.ts` was updated first.
- The test required zero failed existing pair scenarios.
- The two v0.4.0 failed pairs were promoted to hard assertions.
- The red run failed with:
  - `expected 0 failed existing pairs, got 2`
  - `hard assertion pair failed: slay-the-spire vs monster-train, rimworld vs oxygen-not-included`
  - missing `F_COLONY_MANAGEMENT_STYLE` selector behavior.

Green:
- Added `F_COLONY_MANAGEMENT_STYLE`.
- Strengthened deckbuilder follow-up options.
- Updated selector priorities.
- Updated follow-up rerank handling for explicitly penalized games.
- Added close explicit pair-order override.

## Verification

Final verification is recorded in `docs/ITERATION_LOG.md`.

Required checks:
- `npm.cmd run test:gameseek`
- `npm.cmd run test:gameseek:metadata`
- `npm.cmd run test:gameseek:api`
- `npm.cmd run test:gameseek:followups`
- `npm.cmd run test:gameseek:robustness`
- `npm.cmd run build`
- `git diff -- src/lib/gameseek/goldenSeeds.ts`
- `git diff -- src/lib/gameseek/questions.ts`
- `git diff -- src/lib/gameseek/scoring.ts`
- `git status --short`

## Next

Recommended v0.4.2:
- Frontend integration.
- After the 12 core questions, display 1-3 follow-up questions when `needsFollowUp = true`.
- Submit `{ answers, followUpAnswers }`.
- Show reranked results.
- Explain that the follow-up was asked to distinguish similar games.

Recommended v0.5:
- Re-run full robustness diagnostics against frontend-integrated behavior.
- Consider broader A/B reduction if the 177-pair confusable diagnostics remain high-risk.
