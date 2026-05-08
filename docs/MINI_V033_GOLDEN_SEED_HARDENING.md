# GameSeek Mini v0.3.3 Golden Seed Hardening

## Scope

Branch:
- `mini-v0.3.3-golden-seed-hardening`

Base:
- `mini-v0.3.2-strategy-buildcraft-calibration`

Goal:
- Preserve the v0.3.2 curated golden seed calibration.
- Prevent future generator runs from accidentally overwriting curated answers.
- Add an explicit seed audit so generated and curated seeds have enforceable boundaries.

This release does not aim to improve recommendation recall. It hardens the seed workflow around the existing v0.3.2 result.

## Hard Boundaries

Unchanged:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/questions.ts`
- `src/lib/gameseek/games.ts`
- API route and API contract
- Recommendation algorithm
- Game pool size

No new dynamic adaptation, signature rescue, popularity prior, or quality prior was added.

## Generated Seeds vs Curated Seeds

Generated seeds:
- Created or refreshed by `scripts/expand-golden-seeds.ts`.
- Use the current scoring-layer fields to select valid answer maps.
- Are suitable for broad coverage when adding games.

Curated seeds:
- Are human-reviewed regression fixtures.
- May preserve hand-calibrated answers when the fixed 12-question space cannot express a target cleanly through generated heuristics.
- Must carry calibration metadata:
  - `curated: true`
  - `calibrationVersion`
  - `calibrationReason`
  - `originalFailureRank`
  - `calibratedRank`

## v0.3.2 Curated Seeds

The following 12 seeds were calibrated in v0.3.2 and are now marked as curated:

| Target | Original failure rank | Calibrated rank |
| --- | ---: | ---: |
| `detroit-become-human` | 7 | 6 |
| `balatro` | 8 | 4 |
| `monster-train` | 10 | 5 |
| `into-the-breach` | 13 | 3 |
| `age-of-empires-iv` | 15 | 2 |
| `total-war-warhammer-iii` | 31 | 3 |
| `xcom-2` | 11 | 4 |
| `tactics-ogre-reborn` | 19 | 1 |
| `marvels-midnight-suns` | 15 | 2 |
| `dicey-dungeons` | 8 | 5 |
| `dyson-sphere-program` | 9 | 1 |
| `plants-vs-zombies` | 8 | 6 |

## Why v0.3.2 Did Not Run `seed:golden`

v0.3.2 intentionally curated 12 seed answer maps after diagnostics. At that time, the generator did not yet distinguish generated seeds from curated seeds. Running `npm.cmd run seed:golden` could have overwritten the curated answer maps or removed their rationale.

v0.3.3 fixes that workflow gap.

## Generator Rule

Default behavior:

```powershell
npm.cmd run seed:golden
```

The generator preserves any existing seed with `curated: true` as a complete object. It does not overwrite:
- `answers`
- `persona`
- `notes`
- calibration metadata

Force behavior:

```powershell
npx.cmd tsx scripts/expand-golden-seeds.ts --force-curated
```

`--force-curated` intentionally allows curated seeds to be regenerated. This is dangerous because it can overwrite curated answers and remove calibration metadata. The script prints a warning when the flag is used.

Use `--force-curated` only when intentionally discarding curated calibration history.

## Seed Audit

New script:

```powershell
npm.cmd run test:gameseek:seeds
```

It checks:
- `goldenSeeds.length === games.length`
- target game id exists
- target game id is unique
- every question id in every answer map is legal
- every answer value is a legal option id
- v0.3.2 curated targets are marked `curated: true`
- every curated seed has `calibrationVersion`
- every curated seed has `calibrationReason`
- every curated seed has positive integer `originalFailureRank`
- every curated seed has positive integer `calibratedRank`
- `calibratedRank <= 6`

The audit does not require the current live rank to equal `calibratedRank`, because rank metadata records historical calibration state.

## Verification

Fresh verification before commit:

```powershell
npm.cmd run test:gameseek
npm.cmd run test:gameseek:metadata
npm.cmd run test:gameseek:api
npm.cmd run test:gameseek:seeds
npm.cmd run build
git diff -- src/lib/gameseek/scoring.ts
git diff -- src/lib/gameseek/questions.ts
git status --short
```

Result:
- `npm.cmd run test:gameseek`: passed, `Top6Recall = 1`, `failures = []`.
- `npm.cmd run test:gameseek:metadata`: passed, metadata errors `0`, metadata warnings `0`.
- `npm.cmd run test:gameseek:api`: passed.
- `npm.cmd run test:gameseek:seeds`: passed, `curatedSeeds = 12`, errors `0`.
- `npm.cmd run build`: passed.
- `git diff -- src/lib/gameseek/scoring.ts`: no diff.
- `git diff -- src/lib/gameseek/questions.ts`: no diff.
- `git diff --check`: no whitespace errors; only Windows LF-to-CRLF warnings.
- `git status --short`: only intended v0.3.3 files changed before commit.

Seed generator verification:
- `npm.cmd run seed:golden` was run after generator hardening.
- `npm.cmd run test:gameseek:seeds` still passed afterward with `curatedSeeds = 12`.
- This confirms default generation preserves v0.3.2 curated seed metadata and answers.
