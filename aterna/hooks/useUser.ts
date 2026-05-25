import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser as useClerkUser } from "@clerk/clerk-expo";
import { getSupabaseClient } from "@/lib/supabase";
import type { User as DbUser } from "@/types/database";

interface UseUserResult {
  dbUser: DbUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useClerkUser();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrSyncUser = useCallback(async () => {
    if (!isAuthLoaded || !isClerkUserLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get dynamic Supabase-compatible Clerk JWT token
      const token = await getToken({ template: "supabase" });
      if (!token) {
        throw new Error("Failed to retrieve Clerk-Supabase JWT token.");
      }

      // 2. Instantiate authenticated client
      const supabase = getSupabaseClient(token);

      // 3. Query existing user by clerk_id
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkUser.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to query database user: ${fetchError.message}`);
      }

      if (existingUser) {
        // User exists, check if onboardingComplete matches local unsafeMetadata
        const localOnboarding = clerkUser.unsafeMetadata.onboardingComplete === true;
        if (existingUser.onboarding_complete !== localOnboarding) {
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ onboarding_complete: localOnboarding })
            .eq("id", existingUser.id)
            .select()
            .single();

          if (updateError) {
            console.error("[useUser] Sync onboarding complete status error:", updateError.message);
          } else {
            setDbUser(updatedUser);
            return;
          }
        }
        setDbUser(existingUser);
      } else {
        // User does not exist, insert/sync new record
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const displayName = clerkUser.firstName || clerkUser.username || "User";
        const avatarUrl = clerkUser.imageUrl || null;
        const onboardingComplete = clerkUser.unsafeMetadata.onboardingComplete === true;

        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            clerk_id: clerkUser.id,
            email,
            display_name: displayName,
            avatar_url: avatarUrl,
            onboarding_complete: onboardingComplete,
            ai_tone: "balanced",
            subscription_tier: "free",
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to insert/sync user to database: ${insertError.message}`);
        }

        setDbUser(newUser);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "User synchronization failed";
      console.error("[useUser] Error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthLoaded, isClerkUserLoaded, isSignedIn, clerkUser, getToken]);

  useEffect(() => {
    fetchOrSyncUser();
  }, [fetchOrSyncUser]);

  return {
    dbUser,
    loading,
    error,
    refetch: fetchOrSyncUser,
  };
}
