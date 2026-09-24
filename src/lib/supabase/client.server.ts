// Server-side Supabase client with the service role / secret key — bypasses RLS.
// Use only in server functions and server routes. For user-authenticated
// queries (with RLS), use the auth middleware instead.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { createSupabaseFetch } from "./fetch";

/** Trim + strip wrapping quotes from dashboard-pasted secrets. */
function readServerEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  return trimmed || undefined;
}

function keyKind(key: string): "jwt_service_role" | "sb_secret" | "sb_publishable" | "jwt_anon_or_unknown" {
  if (key.startsWith("sb_secret_")) return "sb_secret";
  if (key.startsWith("sb_publishable_")) return "sb_publishable";
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8")) as {
        role?: string;
      };
      if (payload.role === "service_role") return "jwt_service_role";
    } catch {
      /* fall through */
    }
    return "jwt_anon_or_unknown";
  }
  return "jwt_anon_or_unknown";
}

function resolveAdminCredentials(): { url: string; key: string; kind: ReturnType<typeof keyKind> } {
  const url =
    readServerEnv("SUPABASE_URL") ?? readServerEnv("VITE_SUPABASE_URL");
  const key =
    readServerEnv("SUPABASE_SERVICE_ROLE_KEY") ??
    // New Dashboard naming (Settings → API Keys → secret).
    readServerEnv("SUPABASE_SECRET_KEY");

  const publishable =
    readServerEnv("SUPABASE_PUBLISHABLE_KEY") ??
    readServerEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
    readServerEnv("SUPABASE_ANON_KEY") ??
    readServerEnv("VITE_SUPABASE_ANON_KEY");

  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Set them in .env (see .env.example).`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  const kind = keyKind(key);

  if (kind === "sb_publishable") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is a publishable key (sb_publishable_…). Use the service_role JWT or sb_secret_ key from Settings → API Keys.",
    );
  }

  if (publishable && key === publishable) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY matches the publishable/anon key. Admin Auth (createUser) requires the service_role / secret key.",
    );
  }

  if (kind === "jwt_anon_or_unknown" && key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8")) as {
        role?: string;
      };
      if (payload.role === "anon") {
        throw new Error(
          "SUPABASE_SERVICE_ROLE_KEY is an anon JWT. Paste the service_role key (role: service_role) from the Supabase dashboard.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("SUPABASE_SERVICE_ROLE_KEY")) throw error;
    }
  }

  return { url, key, kind };
}

function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { url, key, kind } = resolveAdminCredentials();

  console.info("[Supabase] admin client init", {
    urlHost: new URL(url).host,
    keyKind: kind,
    keyLength: key.length,
    // Never log the key — only enough to confirm the right env var was read.
    keyHint: `${key.slice(0, 8)}…${key.slice(-4)}`,
  });

  return createClient<Database>(url, key, {
    global: {
      // Auth Admin needs the service credential on `apikey` (and Bearer for legacy JWTs).
      fetch: createSupabaseFetch(key),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

let _supabaseAdmin: SupabaseClient<Database> | undefined;

// SECURITY: never expose this client to browser code.
// Load inside server handlers: const { supabaseAdmin } = await import("@/lib/supabase/client.server");
// Top-level import is safe only in other *.server.ts modules — route files and *.functions.ts ship to the client bundle.
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});

/** True when the configured admin key looks like a privileged credential. */
export function assertSupabaseAdminConfigured(): void {
  // Throws if URL/key missing or key is publishable/anon.
  resolveAdminCredentials();
}
