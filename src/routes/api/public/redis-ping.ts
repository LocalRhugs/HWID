import { createFileRoute } from "@tanstack/react-router";
import { getRedis } from "@/lib/redis.server";

export const Route = createFileRoute("/api/public/redis-ping")({
  server: {
    handlers: {
      GET: async () => {
        const r = getRedis();
        if (!r) {
          return new Response(
            JSON.stringify({ ok: false, reason: "env vars missing" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        try {
          const key = "diag:ping";
          const value = `pong-${Date.now()}`;
          await r.set(key, value, { ex: 30 });
          const got = await r.get<string>(key);
          return new Response(
            JSON.stringify({ ok: true, roundtrip: got === value, value: got }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});