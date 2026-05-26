import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getSupabaseClient = (clerkToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
};

export const getSupabase = async (
  getToken: (options?: { template?: string }) => Promise<string | null | undefined>
) => {
  try {
    // Under Clerk's new native integration, we use the default Clerk token (no template argument)
    const token = await getToken();
    if (token) {
      console.log("[getSupabase] ✅ Successfully retrieved Clerk JWT. Passing authenticated client.");
      return getSupabaseClient(token);
    } else {
      console.warn("[getSupabase] ⚠️ getToken() returned null/undefined. Falling back to anonymous client.");
    }
  } catch (err) {
    console.error("[getSupabase] ❌ Error retrieving token:", err);
  }
  return supabase;
};

