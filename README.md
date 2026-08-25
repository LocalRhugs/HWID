# Free Acess

Build me a Roblox script session management website with the following:

Core Functionality:

HWID based session tracking system

When a HWID hits the endpoint it checks if they have an active session or cooldown

If no record exists, create a new session with a 30 minute timer and return allowed

When 30 minute session expires, start a 5 hour cooldown for that HWID

When cooldown expires, automatically delete their record from the database completely so they start fresh next run

Return clear JSON responses like {"status": "allowed"}, {"status": "cooldown", "remaining": seconds}, {"status": "session_active", "remaining": seconds}

Database Table Structure:

Table name: hwid_sessions

Columns: hwid (text, primary key), session_start (timestamp), cooldown_start (timestamp), status (text)

API Endpoints needed:

POST /api/check — receives HWID, returns current status and time remaining

Automatic cleanup — when cooldown finishes data gets wiped completely, user starts fresh next run

UI Pages:

Simple admin dashboard showing active sessions and cooldowns in real time

Show total active users, total on cooldown, and a table with HWID, status, time remaining

Auto refreshes every 30 seconds

Design:

Dark theme

Clean and modern

Nothing overcomplicated

Important:

Set up Supabase automatically and provide me the Supabase URL and anon key after setup so I can use unlimited API requests

All timer logic must be server side, never trust the client

HWID is the only identifier, no usernames or accounts needed


Please unzip the file to understand exactly how to implement this and remove all paypal purchases from this website we not focusing on buyign scripts

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hwid-huddle-time.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99e78c61-02dc-4bac-bdf3-0501b0b864dc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

---

## Deploying to Vercel

This repo builds for Vercel out of the box. Steps:

1. Push the repo to GitHub and click **Add New… → Project** in Vercel, then import it.
2. Framework preset: **Other** (`vercel.json` already sets `framework: null`, build command `npm run build`).
   Leave the Output Directory empty — the build emits `.vercel/output`, which Vercel detects automatically.
3. Add the environment variables from `.env.example` under **Settings → Environment Variables**
   (add them to both Production and Preview):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_PASSWORD`, `SESSION_SECRET`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - `DISCORD_WEBHOOK_URL`, `COMBOWICK_KEY_ADMIN_TOKEN`
4. Deploy. SSR, server functions and everything under `/api/*` run as Vercel functions;
   `/api/public/*` stays open for external callers (Roblox scripts, webhooks).

Notes:
- `VITE_`-prefixed variables are bundled into the browser build, so only public values belong there.
  `SUPABASE_SERVICE_ROLE_KEY`, `SITE_PASSWORD` and `SESSION_SECRET` must stay unprefixed (server only).
- Changing an env var in Vercel requires a redeploy to take effect.
- The database itself stays on Supabase; grab the URL/keys from your Supabase project settings.
- `wrangler.jsonc` is only used by the Lovable/Cloudflare build and is ignored by Vercel.
