// Public scripts map. Validates X-Session-Token against the sessions table
// (issued by check_hwid RPC) and returns { gameId: scriptUrl, default: ... }.
// All URLs point to GitHub raw — never lovable.app — so schannel executors work.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-Session-Token, Content-Type, Authorization, apikey",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

const PAID_SCRIPT_SENTINEL = "lovable:paid-loader";
const DISABLED_SCRIPT_SENTINEL = "lovable:disabled-loader";
const DEFAULT_FALLBACK_URL =
  "https://raw.githubusercontent.com/checkurasshole/INK/main/WicksModule.lua";
const DISABLED_FALLBACK_URL =
  "https://raw.githubusercontent.com/checkurasshole/INK/refs/heads/main/exist";
// Paid games route through this Supabase function so schannel executors can reach it.
const PAID_FALLBACK_URL =
  "https://zgqjncrelglxcawifdeb.supabase.co/functions/v1/public-script";

let cache: { expiresAt: number; body: string } | null = null;
const TTL_MS = 30_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const token = req.headers.get("x-session-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "missing token" }), { status: 401, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .select("token, used, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (sErr || !session || session.used || new Date(session.expires_at).getTime() < Date.now()) {
    return new Response(JSON.stringify({ error: "invalid token" }), { status: 401, headers: cors });
  }

  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return new Response(cache.body, { status: 200, headers: cors });
  }

  const map: Record<string, string> = {};
  const { data: rows } = await supabase
    .from("allowed_games")
    .select("game_id, script_url, enabled, is_paid");

  for (const row of (rows ?? []) as Array<{
    game_id: string; script_url: string | null; enabled?: boolean; is_paid?: boolean;
  }>) {
    const url = (row.script_url ?? "").trim();
    if (row.enabled === false) { map[row.game_id] = DISABLED_FALLBACK_URL; continue; }
    if (row.is_paid || url === PAID_SCRIPT_SENTINEL) { map[row.game_id] = PAID_FALLBACK_URL; continue; }
    if (url === DISABLED_SCRIPT_SENTINEL) { map[row.game_id] = DISABLED_FALLBACK_URL; continue; }
    if (!url) continue;
    // Only accept executor-reachable hosts; skip any accidental lovable.app URLs.
    if (/lovable\.app/i.test(url)) continue;
    map[row.game_id] = url;
  }
  map.default = DEFAULT_FALLBACK_URL;

  const body = JSON.stringify(map);
  cache = { expiresAt: now + TTL_MS, body };
  return new Response(body, { status: 200, headers: cors });
});