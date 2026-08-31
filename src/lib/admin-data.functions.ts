import { createServerFn } from "@tanstack/react-start";

// Password-gated admin data access. The site uses the SITE_PASSWORD cookie gate
// (gate.server.ts requireUnlocked), NOT Supabase Auth, so the browser has no
// Supabase identity — direct client-side queries hit the `anon` role and are
// denied. All privileged reads/writes therefore run here on the server with the
// service-role client (bypasses RLS), guarded by requireUnlocked().

export type DashboardRow = {
  hwid: string;
  session_start: string | null;
  cooldown_start: string | null;
  status: string;
  created_at: string;
  last_script_url?: string | null;
  last_game_id?: string | null;
};
export type DashboardBan = { hwid: string; reason: string | null; banned_at: string };
export type DashboardHistory = { hwid: string; script_url: string | null; created_at: string };

export type DashboardData = {
  rows: DashboardRow[];
  totalSessions: number;
  activeCount: number;
  cooldownCount: number;
  bans: DashboardBan[];
  settings: Record<string, unknown> | null;
  history: DashboardHistory[];
};

export const fetchDashboard = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { term?: unknown; statusFilter?: unknown; sessionLimit?: unknown };
    const term = typeof d.term === "string" ? d.term.trim().slice(0, 200) : "";
    const statusFilter =
      d.statusFilter === "active" || d.statusFilter === "cooldown"
        ? (d.statusFilter as "active" | "cooldown")
        : ("all" as const);
    let sessionLimit = Number(d.sessionLimit);
    if (!Number.isFinite(sessionLimit)) sessionLimit = 20;
    sessionLimit = Math.min(Math.max(Math.floor(sessionLimit), 1), 1000);
    return { term, statusFilter, sessionLimit };
  })
  .handler(async ({ data }): Promise<DashboardData> => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let sessionsQ = supabaseAdmin
      .from("hwid_sessions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.sessionLimit);
    if (data.term) sessionsQ = sessionsQ.ilike("hwid", `%${data.term}%`);
    if (data.statusFilter !== "all") sessionsQ = sessionsQ.eq("status", data.statusFilter);

    const [s, b, c, sess, aCnt, cCnt, tCnt] = await Promise.all([
      sessionsQ,
      supabaseAdmin.from("banned_hwids" as any).select("*").order("banned_at", { ascending: false }).limit(500),
      supabaseAdmin.from("app_settings" as any).select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("sessions" as any).select("hwid, script_url, created_at").order("created_at", { ascending: false }).limit(2000),
      supabaseAdmin.from("hwid_sessions").select("hwid", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("hwid_sessions").select("hwid", { count: "exact", head: true }).eq("status", "cooldown"),
      supabaseAdmin.from("hwid_sessions").select("hwid", { count: "exact", head: true }),
    ]);
    if (s.error) throw new Error(`Sessions load failed: ${s.error.message}`);

    const filtersActive = !!data.term || data.statusFilter !== "all";
    const totalSessions = filtersActive
      ? (s.count ?? (s.data?.length ?? 0))
      : (tCnt.count ?? s.count ?? (s.data?.length ?? 0));

    return {
      rows: (s.data ?? []) as DashboardRow[],
      totalSessions,
      activeCount: aCnt.count ?? 0,
      cooldownCount: cCnt.count ?? 0,
      bans: ((b.data ?? []) as unknown) as DashboardBan[],
      settings: (c.data ?? null) as Record<string, unknown> | null,
      history: ((sess.data ?? []) as unknown) as DashboardHistory[],
    };
  });

export const clearHwidSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const hwid = String((data as { hwid?: unknown })?.hwid ?? "").trim();
    if (!hwid) throw new Error("Missing hwid");
    return { hwid: hwid.slice(0, 512) };
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [r1] = await Promise.all([
      supabaseAdmin.from("hwid_sessions").delete().eq("hwid", data.hwid),
      supabaseAdmin.from("sessions" as any).delete().eq("hwid", data.hwid),
    ]);
    if (r1.error) throw new Error(`Clear failed: ${r1.error.message}`);
    return { ok: true as const };
  });

export const banHwid = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { hwid?: unknown; reason?: unknown };
    const hwid = String(d.hwid ?? "").trim();
    if (!hwid) throw new Error("Missing hwid");
    const reason = d.reason == null || d.reason === "" ? null : String(d.reason).slice(0, 500);
    return { hwid: hwid.slice(0, 512), reason };
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("banned_hwids" as any)
      .insert({ hwid: data.hwid, reason: data.reason });
    if (error) throw new Error(`Ban failed: ${error.message}`);
    await Promise.all([
      supabaseAdmin.from("hwid_sessions").delete().eq("hwid", data.hwid),
      supabaseAdmin.from("sessions" as any).delete().eq("hwid", data.hwid),
    ]);
    return { ok: true as const };
  });

export const unbanHwid = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const hwid = String((data as { hwid?: unknown })?.hwid ?? "").trim();
    if (!hwid) throw new Error("Missing hwid");
    return { hwid: hwid.slice(0, 512) };
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("banned_hwids" as any).delete().eq("hwid", data.hwid);
    if (error) throw new Error(`Unban failed: ${error.message}`);
    return { ok: true as const };
  });

export const saveScriptContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const content = String((data as { script_content?: unknown })?.script_content ?? "");
    return { script_content: content };
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings" as any)
      .update({ script_content: data.script_content, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
