import type { GameSubCluster } from "./types";

export type FollowUpQuestion = {
  id: string;
  text: string;
  trigger: {
    primaryCluster?: string;
    subClusters?: GameSubCluster[];
    confusableGameIds?: string[];
  };
  options: {
    id: string;
    label: string;
    subClusterBoosts?: Partial<Record<GameSubCluster, number>>;
    tagBoosts?: string[];
    tagPenalties?: string[];
    gameBoosts?: Record<string, number>;
    gamePenalties?: Record<string, number>;
  }[];
};

export type FollowUpAnswerMap = Record<string, string>;

export const followUpQuestions: FollowUpQuestion[] = [
  {
    id: "F_STRATEGY_SUBCLUSTER",
    text: "如果推荐方向偏策略/建造，你更想要哪种核心乐趣？",
    trigger: { primaryCluster: "strategy_buildcraft" },
    options: [
      { id: "factory_automation", label: "建生产线、自动化、优化效率", subClusterBoosts: { factory_automation: 8 } },
      { id: "city_colony_management", label: "规划城市、殖民地、资源和居民", subClusterBoosts: { city_colony_management: 8 } },
      { id: "deckbuilder_roguelike", label: "用卡牌、遗物、随机组合构筑套路", subClusterBoosts: { deckbuilder_roguelike: 8 } },
      { id: "tactics_turn_based", label: "小队走格子、回合制战术决策", subClusterBoosts: { tactics_turn_based: 8 } },
      { id: "rts_grand_strategy", label: "指挥军队、文明、派系或大战略", subClusterBoosts: { rts_grand_strategy: 8 } },
      { id: "defense_survival", label: "布防、守线、抵御一波波敌人", subClusterBoosts: { defense_survival: 8 } },
    ],
  },
  {
    id: "F_STRATEGY_TIME_MODE",
    text: "你更喜欢哪种策略节奏？",
    trigger: { primaryCluster: "strategy_buildcraft" },
    options: [
      { id: "deliberate", label: "慢慢想，每一步都可以算清楚", subClusterBoosts: { tactics_turn_based: 8, puzzle_strategy: 8 } },
      { id: "realtime", label: "实时操作和即时反应更刺激", subClusterBoosts: { rts_grand_strategy: 8, defense_survival: 5 } },
      { id: "long_planning", label: "可以暂停/规划，但整体是长期经营", subClusterBoosts: { city_colony_management: 8, factory_automation: 6 } },
      { id: "short_run", label: "一局很短，快速失败快速重开", subClusterBoosts: { deckbuilder_roguelike: 8, short_loop_strategy: 8 } },
    ],
  },
  {
    id: "F_STRATEGY_SCALE",
    text: "你更喜欢操作哪个层级的东西？",
    trigger: { primaryCluster: "strategy_buildcraft" },
    options: [
      { id: "squad", label: "几个角色或一个小队", subClusterBoosts: { tactics_turn_based: 8 } },
      { id: "base", label: "一座城市、殖民地或基地", subClusterBoosts: { city_colony_management: 8, defense_survival: 5 } },
      { id: "factory_network", label: "一整套工厂、物流或生产网络", subClusterBoosts: { factory_automation: 8 } },
      { id: "faction", label: "一个文明、国家、派系或军团", subClusterBoosts: { rts_grand_strategy: 8 } },
      { id: "build_run", label: "一副牌、一套 build、一局短循环", subClusterBoosts: { deckbuilder_roguelike: 8, short_loop_strategy: 7 } },
    ],
  },
  {
    id: "F_DECKBUILDER_STYLE",
    text: "如果是卡牌或构筑类，你更偏好哪种？",
    trigger: { subClusters: ["deckbuilder_roguelike"] },
    options: [
      { id: "slay-the-spire", label: "经典卡牌爬塔，逐步构筑强力牌组", subClusterBoosts: { deckbuilder_roguelike: 6 }, gameBoosts: { "slay-the-spire": 10 }, gamePenalties: { "monster-train": -4, balatro: -4, "dicey-dungeons": -4 } },
      { id: "monster-train", label: "多层战场、单位站位、路线防守", subClusterBoosts: { deckbuilder_roguelike: 6, defense_survival: 4 }, gameBoosts: { "monster-train": 10 }, gamePenalties: { "slay-the-spire": -30, balatro: -4 } },
      { id: "balatro", label: "扑克牌、数字倍率、短局冲分", subClusterBoosts: { deckbuilder_roguelike: 6, short_loop_strategy: 5 }, gameBoosts: { balatro: 10 }, gamePenalties: { "dicey-dungeons": -4, "slay-the-spire": -4 } },
      { id: "dicey-dungeons", label: "骰子、角色能力、随机战斗谜题", subClusterBoosts: { deckbuilder_roguelike: 6, short_loop_strategy: 5 }, gameBoosts: { "dicey-dungeons": 10 }, gamePenalties: { balatro: -4 } },
      { id: "marvels-midnight-suns", label: "卡牌只是辅助，我更想要角色和剧情战斗", subClusterBoosts: { tactics_turn_based: 6, narrative_strategy: 6 }, gameBoosts: { "marvels-midnight-suns": 10 } },
    ],
  },
  {
    id: "F_TACTICS_STYLE",
    text: "如果是回合战术，你更喜欢哪种？",
    trigger: { subClusters: ["tactics_turn_based", "puzzle_strategy"] },
    options: [
      { id: "xcom-2", label: "小队养成、命中率、装备和战役压力", subClusterBoosts: { tactics_turn_based: 7 }, gameBoosts: { "xcom-2": 10 }, gamePenalties: { "into-the-breach": -5 } },
      { id: "into-the-breach", label: "短小精悍、像解谜一样的战术关卡", subClusterBoosts: { puzzle_strategy: 8, tactics_turn_based: 5, short_loop_strategy: 4 }, gameBoosts: { "into-the-breach": 10 }, gamePenalties: { "xcom-2": -5 } },
      { id: "tactics-ogre-reborn", label: "日式战棋、职业养成、剧情推进", subClusterBoosts: { tactics_turn_based: 7, narrative_strategy: 5 }, gameBoosts: { "tactics-ogre-reborn": 10 }, gamePenalties: { "marvels-midnight-suns": -4 } },
      { id: "marvels-midnight-suns", label: "超级英雄、角色羁绊、卡牌战斗混合", subClusterBoosts: { tactics_turn_based: 6, deckbuilder_roguelike: 5, narrative_strategy: 5 }, gameBoosts: { "marvels-midnight-suns": 10 }, gamePenalties: { "tactics-ogre-reborn": -4 } },
    ],
  },
  {
    id: "F_FACTORY_STYLE",
    text: "如果是自动化/工厂类，你更喜欢哪种？",
    trigger: { subClusters: ["factory_automation"] },
    options: [
      { id: "factorio", label: "复杂生产线、传送带、效率优化", subClusterBoosts: { factory_automation: 8 }, gameBoosts: { factorio: 10 }, gamePenalties: { "dyson-sphere-program": -4 } },
      { id: "dyson-sphere-program", label: "星际尺度、巨构工程、视觉规模感", subClusterBoosts: { factory_automation: 8 }, gameBoosts: { "dyson-sphere-program": 10 }, gamePenalties: { factorio: -4 } },
      { id: "oxygen-not-included", label: "殖民地系统、气体液体、复杂生存工程", subClusterBoosts: { city_colony_management: 7, factory_automation: 5 }, gameBoosts: { "oxygen-not-included": 10 }, gamePenalties: { rimworld: -3 } },
      { id: "light_factory", label: "更轻量、抽象、偏解谜的生产链", subClusterBoosts: { factory_automation: 5, puzzle_strategy: 5 }, tagBoosts: ["puzzle", "optimization"] },
    ],
  },
  {
    id: "F_RTS_GRAND_STYLE",
    text: "如果是战争/战略类，你更喜欢哪种？",
    trigger: { subClusters: ["rts_grand_strategy"] },
    options: [
      { id: "age-of-empires-iv", label: "即时采资源、造兵、操作军队", subClusterBoosts: { rts_grand_strategy: 7 }, gameBoosts: { "age-of-empires-iv": 10 }, gamePenalties: { "total-war-warhammer-iii": -4, "civilization-vi": -4 } },
      { id: "total-war-warhammer-iii", label: "大地图战役、派系、军团和奇幻战争", subClusterBoosts: { rts_grand_strategy: 7, tactics_turn_based: 4 }, gameBoosts: { "total-war-warhammer-iii": 10 }, gamePenalties: { "age-of-empires-iv": -4 } },
      { id: "civilization-vi", label: "文明发展、科技、外交、长期规划", subClusterBoosts: { rts_grand_strategy: 7, tactics_turn_based: 3 }, gameBoosts: { "civilization-vi": 10 }, gamePenalties: { "age-of-empires-iv": -4 } },
      { id: "northgard", label: "更轻量的部族经营和领土扩张", subClusterBoosts: { rts_grand_strategy: 6, city_colony_management: 4 }, gameBoosts: { northgard: 10 } },
    ],
  },
  {
    id: "F_DEFENSE_STYLE",
    text: "如果是防守类，你更喜欢哪种？",
    trigger: { subClusters: ["defense_survival"] },
    options: [
      { id: "plants-vs-zombies", label: "轻松、可爱、关卡式植物防守", subClusterBoosts: { defense_survival: 7, short_loop_strategy: 5 }, gameBoosts: { "plants-vs-zombies": 10 }, gamePenalties: { "dome-keeper": -3 } },
      { id: "bloons-td-6", label: "数值成长、塔升级、路线优化", subClusterBoosts: { defense_survival: 7, short_loop_strategy: 5 }, tagBoosts: ["tower_defense", "optimization"] },
      { id: "frostpunk", label: "城市生存压力、资源短缺、极端环境", subClusterBoosts: { city_colony_management: 7, defense_survival: 6, narrative_strategy: 4 }, gameBoosts: { frostpunk: 10 } },
      { id: "they-are-billions", label: "大规模防线、怪潮、生存建造", subClusterBoosts: { defense_survival: 8, rts_grand_strategy: 5 }, gameBoosts: { "they-are-billions": 10 } },
    ],
  },
];

export function getFollowUpQuestion(id: string) {
  return followUpQuestions.find((question) => question.id === id);
}

export function validateFollowUpAnswerMap(value: unknown) {
  if (value == null) return { ok: true as const, answers: {} as FollowUpAnswerMap };
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false as const, error: "followUpAnswers must be an object", status: 400 };
  }

  const answers = value as Record<string, unknown>;
  const result: FollowUpAnswerMap = {};

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = getFollowUpQuestion(questionId);
    if (!question) {
      return { ok: false as const, error: `Illegal follow-up question id: ${questionId}`, status: 400 };
    }
    if (typeof optionId !== "string" || !question.options.some((option) => option.id === optionId)) {
      return { ok: false as const, error: `Illegal follow-up option: ${questionId}:${String(optionId)}`, status: 400 };
    }
    result[questionId] = optionId;
  }

  return { ok: true as const, answers: result };
}
