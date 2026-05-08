# GameSeek Mini v0.4.2 Frontend Follow-up Integration

## Goal

v0.4.2 connects the backend follow-up capability from v0.4.0 and v0.4.1 to the frontend with a minimal usable loop:

1. User answers the original 12 core questions.
2. Frontend calls the existing recommendation API with `{ answers }`.
3. If the API returns `needsFollowUp = true` and `followUpQuestions` is non-empty, the page shows initial recommendations plus 1-3 follow-up questions.
4. User answers all returned follow-up questions and submits `{ answers, followUpAnswers }` to the same API.
5. The page displays reranked final recommendations.
6. User can skip follow-up questions and keep the initial recommendations.

## Why Frontend Integration Now

v0.4.0 added the backend follow-up architecture. v0.4.1 hardened the two unresolved follow-up pair scenarios:
- `slay-the-spire` vs `monster-train`
- `rimworld` vs `oxygen-not-included`

After v0.4.1, existing tested pair scenarios are `8 passed / 0 failed / 2 skipped_missing_game`. This is stable enough to expose the backend follow-up capability in the UI.

## Non-goals

This phase intentionally does not:
- Expand the game pool.
- Change golden seeds.
- Change the original 12 questions.
- Rewrite the base scoring algorithm.
- Change the follow-up rerank caps.
- Add popularity, rating, sales, or other external priors.
- Add a complex multi-round follow-up system.
- Add frontend animations or large visual redesign.

## Frontend State Machine

`src/app/page.tsx` now uses an explicit phase state:

```ts
type Phase =
  | "answering_core"
  | "loading_initial"
  | "initial_results"
  | "answering_followups"
  | "loading_final"
  | "final_results"
  | "error";
```

Main state:
- `answers`
- `followUpAnswers`
- `recommendations`
- `followUpQuestions`
- `needsFollowUp`
- `diagnostic`
- `phase`
- `errorMessage`
- `hasSubmittedFollowUps`

Flow:
- Initial phase is `answering_core`.
- Core submit sets `loading_initial`.
- A successful response with no follow-ups sets `final_results`.
- A successful response with follow-ups sets `answering_followups`.
- Follow-up submit sets `loading_final`, then `final_results`.
- Skip follow-ups sets `final_results` and preserves initial recommendations.
- Error cases set `error` and show a recovery button.

## API Request Flow

The frontend uses the existing API only:

Initial request:

```json
{
  "answers": {
    "Q01_MOTIVE": "A"
  }
}
```

Follow-up request:

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

The frontend accepts both `recommendations` and legacy `results` response fields.

## Follow-up UI Behavior

When `needsFollowUp = true` and `followUpQuestions.length > 0`, the page shows:

- Title: `为了更准，再回答几个追问题`
- Explanation: `你的答案指向了几个相似游戏方向。回答下面的问题后，我会重新排序推荐结果。`
- Each follow-up question text.
- Radio options using `option.label`.
- `优化推荐` button.
- `跳过追问，查看初步结果` button.

Rules:
- The frontend does not truncate follow-up questions.
- The backend selector still owns the max-3 rule.
- `优化推荐` is enabled only after all returned follow-up questions are answered.
- Users who do not want to answer can skip follow-ups.

## Recommendation Display

Initial recommendations:
- Title: `初步推荐`
- Hint: `下面是根据核心问卷得到的初步结果。回答追问后会进一步优化排序。`

Final recommendations:
- Title: `推荐结果`
- If follow-ups were answered: `已根据你的追问答案优化排序。`
- If follow-ups were skipped: `已跳过追问，展示初步推荐结果。`
- If no follow-ups were needed: `下面是根据核心问卷得到的推荐结果。`

## Error Handling

The page handles:
- API request failure.
- Non-2xx API responses.
- Invalid JSON response.
- Missing `recommendations` / `results`.
- Submitting before all 12 core questions are answered.
- Submitting follow-ups before all returned follow-up questions are answered.
- `needsFollowUp = true` with an empty `followUpQuestions` array.

Errors show a clear message and a recovery button.

## Frontend Contract Test

New script:

```json
"test:gameseek:frontend-contract": "tsx scripts/test-gameseek-frontend-contract.ts"
```

The script checks:
- Old `{ answers }` API request still returns recommendations.
- Follow-up API response includes `followUpQuestions` when `needsFollowUp` is true.
- Each follow-up question has `id`, `text`, and `options`.
- Each follow-up option has `id` and `label`.
- `{ answers, followUpAnswers }` still returns recommendations.
- `page.tsx` contains the expected frontend phase/state-machine markers.

## Manual Validation Record

Build/server:
- `npm.cmd run build` passed.
- Production server was started at `http://127.0.0.1:3002/`.
- `Invoke-WebRequest http://127.0.0.1:3002/` returned HTTP `200`.

Browser note:
- Codex in-app browser automation could not connect because no `iab` backend was discovered in this session.
- The validation below therefore used the production build plus direct API path verification instead of click automation.

### Path 1: No Follow-up

Seed:
- `lol-wild-rift`

Result:
- Initial API status: `200`
- Recommendation count: `6`
- `needsFollowUp = false`
- `followUpQuestions.length = 0`

Expected UI behavior:
- Page goes directly to final recommendations.
- Follow-up panel is not shown.

### Path 2: Follow-up Optimization

Seed:
- `slay-the-spire`

Initial result:
- Initial API status: `200`
- Recommendation count: `6`
- `needsFollowUp = true`
- `followUpQuestions.length = 3`
- Returned question ids:
  - `F_DECKBUILDER_STYLE`
  - `F_STRATEGY_SUBCLUSTER`
  - `F_COLONY_MANAGEMENT_STYLE`

Follow-up request:
- Sent `{ answers, followUpAnswers }`.

Final result:
- Final API status: `200`
- Recommendation count: `6`
- `needsFollowUp = false`
- Top 3 after selected follow-ups:
  - `slay-the-spire`
  - `backpack-hero`
  - `factorio`

Expected UI behavior:
- Page shows initial recommendations.
- Page shows 1-3 follow-up questions.
- After answering follow-ups, page shows final recommendations with optimized-copy text.

### Path 3: Skip Follow-up

Seed:
- `slay-the-spire`

Initial result:
- Recommendation count: `6`
- `needsFollowUp = true`
- `followUpQuestions.length = 3`

Skip behavior:
- No second rerank request is made.
- Initial recommendations are retained as final display.
- Retained top 3:
  - `slay-the-spire`
  - `backpack-hero`
  - `factorio`

Expected UI behavior:
- User can click `跳过追问，查看初步结果`.
- Page shows final results with skipped-copy text.

## Known Limits

- v0.4.2 does not persist answers across refreshes.
- v0.4.2 does not implement multi-round follow-up.
- v0.4.2 does not add new game content.
- Full browser click automation was not available in this session; validation used contract tests, production build, local HTTP check, and direct API path checks.

## Next

Recommended v0.4.3 or v0.5:
- Add browser-level regression coverage if the environment exposes a stable browser backend.
- Polish frontend copy and layout after the minimal loop is proven.
- Re-run robustness diagnostics with frontend-integrated usage assumptions.
