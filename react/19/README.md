# React 19 + mion Starter

A full-stack starter that pairs a React 19 SPA (Vite + React Router) with a [mion](https://mion.io) API running on Node.

## Setup

```bash
npm install
```

## Development

Runs the Vite dev server with the mion API inside it, under `/api/mion`:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build       # SPA into dist/, API into dist-server/
```

## Preview

```bash
npm run preview:api # the built API, on port 3001
npm run preview     # in a second terminal: the SPA, forwarding /api/mion to the API
```

## Test

```bash
npm run typecheck   # tsc
npm run lint        # oxlint with the mion rules
npm run test:unit   # vitest: raw API calls and the typed client
npm run test:e2e    # playwright
```

## Project Layout

- `app/`: React SPA (pages, router, mion client, batch calls)
- `api/`: mion API (routes, models, repository, Node server entry)

Write `batch()` calls in `.ts` modules that use the module-level client from `app/mion-client.ts`, like
`app/orders-batch.ts`. React components only call those functions.

## Learn More

- [mion docs](https://mion.io)
- [React docs](https://react.dev)
- [React Router docs](https://reactrouter.com)
