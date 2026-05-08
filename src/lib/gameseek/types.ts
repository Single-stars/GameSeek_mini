export type GameCluster =
  | "competitive_pvp"
  | "open_world_explore"
  | "narrative_roleplay"
  | "strategy_buildcraft"
  | "cozy_management"
  | "sandbox_factory"
  | "coop_party"
  | "puzzle_observation"
  | "short_loop_casual";

export type Game = {
  id: string;
  title: string;
  cluster: GameCluster;
  tags: string[];
  antiTags: string[];
  discriminatorTags: string[];
  confusableWith: string[];
  why: string[];
  notFor: string[];
  similar: string[];
};

export type Question = {
  id: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    tags?: string[];
    antiTags?: string[];
  }[];
};

export type AnswerMap = Record<string, string>;

export type Recommendation = {
  game: Game;
  score: number;
  matchedTags: string[];
  blockedBy: string[];
  explanation: string[];
};
