import { createServerFn } from "@tanstack/react-start";

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { getGateSession, passwordMatches } = await import("./gate.server");
    const expected = process.env["SITE_PASSWORD"];
    if (!expected) return { ok: false as const, error: "Site password is not configured." };
    if (!data?.password || !passwordMatches(data.password, expected)) {
      return { ok: false as const, error: "Incorrect password" };
    }
    const session = await getGateSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const getGateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getGateSession } = await import("./gate.server");
  const session = await getGateSession();
  return { unlocked: session.data.unlocked === true };
});

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { getGateSession } = await import("./gate.server");
  const session = await getGateSession();
  await session.clear();
  return { ok: true as const };
});
