import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isBrowserRequest, obfuscateScript } from "@/lib/lua-obfuscator";
import { safeGet, safeSetEx } from "@/lib/redis.server";

const LOADER_CACHE_TTL = 300; // seconds
const loaderCacheKey = (id: string) => `loader:script:${id}`;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const LUA = "text/plain; charset=utf-8";
// rebuild marker: v4 (hwid-gated)

function denied(msg: string, status = 403) {
  return new Response(`--[[ ${msg} ]]`, { status, headers: { ...headers, "Content-Type": LUA } });
}

// Wrap the obfuscated payload with a Lua-side HWID gate that calls /api/check
// before executing. allowed / session_active -> run; cooldown -> warn and abort.
function wrapWithHwidGate(obfuscatedPayload: string, baseUrl: string): string {
  // Escape any "]]" inside the payload so we can embed it in a long-bracket string.
  // Bump the bracket level so [[ ... ]] inside the payload doesn't end the string early.
  const safePayload = obfuscatedPayload.replace(/\]==\]/g, "]= =]");
  const checkUrl = `${baseUrl}/api/check`;
  return `-- HWID gate
local HttpService = game:GetService("HttpService")
local ok, hwid = pcall(function() return game:GetService("RbxAnalyticsService"):GetClientId() end)
if not ok or type(hwid) ~= "string" or #hwid < 3 then
  hwid = HttpService:GenerateGUID(false)
end

local function httpPost(url, body)
  if syn and syn.request then
    return syn.request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif http and http.request then
    return http.request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif http_request then
    return http_request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif request then
    return request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif fluxus and fluxus.request then
    return fluxus.request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  end
  return nil
end

local body = HttpService:JSONEncode({ hwid = hwid })
local res = httpPost("${checkUrl}", body)
if not res or not res.Body then
  warn("[Loader] HWID check failed: no executor http support")
  return
end

local decoded
local okJson, parsed = pcall(function() return HttpService:JSONDecode(res.Body) end)
if okJson then decoded = parsed end
if type(decoded) ~= "table" then
  warn("[Loader] HWID check failed: bad response")
  return
end

local status = decoded.status
local remaining = tonumber(decoded.remaining) or 0

local function fmt(s)
  s = math.max(0, math.floor(s))
  local h = math.floor(s / 3600)
  local m = math.floor((s % 3600) / 60)
  local sec = s % 60
  return string.format("%02d:%02d:%02d", h, m, sec)
end

if status == "cooldown" then
  warn(string.format("[Loader] HWID is on cooldown. Try again in %s.", fmt(remaining)))
  return
elseif status == "error" then
  warn("[Loader] HWID check error: " .. tostring(decoded.error))
  return
elseif status ~= "allowed" and status ~= "session_active" then
  warn("[Loader] HWID check denied: " .. tostring(status))
  return
end

print(string.format("[Loader] HWID OK (%s) — %s remaining", status, fmt(remaining)))

-- Original (obfuscated) payload below
local _payload = [==[${safePayload}]==]
local _exec = loadstring or load
if _exec then
  local fn, err = _exec(_payload)
  if not fn then warn("[Loader] payload load error: " .. tostring(err)) return end
  fn()
end
`;
}

// Allowlist gate: only HWIDs in loader_hwids may execute. No session/cooldown.
function wrapWithAllowlistGate(obfuscatedPayload: string, baseUrl: string, loaderId: string): string {
  const safePayload = obfuscatedPayload.replace(/\]==\]/g, "]= =]");
  const checkUrl = `${baseUrl}/api/public/loader-check`;
  const safeLoaderId = loaderId.replace(/"/g, '\\"');
  return `-- HWID allowlist gate
local HttpService = game:GetService("HttpService")
local ok, hwid = pcall(function() return game:GetService("RbxAnalyticsService"):GetClientId() end)
if not ok or type(hwid) ~= "string" or #hwid < 3 then
  hwid = HttpService:GenerateGUID(false)
end

local user_id = 0
local okU, lp = pcall(function() return game:GetService("Players").LocalPlayer end)
if okU and lp and lp.UserId then user_id = lp.UserId end

local function httpPost(url, body)
  if syn and syn.request then
    return syn.request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif http and http.request then
    return http.request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif http_request then
    return http_request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif request then
    return request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  elseif fluxus and fluxus.request then
    return fluxus.request({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
  end
  return nil
end

local body = HttpService:JSONEncode({ loader_id = "${safeLoaderId}", hwid = hwid, user_id = user_id })
local res = httpPost("${checkUrl}", body)
if not res or not res.Body then
  warn("[Loader] Allowlist check failed: no executor http support")
  return
end

local decoded
local okJson, parsed = pcall(function() return HttpService:JSONDecode(res.Body) end)
if okJson then decoded = parsed end
if type(decoded) ~= "table" or decoded.allowed ~= true then
  local reason = (type(decoded) == "table" and tostring(decoded.reason)) or "unknown"
  local pretty = reason
  if reason == "paused" then pretty = "access paused by admin"
  elseif reason == "expired" then pretty = "access expired"
  elseif reason == "max_uses_reached" then pretty = "max uses reached"
  elseif reason == "wrong_user" then
    local locked = (type(decoded) == "table" and tostring(decoded.locked_user_id)) or "?"
    pretty = "HWID locked to Roblox UserId " .. locked .. " (you are " .. tostring(user_id) .. ")"
  elseif reason == "user_id_required" then pretty = "could not read your Roblox UserId"
  elseif reason == "not_allowlisted" then pretty = "HWID not on allowlist"
  end
  warn("[Loader] Access denied: " .. pretty)
  warn("[Loader] Your HWID: " .. tostring(hwid))
  warn("[Loader] Your UserId: " .. tostring(user_id))
  return
end

if decoded.expires_at then
  print("[Loader] Allowlist OK -- expires " .. tostring(decoded.expires_at))
else
  print("[Loader] Allowlist OK -- no expiry")
end
if type(decoded.uses_left) == "number" then
  print("[Loader] Uses left: " .. tostring(decoded.uses_left))
end

local _payload = [==[${safePayload}]==]
local _exec = loadstring or load
if _exec then
  local fn, err = _exec(_payload)
  if not fn then warn("[Loader] payload load error: " .. tostring(err)) return end
  fn()
end
`;
}

export const Route = createFileRoute("/api/public/script-loader")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const id = (url.searchParams.get("id") || "").trim();
          if (!id || id.length > 128) return denied("Access Denied");

          if (isBrowserRequest(request)) {
            return new Response(
              `<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body style="background:#0a0a0a;color:#ff4444;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:monospace;font-size:1.5rem;text-align:center"><div style="padding:2rem;border:1px solid #ff4444;border-radius:8px">&#9940; Access Denied<br><small style="color:#666;font-size:0.8rem">This endpoint is not accessible via browser.</small></div></body></html>`,
              { status: 403, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
            );
          }

          let row = await safeGet<{ script_content: string; is_active: boolean; hwid_required: boolean; obfuscate?: boolean }>(loaderCacheKey(id));
          if (!row) {
            const { data, error } = await supabaseAdmin
              .from("loader_scripts")
              .select("script_content, is_active, hwid_required, obfuscate")
              .eq("id", id)
              .maybeSingle();

            if (error) return denied(`db: ${error.message}`, 500);
            row = data as { script_content: string; is_active: boolean; hwid_required: boolean; obfuscate?: boolean } | null;
            if (row && row.is_active && row.script_content) {
              await safeSetEx(loaderCacheKey(id), LOADER_CACHE_TTL, row);
            }
          }
          if (!row || !row.is_active || !row.script_content) return denied("Script not found", 404);

          const baseUrl = `${url.protocol}//${url.host}`;
          const shouldObfuscate = row.obfuscate !== false;
          const payload = shouldObfuscate ? obfuscateScript(row.script_content) : row.script_content;
          const wrapped = row.hwid_required
            ? wrapWithAllowlistGate(payload, baseUrl, id)
            : wrapWithHwidGate(payload, baseUrl);
          return new Response(wrapped, {
            status: 200,
            headers: {
              ...headers,
              "Content-Type": LUA,
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch (e) {
          const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
          return denied(`Internal error: ${msg.replace(/]]/g, "] ]")}`, 500);
        }
      },
    },
  },
});