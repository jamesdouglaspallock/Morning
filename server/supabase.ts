/**
 * Supabase Server Client
 * =====================
 * Centralized, SAFE Supabase server client.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseEnv } from "./lib/env";

let supabaseClient: SupabaseClient | null = null;

function isValidSupabaseUrl(url: string) {
  return (
    url.startsWith("https://") &&
    (url.includes(".supabase.co") || url.includes(".supabase.in"))
  );
}

/* ------------------------------------------------ */
/* Client Initialization (fail-fast, validated) */
/* ------------------------------------------------ */
try {
  // validateSupabaseEnv will throw if required values are missing
  const { url, serviceKey } = validateSupabaseEnv();
  const trimmedUrl = url.trim().replace(/^['"]|['"]$/g, '');

  supabaseClient = createClient(trimmedUrl, serviceKey, {
    auth: {
      persistSession: false, // prevents random session bleed
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  console.log("[SUPABASE] ✅ Server client initialized");
} catch (err: any) {
  // Fail-fast: bubble up error to prevent app from running in a broken state
  console.error("[SUPABASE] ❌ Initialization failed:", err?.message || err);
  throw err;
}

/* ------------------------------------------------ */
/* Public API */
/* ------------------------------------------------ */

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

export function getSupabaseOrThrow(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      "[SUPABASE] Client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Replit Secrets."
    );
  }

  return supabaseClient;
}

/**
 * Optional: safe getter (returns null instead of throwing)
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

/* ------------------------------------------------ */
/* Diagnostics */
/* ------------------------------------------------ */

export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string; }> {
  if (!supabaseClient) {
    return {
      connected: false,
      error: "Supabase client not initialized",
    };
  }

  try {
    const { error } = await supabaseClient
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      return { connected: false, error: error.message };
    }

    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || "Unknown Supabase error",
    };
  }
}

/**
 * Non-blocking startup validation
 */
export async function validateSupabaseConnection(): Promise<void> {
  const result = await testSupabaseConnection();

  if (result.connected) {
    console.log("[SUPABASE] ✅ Connection verified");
  } else {
    console.error("[SUPABASE] ❌ Connection failed:", result.error);
  }
}

export { supabaseClient as supabase }