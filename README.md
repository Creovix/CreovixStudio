# Creovix Studio

Live-stream overlays and studio tools for Twitch, Kick, and TikTok: subathon timer, goals, chat box, clips, giveaways, and more.

This is a standalone [TanStack Start](https://tanstack.com/start) app. It builds with Vite and Nitro and runs on a Node.js server.

## Requirements

- Node.js 20.19 or newer
- A [Supabase](https://supabase.com) project (database + Auth)

## Setup

```sh
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase URL/keys and any platform OAuth credentials you use. Then:

```sh
npm run dev
```

The app listens on `http://localhost:3000`.

## Production

```sh
npm run build
npm start
```

Nitro writes the Node server to `.output/server/index.mjs`. Set `PORT` (default `3000`) and `PUBLIC_SITE_URL` to your public origin so clip links and OAuth callbacks resolve correctly.

## Netlify

Nitro uses the `netlify` preset when `NETLIFY=true` (set automatically on Netlify). `netlify.toml` publishes `dist` (static assets) and rewrites unmatched routes to `/.netlify/functions/server`. A matching rule also lives in `public/_redirects`.

In the Netlify dashboard, **Publish directory must be `dist`**, not `.output/public` and not `dist/client`. Those folders are either the local Node build or a different Start adapter and cause `Page not found (404)` after a successful build.

Copy `.env.example` keys into Netlify (including `VITE_SUPABASE_*` at build time). Production origin should be `https://creovixstudio.org`.

## Vercel

`vercel.json` sets the framework preset to **TanStack Start**. Leave **Output Directory** empty in the Vercel dashboard so Nitro can emit the Build Output API under `.vercel/output`. Setting it to `.output/public` deploys static files only and every SSR/API route returns `404: NOT_FOUND`. Do not add SPA `rewrites` to `index.html`.

Copy `.env.example` keys into Vercel (including `VITE_SUPABASE_*` at build time). Production origin should be `https://creovixstudio.org`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Run the Node.js server from `.output` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
