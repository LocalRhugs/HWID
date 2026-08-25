import { createServerFn } from "@tanstack/react-start";

const BASE = "https://lua-obfuscator-production-5ebb.up.railway.app";

type AdminOp =
  | { op: "list_scripts" }
  | { op: "list_licenses"; sid: string }
  | { op: "license"; sid: string; hwid: string; expires?: number | null; note?: string | null }
  | { op: "revoke"; sid: string; hwid: string }
  | { op: "ban"; sid: string; hwid: string; reason?: string | null }
  | { op: "reinstate"; sid: string; hwid: string }
  | { op: "delete_license"; sid: string; hwid: string }
  | { op: "delete_script"; sid: string };


async function callAdmin(path: string, method: string, body?: unknown): Promise<{ ok: boolean; status: number; error?: string; data?: string }> {
  const token = process.env.COMBOWICK_KEY_ADMIN_TOKEN;
  if (!token) {
    return { ok: false, status: 503, error: "Combowick admin token not configured (COMBOWICK_KEY_ADMIN_TOKEN)." };
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text };
}

export const combowickAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => raw as AdminOp)
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const op = data;
    switch (op.op) {
      case "list_scripts":
        return callAdmin("/key-api/admin/scripts", "GET");
      case "list_licenses":
        return callAdmin(`/key-api/admin/licenses?sid=${encodeURIComponent(op.sid)}`, "GET");
      case "license":
        return callAdmin("/key-api/admin/license", "POST", {
          sid: op.sid, hwid: op.hwid, expires: op.expires ?? undefined, note: op.note ?? undefined,
        });
      case "revoke":
        return callAdmin("/key-api/admin/revoke", "POST", { sid: op.sid, hwid: op.hwid });
      case "ban":
        return callAdmin("/key-api/admin/ban", "POST", {
          sid: op.sid, hwid: op.hwid, reason: op.reason ?? undefined,
        });
      case "reinstate":
        return callAdmin("/key-api/admin/reinstate", "POST", { sid: op.sid, hwid: op.hwid });
      case "delete_license":
        return callAdmin("/key-api/admin/license", "DELETE", { sid: op.sid, hwid: op.hwid });
      case "delete_script":
        return callAdmin("/key-api/admin/script", "DELETE", { sid: op.sid });
      default:
        throw new Error("Unknown op");
    }
  });