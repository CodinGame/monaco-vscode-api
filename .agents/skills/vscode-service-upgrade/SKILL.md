---
name: vscode-service-upgrade
description: 'Upgrade monaco-vscode-api internal VS Code services after a VSCode version bump. Use when missing-services.ts breaks due to service interface changes, when new registerSingleton services must be added, and when service-override modules must be updated for web/common/browser only.'
argument-hint: 'Target VSCode ref or upgrade context (optional)'
user-invocable: true
disable-model-invocation: false
---

# VSCode Service Upgrade

## What This Skill Produces
- A fully updated `src/missing-services.ts` aligned with current VSCode service interfaces.
- New services introduced between two VSCode refs, wired into this library for web builds.
- Updated `service-override` modules that dispatch real VSCode implementations for newly added services.
- Updated `src/services.ts` exports for all newly introduced service identifiers.
- Mandatory dual wiring for each added service:
  - a fake implementation in `src/missing-services.ts`,
  - the real implementation in the relevant `src/service-override/*.ts` module.
- Validation signals that unsupported stubs are explicitly marked and type-safe.

## When To Use
- After updating `config.vscode.ref` in `package.json`.
- When TypeScript errors indicate service interface drift in `src/missing-services.ts`.
- When upstream VSCode added service singletons and this project now misses overrides.

## Inputs And Assumptions
- Repository root is the current working directory.
- Upstream VSCode source is located at `../vscode`.
- Built/transformed VSCode sources exist under `./vscode` where service identifiers were split into `*.service.js` next to original modules.
- Only web, common, and browser services are in scope.
- Services from electron, electron-browser, and session code paths are out of scope.

## Procedure
0. Run preflight dependency sync first (mandatory).
- Before any ref analysis or code migration, run:
  - npm run update-vscode-dependencies && npm i
- Do not continue until this command succeeds.
- Also sync Node runtime config used by this repo:
  - update `mise.vscode.toml` so `tools.node` matches the Node version from the VSCode `.nvmrc` used for the upgrade source.

1. Resolve refs and scope.
- Read the new ref from `package.json` at `config.vscode.ref`.
- Determine previous ref from git history of `package.json` (for example: `git log -p -- package.json`, then extract prior `config.vscode.ref`).
- Confirm target scope: include only `common` and `browser` services.

2. Update missing-services first.
- Open `src/missing-services.ts` and align each fake service implementation with current interface signatures.
- For methods and fields that are straightforward: implement a minimal functional behavior.
- For methods and fields that are too complex or not meaningful in this runtime:
  - use `unsupported` implementation,
  - add the `@Unsupported` annotation.
- Ensure every method declaration is typed by the interface member type pattern so future removals/renames fail at compile time.
- Keep conventions already used in this file (naming, ordering, decorators, helper usage).

3. Discover newly registered services upstream.
- In `../vscode`, diff old and new refs and list newly registered singletons.
- Preferred command pattern:
  - `git diff <oldRef> <newRef> -G'registerSingleton\('`
- Filter findings:
  - keep services defined in `common` or `browser`,
  - ignore entries from `electron`, `session`, `electron-browser`, and similar non-web layers.

4. Add new services to this library.
- Introduce missing service identifiers/imports based on transformed modules in `./vscode` (`module.js` and sibling `module.service.js`).
- For each newly in-scope service, first add a fake implementation in `src/missing-services.ts` using the same decision rules from Step 2.
- Then wire the same service into every relevant `service-override` module.
- In `service-override` modules, use the actual VSCode implementation (not a fake fallback) whenever available and compatible with web scope.
- Export every newly added service identifier from `src/services.ts`.
- Do not consider a service migration complete unless both sides are implemented: fake in `missing-services.ts` and real in `service-override`.

5. Validate changes.
- Run type/lint checks for touched files.
- Run unsupported coverage check:
  - `npm run check-unsupported-decorator`
- Ensure no unsupported fallback is left without `@Unsupported`.
- Ensure all interface-typed methods compile.

## Decision Rules
- Implement vs unsupported:
  - Implement if behavior is deterministic, low-risk, and feasible in browser runtime.
  - This skill uses a pragmatic default: do a minimal implementation for simple web-safe behavior, and reserve `unsupported` for complex or runtime-incompatible behavior.
  - Mark unsupported if behavior depends on desktop/session-only capabilities or heavy runtime coupling.
- Add service override vs skip:
  - Add when service is registered upstream in web-relevant layers and used by bundled code.
  - Skip when service exists only in non-web layers.
  - Keep override-module coverage checks generic (do not require a fixed hardcoded module list).

## Completion Checklist
- Preflight dependency sync completed successfully:
  - npm run update-vscode-dependencies && npm i
- Node runtime sync completed:
  - `mise.vscode.toml` `tools.node` matches the Node version from VSCode `.nvmrc`.
- `src/missing-services.ts` updated before any other service migration work.
- Every newly added service has both:
  - a fake registration in `src/missing-services.ts`,
  - a real registration in a relevant `src/service-override/*.ts` module.
- Every newly added service identifier is exported from `src/services.ts`.
- Every new/changed member follows interface-member typing convention.
- Every unsupported member uses both `unsupported` and `@Unsupported`.
- New upstream services between refs are reviewed and triaged by layer.
- Relevant `service-override` modules include all newly in-scope services.
- Required validation commands pass:
  - `npm run check-unsupported-decorator`
  - `npm run build`

## Suggested Prompt Examples
- `/vscode-service-upgrade upgrade services after vscode ref bump from 1.123.0 to 1.124.0`
- `/vscode-service-upgrade update missing-services.ts and add new browser/common services`
- `/vscode-service-upgrade find registerSingleton additions and wire service-overrides`
