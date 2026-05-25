import { GoalCategory } from "@/types/database";

export interface GoalStoreState {
  rawText: string;
  category: GoalCategory;
  audioBase64?: string | undefined;
  smartText?: string | undefined;
  subTasks?: string[] | undefined;
  stakeAmount?: number | undefined;
  consequenceType?: "charity" | "friend_pool" | "self_reward" | undefined;
  consequenceTarget?: string | null | undefined;
}

let currentGoalState: GoalStoreState = {
  rawText: "",
  category: "personal",
};

export const goalStore = {
  get: () => currentGoalState,
  set: (state: Partial<GoalStoreState>) => {
    currentGoalState = { ...currentGoalState, ...state };
  },
  reset: () => {
    currentGoalState = {
      rawText: "",
      category: "personal",
    };
  },
};
