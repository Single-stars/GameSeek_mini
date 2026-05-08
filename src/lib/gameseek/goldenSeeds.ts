import type { AnswerMap } from "./types";

export type GoldenSeed = {
  id: string;
  targetGameId: string;
  description: string;
  answers: AnswerMap;
};

export const goldenSeeds: GoldenSeed[] = [
  {
    id: "seed-slay-the-spire",
    targetGameId: "slay-the-spire",
    description: "单人低反应、高规划、构筑失败后下局优化",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "B",
      Q03_MASTERY: "B",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "B",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "B",
      Q11_TONE: "C",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-valorant",
    targetGameId: "valorant",
    description: "真人竞技、枪法、低容错爆破、团队配合",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "A",
      Q03_MASTERY: "A",
      Q04_SOCIAL: "D",
      Q05_PRESSURE: "C",
      Q06_FAILURE: "A",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "B",
      Q11_TONE: "A",
      Q12_HARD_AVOID: "B"
    }
  },
  {
    id: "seed-stardew",
    targetGameId: "stardew-valley",
    description: "低压农场、日程、关系、长期整理",
    answers: {
      Q01_MOTIVE: "D",
      Q02_LOOP: "D",
      Q03_MASTERY: "D",
      Q04_SOCIAL: "B",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "B",
      Q08_EXPLORATION: "B",
      Q09_CREATE_MANAGE: "A",
      Q10_RHYTHM: "B",
      Q11_TONE: "B",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-elden-ring",
    targetGameId: "elden-ring",
    description: "黑暗开放世界、高难战斗、路线发现",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "A",
      Q03_MASTERY: "A",
      Q04_SOCIAL: "B",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "A",
      Q07_STORY: "C",
      Q08_EXPLORATION: "A",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "C",
      Q11_TONE: "D",
      Q12_HARD_AVOID: "B"
    }
  },
  {
    id: "seed-cs2",
    targetGameId: "cs2",
    description: "纯枪法、爆破经济局、排位压力可接受",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "A",
      Q03_MASTERY: "A",
      Q04_SOCIAL: "D",
      Q05_PRESSURE: "D",
      Q06_FAILURE: "A",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "B",
      Q11_TONE: "A",
      Q12_HARD_AVOID: "B"
    }
  },
  {
    id: "seed-zelda-botw",
    targetGameId: "zelda-botw",
    description: "自由开放世界、物理解法、弱引导探索",
    answers: {
      Q01_MOTIVE: "C",
      Q02_LOOP: "C",
      Q03_MASTERY: "C",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "A",
      Q07_STORY: "C",
      Q08_EXPLORATION: "A",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "C",
      Q11_TONE: "C",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-baldurs-gate-3",
    targetGameId: "baldurs-gate-3",
    description: "重剧情选择、角色扮演、队伍构筑和回合战术",
    answers: {
      Q01_MOTIVE: "B",
      Q02_LOOP: "B",
      Q03_MASTERY: "B",
      Q04_SOCIAL: "B",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "B",
      Q07_STORY: "A",
      Q08_EXPLORATION: "B",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "C",
      Q11_TONE: "D",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-disco-elysium",
    targetGameId: "disco-elysium",
    description: "大量文本、对话推理、无战斗文学角色扮演",
    answers: {
      Q01_MOTIVE: "B",
      Q02_LOOP: "C",
      Q03_MASTERY: "C",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "A",
      Q08_EXPLORATION: "C",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "C",
      Q11_TONE: "D",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-balatro",
    targetGameId: "balatro",
    description: "短局构筑、倍率连锁、玩法系统第一",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "B",
      Q03_MASTERY: "B",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "B",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "A",
      Q11_TONE: "A",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-hades",
    targetGameId: "hades",
    description: "动作 roguelike、死亡后继续构筑和剧情推进",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "A",
      Q03_MASTERY: "A",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "B",
      Q07_STORY: "B",
      Q08_EXPLORATION: "B",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "A",
      Q11_TONE: "A",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-animal-crossing",
    targetGameId: "animal-crossing",
    description: "低压装修、收集、日常陪伴和自我表达",
    answers: {
      Q01_MOTIVE: "D",
      Q02_LOOP: "D",
      Q03_MASTERY: "D",
      Q04_SOCIAL: "B",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "C",
      Q08_EXPLORATION: "B",
      Q09_CREATE_MANAGE: "B",
      Q10_RHYTHM: "D",
      Q11_TONE: "B",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-unpacking",
    targetGameId: "unpacking",
    description: "低压整理、物品摆放、环境叙事和短流程",
    answers: {
      Q01_MOTIVE: "D",
      Q02_LOOP: "D",
      Q03_MASTERY: "C",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "C",
      Q08_EXPLORATION: "B",
      Q09_CREATE_MANAGE: "B",
      Q10_RHYTHM: "A",
      Q11_TONE: "B",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-minecraft",
    targetGameId: "minecraft",
    description: "自由沙盒、建造、探索、制作和自定目标",
    answers: {
      Q01_MOTIVE: "C",
      Q02_LOOP: "D",
      Q03_MASTERY: "D",
      Q04_SOCIAL: "B",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "C",
      Q07_STORY: "C",
      Q08_EXPLORATION: "A",
      Q09_CREATE_MANAGE: "B",
      Q10_RHYTHM: "D",
      Q11_TONE: "C",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-factorio",
    targetGameId: "factorio",
    description: "生产线、自动化、资源链和效率优化",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "B",
      Q03_MASTERY: "B",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "C",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "C",
      Q10_RHYTHM: "C",
      Q11_TONE: "C",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-it-takes-two",
    targetGameId: "it-takes-two",
    description: "固定双人合作、一起通关、多变机制和轻剧情",
    answers: {
      Q01_MOTIVE: "B",
      Q02_LOOP: "C",
      Q03_MASTERY: "C",
      Q04_SOCIAL: "C",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "B",
      Q08_EXPLORATION: "B",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "B",
      Q11_TONE: "A",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-overcooked-2",
    targetGameId: "overcooked-2",
    description: "朋友合作、短局混乱、时间压力和分工沟通",
    answers: {
      Q01_MOTIVE: "D",
      Q02_LOOP: "D",
      Q03_MASTERY: "A",
      Q04_SOCIAL: "C",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "A",
      Q11_TONE: "A",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-baba-is-you",
    targetGameId: "baba-is-you",
    description: "高难逻辑解谜、规则操控、低反应要求",
    answers: {
      Q01_MOTIVE: "A",
      Q02_LOOP: "B",
      Q03_MASTERY: "C",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "B",
      Q07_STORY: "D",
      Q08_EXPLORATION: "C",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "B",
      Q11_TONE: "C",
      Q12_HARD_AVOID: "A"
    }
  },
  {
    id: "seed-tetris-effect",
    targetGameId: "tetris-effect",
    description: "短局心流、音乐沉浸、分数挑战和快速反馈",
    answers: {
      Q01_MOTIVE: "D",
      Q02_LOOP: "B",
      Q03_MASTERY: "A",
      Q04_SOCIAL: "A",
      Q05_PRESSURE: "A",
      Q06_FAILURE: "D",
      Q07_STORY: "D",
      Q08_EXPLORATION: "D",
      Q09_CREATE_MANAGE: "D",
      Q10_RHYTHM: "A",
      Q11_TONE: "B",
      Q12_HARD_AVOID: "A"
    }
  }
];
