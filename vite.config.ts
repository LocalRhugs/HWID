// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// When Vercel runs the build (VERCEL=1 in their build env) we target Nitro's
// `vercel` preset, which emits .vercel/output (Build Output API v3) so SSR +
// server functions + /api routes all run as Vercel functions.
// Locally / on Lovable the default preset is used, so nothing changes there.
const isVercel = !!process.env.VERCEL;

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const supabasePublishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

  return {
    tanstackStart: {
      server: { entry: "server" },
    },
    vite: {
      define: {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
        "import.meta.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
        "import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
        "import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY,
        ),
      },
    },
    ...(isVercel ? { nitro: { preset: "vercel" } } : {}),
  };
});
