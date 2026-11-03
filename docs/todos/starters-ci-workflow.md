---
type: chore
spec: guidelines
status: ready
created: 2026-11-03
---

# Test and publish the starters from GitHub Actions

## Intent

The starters are tested and published by hand: `node scripts/publish-all.mjs` runs `scripts/pre-publish-test.mjs`,
then `npm publish` in each starter folder, asking for the 2FA code each time. The repository has no `.github/`
folder, so nothing checks a pull request, and a release depends on one machine being set up right.

The maintainer wants GitHub Actions to cover this for every starter.

## Direction

- **Pull request checks:** a workflow that runs the fast root tests (`tests/create-output.test.ts`,
  `tests/mion-utils.test.ts`) and, per starter, the create e2e block (`npm run test:create:<name>`: create, install,
  build, typecheck, unit tests, Playwright). One job per starter so they run in parallel and fail on their own.
- **mion version:** pull requests run against the npm-published `@mionjs/*` (what users get). Decide whether a
  second lane should run against mion `main` through the local registry flow (`npm run mionlink` needs a mion
  checkout next to this repo, with Go and pnpm to build it).
- **Publishing:** a manually started (or tag-started) workflow that runs the pre-publish test and publishes each
  changed starter. Needs an npm token or npm trusted publishing set up for the `@mionjs` scope; `publish-all.mjs`
  asks for an OTP interactively, so CI needs a non-interactive path.
- Playwright browsers: install with `npx playwright install --with-deps chromium` in the job.

## Done when

- A pull request runs the root tests and every starter's create e2e block on GitHub Actions.
- A maintainer can publish the starters from a workflow, without a local 2FA prompt per package.
- `CLAUDE.md` and the root `README.md` say how starters are tested and published.
