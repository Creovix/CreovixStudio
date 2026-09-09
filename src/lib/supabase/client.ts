import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { createSupabaseFetch } from "./fetch";
import { getPublicSupabaseEnv } from "./env";

function createSupabaseClient() {
  const env = getPublicSupabaseEnv();
  if (!env) {
    const message =
      "Missing Supabase environment variable(s): VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (and matching SUPABASE_* on the server). Set them in .env (see .env.example).";
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(env.url, env.key, {
    global: {
      fetch: createSupabaseFetch(env.key),
    },
    auth: {
      storage: typeof window === "undefined" ? undefined : localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
