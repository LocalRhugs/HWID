import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeAppSettingsInput } from "@/lib/settings-validation";

export const fetchGameName = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const obj = data as { gameId?: string };
    const gameId = (obj?.gameId ?? "").toString().trim();
    if (!/^\d+$/.test(gameId)) throw new Error("Invalid game id");
    return { gameId };
  })
  .handler(async ({ data }) => {
    const { gameId } = data;

    // 1. Check Supabase cache
    const { data: cached } = await supabaseAdmin
      .from("game_cache")
      .select("game_name, creator_name, universe_id")
      .eq("game_id", gameId)
      .maybeSingle();
    if (cached && cached.universe_id) {
      return {
        gameName: cached.game_name,
        creatorName: cached.creator_name ?? "",
        universeId: cached.universe_id,
        cached: true,
      };
    }

    // 2. Resolve place id -> universe id
    try {
      const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${gameId}/universe`);
      if (!uRes.ok) return { gameName: gameId, creatorName: "", universeId: "", cached: false };
      const { universeId } = (await uRes.json()) as { universeId: number };

      const gRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
      if (!gRes.ok) {
        return { gameName: gameId, creatorName: "", universeId: String(universeId), cached: false };
      }
      const gJson = (await gRes.json()) as { data?: Array<{ name: string; creator?: { name: string }; description?: string }> };
      const game = gJson.data?.[0];
      if (!game) return { gameName: gameId, creatorName: "", universeId: String(universeId), cached: false };

      await supabaseAdmin.from("game_cache").upsert(
        {
          game_id: gameId,
          game_name: game.name,
          game_description: game.description ?? "",
          creator_name: game.creator?.name ?? "",
          universe_id: String(universeId),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "game_id" },
      );

      return {
        gameName: game.name,
        creatorName: game.creator?.name ?? "",
        universeId: String(universeId),
        cached: false,
      };
    } catch (e) {
      return { gameName: gameId, creatorName: "", universeId: "", cached: false };
    }
  });

export const fetchScriptSource = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const obj = data as { url?: string };
    const url = (obj?.url ?? "").toString().trim();
    if (!url) return { url: "" };
    if (url.length > 2048) throw new Error("URL too long");
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Invalid script URL");
    }
    if (parsed.protocol !== "https:") throw new Error("Script URL must use https");
    return { url: parsed.toString() };
  })
  .handler(async ({ data }) => {
    if (!data.url) return { content: "", contentType: "text/plain", finalUrl: "", ok: false, status: 0 };

    const res = await fetch(data.url, {
      headers: {
        "User-Agent": "Lovable-HWID-Admin/1.0",
        Accept: "text/plain, text/*;q=0.9, */*;q=0.1",
      },
      redirect: "follow",
    });

    const text = await res.text();
    return {
      content: text.slice(0, 200000),
      contentType: res.headers.get("content-type") ?? "text/plain",
      finalUrl: res.url,
      ok: res.ok,
      status: res.status,
    };
  });

export const updateAppSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const obj = (data ?? {}) as {
      sessionMinutes?: unknown;
      cooldownSeconds?: unknown;
      throttleSeconds?: unknown;
      autoBanThreshold?: unknown;
      killSwitch?: unknown;
      stickinessGreen?: unknown;
      stickinessYellow?: unknown;
      retentionD1Green?: unknown;
      retentionD1Yellow?: unknown;
      retentionD7Green?: unknown;
      retentionD7Yellow?: unknown;
      wauDropAlertPct?: unknown;
      dauDropAlertPct?: unknown;
      retentionDropAlertPct?: unknown;
    };

    return normalizeAppSettingsInput({
      sessionMinutes: obj.sessionMinutes,
      cooldownSeconds: obj.cooldownSeconds,
      throttleSeconds: obj.throttleSeconds,
      autoBanThreshold: obj.autoBanThreshold,
      killSwitch: obj.killSwitch,
      stickinessGreen: obj.stickinessGreen,
      stickinessYellow: obj.stickinessYellow,
      retentionD1Green: obj.retentionD1Green,
      retentionD1Yellow: obj.retentionD1Yellow,
      retentionD7Green: obj.retentionD7Green,
      retentionD7Yellow: obj.retentionD7Yellow,
      wauDropAlertPct: obj.wauDropAlertPct,
      dauDropAlertPct: obj.dauDropAlertPct,
      retentionDropAlertPct: obj.retentionDropAlertPct,
    });
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();

    const payload = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabaseAdmin
      .from("app_settings")
      .update(payload)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return updated;
  });

export const runGrowthAlerts = createServerFn({ method: "POST" })
  .handler(async () => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { data, error } = await supabaseAdmin.rpc("compute_growth_alerts" as any);
    if (error) throw new Error(error.message);
    return { result: JSON.stringify(data ?? {}) };
  });
