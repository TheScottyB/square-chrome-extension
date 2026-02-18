# Square Inventory Automation Chrome Extension

Chrome extension (Manifest V3, TypeScript + Vite) for Square dashboard automation, catalog workflows, and controlled browser-side actions.

## Build and Run

1. Install dependencies:

```bash
pnpm install
```

2. Build extension bundle:

```bash
pnpm run build
```

3. Load unpacked extension in Chrome:

- Open `chrome://extensions/`
- Enable Developer Mode
- Click **Load unpacked**
- Select `/Users/scottybe/workspace/square/square-chrome-extension/dist`

## Runtime Policy Model

The extension follows the same runtime tiers as `square-tools`:

- `WEB_SAFE`
- `LOCAL_STANDARD`
- `LOCAL_PRIVILEGED`

Scripting actions are gated by capability checks before execution:

- `chrome_execute_script` requires `LOCAL_PRIVILEGED` + `chrome_control` + `js_injection`
- `chrome_insert_css` requires `LOCAL_STANDARD` + `chrome_control`

If a runtime profile is missing, the extension defaults to `WEB_SAFE` and blocks privileged scripting.

### Runtime Profile Storage Key

`chrome.storage.local.runtimeProfile`

Example shape:

```json
{
  "runtimeId": "codex_desktop",
  "mode": "LOCAL_PRIVILEGED",
  "capabilities": {
    "filesystem_full_access": true,
    "photos_full_access": true,
    "chrome_control": true,
    "js_injection": true,
    "mcp_local_tools": true,
    "network_access": true
  }
}
```

## Allowlisted Script Actions

The `executeScript` tool no longer accepts arbitrary JS strings. It accepts only these actions:

- `getPageInfo`
- `extractItemFields`
- `setSeoFields`
- `clickSelector`
- `insertCssClass`

Action contracts are defined in:

- `/Users/scottybe/workspace/square/square-chrome-extension/src/types/scriptActions.ts`

## Permissions and Scope

Host permissions are restricted to Square/Spocket/CDN domains in `manifest.json`. Broad wildcard host permissions are intentionally not used.

## Dev Commands

```bash
pnpm run type-check
pnpm run test
pnpm run build
pnpm run package
```

## Key Source Paths

- `src/background.ts` - service worker and message routing
- `src/content.ts` - page automation entrypoint
- `src/injected.ts` - injected page-context bridge
- `src/utils/chromeApiTools.ts` - Chrome API tool definitions + runtime policy checks
- `src/types/scriptActions.ts` - typed allowlist action contracts

## Troubleshooting

- "Runtime policy blocked ...": set `chrome.storage.local.runtimeProfile` with a compatible mode/capability set.
- Build issues: run `pnpm install` and retry `pnpm run type-check`.
- Messaging issues: inspect background service worker console in `chrome://extensions/`.
