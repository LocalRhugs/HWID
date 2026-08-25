import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { safeGet, safeSetEx } from "@/lib/redis.server";

// Denials are the spam path (bots hammering a loader with a non-allowlisted
// HWID). Cache ONLY denials — never allowances, since the RPC also consumes
// usage counters and must run for every real execution.
const DENY_CACHE_TTL = 60; // seconds
const denyKey = (loaderId: string, hwid: string, userId: number | null) =>
  `loader:deny:${loaderId}:${hwid}:${userId ?? 0}`;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

// Validates that an HWID is on a loader's allowlist (and not expired).
// Called by the Lua-side gate wrapped around hwid_required loaders.
export const Route = createFileRoute("/api/public/loader-check")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      POST: async ({ request }) => {
        let loaderId: string | undefined;
        let hwid: string | undefined;
        let userId: number | null = null;
        try {
          const body = await request.json();
          loaderId = typeof body?.loader_id === "string" ? body.loader_id.trim() : undefined;
          hwid = typeof body?.hwid === "string" ? body.hwid.trim() : undefined;
          const u = body?.user_id;
          if (typeof u === "number" && Number.isFinite(u) && u > 0) userId = Math.floor(u);
          else if (typeof u === "string" && /^\d{1,20}$/.test(u)) userId = Number(u);
        } catch {
          return json({ allowed: false, reason: "bad_json" }, 400);
        }
        if (!loaderId || loaderId.length > 128) return json({ allowed: false, reason: "bad_loader" }, 400);
        if (!hwid || hwid.length < 3 || hwid.length > 256) return json({ allowed: false, reason: "bad_hwid" }, 400);

        const dk = denyKey(loaderId, hwid, userId);
        const cachedDeny = await safeGet<{ reason: string; locked_user_id: unknown }>(dk);
        if (cachedDeny) {
          return json({
            allowed: false,
            reason: cachedDeny.reason,
            expires_at: null,
            locked_user_id: cachedDeny.locked_user_id ?? null,
            uses_left: null,
          });
        }

        const { data, error } = await supabaseAdmin.rpc("check_loader_hwid", {
          _loader_id: loaderId,
          _hwid: hwid,
          _user_id: userId,
        });
        if (error) return json({ allowed: false, reason: "db_error", error: error.message }, 500);
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.allowed) {
          await safeSetEx(dk, DENY_CACHE_TTL, {
            reason: row?.reason ?? "unknown",
            locked_user_id: row?.locked_user_id ?? null,
          });
        }
        return json({
          allowed: !!row?.allowed,
          reason: row?.reason ?? "unknown",
          expires_at: row?.expires_at ?? null,
          locked_user_id: row?.locked_user_id ?? null,
          uses_left: row?.uses_left ?? null,
        });
      },
    },
  },
});