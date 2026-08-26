import { createServerFn } from "@tanstack/react-start";

export type AllowedGameImportRow = {
  game_id: string;
  name: string | null;
  enabled: boolean;
  script_url: string | null;
  universe_id?: string | null;
  is_paid?: boolean;
};

function validateRows(raw: unknown): AllowedGameImportRow[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 500) {
    throw new Error("Import must contain between 1 and 500 games");
  }
  return raw.map((value) => {
    const row = value as Partial<AllowedGameImportRow>;
    const gameId = String(row.game_id ?? "").trim();
    if (!/^\d+$/.test(gameId)) throw new Error("Every game ID must be numeric");
    return {
      game_id: gameId,
      name: row.name == null ? null : String(row.name).slice(0, 500),
      enabled: row.enabled !== false,
      script_url: row.script_url == null ? null : String(row.script_url).slice(0, 2048),
      ...(row.universe_id ? { universe_id: String(row.universe_id).slice(0, 64) } : {}),
      ...(typeof row.is_paid === "boolean" ? { is_paid: row.is_paid } : {}),
    };
  });
}

export const upsertAllowedGames = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ({ rows: validateRows((data as { rows?: unknown })?.rows) }))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("allowed_games")
      .upsert(data.rows, { onConflict: "game_id" });
    if (error) throw new Error(`Game import failed: ${error.message}`);
    return { count: data.rows.length };
  });

export const updateAllowedGame = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = data as { gameIds?: unknown; patch?: unknown };
    const ids = Array.isArray(payload.gameIds) ? payload.gameIds.map(String).filter((id) => /^\d+$/.test(id)) : [];
    if (!ids.length || ids.length > 500 || !payload.patch || typeof payload.patch !== "object") throw new Error("Invalid game update");
    const { error } = await supabaseAdmin.from("allowed_games").update(payload.patch as Record<string, unknown>).in("game_id", ids);
    if (error) throw new Error(`Game update failed: ${error.message}`);
    return { count: ids.length };
  });

export const deleteAllowedGames = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = Array.isArray((data as { gameIds?: unknown })?.gameIds) ? (data as { gameIds: string[] }).gameIds.filter((id) => /^\d+$/.test(id)) : [];
    if (!ids.length || ids.length > 500) throw new Error("Invalid game delete");
    const { error } = await supabaseAdmin.from("allowed_games").delete().in("game_id", ids);
    if (error) throw new Error(`Game delete failed: ${error.message}`);
    return { count: ids.length };
  });
