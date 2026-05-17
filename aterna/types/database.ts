export type GoalStatus = "active" | "completed" | "partial" | "failed" | "skipped";
export type GoalCategory = "work" | "health" | "learning" | "creative" | "financial" | "personal";
export type SubscriptionTier = "free" | "pro" | "team";
export type AITone = "gentle" | "balanced" | "tough";
export type ConsequenceType = "charity" | "friend_pool" | "self_reward";

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  checkin_time: string;
  morning_time: string;
  goal_categories: GoalCategory[];
  ai_tone: AITone;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  streak_current: number;
  streak_best: number;
  onboarding_complete: boolean;
  expo_push_token: string | null;
  share_to_feed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  raw_text: string;
  smart_text: string | null;
  voice_url: string | null;
  category: GoalCategory;
  stake_amount: number;
  consequence_type: ConsequenceType;
  consequence_target: string | null;
  status: GoalStatus;
  share_to_feed: boolean;
  declared_at: string;
  checkin_at: string | null;
  goal_date: string;
  created_at: string;
}

export interface Partner {
  id: string;
  week_start: string;
  user_a_id: string;
  user_b_id: string;
  user_a_video_url: string | null;
  user_b_video_url: string | null;
  user_a_reacted_at: string | null;
  user_b_reacted_at: string | null;
  user_a_reaction: string | null;
  user_b_reaction: string | null;
  match_score: number | null;
  rating_a: number | null;
  rating_b: number | null;
  created_at: string;
}

export interface AIDebrief {
  id: string;
  goal_id: string | null;
  user_id: string;
  debrief_type: "checkin" | "pattern_analysis" | "monthly_report";
  debrief_text: string;
  model_used: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
}
