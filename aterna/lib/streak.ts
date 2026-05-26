import { format, subDays } from "date-fns";
import type { Goal } from "@/types/database";

/**
 * Calculates the new daily streak count based on the check-in outcome.
 */
export function calculateNewStreak(
  currentStreak: number,
  outcome: "completed" | "partial" | "failed"
): number {
  if (outcome === "completed" || outcome === "partial") {
    return currentStreak + 1;
  }
  return 0;
}

/**
 * Detects if the new streak count matches a major streak milestone.
 */
export function isMilestoneStreak(newStreak: number): boolean {
  const milestones = [7, 14, 21, 30, 60, 100];
  return milestones.includes(newStreak);
}

/**
 * Checks if the user has reached a new personal best streak.
 */
export function shouldUpdateBest(newStreak: number, currentBest: number): boolean {
  return newStreak > currentBest;
}

/**
 * Helper to get yesterday's date string in YYYY-MM-DD format.
 */
export function getYesterdayDateString(): string {
  return format(subDays(new Date(), 1), "yyyy-MM-dd");
}

/**
 * Checks if a goal from yesterday was skipped (i.e. declared but never checked in).
 */
export function wasGoalSkipped(yesterdayGoal: Goal | null): boolean {
  if (!yesterdayGoal) return false;
  return yesterdayGoal.status === "active";
}
