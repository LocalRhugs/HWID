export const APP_SETTINGS_LIMITS = {
  sessionMinutes: { min: 1, max: 180 },
  cooldownSeconds: { min: 0, max: 86400 },
  throttleSeconds: { min: 0, max: 60 },
  autoBanThreshold: { min: 0, max: 1000 },
  perGameSessionMinutes: { min: 0, max: 180 },
  perGameCooldownSeconds: { min: 0, max: 86400 },
  percent: { min: 0, max: 100 },
  alertPct: { min: 1, max: 90 },
} as const;

type AppSettingsInput = {
  sessionMinutes: unknown;
  cooldownSeconds: unknown;
  throttleSeconds: unknown;
  autoBanThreshold: unknown;
  killSwitch: unknown;
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

type OptionalGameTimersInput = {
  sessionMinutes: unknown;
  cooldownSeconds: unknown;
};

function parseInteger(value: unknown, field: string): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`${field} must be a whole number`);
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`${field} must be a whole number`);
    }
    return Number(trimmed);
  }

  throw new Error(`${field} must be a whole number`);
}

function parseOptionalInteger(value: unknown, field: string): number | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return parseInteger(value, field);
}

function assertRange(value: number, min: number, max: number, field: string, unit: string) {
  if (value < min || value > max) {
    throw new Error(`${field} must be between ${min} and ${max} ${unit}`);
  }
}

export function normalizeAppSettingsInput(input: AppSettingsInput) {
  const sessionMinutes = parseInteger(input.sessionMinutes, "Session length");
  const cooldownSeconds = parseInteger(input.cooldownSeconds, "Cooldown length");
  const throttleSeconds = parseInteger(input.throttleSeconds, "Throttle");
  const autoBanThreshold = parseInteger(input.autoBanThreshold, "Auto-ban threshold");

  assertRange(
    sessionMinutes,
    APP_SETTINGS_LIMITS.sessionMinutes.min,
    APP_SETTINGS_LIMITS.sessionMinutes.max,
    "Session length",
    "minutes",
  );
  assertRange(
    cooldownSeconds,
    APP_SETTINGS_LIMITS.cooldownSeconds.min,
    APP_SETTINGS_LIMITS.cooldownSeconds.max,
    "Cooldown length",
    "seconds",
  );
  assertRange(
    throttleSeconds,
    APP_SETTINGS_LIMITS.throttleSeconds.min,
    APP_SETTINGS_LIMITS.throttleSeconds.max,
    "Throttle",
    "seconds",
  );
  assertRange(
    autoBanThreshold,
    APP_SETTINGS_LIMITS.autoBanThreshold.min,
    APP_SETTINGS_LIMITS.autoBanThreshold.max,
    "Auto-ban threshold",
    "hits",
  );

  if (typeof input.killSwitch !== "boolean") {
    throw new Error("Kill switch must be true or false");
  }

  const out: Record<string, unknown> = {
    session_seconds: sessionMinutes * 60,
    cooldown_seconds: cooldownSeconds,
    throttle_seconds: throttleSeconds,
    auto_ban_threshold: autoBanThreshold,
    kill_switch: input.killSwitch,
  };

  const mapPct = (val: unknown, field: string, max: number) => {
    if (val == null || (typeof val === "string" && val.trim() === "")) return undefined;
    const n = parseInteger(val, field);
    assertRange(n, 0, max, field, "%");
    return n;
  };

  const sg  = mapPct(input.stickinessGreen,  "Stickiness green",  100);
  const sy  = mapPct(input.stickinessYellow, "Stickiness yellow", 100);
  const r1g = mapPct(input.retentionD1Green,  "D+1 retention green",  100);
  const r1y = mapPct(input.retentionD1Yellow, "D+1 retention yellow", 100);
  const r7g = mapPct(input.retentionD7Green,  "D+7 retention green",  100);
  const r7y = mapPct(input.retentionD7Yellow, "D+7 retention yellow", 100);
  const wau = mapPct(input.wauDropAlertPct,        "WAU drop alert",        90);
  const dau = mapPct(input.dauDropAlertPct,        "DAU drop alert",        90);
  const rdr = mapPct(input.retentionDropAlertPct,  "Retention drop alert",  90);

  if (sg !== undefined) out.stickiness_green = sg;
  if (sy !== undefined) out.stickiness_yellow = sy;
  if (r1g !== undefined) out.retention_d1_green = r1g;
  if (r1y !== undefined) out.retention_d1_yellow = r1y;
  if (r7g !== undefined) out.retention_d7_green = r7g;
  if (r7y !== undefined) out.retention_d7_yellow = r7y;
  if (wau !== undefined) out.wau_drop_alert_pct = wau;
  if (dau !== undefined) out.dau_drop_alert_pct = dau;
  if (rdr !== undefined) out.retention_drop_alert_pct = rdr;

  return out as typeof out & { session_seconds: number; cooldown_seconds: number; throttle_seconds: number; auto_ban_threshold: number; kill_switch: boolean };
}

export function normalizeOptionalGameTimersInput(input: OptionalGameTimersInput) {
  const sessionMinutes = parseOptionalInteger(input.sessionMinutes, "Per-game session length");
  const cooldownSeconds = parseOptionalInteger(input.cooldownSeconds, "Per-game cooldown length");

  if (sessionMinutes != null) {
    assertRange(
      sessionMinutes,
      APP_SETTINGS_LIMITS.perGameSessionMinutes.min,
      APP_SETTINGS_LIMITS.perGameSessionMinutes.max,
      "Per-game session length",
      "minutes",
    );
  }

  if (cooldownSeconds != null) {
    assertRange(
      cooldownSeconds,
      APP_SETTINGS_LIMITS.perGameCooldownSeconds.min,
      APP_SETTINGS_LIMITS.perGameCooldownSeconds.max,
      "Per-game cooldown length",
      "seconds",
    );
  }

  return {
    session_seconds: sessionMinutes == null ? null : sessionMinutes * 60,
    cooldown_seconds: cooldownSeconds,
  };
}