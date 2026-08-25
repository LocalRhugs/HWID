import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PAID_SCRIPT_SENTINEL, DISABLED_SCRIPT_SENTINEL } from "@/lib/protected-script";
import { safeGet, safeSetEx } from "@/lib/redis.server";

const SEARCH_CACHE_TTL = 120; // seconds
const searchKey = (q: string) => `public:scripts:search:v1:${q.toLowerCase()}`;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const PAID_LOADER_URL =
  "https://raw.githubusercontent.com/checkurasshole/INK/main/WicksModule.lua";
const DISABLED_LOADER_URL =
  "https://raw.githubusercontent.com/checkurasshole/INK/refs/heads/main/exist";

function resolveUrl(row: { script_url: string | null; is_paid: boolean; enabled: boolean }): string | null {
  if (!row.enabled) return DISABLED_LOADER_URL;
  const url = (row.script_url ?? "").trim();
  if (row.is_paid || url === PAID_SCRIPT_SENTINEL) return PAID_LOADER_URL;
  if (url === DISABLED_SCRIPT_SENTINEL) return DISABLED_LOADER_URL;
  if (!url) return null;
  return url;
}

export const Route = createFileRoute("/api/public/scripts/search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const q = (url.searchParams.get("q") || "").trim();
          if (!q) return Response.json({ success: false, error: "missing q" }, { status: 400, headers });
          if (q.length > 128) return Response.json({ success: false, error: "q too long" }, { status: 400, headers });

          const ck = searchKey(q);
          const cached = await safeGet<string>(ck);
          if (cached) {
            return new Response(cached, {
              status: 200,
              headers: { ...headers, "Content-Type": "application/json" },
            });
          }

          const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
          const { data, error } = await supabaseAdmin
            .from("allowed_games")
            .select("game_id, name, script_url, enabled, is_paid, no_timer, session_seconds, cooldown_seconds, universe_id, added_at")
            .or(`game_id.ilike.${like},name.ilike.${like},script_url.ilike.${like},universe_id.ilike.${like}`)
            .limit(200);
          if (error) {
            const unreachable = /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(error.message);
            return Response.json(
              { success: false, error: unreachable ? "backend unavailable" : error.message },
              { status: unreachable ? 503 : 500, headers },
            );
          }

          const items = (data ?? []).map((row: any) => ({
            id: row.game_id,
            gameId: row.game_id,
            name: row.name ?? null,
            url: resolveUrl(row),
            rawUrl: row.script_url ?? null,
            status: row.enabled ? "active" : "disabled",
            isPaid: !!row.is_paid,
            noTimer: !!row.no_timer,
            sessionSeconds: row.session_seconds ?? null,
            cooldownSeconds: row.cooldown_seconds ?? null,
            universeId: row.universe_id ?? null,
            createdAt: row.added_at,
          }));

          const body = JSON.stringify({ success: true, count: items.length, data: items });
          await safeSetEx(ck, SEARCH_CACHE_TTL, body);
          return new Response(body, {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "error";
          const unreachable = /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg);
          return Response.json(
            { success: false, error: unreachable ? "backend unavailable" : msg },
            { status: unreachable ? 503 : 500, headers },
          );
        }
      },
    },
  },
});