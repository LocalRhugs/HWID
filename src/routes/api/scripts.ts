import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import bundledScripts from "@/data/script-bundle.json";
import { PAID_SCRIPT_SENTINEL, DISABLED_SCRIPT_SENTINEL, SCRIPT_ENDPOINT_PATH } from "@/lib/protected-script";
import { safeGet, safeSetEx } from "@/lib/redis.server";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-Session-Token, Content-Type, Authorization",
  "Cache-Control": "no-store",
};

const DEFAULT_FALLBACK_URL =
  "https://raw.githubusercontent.com/checkurasshole/INK/main/WicksModule.lua";

// Raw URL for disabled games — served directly to the Lua client so the
// executor HttpGet's GitHub directly instead of bouncing through our API.
const DISABLED_FALLBACK_URL =
  "https://raw.githubusercontent.com/checkurasshole/INK/refs/heads/main/exist";

// Cache key + TTL for the assembled scripts map. The map is identical for
// every caller (game_id -> url), so we share one entry across all worker
// isolates via Upstash. 30s TTL is short enough that admin toggles are
// reflected quickly, but long enough to absorb bursts from executors.
// In-memory layer in front of Redis avoids the network hop for the very
// hot path within a single isolate.
const SCRIPTS_MAP_TTL_MS = 120_000;
const SCRIPTS_MAP_TTL_SECONDS = 120;
const SCRIPTS_MAP_CACHE_KEY = "scripts:map:v1";
const SESSION_CACHE_TTL_SECONDS = 300;
const sessionCacheKey = (token: string) => `session:valid:${token}`;
let scriptsMapCache: { expiresAt: number; body: string } | null = null;

export const Route = createFileRoute("/api/scripts")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      GET: async ({ request }) => {
        try {
          const token = request.headers.get("x-session-token");
          const internalScriptUrl = new URL(SCRIPT_ENDPOINT_PATH, request.url).toString();

          if (!token) {
            return new Response(JSON.stringify({ error: "missing token" }), {
              status: 401,
              headers: { ...headers, "Content-Type": "application/json" },
            });
          }

          // Check Redis first — sessions don't mutate after creation (except
          // the `used` flag, which this endpoint never sets), so a 60s
          // positive cache is safe and removes a Supabase round-trip from
          // every executor poll.
          const cachedValid = await safeGet<1>(sessionCacheKey(token));
          if (!cachedValid) {
            const { data: session, error } = await supabaseAdmin
              .from("sessions")
              .select("token, used, expires_at")
              .eq("token", token)
              .maybeSingle();

            if (
              error ||
              !session ||
              session.used ||
              new Date(session.expires_at).getTime() < Date.now()
            ) {
              return new Response(JSON.stringify({ error: "invalid token" }), {
                status: 401,
                headers: { ...headers, "Content-Type": "application/json" },
              });
            }

            // Cache for the shorter of 60s or remaining session lifetime.
            const remainingMs = new Date(session.expires_at).getTime() - Date.now();
            const ttl = Math.max(1, Math.min(SESSION_CACHE_TTL_SECONDS, Math.floor(remainingMs / 1000)));
            await safeSetEx(sessionCacheKey(token), ttl, 1);
          }

          // 1. Per-isolate in-memory cache (fastest, no network)
          const now = Date.now();
          if (scriptsMapCache && scriptsMapCache.expiresAt > now) {
            return new Response(scriptsMapCache.body, {
              status: 200,
              headers: { ...headers, "Content-Type": "application/json" },
            });
          }

          // 2. Shared Redis cache (across all worker isolates)
          const redisBody = await safeGet<string>(SCRIPTS_MAP_CACHE_KEY);
          if (redisBody) {
            scriptsMapCache = { expiresAt: now + SCRIPTS_MAP_TTL_MS, body: redisBody };
            return new Response(redisBody, {
              status: 200,
              headers: { ...headers, "Content-Type": "application/json" },
            });
          }

          const map: Record<string, string> = {};

          for (const row of bundledScripts as Array<{
            game_id: string;
            script_url: string | null;
            is_paid?: boolean;
            enabled?: boolean;
          }>) {
            const url = (row.script_url ?? "").trim();
            if (!row.enabled || !url || row.is_paid || url === PAID_SCRIPT_SENTINEL) continue;
            map[row.game_id] = url;
          }

          const { data: rows } = await supabaseAdmin
            .from("allowed_games")
            .select("game_id, script_url, enabled, is_paid");

          for (const row of (rows ?? []) as Array<{
            game_id: string;
            script_url: string | null;
            enabled?: boolean;
            is_paid?: boolean;
          }>) {
            const url = (row.script_url ?? "").trim();
            // Disabled games => return the raw MainLoader1 URL directly.
            // (Bouncing through /api/public/script adds a needless round-trip
            // + token validation + obfuscation just to emit one HttpGet line.)
            if (row.enabled === false) {
              map[row.game_id] = DISABLED_FALLBACK_URL;
              continue;
            }
            if (row.is_paid || url === PAID_SCRIPT_SENTINEL) {
              map[row.game_id] = internalScriptUrl;
              continue;
            }
            if (url === DISABLED_SCRIPT_SENTINEL) {
              map[row.game_id] = DISABLED_FALLBACK_URL;
              continue;
            }
            if (!url) continue;
            map[row.game_id] = url;
          }

          map.default = DEFAULT_FALLBACK_URL;

          const body = JSON.stringify(map);
          scriptsMapCache = { expiresAt: now + SCRIPTS_MAP_TTL_MS, body };
          await safeSetEx(SCRIPTS_MAP_CACHE_KEY, SCRIPTS_MAP_TTL_SECONDS, body);

          return new Response(body, {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: "scripts endpoint error" }),
            { status: 500, headers: { ...headers, "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});