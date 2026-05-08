import type { Question } from "./types";

export const questions: Question[] = [
  {
    id: "Q01_MOTIVE",
    prompt: "你现在最想从游戏里获得什么？",
    options: [
      { id: "A", text: "挑战和变强，靠技术或判断获得成就感", tags: ["skill_mastery", "system_mastery", "high_challenge", "battle_royale"] },
      { id: "B", text: "进入一个故事、角色或世界", tags: ["story", "roleplay", "character_bond", "immersion"] },
      { id: "C", text: "探索、发现秘密、自己理解规则", tags: ["exploration", "discovery", "mystery", "low_guidance", "self_directed"] },
      { id: "D", text: "放松、经营、整理、短时间获得反馈", tags: ["cozy", "management", "short_session", "low_pressure"] }
    ]
  },
  {
    id: "Q02_LOOP",
    prompt: "你希望自己在游戏里最常反复做什么？",
    options: [
      { id: "A", text: "战斗、操作、闪避、瞄准或连招", tags: ["action_combat", "reflex", "aim", "combat_mastery", "battle_royale", "hero_shooter", "melee_action", "combo"] },
      { id: "B", text: "规划、构筑、算收益、做取舍", tags: ["planning", "buildcraft", "strategy", "system_mastery", "lane_strategy", "deckbuilder"] },
      { id: "C", text: "探索地图、找秘密、推进冒险", tags: ["exploration", "discovery", "adventure"] },
      { id: "D", text: "经营、建造、收集、布置或养成", tags: ["management", "building", "collection", "self_expression"] }
    ]
  },
  {
    id: "Q03_MASTERY",
    prompt: "你更想靠什么变强？",
    options: [
      { id: "A", text: "操作熟练、反应、手感", tags: ["reflex", "combat_mastery", "timing"] },
      { id: "B", text: "理解系统、找到最优策略", tags: ["planning", "optimization", "system_mastery", "4x_strategy", "empire_building", "macro_planning", "perfect_information"] },
      { id: "C", text: "观察线索、理解规则、推理真相", tags: ["observation", "deduction", "puzzle", "mystery", "spatial_logic", "physics", "logic", "rule_manipulation", "visual_trick"] },
      { id: "D", text: "长期建设、收集、养成，让世界慢慢变好", tags: ["long_term", "collection", "management", "cozy", "character_collection", "team_building", "anime"] }
    ]
  },
  {
    id: "Q04_SOCIAL",
    prompt: "你希望游戏里其他人的参与程度是？",
    options: [
      { id: "A", text: "完全单人，最好不用管别人", tags: ["solo"], antiTags: ["pvp", "team", "fixed_coop", "multiplayer"] },
      { id: "B", text: "单人为主，可选弱社交", tags: ["solo", "optional_social"] },
      { id: "C", text: "固定朋友合作，一起通关或制造混乱", tags: ["fixed_coop", "teamwork", "coop", "chaos_fun", "local_multiplayer", "mini_games", "party", "randomness", "two_player", "puzzle_platforming"] },
      { id: "D", text: "真人匹配、排位、对抗、团队竞技", tags: ["pvp", "ranked", "team", "social_pressure", "objective"] }
    ]
  },
  {
    id: "Q05_PRESSURE",
    prompt: "你最不想要哪种压力？",
    options: [
      { id: "A", text: "真人对抗、排位输赢压力", antiTags: ["pvp", "ranked", "high_pressure"] },
      { id: "B", text: "队友依赖、被别人影响体验", antiTags: ["team", "fixed_coop", "social_pressure"] },
      { id: "C", text: "高难卡关、死亡惩罚、反复受苦", antiTags: ["high_difficulty", "high_pressure", "soulslike"] },
      { id: "D", text: "复杂系统、长时间研究和优化", antiTags: ["high_complexity", "optimization", "macro_planning"] }
    ]
  },
  {
    id: "Q06_FAILURE",
    prompt: "你能接受哪种失败？",
    options: [
      { id: "A", text: "操作失败，死了再练", tags: ["reflex", "combat_mastery", "high_challenge"] },
      { id: "B", text: "构筑失败，下局优化", tags: ["run_based", "buildcraft", "system_mastery"] },
      { id: "C", text: "经营崩盘，重新规划资源", tags: ["management", "resource_pressure", "planning", "resource_management", "colony_sim", "systemic", "survival", "failure_pressure"] },
      { id: "D", text: "不太想失败，越轻松越好", tags: ["low_pressure", "cozy"], antiTags: ["high_pressure", "high_difficulty"] }
    ]
  },
  {
    id: "Q07_STORY",
    prompt: "你对剧情、角色、文本的需求是？",
    options: [
      { id: "A", text: "很重要，我愿意大量阅读或看剧情", tags: ["story", "heavy_text", "character_bond", "dialogue", "interactive_movie", "branching_story", "cinematic_choice", "cinematic", "choice_consequence", "philosophical"] },
      { id: "B", text: "可以有剧情，但不要压过玩法", tags: ["story", "gameplay_first"] },
      { id: "C", text: "更喜欢环境叙事和自己探索理解", tags: ["environmental_story", "exploration", "mystery"] },
      { id: "D", text: "剧情不重要，玩法系统第一", tags: ["gameplay_first"], antiTags: ["heavy_text", "cinematic_story"] }
    ]
  },
  {
    id: "Q08_EXPLORATION",
    prompt: "你对探索和自由度的偏好是？",
    options: [
      { id: "A", text: "大地图自由探索，自己发现路线", tags: ["open_world", "exploration", "low_guidance", "sandbox_rpg"] },
      { id: "B", text: "紧凑箱庭或关卡探索，不要太散", tags: ["compact_world", "guided", "adventure"] },
      { id: "C", text: "隐藏谜题、秘密、知识推进", tags: ["mystery", "discovery", "knowledge_progression", "puzzle", "spatial_logic", "physics"] },
      { id: "D", text: "探索不重要，我更看重系统或对战", antiTags: ["open_world", "exploration"] }
    ]
  },
  {
    id: "Q09_CREATE_MANAGE",
    prompt: "你对经营、建造、收集、创造的态度？",
    options: [
      { id: "A", text: "很喜欢农场、日程、关系和慢慢整理", tags: ["farming", "life_sim", "cozy", "routine"] },
      { id: "B", text: "喜欢建造、装修、创造和自我表达", tags: ["building", "decoration", "self_expression", "sandbox", "house_building", "character_creation"] },
      { id: "C", text: "喜欢生产链、自动化、资源优化", tags: ["factory", "automation", "optimization", "resource_chain", "resource_management", "colony_sim", "systemic", "crafting", "macro_planning"] },
      { id: "D", text: "不喜欢重复刷、建造或经营", antiTags: ["management", "building", "routine", "factory"] }
    ]
  },
  {
    id: "Q10_RHYTHM",
    prompt: "你更喜欢怎样的游戏节奏？",
    options: [
      { id: "A", text: "5-15 分钟一局，快速反馈", tags: ["short_session", "fast_feedback", "mini_games", "tower_defense", "auto_attack"] },
      { id: "B", text: "30-60 分钟，持续推进一段体验", tags: ["medium_session", "layered_progress"] },
      { id: "C", text: "长时间沉浸，慢慢进入世界", tags: ["long_session", "immersion", "slow_burn"] },
      { id: "D", text: "无所谓，只要玩法足够对味", tags: ["flexible_session"] }
    ]
  },
  {
    id: "Q11_TONE",
    prompt: "你想要的主要情绪是？",
    options: [
      { id: "A", text: "刺激、爽快、兴奋", tags: ["hype", "fast_feedback", "action_combat", "battle_royale", "party", "mini_games"] },
      { id: "B", text: "安静、治愈、陪伴", tags: ["cozy", "low_pressure", "companionship", "soft_social"] },
      { id: "C", text: "神秘、好奇、探索欲", tags: ["mystery", "discovery", "exploration"] },
      { id: "D", text: "压抑、危险、严肃或黑暗", tags: ["dark_fantasy", "horror", "high_pressure", "mature_theme"] }
    ]
  },
  {
    id: "Q12_HARD_AVOID",
    prompt: "最后，下面哪类你最明确不想要？",
    options: [
      { id: "A", text: "真人 PVP 或排位", antiTags: ["pvp", "ranked", "team"] },
      { id: "B", text: "大量文本和剧情", antiTags: ["heavy_text", "dialogue", "cinematic_story"] },
      { id: "C", text: "高难动作和受苦", antiTags: ["high_difficulty", "soulslike", "high_pressure"] },
      { id: "D", text: "长期经营、刷材料、重复日常", antiTags: ["long_term", "routine", "collection", "management"] }
    ]
  }
];
