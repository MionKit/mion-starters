---
type: feature
spec: guidelines
status: blocked
created: 2026-11-03
---

# One shared backend, a starter config, frontend on a CDN and backend on serverless

## Intent

The future shape of every starter, decided by the maintainer:

- **One backend app for all starters.** The mion API (routes, models, the Orders showcase) lives once in this repo;
  each starter (React, Vue, Nuxt) is only a frontend. At create or install time the shared backend is copied into the
  new project, or symlinked while developing inside this repo. Today each starter carries its own copy of `api/`,
  and they drift.
- **A starter options config file** in each project, recording the choices made at create time, starting with the
  deploy platform picked from the existing `@mionjs/platform-*` packages. `npm create` asks, then writes only what
  that platform needs (entry file, build script, deploy config, dependency).
- **Frontend to a CDN, backend to serverless**, for every starter. The frontend is always a static build, never SSR:
  Nuxt supports only static generation as an SPA (`ssr: false`, `nuxt generate`).

Blocked on purpose: start only after the current plan has shipped (the mion fixes, the Vue and Nuxt ports, the
choose-the-deploy-target todo, the mion release and the starters published on it).

## Direction

The implementer plans first. Open questions, none decided:

1. **Where the shared backend lives** (e.g. a root `backend/` folder), and how it relates to the planned
   `standalone/` starter: is the shared backend that starter?
2. **Copy or symlink:**
   - the published `create-*` packages must copy;
   - development inside this repo can symlink;
   - mion needs one tsconfig program covering frontend and backend, so a symlink must still resolve inside it;
   - the in-process dev API (`mionVitePlugin({server: {entry}})`) must point at the shared backend.
3. **The config file:** name, format, what reads it (`create.mjs`, build scripts), and what else it may choose later.
4. **Platforms:** which of `@mionjs/platform-aws`, `-cloudflare`, `-vercel` and `-gcloud` to offer. Whether Node or
   Bun stay as local-dev servers only. Edge targets need `runTypes.emitMode: 'both'`.
5. **Per-platform deploy notes:**
   - Vercel without Next: a root `api/` folder clashes with Vercel's functions folder. The Build Output API
     (`.vercel/output/`) is an unverified idea.
   - Cloudflare: Workers plus static assets in one `wrangler.toml`, a shape the Vue spike verified on local workerd.
   - AWS: Lambda plus a CDN for the static files.
6. **Verification without accounts:** local runtimes (workerd), handler calls with real requests, and each platform's
   output layout.
7. **Overlap with the choose-the-deploy-target todo**, which picks a platform per project without the shared backend:
   reuse what it ships.

Background: the investigation of the mion 0.13 migration (deploy findings per starter, `DECISIONS.md`) in
`docs/investigations/mion-0.13-migration/` on the `claude/focused-feynman-3p5dap` branch.

## Docs

`CLAUDE.md` (sections "Repo Structure", "Creating a New Project", "Mion API Structure") and each starter's
`README.md`.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- Every starter is frontend-only on top of one shared backend.
- `npm create` asks for the platform and records it in the config file, and the created project deploys its frontend
  as static files and its backend to that platform, each platform checked as far as possible without accounts.
- Nuxt builds only a static SPA.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
