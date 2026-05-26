import { useCallback, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { getSupabase } from "@/lib/supabase";
import { resolvePayment } from "@/lib/payments";
import { calculateNewStreak, isMilestoneStreak, shouldUpdateBest } from "@/lib/streak";
import { cancelCheckinNotification } from "@/lib/notifications";
import { generateDebrief } from "@/lib/gemini";
import type { Goal } from "@/types/database";

interface CheckinParams {
  goalId: string;
  userId: string;
  outcome: "completed" | "partial" | "failed";
  voiceUri: string | null;
  selectedReasons: string[];
  goal: Goal;
}

interface CheckinResult {
  success: boolean;
  debriefText: string | null;
  newStreak: number;
  isMilestone: boolean;
  error?: string;
}

export function useCheckin() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitCheckin = useCallback(
    async (params: CheckinParams): Promise<CheckinResult> => {
      const { goalId, userId, outcome, selectedReasons, goal } = params;
      setLoading(true);

      try {
        const supabase = await getSupabase(getToken);

        // ==========================================
        // Step 1 — Update goal status in Supabase
        // ==========================================
        const { data: updatedGoal, error: goalError } = await supabase
          .from("goals")
          .update({
            status: outcome,
            checkin_at: new Date().toISOString(),
          })
          .eq("id", goalId)
          .eq("status", "active") // Guard against double check-ins
          .select()
          .maybeSingle();

        if (goalError || !updatedGoal) {
          console.error("[useCheckin] Failed to update goal status:", goalError);
          return {
            success: false,
            debriefText: null,
            newStreak: 0,
            isMilestone: false,
            error: goalError?.message || "Could not save check-in. The goal may already be resolved.",
          };
        }

        // ==========================================
        // Step 2 — Run consequence logic (lib/payments.ts)
        // ==========================================
        try {
          const res = await resolvePayment(goalId, outcome, getToken);
          if (!res.success) {
            console.warn("[useCheckin] Consequence resolution failed on server:", res.error);
          }
        } catch (paymentErr) {
          console.error("[useCheckin] Consequence processing failed:", paymentErr);
        }

        // ==========================================
        // Step 3 — Update streak (lib/streak.ts)
        // ==========================================
        let newStreak = 0;
        let isMilestone = false;
        try {
          const { data: userRow } = await supabase
            .from("users")
            .select("streak_current, streak_best")
            .eq("id", userId)
            .single();

          if (userRow) {
            newStreak = calculateNewStreak(userRow.streak_current, outcome);
            isMilestone = isMilestoneStreak(newStreak);
            const nextBest = shouldUpdateBest(newStreak, userRow.streak_best) ? newStreak : userRow.streak_best;

            await supabase
              .from("users")
              .update({
                streak_current: newStreak,
                streak_best: nextBest,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId);
          }
        } catch (streakErr) {
          console.error("[useCheckin] Streak update failed silently:", streakErr);
        }

        // ==========================================
        // Step 4 — Call Gemini debrief
        // ==========================================
        let debriefText: string | null = null;
        try {
          // Fetch user's preferred tone and past 30 days history
          const { data: userRow } = await supabase
            .from("users")
            .select("ai_tone")
            .eq("id", userId)
            .single();

          const { data: historyData } = await supabase
            .from("goals")
            .select("goal_date, status, category")
            .eq("user_id", userId)
            .gte("goal_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
            .order("goal_date", { ascending: false });

          const aiTone = userRow?.ai_tone || "balanced";
          const historyLast30 = (historyData || []).map((h) => ({
            date: h.goal_date,
            status: h.status,
            category: h.category,
          }));

          const debriefResult = await generateDebrief({
            goalText: goal.smart_text || goal.raw_text,
            outcome,
            reasons: selectedReasons,
            historyLast30,
            aiTone,
            streakCount: newStreak,
          });

          debriefText = debriefResult.debrief_text;

          // Save AI debrief in database
          await supabase.from("ai_debriefs").insert({
            goal_id: goalId,
            user_id: userId,
            debrief_type: "checkin",
            debrief_text: debriefText,
            model_used: "gemini-2.5-flash",
          });
        } catch (aiErr) {
          console.error("[useCheckin] Gemini debrief generation failed silently:", aiErr);
        }

        // ==========================================
        // Step 5 — Cancel scheduled notification
        // ==========================================
        try {
          await cancelCheckinNotification(goalId);
        } catch (notifErr) {
          console.error("[useCheckin] Failed to cancel scheduled notification:", notifErr);
        }

        return {
          success: true,
          debriefText,
          newStreak,
          isMilestone,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred during check-in.";
        console.error("[useCheckin] Fatal check-in submit error:", msg);
        return {
          success: false,
          debriefText: null,
          newStreak: 0,
          isMilestone: false,
          error: msg,
        };
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    submitCheckin,
    loading,
  };
}
