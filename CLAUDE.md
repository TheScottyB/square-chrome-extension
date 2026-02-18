# CLAUDE.md

Guidance for agents working in this repository.

## Project Type

- Chrome extension (Manifest V3)
- TypeScript source in `src/`
- Built with Vite into `dist/`

## Required Development Loop

```bash
pnpm install
pnpm run type-check
pnpm run test
pnpm run build
```

Load extension from `dist/` in `chrome://extensions/`.

## Runtime Safety Model

This extension enforces runtime/capability checks for scripting operations.

Modes:

- `WEB_SAFE`
- `LOCAL_STANDARD`
- `LOCAL_PRIVILEGED`

Scripting policy:

- `executeScript` requires `LOCAL_PRIVILEGED` and capabilities `chrome_control + js_injection`
- `insertCSS` requires `LOCAL_STANDARD` and capability `chrome_control`

Runtime profile source:

- `chrome.storage.local.runtimeProfile`

If missing/invalid, runtime defaults to `WEB_SAFE` and privileged operations are blocked.

## Script Execution Contract

Do not add arbitrary code execution paths.

`executeScript` must use allowlisted actions from:

- `src/types/scriptActions.ts`

Current allowlist:

- `getPageInfo`
- `extractItemFields`
- `setSeoFields`
- `clickSelector`
- `insertCssClass`

## Key Files

- `manifest.json` - extension permissions and host scope
- `src/background.ts` - background service worker
- `src/content.ts` - content script entrypoint
- `src/injected.ts` - page-context bridge
- `src/utils/chromeApiTools.ts` - tool handlers + runtime checks
- `src/types/scriptActions.ts` - action and runtime type contracts

## Security Constraints

- Keep host permissions least-privilege.
- No `eval` for user-provided or model-provided script strings.
- Do not log API keys or tokens.
