# Vue 3 + mion Starter

A full-stack starter that pairs a Vue 3 SPA with a [mion](https://mion.io) API. The same `api/` package builds for Node, Bun, Vercel, and Cloudflare Workers.

## Setup

```bash
npm install
```

## Development

Runs the Vue dev server with the mion API mounted as Vite middleware:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build       # builds both the SPA and the API
npm run build:app   # SPA only
npm run build:api   # API only
```

## Preview

```bash
npm run preview
```

## Test

```bash
npm run test:unit   # vitest
npm run test:e2e    # playwright
```

## Project layout

- `app/` — Vue 3 SPA (router, pages, mion client)
- `api/` — mion API (routes, models, repositories, platform entries)
- `deploy/` — Cloudflare Workers config
- `functions/` — Cloudflare Pages Functions wrapper

## Learn more

- [mion docs](https://mion.io)
- [Vue 3 docs](https://vuejs.org)
