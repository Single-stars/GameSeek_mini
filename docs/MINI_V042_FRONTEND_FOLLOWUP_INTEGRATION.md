# GameSeek Mini v0.4.2 Frontend Follow-up Integration

## Goal

v0.4.2 connects the backend follow-up capability from v0.4.0 and v0.4.1 to the frontend.

This correction changes the frontend direction from:

```txt
12-question list + initial result display + optional follow-up + user-triggered rerank
```

to:

```txt
one question per page + required core answers + required returned follow-ups + final recommendations only
```

The product reason is simple: follow-up questions are part of the recommendation process, not an optional post-result tweak. Showing interim rankings before the system finishes disambiguation makes the experience feel less decisive and exposes unstable ordering that the follow-up step is designed to resolve.

## Why This Replaced the Earlier v0.4.2 Flow

The first v0.4.2 implementation proved the API and frontend could exchange `followUpAnswers`, but the UI still showed an intermediate recommendation state and allowed users to skip disambiguation.

That created three product problems:

- Users could see rankings before the strategy/buildcraft ambiguity was resolved.
- The page had two recommendation states, which made the flow harder to explain.
- Follow-up questions felt optional even when the backend had identified a real ambiguity.

The revised v0.4.2 flow treats returned follow-ups as required questions before the final recommendation is shown.

## Non-goals

This phase intentionally does not:

- Expand the game pool.
- Change `goldenSeeds.ts`.
- Change the original 12 questions.
- Rewrite the base scoring algorithm.
- Change follow-up rerank caps.
- Add popularity, rating, sales, or other external priors.
- Add a complex multi-round follow-up system.
- Add Playwright/Cypress.
- Add complex animation or a larger visual redesign.

## Frontend State Machine

`src/app/page.tsx` uses this explicit phase state:

```ts
type Phase =
  | "answering_core"
  | "checking_followups"
  | "answering_followups"
  | "loading_final"
  | "final_results"
  | "error";
```

Main state:

- `coreQuestionIndex`
- `followUpQuestionIndex`
- `answers`
- `followUpAnswers`
- `followUpQuestions`
- `recommendations`
- `pendingInitialRecommendations`
- `diagnostic`
- `phase`
- `errorMessage`
- `softNotice`
- `hasAnsweredFollowUps`

Flow:

1. Initial phase is `answering_core`.
2. The page shows one core question.
3. The user must choose one option before moving forward.
4. After the 12th core answer, the page enters `checking_followups`.
5. The frontend calls the existing recommendation API with `{ answers }`.
6. If the API returns `needsFollowUp = false`, the page enters `final_results`.
7. If the API returns `needsFollowUp = true` with non-empty `followUpQuestions`, the page enters `answering_followups`.
8. The page shows one follow-up question at a time.
9. The user must answer every returned follow-up question.
10. After the last follow-up answer, the page enters `loading_final`.
11. The frontend calls the same API with `{ answers, followUpAnswers }`.
12. The page enters `final_results` and shows recommendations once.
13. Fatal request or response errors enter `error` and show a restart button.

## Progress Display

The progress indicator appears in the top-right progress pill.

Core stage:

```txt
1 / 12
2 / 12
...
12 / 12
```

Checking stage:

```txt
正在判断是否需要追加问题...
```

Follow-up stage:

If the API returns three follow-ups:

```txt
13 / 15
14 / 15
15 / 15
```

If the API returns one follow-up:

```txt
13 / 13
```

The frontend does not guess the final total before the backend returns follow-up questions. During core answering, the total stays `12`.

## API Request Flow

The frontend still uses the existing API only.

Initial request after all 12 core questions:

```json
{
  "answers": {
    "Q01_MOTIVE": "A"
  }
}
```

Final request after returned follow-ups are answered:

```json
{
  "answers": {
    "Q01_MOTIVE": "A"
  },
  "followUpAnswers": {
    "F_DECKBUILDER_STYLE": "slay-the-spire"
  }
}
```

Compatibility behavior:

- The frontend accepts both `recommendations` and legacy `results`.
- If `needsFollowUp = true` but no valid follow-up questions are returned, the page does not hang; it uses the current recommendations as final output and shows a soft notice.
- If the response is missing `recommendations` / `results`, the page enters `error`.

## No-follow-up Path

Example seed used for verification:

- `lol-wild-rift`

Observed API result:

- HTTP status: `200`
- Recommendation count: `6`
- `needsFollowUp = false`
- `followUpQuestions.length = 0`

Expected UI behavior:

- Page shows one core question at a time.
- Progress shows `1 / 12` through `12 / 12`.
- After the 12th answer, the page checks whether follow-ups are needed.
- No follow-up UI is shown.
- Final recommendations are displayed once.

## Follow-up Path

Example seed used for verification:

- `slay-the-spire`

Observed initial API result:

- HTTP status: `200`
- Recommendation count: `6`
- `needsFollowUp = true`
- `followUpQuestions.length = 3`
- Returned question ids:
  - `F_DECKBUILDER_STYLE`
  - `F_STRATEGY_SUBCLUSTER`
  - `F_COLONY_MANAGEMENT_STYLE`

Observed final API result after sending `{ answers, followUpAnswers }`:

- HTTP status: `200`
- Recommendation count: `6`
- `needsFollowUp = false`
- Top 3:
  - `slay-the-spire`
  - `backpack-hero`
  - `factorio`

Expected UI behavior:

- Page shows one core question at a time.
- Progress shows `1 / 12` through `12 / 12`.
- After the 12th answer, the page shows `正在判断是否需要追加问题...`.
- The page continues with returned follow-up questions.
- For three follow-ups, progress shows `13 / 15`, `14 / 15`, `15 / 15`.
- Every follow-up is required.
- The last follow-up button generates the final recommendation.
- Recommendations are displayed once.

## Removed UI

The page no longer exposes the old optional follow-up experience:

- No intermediate recommendation panel.
- No optional rerank button.
- No follow-up skip button.
- No skipped-result copy.

The final page title is:

```txt
为你推荐
```

Final hint copy:

- No returned follow-ups: `已根据你的核心答案生成推荐。`
- Follow-ups answered: `已根据你的核心答案和追加问题生成推荐。`

## Error Handling

The page handles:

- User attempts to continue without answering the current question.
- API request failure.
- Non-2xx API responses.
- Invalid JSON response.
- Missing `recommendations` / `results`.
- Invalid `followUpQuestions`.
- Follow-up question missing `id`, `text`, or `options`.
- Follow-up option missing `id` or `label`.
- Empty core question data.
- Restart after an error.

Errors are shown on-page and do not crash the app.

## Frontend Contract Test

The existing package script remains:

```json
"test:gameseek:frontend-contract": "tsx scripts/test-gameseek-frontend-contract.ts"
```

The script checks:

- `{ answers }` API request returns recommendations/results.
- If `needsFollowUp = true`, `followUpQuestions` is an array.
- Each follow-up question has `id`, `text`, and `options`.
- Each follow-up option has `id` and `label`.
- `{ answers, followUpAnswers }` API request returns recommendations/results.
- `page.tsx` includes the new paged required state-machine markers.
- `page.tsx` no longer includes old optional-flow UI text.

## Manual Validation Record

Build/server:

- `npm.cmd run build` passed.
- Production server was available at `http://127.0.0.1:3002/`.
- `Invoke-WebRequest http://127.0.0.1:3002/` returned HTTP `200`.
- The returned page HTML contained `GameSeek Mini`.
- The returned page HTML did not contain the old optional-flow strings checked by the contract test.

Browser note:

- This session did not use Playwright/Cypress by design.
- Browser click automation was not available through a stable in-app browser backend.
- Validation therefore used production build, local HTTP page check, direct API path checks, and the frontend contract test. This is not a browser E2E test.

## Verification Evidence

Commands run on `mini-v0.4.2-paged-required-followups`:

- `npm.cmd run test:gameseek`: passed, `Top6Recall = 1`, `TopKMonotonicityPassed = true`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, metadata errors `0`, warnings `0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run test:gameseek:followups`: passed, pair summary `tested = 8`, `passed = 8`, `failed = 0`, `skipped = 2`.
- `npm.cmd run test:gameseek:robustness`: passed, `missingFiles = []`.
- `npm.cmd run test:gameseek:frontend-contract`: passed.
- `npm.cmd run build`: passed.

Core file checks:

- `git diff -- src/lib/gameseek/goldenSeeds.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.

Report hygiene:

- `test:gameseek:robustness` regenerated v0.3.4 reports during verification.
- `test:gameseek:followups` regenerated v0.4.1 pair-hardening reports during verification.
- Those historical report files were restored after verification.

## Known Limits

- v0.4.2 does not persist answers across refreshes.
- v0.4.2 does not support returning to core questions after follow-up questions are fetched.
- v0.4.2 does not implement multi-round follow-up.
- v0.4.2 does not add game content.
- Full browser click automation is still a future testing improvement.

## Score and Follow-up Impact Fix

Branch:

- `mini-v0.4.2-score-and-followup-impact-fix`

Reason:

- The API returns an internal raw `score` used for ranking.
- `rankAllWithFollowUps` can add a capped follow-up delta to that raw score.
- The previous frontend displayed `result.score` directly, so users could see values above the old implied display ceiling, for example values above `120`.
- This was a display problem, not a ranking problem.

Resolution:

- The frontend now uses `normalizeDisplayScore(score)` before showing a score to users.
- The UI now shows a bounded percentage:

```txt
匹配度 94%
```

- The normalization is display-only:

```ts
Math.max(0, Math.min(100, Math.round((score / 120) * 100)))
```

- Internal raw scores remain unchanged for sorting.
- No `scoring.ts` changes were made.
- No follow-up rerank cap changes were made.

Follow-up impact:

- The frontend keeps the first API recommendations in `pendingInitialRecommendations`.
- It does not show those initial recommendations to the user.
- After the user answers follow-up questions, the frontend compares the hidden initial recommendations with final recommendations using `compareRecommendations`.
- The final recommendation page now explains whether the follow-up changed ordering:

```txt
追加问题已影响排序。
```

or:

```txt
排序无需明显调整。
```

- When ranking changes are available, the page lists at most three small explanations, for example:

```txt
《RimWorld》因为你的追加答案更靠前（2 → 1）。
```

Impact verification:

- Added `scripts/test-gameseek-followup-impact.ts`.
- Added package script:

```json
"test:gameseek:followup-impact": "tsx scripts/test-gameseek-followup-impact.ts"
```

The script compares base rankings and follow-up rankings for these scenarios:

- `slay-the-spire` seed with Slay the Spire deckbuilder follow-up.
- `slay-the-spire` seed with Monster Train deckbuilder follow-up.
- `rimworld` seed with RimWorld colony-storytelling follow-up.
- `rimworld` seed with Oxygen Not Included engineering-systems follow-up.

Focused result before final verification:

- `visibleRankDeltaCount = 3`
- Required visible rank-delta count: `2`
- `slay-the-spire` seed + Monster Train follow-up: Monster Train rank improved from `15` to `10`.
- `rimworld` seed + colony-storytelling follow-up: RimWorld moved from rank `2` to rank `1`.
- `rimworld` seed + engineering-systems follow-up was a confirmation-only case: Oxygen Not Included was already rank `1`, but score deltas still reflected the follow-up preference.

No rerank weight adjustment:

- The impact script showed measurable follow-up effects.
- Existing pair-hardening tests still cover the 8 passed / 0 failed / 2 skipped pair status.
- Because impact was already measurable, this fix did not change `followupScoring.ts` weights or caps.

Manual production validation for this fix:

- Production server was restarted on `http://127.0.0.1:3002/`.
- Page HTTP request returned `200`.
- The page did not contain the old optional-flow strings checked by the contract test.
- Direct API follow-up path with the `slay-the-spire` seed returned:
  - initial status `200`
  - `needsFollowUp = true`
  - follow-up count `3`
  - final status `200`
  - final recommendation count `6`
  - final `needsFollowUp = false`
- A raw-score scan found a baseline raw score of `160` for `outer-wilds`, confirming that raw score can exceed the old display ceiling.
- The same score normalizes to display percent `100`, confirming the display clamp.

Final verification on this fix branch:

- `npm.cmd run test:gameseek`: passed, `Top6Recall = 1`, `TopKMonotonicityPassed = true`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, metadata errors `0`, warnings `0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run test:gameseek:followups`: passed, pair scenarios `8` passed, `0` failed, `2` skipped.
- `npm.cmd run test:gameseek:robustness`: passed, `missingFiles = []`.
- `npm.cmd run test:gameseek:frontend-contract`: passed.
- `npm.cmd run test:gameseek:followup-impact`: passed, `visibleRankDeltaCount = 3`.
- `npm.cmd run build`: passed.

## Next

Recommended next work:

- Add browser-level regression coverage when a stable browser automation backend is available.
- Polish copy and layout after the required follow-up flow is validated with real users.
- Consider a safe “return to previous answer” design only after defining how changing core answers should invalidate fetched follow-ups.
