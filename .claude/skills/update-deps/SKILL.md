---
name: update-deps
description: Update a starter's framework dependencies by comparing with a fresh official scaffold. Use when you need to update nextjs, nuxt, or vue starter dependencies to the latest versions.
user-invocable: true
allowed-tools: Bash Read Grep Glob WebSearch WebFetch
---

# Update Starter Dependencies

Updates a single mion starter by scaffolding a fresh vanilla project with the official CLI, comparing it with the existing starter, and applying updates with verification.

## Step 0 — Ask Which Starter

Ask the user which starter to update:

- `nextjs` (nextjs/16)
- `nuxt` (nuxt/4)
- `vue` (vue/3)

Do NOT proceed until the user has chosen one.

## Step 1 — Scaffold a Fresh Vanilla Project

Get a fresh project into a temp directory at the repo root. We only need the generated files for comparison — do NOT run `npm install`.

**IMPORTANT:** Most framework CLIs (`npm create nuxt`, `npm create vue`, etc.) use interactive TUI prompts that cannot be automated with piped input or flags. Do NOT attempt to run these CLIs directly. Instead, clone the official starter/template repos:

### nextjs

```bash
npx create-next-app@latest tmp-update-nextjs --yes
```

The `--yes` flag accepts all defaults (TypeScript, Tailwind, ESLint, App Router, Turbopack, `@/*` import alias). This is the one CLI that works non-interactively.

### nuxt

```bash
git clone --depth 1 --branch v4 https://github.com/nuxt/starter.git tmp-update-nuxt
```

### vue

```bash
git clone --depth 1 https://github.com/vuejs/create-vue.git tmp-update-vue-repo
```

Then read the template files from `tmp-update-vue-repo/template/` — that's where `create-vue` stores the scaffold source.

### Fallback

If a clone fails or the repo structure has changed, try `npx giget@latest gh:<org>/<repo> tmp-update-<name>`. As a last resort, manually check the latest `package.json` from the starter repo on GitHub.

## Step 2 — Compare with Existing Starter

Read the `package.json` from both the fresh scaffold and the existing starter. Compare:

### 2a. Package Versions

Create a comparison table of all shared dependencies. Focus on:

- Main framework package (next, nuxt, vue)
- Build tools (vite, typescript, eslint)
- CSS tooling (tailwind, postcss)
- Testing (playwright, vitest)
- Any other shared non-`@mionjs/*` dependencies

Note any NEW dependencies in the scaffold that don't exist in the starter, and any dependencies in the starter that are no longer in the scaffold.

### 2b. Config Files

Compare these config files between the fresh scaffold and existing starter:

- `tsconfig.json` / `tsconfig.*.json`
- `eslint.config.*`
- Framework config: `next.config.ts`, `nuxt.config.ts`, or `vite.config.ts`
- `tailwind.config.*` / `postcss.config.*`
- `.gitignore`

For each file that differs, note the key differences. Ignore mion-specific config (proxy rules, mion plugins, API server config) — those are intentional customizations.

### 2c. Code Patterns & Structure

Look for structural changes:

- New or renamed directories/files in the scaffold
- Changed routing patterns or conventions
- Updated layout/page structure
- New boilerplate patterns

## Step 3 — Write Update Plan

Write the plan to `tmp-update-plan.md` at the repo root. The plan must include the analysis from Step 2 AND the implementation/testing steps. Use this template:

```markdown
# Update Plan: <starter name> (<starter path>)

## Dependency Updates

| Package | Current | New    | Action |
| ------- | ------- | ------ | ------ |
| next    | 16.1.6  | 16.3.0 | update |

Action values: `update` / `skip` / `investigate`

## Config Changes

<!-- For each config file that differs, summarize what would change.
     Mark mion-specific customizations that must be preserved. -->

### <config-file-name>

- Change description...

## Code Pattern Changes

<!-- Structural changes and whether they affect the mion integration -->

## Potential Breaking Changes

<!-- Anything that could break the mion integration or the Orders showcase API -->

## Implementation Steps

1. Update dependency versions in `package.json` for packages marked `update` above
2. Run `npm install`
3. Apply config file changes listed above (preserve mion-specific customizations)
4. Apply any code changes listed above

### Confirmation Gate

The following changes require explicit user confirmation before applying:

- Changes to `@mionjs/*` packages or mion-specific configuration
- Changes to files outside the starter being updated
- Any change not listed in this plan

## Verification

1. Run e2e tests: `cd <starter-dir> && npm test`
2. If tests fail:
   - If the error is trivial (renamed import, type mismatch, minor API change): fix and re-test
   - If non-trivial: search for `<package> <version> breaking changes` and report findings
   - If multiple deps were updated and error source is unclear: revert all, update one-by-one to isolate the culprit

## Notes

<!-- Any additional context or recommendations -->
```

After writing the file, tell the user:

- The plan has been written to `tmp-update-plan.md`
- They can review and modify it (change actions, remove sections, adjust implementation steps, etc.)
- Ask them to confirm when ready to proceed

**STOP HERE. Do NOT proceed to Step 4 until the user explicitly approves.**

## Step 4 — Execute the Approved Plan

Read `tmp-update-plan.md` and execute the implementation steps and verification exactly as written in the approved (possibly modified) plan.

If you encounter issues not covered by the plan, ask the user before proceeding.

## Step 5 — Version Bump & Update Log

Only perform this step after all tests pass and the update is verified.

1. Bump the `version` field in the starter's `package.json` (minor bump for dependency updates, e.g. `0.1.0` -> `0.2.0`)
2. Create the update log file at `<starter-dir>/updatelogs/from-<old>-to-<new>.md` (create the `updatelogs/` directory if it doesn't exist)
3. Use this template for the update log:

```markdown
# Update Log: v<old> -> v<new>

**Date:** <YYYY-MM-DD>

## Updated

| Package   | From          | To            |
| --------- | ------------- | ------------- |
| <package> | <old version> | <new version> |

## Skipped

| Package   | Current   | Available   | Reason   |
| --------- | --------- | ----------- | -------- |
| <package> | <current> | <available> | <reason> |

## Issues & Fixes

- **<issue title>:** Description of the issue and how it was resolved or why it's not a concern.

## Code Changes

- Summary of code changes if applied
```

## Step 6 — Cleanup & Summary

1. Delete the temp directory and plan file: `rm -rf tmp-update-* tmp-update-plan.md`
2. Present a final summary:
   - **Updated**: packages successfully updated with versions
   - **Skipped**: packages intentionally not updated (with reason)
   - **Issues**: any breaking changes found and how they were resolved
   - **Modified files**: all files changed beyond package.json/package-lock.json
