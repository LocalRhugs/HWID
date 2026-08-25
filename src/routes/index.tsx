import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, LogOut, ArrowRight, Activity, Lock, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "HWID Sessions Password Access" },
      { name: "description", content: "Password-protected admin access for HWID session management." },
      { property: "og:title", content: "HWID Sessions Password Access" },
      { property: "og:description", content: "Password-protected admin access for HWID session management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Index() {
  const { allowed, loading, unlock, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await unlock(password);
      if (!res.ok) setError(res.error ?? "Incorrect password");
      else setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">HWID Sessions</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the site password to continue
            </p>
            <form onSubmit={handleUnlock} className="mt-6 space-y-2 text-left">
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Checking…" : "Unlock"}
              </button>
            </form>
            {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
          </div>
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-5 px-6 py-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </footer>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold">HWID Sessions</div>
              <div className="text-[11px] text-muted-foreground">Admin Console</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground sm:inline">Unlocked</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground hover:border-primary/40"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor]" /> System online
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Manage your <span className="bg-gradient-to-r from-[oklch(0.78_0.18_280)] to-[oklch(0.72_0.18_200)] bg-clip-text text-transparent">HWID sessions</span> with control.
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Real-time session tracking, cooldown enforcement, and per-game configuration for your Roblox script ecosystem.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/admin"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-95"
            >
              Open Admin Dashboard
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card/60 px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              View documentation
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Activity, label: "Live sessions", desc: "Real-time updates with millisecond precision." },
            { icon: Lock, label: "Server-enforced", desc: "All cooldown logic runs in Postgres, not the client." },
            { icon: Zap, label: "Direct RPC", desc: "Calls hit the database directly — no edge bottleneck." },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm transition hover:border-primary/40">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display font-semibold">{f.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} HWID Sessions</span>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
