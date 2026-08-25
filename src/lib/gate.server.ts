import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type GateSession = { unlocked?: boolean };

export function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "site-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function getGateSession() {
  return useSession<GateSession>(sessionConfig());
}

export async function requireUnlocked() {
  const session = await getGateSession();
  if (session.data.unlocked !== true) throw new Error("Unauthorized");
  return session;
}

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
