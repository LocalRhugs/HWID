import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SESSION_MS = 30 * 60 * 1000; // 30 minutes
const COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 hours

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
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
        const { data: existing, error: selErr } = await supabaseAdmin
          .from("hwid_sessions")
          .select("*")
          .eq("hwid", hwid)
          .maybeSingle();

        if (selErr) {
          return json({ status: "error", error: selErr.message }, 500);
        }

        if (!existing) {
          const sessionStart = new Date(now).toISOString();
          const { error: insErr } = await supabaseAdmin
            .from("hwid_sessions")
            .insert({ hwid, session_start: sessionStart, status: "active" });
          if (insErr) return json({ status: "error", error: insErr.message }, 500);
          return json({
            status: "allowed",
            remaining: Math.floor(SESSION_MS / 1000),
          });
        }

        // Active session
        if (existing.status === "active" && existing.session_start) {
          const start = new Date(existing.session_start).getTime();
          const elapsed = now - start;
          if (elapsed < SESSION_MS) {
            return json({
              status: "session_active",
              remaining: Math.floor((SESSION_MS - elapsed) / 1000),
            });
          }
          // Session expired -> start cooldown
          const cooldownStart = new Date(now).toISOString();
          const { error: updErr } = await supabaseAdmin
            .from("hwid_sessions")
            .update({
              status: "cooldown",
              cooldown_start: cooldownStart,
              session_start: null,
            })
            .eq("hwid", hwid);
          if (updErr) return json({ status: "error", error: updErr.message }, 500);
          return json({
            status: "cooldown",
            remaining: Math.floor(COOLDOWN_MS / 1000),
          });
        }

        // On cooldown
        if (existing.status === "cooldown" && existing.cooldown_start) {
          const start = new Date(existing.cooldown_start).getTime();
          const elapsed = now - start;
          if (elapsed < COOLDOWN_MS) {
            return json({
              status: "cooldown",
              remaining: Math.floor((COOLDOWN_MS - elapsed) / 1000),
            });
          }
          // Cooldown expired -> wipe and start fresh
          await supabaseAdmin.from("hwid_sessions").delete().eq("hwid", hwid);
          const sessionStart = new Date(now).toISOString();
          const { error: insErr } = await supabaseAdmin
            .from("hwid_sessions")
            .insert({ hwid, session_start: sessionStart, status: "active" });
          if (insErr) return json({ status: "error", error: insErr.message }, 500);
          return json({
            status: "allowed",
            remaining: Math.floor(SESSION_MS / 1000),
          });
        }

        return json({ status: "error", error: "Unknown state" }, 500);
      },
    },
  },
});