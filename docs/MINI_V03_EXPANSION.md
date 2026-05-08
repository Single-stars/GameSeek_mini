# GameSeek Mini v0.3 Expansion

Date:
- `2026-05-08`

Branch:
- `mini-v0.3-strategy-buildcraft-expansion`

## Scope

Goal:
- Expand only the `strategy_buildcraft` cluster.
- Move the pool from `60` games to `80` games.
- Keep `src/lib/gameseek/scoring.ts` unchanged.
- Keep the recommendation algorithm unchanged.
- Keep the API contract unchanged.

Allowed changes used:
- `src/lib/gameseek/games.ts`
- `src/lib/gameseek/goldenSeeds.ts`
- `scripts/test-gameseek-metadata.ts`
- `scripts/test-gameseek.ts`
- `docs/MINI_V03_EXPANSION.md`
- `docs/ITERATION_LOG.md`

Files intentionally not changed:
- `src/lib/gameseek/scoring.ts`
- `src/lib/gameseek/questions.ts`

## Pool Result

Game count:
- `games.length = 80`

Expanded cluster:
- `strategy_buildcraft = 28`

No full-pool expansion was done. The v0.3 first round only expands one cluster.

## Added Games

The requested Factorio candidate was skipped because `factorio` already exists in the project. `Northgard` was used as the replacement.

Added `strategy_buildcraft` games:
- `against-the-storm` / 风暴之城
- `oxygen-not-included` / 缺氧
- `anno-1800` / 纪元1800
- `frostpunk` / 冰汽时代
- `they-are-billions` / 亿万僵尸
- `age-of-empires-iv` / 帝国时代 IV
- `total-war-warhammer-iii` / 全面战争：战锤3
- `xcom-2` / XCOM 2
- `fire-emblem-engage` / 火焰纹章 Engage
- `tactics-ogre-reborn` / 皇家骑士团：重生
- `triangle-strategy` / 三角战略
- `marvels-midnight-suns` / 漫威暗夜之子
- `loop-hero` / 循环英雄
- `dicey-dungeons` / 骰子地下城
- `wildfrost` / Wildfrost
- `griftlands` / 欺诈之地
- `peglin` / Peglin
- `backpack-hero` / 背包英雄
- `dome-keeper` / 穹顶守护者
- `northgard` / Northgard（北境之地）

## Intake Notes

### against-the-storm

1. 核心反复行为：在风暴周期中开新 settlement，平衡资源、人口需求、订单和失败压力。
2. 玩家为什么爱它：每局城市都像一次高压构筑 run，策略规划和随机目标会持续制造取舍。
3. 和同簇相似游戏差异：比 `anno-1800` 更 run-based，比 `frostpunk` 更偏重复构筑和订单优化。
4. 明确不适合玩家：不适合讨厌经营压力、反复开局、资源短缺和失败重来的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q09_CREATE_MANAGE=C`；核心 scoring tags 为 `resource_management`、`survival`、`run_based`、`systemic`、`medium_session`、`strategy`。

### oxygen-not-included

1. 核心反复行为：设计封闭基地，管理氧气、温度、液体、管线、复制人需求和自动化。
2. 玩家为什么爱它：系统互相耦合，问题会层层外溢，解决一个工程瓶颈会带来强烈系统掌控感。
3. 和同簇相似游戏差异：比 `rimworld` 更偏物理工程和自动化，比 `against-the-storm` 更偏长期基地调试。
4. 明确不适合玩家：不适合讨厌复杂系统、热量流体气体模拟和长时间排错的玩家。
5. 拉出它的题或标签：`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q09_CREATE_MANAGE=C`、`Q10_RHYTHM=C`；核心 scoring tags 为 `colony_sim`、`systemic`、`survival`、`optimization`、`automation`、`high_complexity`、`long_session`。

### anno-1800

1. 核心反复行为：建设工业城市，规划人口阶层、供应链、贸易航线和多岛物流。
2. 玩家为什么爱它：产业链越铺越复杂，城市扩张和物流优化会带来宏观经营成就感。
3. 和同簇相似游戏差异：比 `civilization-vi` 更重城市供应链，比 `against-the-storm` 更长期、更稳定。
4. 明确不适合玩家：不适合只想短局反馈、讨厌物流维护和多层资源链的玩家。
5. 拉出它的题或标签：`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q09_CREATE_MANAGE=C`、`Q10_RHYTHM=C`；核心 scoring tags 为 `resource_chain`、`optimization`、`macro_planning`、`empire_building`、`long_session`、`management`。

### frostpunk

1. 核心反复行为：在极寒危机中管理城市、法律、资源、热量和居民希望。
2. 玩家为什么爱它：它把生存经营和道德压力绑在一起，每次政策选择都直接改变社会状态。
3. 和同簇相似游戏差异：比 `against-the-storm` 更叙事和道德困境，比 `oxygen-not-included` 更社会压力导向。
4. 明确不适合玩家：不适合只想低压建造、讨厌道德困境或不想承受社会崩溃压力的玩家。
5. 拉出它的题或标签：`Q06_FAILURE=C`、`Q07_STORY=A`、`Q11_TONE=D`；核心 scoring tags 为 `survival`、`resource_pressure`、`moral_choice`、`planning`、`high_pressure`、`story`、`management`。

### they-are-billions

1. 核心反复行为：建基地、规划防线、扩张经济，并抵御大规模尸潮。
2. 玩家为什么爱它：防线布局和资源节奏很紧，一次破口就可能导致全盘崩溃。
3. 和同簇相似游戏差异：比 `dome-keeper` 更大规模、更 RTS，比 `frostpunk` 更偏防守和实时压力。
4. 明确不适合玩家：不适合讨厌高压防守、单点崩盘或实时资源调度的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q10_RHYTHM=A`；核心 scoring tags 为 `tower_defense`、`rts`、`base_building`、`horde_survival`、`resource_management`、`planning`、`high_pressure`、`macro_planning`。

### age-of-empires-iv

1. 核心反复行为：实时采集、攀科技、控兵、运营经济，并用文明差异打对抗。
2. 玩家为什么爱它：开局流程、经济爆发和战场操作都能通过练习持续变强。
3. 和同簇相似游戏差异：比 `northgard` 更硬核即时对抗，比 `total-war-warhammer-iii` 更重微操和实时经济。
4. 明确不适合玩家：不适合讨厌多人压力、实时操作和大量练习开局流程的玩家。
5. 拉出它的题或标签：`Q01_MOTIVE=A`、`Q03_MASTERY=B`、`Q04_SOCIAL=D`、`Q11_TONE=D`；核心 scoring tags 为 `rts`、`macro_planning`、`pvp`、`ranked`、`economy_management`、`army_control`、`high_pressure`、`skill_mastery`。

### total-war-warhammer-iii

1. 核心反复行为：在大战役地图上经营派系、扩张领土，并指挥大规模奇幻战场。
2. 玩家为什么爱它：宏观战略和壮观战斗并存，派系差异带来长期重玩空间。
3. 和同簇相似游戏差异：比 `civilization-vi` 更重战场演出和部队操控，比 `age-of-empires-iv` 更宏观、更长局。
4. 明确不适合玩家：不适合只想短局轻策略、讨厌复杂派系系统或不想管理大战役的玩家。
5. 拉出它的题或标签：`Q03_MASTERY=B`、`Q09_CREATE_MANAGE=C`、`Q10_RHYTHM=C`；核心 scoring tags 为 `grand_strategy`、`tactics`、`fantasy`、`army_control`、`macro_planning`、`turn_based`、`long_session`、`empire_building`。

### xcom-2

1. 核心反复行为：带小队执行回合战术任务，在命中率、掩体、风险和永久损失之间取舍。
2. 玩家为什么爱它：每次行动都有压力，队员成长和永久死亡会放大战术决定的重量。
3. 和同簇相似游戏差异：比 `into-the-breach` 更随机、更角色化，比 `fire-emblem-engage` 更高压、更战术军事。
4. 明确不适合玩家：不适合讨厌随机命中、永久损失或高压回合战术的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q11_TONE=D`；核心 scoring tags 为 `tactics`、`turn_based`、`squad_building`、`permadeath`、`planning`、`high_pressure`、`story`、`risk_reward`。

### fire-emblem-engage

1. 核心反复行为：养成角色、配置职业和戒指，在棋盘上做站位与克制。
2. 玩家为什么爱它：战棋、角色成长和日式角色羁绊结合，队伍构筑感强。
3. 和同簇相似游戏差异：比 `xcom-2` 更角色动画和日式养成，比 `tactics-ogre-reborn` 更现代、更轻快。
4. 明确不适合玩家：不适合讨厌二次元角色羁绊、回合战棋或长线队伍养成的玩家。
5. 拉出它的题或标签：`Q01_MOTIVE=B`、`Q02_LOOP=B`、`Q03_MASTERY=D`、`Q07_STORY=A`；核心 scoring tags 为 `tactics`、`turn_based`、`party_building`、`character_bond`、`anime`、`planning`、`story`、`long_term`。

### tactics-ogre-reborn

1. 核心反复行为：管理职业、阵容和站位，在政治战争叙事中推进战棋关卡。
2. 玩家为什么爱它：职业构筑和政治分支叙事结合，战棋系统更传统、更厚重。
3. 和同簇相似游戏差异：比 `triangle-strategy` 更职业构筑，比 `fire-emblem-engage` 更经典和政治战争。
4. 明确不适合玩家：不适合讨厌长文本剧情、传统战棋节奏或大量队伍管理的玩家。
5. 拉出它的题或标签：`Q01_MOTIVE=B`、`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q10_RHYTHM=C`；核心 scoring tags 为 `tactics`、`turn_based`、`party_building`、`class_building`、`story`、`planning`、`long_session`。

### triangle-strategy

1. 核心反复行为：推进章节剧情，在政治选择和高低差战棋中做取舍。
2. 玩家为什么爱它：故事分支和战棋关卡互相支撑，选择会影响路线和立场。
3. 和同簇相似游戏差异：比 `tactics-ogre-reborn` 更强调剧情投票和分支，比 `into-the-breach` 更叙事。
4. 明确不适合玩家：不适合只想快速战斗、讨厌大量剧情铺垫或不喜欢回合战棋的玩家。
5. 拉出它的题或标签：`Q01_MOTIVE=B`、`Q02_LOOP=B`、`Q07_STORY=A`、`Q10_RHYTHM=C`；核心 scoring tags 为 `tactics`、`turn_based`、`story`、`choice_consequence`、`political_drama`、`planning`、`long_session`。

### marvels-midnight-suns

1. 核心反复行为：用卡牌技能做英雄战术站位，在战斗外经营关系和解锁。
2. 玩家为什么爱它：卡牌构筑、战术位移和漫威英雄养成形成混合体验。
3. 和同簇相似游戏差异：比 `xcom-2` 更卡牌和英雄关系，比 `griftlands` 更战术战场。
4. 明确不适合玩家：不适合讨厌漫威题材、卡牌逻辑或战斗外社交养成的玩家。
5. 拉出它的题或标签：`Q01_MOTIVE=B`、`Q02_LOOP=B`、`Q07_STORY=A`、`Q10_RHYTHM=A`；核心 scoring tags 为 `card_game`、`deckbuilder`、`tactics`、`turn_based`、`superhero`、`relationship`、`planning`、`story`。

### loop-hero

1. 核心反复行为：摆放地形卡、改变循环路线，看自动战斗并把资源带回营地。
2. 玩家为什么爱它：玩家不直接操作战斗，而是通过路线和地块组合塑造 run。
3. 和同簇相似游戏差异：比 `vampire-survivors` 更间接构筑，比 `backpack-hero` 更路线和地形。
4. 明确不适合玩家：不适合想要直接动作操作、强剧情演出或清晰线性关卡的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q10_RHYTHM=A`；核心 scoring tags 为 `roguelike`、`run_based`、`loop_building`、`resource_management`、`planning`、`low_reflex`、`system_mastery`、`short_session`。

### dicey-dungeons

1. 核心反复行为：用骰点填装备格，围绕角色规则做短局构筑。
2. 玩家为什么爱它：骰点随机和装备组合形成轻量但高反馈的策略 puzzle。
3. 和同簇相似游戏差异：比 `balatro` 更角色规则和骰点，比 `slay-the-spire` 更短、更随机。
4. 明确不适合玩家：不适合讨厌随机骰点、短局重复挑战或缺少长剧情推进的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=B`、`Q10_RHYTHM=A`；核心 scoring tags 为 `deckbuilder`、`dice`、`roguelike`、`run_based`、`combo`、`short_session`、`system_mastery`、`low_reflex`。

### wildfrost

1. 核心反复行为：围绕卡牌站位、倒计时攻击、伙伴状态和高难短局做构筑。
2. 玩家为什么爱它：看似可爱但惩罚很强，玩家需要精确规划攻击节奏和站位。
3. 和同簇相似游戏差异：比 `monster-train` 更小盘面和倒计时，比 `slay-the-spire` 更重站位。
4. 明确不适合玩家：不适合讨厌高难卡牌解题、反复失败或局内随机压力的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q10_RHYTHM=A`、`Q11_TONE=A`；核心 scoring tags 为 `deckbuilder`、`roguelike`、`turn_based`、`combo`、`lane_strategy`、`planning`、`high_difficulty`、`short_session`。

### griftlands

1. 核心反复行为：在谈判、战斗、关系和分支选择中用两套卡组推进 run。
2. 玩家为什么爱它：卡牌构筑和叙事后果绑定，选择会影响关系和后续事件。
3. 和同簇相似游戏差异：比 `slay-the-spire` 更叙事和对话，比 `marvels-midnight-suns` 更 roguelite。
4. 明确不适合玩家：不适合讨厌阅读、卡牌构筑或局内选择后果压力的玩家。
5. 拉出它的题或标签：`Q01_MOTIVE=B`、`Q02_LOOP=B`、`Q07_STORY=A`、`Q10_RHYTHM=A`；核心 scoring tags 为 `deckbuilder`、`story`、`dialogue`、`choice_consequence`、`roguelike`、`run_based`、`planning`、`character_bond`。

### peglin

1. 核心反复行为：发射弹珠，利用物理碰撞、遗物和路线选择做短局构筑。
2. 玩家为什么爱它：随机物理和连锁伤害让每局都有不可控但爽快的爆发。
3. 和同簇相似游戏差异：比 `balatro` 更物理随机，比 `dicey-dungeons` 更弹珠和碰撞。
4. 明确不适合玩家：不适合讨厌随机物理、缺少剧情或无法精确控制输出的玩家。
5. 拉出它的题或标签：`Q02_LOOP=A`、`Q03_MASTERY=C`、`Q10_RHYTHM=A`、`Q11_TONE=A`；核心 scoring tags 为 `roguelike`、`pachinko`、`physics`、`combo`、`short_session`、`risk_reward`、`fast_feedback`、`low_reflex`。

### backpack-hero

1. 核心反复行为：整理背包格子，利用物品邻接关系、路线和遗物做构筑。
2. 玩家为什么爱它：空间管理直接变成战斗强度，整理背包本身就是核心策略。
3. 和同簇相似游戏差异：比 `slay-the-spire` 更空间 puzzle，比 `loop-hero` 更物品组合。
4. 明确不适合玩家：不适合讨厌整理格子、物品组合计算或重复短局构筑的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=B`、`Q10_RHYTHM=A`；核心 scoring tags 为 `inventory_management`、`roguelike`、`planning`、`combo`、`run_based`、`optimization`、`short_session`、`system_mastery`。

### dome-keeper

1. 核心反复行为：在波次之间挖矿、带资源回穹顶、升级，并抵御怪物进攻。
2. 玩家为什么爱它：挖矿路线、升级取舍和防守压力形成紧凑循环。
3. 和同簇相似游戏差异：比 `they-are-billions` 更短局和单基地，比 `vampire-survivors` 更资源路线。
4. 明确不适合玩家：不适合想要强剧情、低时间压力或不喜欢重复局内循环的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q10_RHYTHM=A`、`Q11_TONE=A`；核心 scoring tags 为 `tower_defense`、`mining`、`resource_management`、`base_defense`、`short_session`、`planning`、`survival`、`fast_feedback`。

### northgard

1. 核心反复行为：扩张领地、管理冬季资源、选择胜利路线，并处理实时战略压力。
2. 玩家为什么爱它：它把 RTS 节奏降得更宏观，资源、领地和氏族差异比纯微操更重要。
3. 和同簇相似游戏差异：比 `age-of-empires-iv` 更慢、更资源规划，比 `civilization-vi` 更实时。
4. 明确不适合玩家：不适合讨厌实时策略、资源压力或需要快速即时反馈的玩家。
5. 拉出它的题或标签：`Q02_LOOP=B`、`Q03_MASTERY=B`、`Q06_FAILURE=C`、`Q10_RHYTHM=B`；核心 scoring tags 为 `rts`、`resource_management`、`survival`、`territory_control`、`clan_strategy`、`macro_planning`、`medium_session`、`planning`。

## Calibration Notes

Initial v0.3 regression after adding 20 games:
- `total = 80`
- `Top1Recall = 0.225`
- `Top3Recall = 0.525`
- `Top6Recall = 0.8`
- `failureReasonCounts = { "confusable_game_suppression": 16 }`

Root cause:
- Several added strategy games carried broad scoring tags and overmatched unrelated generated seeds.
- The largest suppressor was `oxygen-not-included`, followed by broad pressure from `dome-keeper`, `against-the-storm`, `loop-hero`, `griftlands`, and `backpack-hero`.

Minimal calibration applied:
- Removed `resource_management` and `planning` from `oxygen-not-included`.
- Removed `planning` from `against-the-storm`.

Reason:
- These broad scoring tags caused cross-seed suppression.
- The games retain more specific scoring signals such as `colony_sim`, `systemic`, `survival`, `optimization`, `automation`, `run_based`, `medium_session`, and `strategy`.
- No `questions.ts` change was needed.

## Test Boundary Update

`scripts/test-gameseek.ts` was updated because v0.3 expands past the fixed v0.1/v0.2 pool size.

Changed:
- From fixed `games.length === 60`
- To minimum `games.length >= 60`

Current boundary:
- `const MIN_GAME_COUNT = 60`

Unchanged checks:
- `goldenSeeds.length === games.length`
- `seenTargets.size === games.length`
- `questions.length === 12`
- illegal question validation
- illegal option validation
- TopK / recall calculation
- failure reason diagnostics
- byCluster / nearMiss / confusable diagnostics

## Metadata Threshold Update

`scripts/test-gameseek-metadata.ts` was updated for the v0.3 single-cluster expansion shape.

Reason:
- With `80` games and `strategy_buildcraft = 28`, the old generic warning threshold `Math.max(12, games.length * 0.25)` equals `20`.
- A strategy-only expansion intentionally makes `strategy_buildcraft` larger than `20`.
- This is not a data hygiene problem for v0.3.

Rule:
- `strategy_buildcraft` is allowed up to `30` games before `cluster_unusually_large` warning.
- Other clusters still use the original generic threshold.

## Golden Seeds

`npm.cmd run seed:golden` generated one seed per game:
- `total = 80`
- `questions = 12`

Expected generated change:
- `src/lib/gameseek/goldenSeeds.ts` now includes 20 additional generated seeds for the v0.3 games.

The generator still uses only scoring-layer `tags` and `antiTags` for missing or illegal seed generation. It does not read `discriminatorTags`, `confusableWith`, `why`, `notFor`, `similar`, or `cluster` for answer scoring.

## Verification Snapshot

Recommendation regression:
- `npm.cmd run test:gameseek`
- `total = 80`
- `Top1Recall = 0.3125`
- `Top3Recall = 0.575`
- `Top6Recall = 0.85`
- `TopKMonotonicityPassed = true`
- `passed = true`
- `failureReasonCounts = { "confusable_game_suppression": 12 }`

Metadata:
- `npm.cmd run test:gameseek:metadata`
- `games = 80`
- `clusters = 9`
- `errors = 0`
- `warnings = 0`
- `strategy_buildcraft = 28`

API:
- `npm.cmd run test:gameseek:api`
- `passed = true`
- Empty answers, illegal question id, illegal option id, array answer rejection, one-answer payload, and full-answer payload all passed expected boundaries.

Build:
- `npm.cmd run build`
- Passed.

Algorithm boundary:
- `git diff -- src/lib/gameseek/scoring.ts`
- No diff.

## Follow-Up

Do not expand another cluster until v0.3 first-round behavior is reviewed.

Known remaining diagnostic failures:
- `12` Top6 failures remain in generated-seed regression.
- All are classified as `confusable_game_suppression`.
- This is acceptable for the v0.3 first-round threshold because global `Top6Recall = 0.85`, but it should inform later sub-cluster tuning.
