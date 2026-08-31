import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { safeGet, safeSetEx, safeDel } from "@/lib/redis.server";
import { randomBytes } from "node:crypto";

const SESSION_SECONDS = 30 * 60;
const COOLDOWN_SECONDS = 5 * 60 * 60;
const timerKey = (hwid: string) => `hwid:timer:v1:${hwid}`;
type TimerState = { status: "active" | "cooldown"; startedAt: number };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

async function issueSessionToken(hwid: string, startedAt: number) {
  const sessionToken = createSessionToken();
  const { error } = await supabaseAdmin.from("hwid_sessions").update({
    session_token: sessionToken,
    session_token_created_at: new Date(startedAt).toISOString(),
  }).eq("hwid", hwid);
  if (error) throw new Error(error.message);
  return sessionToken;
}

function remaining(state: TimerState, now: number) {
  const duration = state.status === "active" ? SESSION_SECONDS : COOLDOWN_SECONDS;
  return Math.max(0, duration - Math.floor((now - state.startedAt) / 1000));
}

async function persistActive(hwid: string, startedAt: number) {
  await supabaseAdmin.from("hwid_sessions").upsert(
    { hwid, session_start: new Date(startedAt).toISOString(), cooldown_start: null, status: "active" },
    { onConflict: "hwid" },
  );
  await safeSetEx(timerKey(hwid), SESSION_SECONDS, { status: "active", startedAt });
}

export const Route = createFileRoute("/api/check")({
  server: {
    handlers: {
      OPTIONS: async () => json({}, 204),
      POST: async ({ request }) => {
        let hwid: string | undefined;
        try {
          const body = await request.json();
          hwid = typeof body?.hwid === "string" ? body.hwid.trim() : undefined;
        } catch {
          return json({ status: "error", error: "Invalid JSON body" }, 400);
        }
        if (!hwid || hwid.length < 3 || hwid.length > 256) {
          return json({ status: "error", error: "Missing or invalid hwid" }, 400);
        }

        const now = Date.now();
        const cached = await safeGet<TimerState>(timerKey(hwid));
        if (cached && (cached.status === "active" || cached.status === "cooldown")) {
          const left = remaining(cached, now);
          if (left > 0) {
            if (cached.status === "active") {
              const sessionToken = await issueSessionToken(hwid, cached.startedAt);
              return json({ status: "session_active", remaining: left, session_token: sessionToken });
            }
            return json({ status: "cooldown", remaining: left });
          }
          await safeDel(timerKey(hwid));
        }

        const { data: existing, error: selErr } = await supabaseAdmin
          .from("hwid_sessions")
          .select("hwid, status, session_start, cooldown_start")
          .eq("hwid", hwid)
          .maybeSingle();
        if (selErr) return json({ status: "error", error: selErr.message }, 500);

        if (!existing) {
          await persistActive(hwid, now);
          const sessionToken = await issueSessionToken(hwid, now);
          return json({ status: "allowed", remaining: SESSION_SECONDS, session_token: sessionToken });
        }

        if (existing.status === "active" && existing.session_start) {
          const startedAt = new Date(existing.session_start).getTime();
          const left = SESSION_SECONDS - Math.floor((now - startedAt) / 1000);
          if (left > 0) {
            await safeSetEx(timerKey(hwid), left, { status: "active", startedAt });
            const sessionToken = await issueSessionToken(hwid, startedAt);
            return json({ status: "session_active", remaining: left, session_token: sessionToken });
          }
          const { error } = await supabaseAdmin.from("hwid_sessions").update({
            status: "cooldown", cooldown_start: new Date(now).toISOString(), session_start: null,
          }).eq("hwid", hwid);
          if (error) return json({ status: "error", error: error.message }, 500);
          await safeSetEx(timerKey(hwid), COOLDOWN_SECONDS, { status: "cooldown", startedAt: now });
          return json({ status: "cooldown", remaining: COOLDOWN_SECONDS });
        }

        if (existing.status === "cooldown" && existing.cooldown_start) {
          const startedAt = new Date(existing.cooldown_start).getTime();
          const left = COOLDOWN_SECONDS - Math.floor((now - startedAt) / 1000);
          if (left > 0) {
            await safeSetEx(timerKey(hwid), left, { status: "cooldown", startedAt });
            return json({ status: "cooldown", remaining: left });
          }
          await supabaseAdmin.from("hwid_sessions").delete().eq("hwid", hwid);
          await persistActive(hwid, now);
          const sessionToken = await issueSessionToken(hwid, now);
          return json({ status: "allowed", remaining: SESSION_SECONDS, session_token: sessionToken });
        }

        return json({ status: "error", error: "Unknown state" }, 500);
      },
    },
  },
});
