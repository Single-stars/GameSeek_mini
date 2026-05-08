# GameSeek Mini v0.3.4 Recommendation Robustness Diagnostics

## Scope

Branch:
- `mini-v0.3.4-recommendation-robustness-diagnostics`

Base:
- `mini-v0.3.3-golden-seed-hardening`

Goal:
- Add a report-only robustness diagnostics suite.
- Evaluate user answer variation, answer noise, confusable game pairs, question discrimination, and report-only sub-clusters.
- Produce reproducible reports for v0.3.5 / v0.4 planning.

This phase does not fix recommendation behavior. Low robustness metrics are not v0.3.4 failures unless the baseline tests fail.

## Hard Boundaries

Unchanged:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/questions.ts`
- `src/lib/gameseek/games.ts`
- `src/lib/gameseek/goldenSeeds.ts`
- API route and API contract
- Recommendation algorithm
- Game pool size

No dynamic adaptation, signature rescue, popularity prior, or quality prior was added.

## Scripts

Shared helper:
- `scripts/gameseek-diagnostics-utils.ts`

Diagnostic scripts:
- `scripts/simulate-user-answers.ts`
- `scripts/test-answer-noise.ts`
- `scripts/test-confusable-ab.ts`
- `scripts/analyze-question-discrimination.ts`
- `scripts/analyze-subclusters.ts`
- `scripts/run-robustness-diagnostics.ts`

Package scripts:
- `test:gameseek:simulation`
- `test:gameseek:noise`
- `test:gameseek:ab`
- `test:gameseek:questions`
- `test:gameseek:subclusters`
- `test:gameseek:robustness`

## Method Notes

General:
- All scripts are read-only against core recommender data.
- All ranking calls reuse `rankAll` from `src/lib/gameseek/scoring.ts`.
- No script copies or reimplements the scoring algorithm.
- Robustness scripts fail only on script errors, illegal data, or report generation failure. Weak robustness metrics are written to reports and do not fail v0.3.4.

Deterministic randomness:
- User simulation and noise tests use deterministic seeded randomness.
- Seeds are derived from seed id, test level, and variant/trial index.
- Re-running the scripts should produce stable report contents for the same input data.

Confusable A/B:
- Pairs are built from `confusableWith`.
- A-B / B-A duplicates are de-duplicated.
- Self loops, unknown ids, and missing seed pairs are skipped and recorded.

## Reports

Generated reports:
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

## Headline Results

User answer simulation:

| Level | Top6Recall | Average Rank | Fragile Seeds |
| --- | ---: | ---: | ---: |
| light | 0.8333 | 4.52 | 20 |
| medium | 0.6750 | 7.07 | 20 |
| heavy | 0.4292 | 13.75 | 20 |

Answer noise:

| Changed questions | Top6 retention | Average rank drop | Average Top6 overlap |
| ---: | ---: | ---: | ---: |
| 1 | 0.8250 | 1.88 | 4.69 |
| 2 | 0.6875 | 4.12 | 3.92 |
| 3 | 0.5675 | 7.29 | 3.26 |

Confusable A/B:

| Status | Count |
| --- | ---: |
| passed | 124 |
| failed | 49 |
| indistinguishable | 4 |

Additional A/B metadata:
- Tested pairs: `177`
- Skipped pairs recorded: `177`

Question discrimination:
- Baseline Top6Recall: `1`
- Strongest leave-one-out Top6 drops:
  - `Q03_MASTERY`: `-0.1875`
  - `Q04_SOCIAL`: `-0.1625`
  - `Q10_RHYTHM`: `-0.1375`

Sub-cluster analysis:
- Overloaded cluster: `strategy_buildcraft`, `28` games.
- High-risk confusions: `146`
- Suggested sub-cluster counts:
  - `city_colony_management`: `25`
  - `deckbuilder_roguelike`: `13`
  - `defense_survival`: `13`
  - `factory_automation`: `8`
  - `narrative_strategy`: `26`
  - `rts_grand_strategy`: `7`
  - `short_loop`: `19`
  - `tactics_turn_based`: `11`

## Interpretation

v0.3.4 should not tune seeds, tags, questions, or scoring based on these results.

Recommended next use:
- v0.3.5 can pick one bounded robustness issue from these reports and calibrate it.
- v0.4 can use the question discrimination and sub-cluster reports to decide whether the fixed 12-question form needs additional sub-cluster questions.

## Verification

Fresh final verification:

```powershell
npm.cmd run test:gameseek
npm.cmd run test:gameseek:metadata
npm.cmd run test:gameseek:api
npm.cmd run test:gameseek:robustness
npm.cmd run build
git diff -- src/lib/gameseek/scoring.ts
git diff -- src/lib/gameseek/questions.ts
git diff -- src/lib/gameseek/games.ts
git diff -- src/lib/gameseek/goldenSeeds.ts
git status --short
```

Result:
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
