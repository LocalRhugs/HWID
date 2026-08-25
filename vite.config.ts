// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// When Vercel runs the build (VERCEL=1 in their build env) we target Nitro's
// `vercel` preset, which emits .vercel/output (Build Output API v3) so SSR +
// server functions + /api routes all run as Vercel functions.
// Locally / on Lovable the default preset is used, so nothing changes there.
const isVercel = !!process.env.VERCEL;

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // The connected project provides NEXT_PUBLIC_* variables, while the generated
  // client code uses Vite's browser-safe VITE_* names.
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    },
  },
  ...(isVercel ? { nitro: { preset: "vercel" } } : {}),
});
