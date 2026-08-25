import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

const LINK_PATTERNS = [
  "http://",
  "https://",
  "www.",
  "discord.gg",
  "discord.com/invite",
  "discordapp.com",
  ".gg/",
  "discord.io", "dsc.gg", "invite.gg",
  "t.me/", "telegram.me", "bit.ly", "tinyurl", "cutt.ly", "shorturl",
];

const BAD_WORDS = [
  "nigger", "nigga", "faggot", "fag", "retard", "retarded", "kike",
  "chink", "spic", "tranny", "kys", "kill yourself", "cunt", "whore",
  "slut", "rape", "pedo", "pedophile", "cp", "child porn",
];
function containsBadWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => {
    const re = new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    return re.test(lower);
  });
}

async function fetchRobloxUser(userId: string) {
  try {
    const [uRes, aRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
    ]);
    const u = uRes.ok ? await uRes.json() as any : null;
    const a = aRes.ok ? await aRes.json() as any : null;
    return {
      name: u?.name as string | undefined,
      displayName: u?.displayName as string | undefined,
      avatar: a?.data?.[0]?.imageUrl as string | undefined,
    };
  } catch { return {} as { name?: string; displayName?: string; avatar?: string }; }
}
async function resolveUserIdByUsername(username: string): Promise<string | null> {
  try {
    const r = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    if (!r.ok) return null;
    const j = await r.json() as { data?: Array<{ id?: number }> };
    const id = j?.data?.[0]?.id;
    return typeof id === "number" ? String(id) : null;
  } catch { return null; }
}
async function fetchRobloxPlace(placeId: string) {
  try {
    const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    if (!uRes.ok) return {} as { universeId?: number; gameName?: string; creatorName?: string };
    const { universeId } = await uRes.json() as { universeId: number };
    const gRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
    if (!gRes.ok) return { universeId };
    const gJson = await gRes.json() as { data?: Array<{ name: string; creator?: { name: string } }> };
    const g = gJson.data?.[0];
    return { universeId, gameName: g?.name, creatorName: g?.creator?.name };
  } catch { return {} as { universeId?: number; gameName?: string; creatorName?: string }; }
}

const TYPE_META: Record<string, { title: string; color: number }> = {
  suggestion: { title: "💡 Suggestion", color: 0x3b82f6 },
  bug: { title: "🐞 Bug Report", color: 0xef4444 },
  help: { title: "❓ Help", color: 0xeab308 },
};

function sanitize(msg: string): string {
  return msg
    // strip control chars (keep \n and \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // neutralize mentions
    .replace(/@everyone/gi, "@\u200beveryone")
    .replace(/@here/gi, "@\u200bhere")
    .replace(/<@!?(\d+)>/g, "<@\u200b$1>")
    .replace(/<@&(\d+)>/g, "<@&\u200b$1>")
    .replace(/<#(\d+)>/g, "<#\u200b$1>")
    // strip code fences and backticks (prevents embed injection)
    .replace(/```/g, "'''")
    .replace(/`/g, "'")
    .trim();
}

function getIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    ""
  );
}

export const Route = createFileRoute("/api/public/feedback")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      POST: async ({ request }) => {
        const webhook = process.env.DISCORD_WEBHOOK_URL;
        if (!webhook) return json({ success: false, error: "not_configured" }, 500);

        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ success: false, error: "empty" }, 400);
        }

        const str = (v: unknown) => (typeof v === "string" ? v : "");
        let type = str(body?.type).toLowerCase().trim();
        const message = str(body?.message);
        const hwid = str(body?.hwid).trim();
        const placeId = str(body?.placeId).trim();
        const username = str(body?.username).trim();
        const version = str(body?.version).trim();
        const userIdRaw = str(body?.userId).trim();
        let userId = /^\d{1,20}$/.test(userIdRaw) ? userIdRaw : "";

        if (!TYPE_META[type]) type = "suggestion";

        if (!message.trim() || !hwid || !placeId || !username || !version) {
          return json({ success: false, error: "empty" });
        }
        if (message.length > 500) return json({ success: false, error: "too_long" });

        const lower = message.toLowerCase();
        if (LINK_PATTERNS.some((p) => lower.includes(p))) {
          return json({ success: false, error: "no_links" });
        }
        if (containsBadWord(message) || containsBadWord(username)) {
          return json({ success: false, error: "bad_words" });
        }
        if (hwid.length > 256 || username.length > 128 || placeId.length > 64 || version.length > 64) {
          return json({ success: false, error: "too_long" });
        }

        const ip = getIp(request);

        // Ban check
        const { data: banned } = await supabaseAdmin
          .from("banned_hwids")
          .select("hwid")
          .eq("hwid", hwid)
          .maybeSingle();
        if (banned) return json({ success: false, error: "banned" });

        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        const minuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

        // Rate limits
        const [{ count: hwidCount }, { count: ipCount }, { count: globalCount }] = await Promise.all([
          supabaseAdmin
            .from("feedback_log")
            .select("hwid", { count: "exact", head: true })
            .eq("hwid", hwid)
            .gte("created_at", hourAgo),
          ip
            ? supabaseAdmin
                .from("feedback_log")
                .select("hwid", { count: "exact", head: true })
                .eq("ip", ip)
                .gte("created_at", hourAgo)
            : Promise.resolve({ count: 0 } as any),
          supabaseAdmin
            .from("feedback_log")
            .select("hwid", { count: "exact", head: true })
            .gte("created_at", minuteAgo),
        ]);

        if ((hwidCount ?? 0) >= 3) return json({ success: false, error: "rate_limited" });
        if (ip && (ipCount ?? 0) >= 5) return json({ success: false, error: "rate_limited" });
        if ((globalCount ?? 0) >= 25) return json({ success: false, error: "busy" });

        const clean = sanitize(message);
        if (!clean) return json({ success: false, error: "empty" });

        // Enrich with Roblox metadata (best-effort). If the client didn't send
        // a userId, resolve it from the username so the embed still shows the
        // avatar + profile link.
        if (!userId && username && /^[A-Za-z0-9_]{3,32}$/.test(username)) {
          const resolved = await resolveUserIdByUsername(username);
          if (resolved) userId = resolved;
        }
        const [robloxUser, robloxPlace] = await Promise.all([
          userId ? fetchRobloxUser(userId) : Promise.resolve({} as { name?: string; displayName?: string; avatar?: string }),
          /^\d+$/.test(placeId) ? fetchRobloxPlace(placeId) : Promise.resolve({} as { universeId?: number; gameName?: string; creatorName?: string }),
        ]);
        const displayUser = robloxUser.displayName && robloxUser.name
          ? `${robloxUser.displayName} (@${robloxUser.name})`
          : sanitize(username).slice(0, 128) || "unknown";
        const gameLabel = robloxPlace.gameName
          ? `${robloxPlace.gameName}${robloxPlace.creatorName ? ` by ${robloxPlace.creatorName}` : ""}`
          : placeId;

        const meta = TYPE_META[type];
        const embed: any = {
          title: meta.title,
          color: meta.color,
          description: clean,
          author: userId ? {
            name: displayUser,
            url: `https://www.roblox.com/users/${userId}/profile`,
            icon_url: robloxUser.avatar,
          } : undefined,
          thumbnail: robloxUser.avatar ? { url: robloxUser.avatar } : undefined,
          fields: [
            {
              name: "User",
              value: userId
                ? `[${displayUser}](https://www.roblox.com/users/${userId}/profile) \`${userId}\``
                : displayUser,
              inline: true,
            },
            { name: "HWID", value: `${hwid.slice(0, 8)}…`, inline: true },
            { name: "Game", value: `[${gameLabel}](https://www.roblox.com/games/${placeId})`, inline: true },
            { name: "Version", value: version, inline: true },
          ],
          footer: { text: "Feedback" },
          timestamp: now.toISOString(),
        };

        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embeds: [embed],
              allowed_mentions: { parse: [] },
            }),
          });
          if (!res.ok) return json({ success: false, error: "discord_error" });
        } catch {
          return json({ success: false, error: "discord_error" });
        }

        // Record (best effort — don't fail the request if these fail)
        await Promise.all([
          supabaseAdmin.from("feedback_log").insert({ hwid, ip, created_at: now.toISOString() }),
          supabaseAdmin.from("feedback_entries").insert({
            type,
            message: clean,
            hwid,
            place_id: placeId,
            username,
            version,
            ip,
          }),
        ]).catch(() => {});

        return json({ success: true });
      },
    },
  },
});