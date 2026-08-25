// Public fallback script — returns raw Lua text on valid X-Session-Token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-Session-Token, Content-Type, Authorization, apikey",
  "Cache-Control": "no-store",
};

const PAID_SCRIPT_LOADER = `local moduleUrl = "https://raw.githubusercontent.com/checkurasshole/INK/main/WicksModule.lua"
local success, result = pcall(function()
\treturn loadstring(game:HttpGet(moduleUrl, true))()
end)
if success and result and result.Load then
\tresult.Load()
else
\twarn("WicksShop: Failed to load module")
end`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const token = req.headers.get("x-session-token");
  if (!token) return new Response("missing token", { status: 401, headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await (supabase.rpc as any)("validate_session_token", { p_token: token });
  if (error || !data || (data as any).valid !== true) {
    return new Response("invalid token", { status: 401, headers: cors });
  }

  const scriptUrl = typeof (data as any).script_url === "string" ? (data as any).script_url.trim() : "";
  let body = PAID_SCRIPT_LOADER;

  if (scriptUrl && scriptUrl !== "lovable:paid-loader" && scriptUrl !== "lovable:disabled-loader"
      && !/lovable\.app/i.test(scriptUrl)) {
    try {
      const up = await fetch(scriptUrl, {
        headers: { "User-Agent": "Supabase-HWID-Script/1.0", Accept: "text/plain, */*" },
        redirect: "follow",
      });
      if (up.ok) body = await up.text();
    } catch { /* fall through to PAID_SCRIPT_LOADER */ }
  }

  return new Response(body, {
    status: 200,
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
  });
});