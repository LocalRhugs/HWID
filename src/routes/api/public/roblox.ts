import { createFileRoute } from "@tanstack/react-router";
import { safeGet, safeSetEx } from "@/lib/redis.server";

const UPSTREAM_LOOKUP_URL = "https://combo0-chroncile.vercel.app/api/roblox";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

// Game metadata rarely changes — 1h cache cuts upstream calls dramatically.
const ROBLOX_LOOKUP_TTL = 3600;
const robloxCacheKey = (gameId: string) => `roblox:lookup:${gameId}`;

export const Route = createFileRoute("/api/public/roblox")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const gameId = (url.searchParams.get("gameId") || "").trim();

          if (!gameId) {
            return Response.json({ success: false, error: "gameId required" }, { status: 400, headers });
          }

          if (!/^\d{1,32}$/.test(gameId)) {
            return Response.json({ success: false, error: "invalid gameId" }, { status: 400, headers });
          }

          const cached = await safeGet<{ status: number; body: string; ct: string }>(robloxCacheKey(gameId));
          if (cached) {
            return new Response(cached.body, {
              status: cached.status,
              headers: { ...headers, "Content-Type": cached.ct },
            });
          }

          const upstream = await fetch(`${UPSTREAM_LOOKUP_URL}?gameId=${encodeURIComponent(gameId)}`, {
            headers: {
              Accept: "application/json",
              "User-Agent": "Lovable-Public-API-Proxy/1.0",
            },
          });

          const body = await upstream.text();
          const ct = upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
          // Only cache successful responses; don't cache transient upstream errors.
          if (upstream.ok) {
            await safeSetEx(robloxCacheKey(gameId), ROBLOX_LOOKUP_TTL, { status: upstream.status, body, ct });
          }
          return new Response(body, {
            status: upstream.status,
            headers: {
              ...headers,
              "Content-Type": ct,
            },
          });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "error" }, { status: 500, headers });
        }
      },
    },
  },
});