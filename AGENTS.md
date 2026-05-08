# AGENTS.md

## Project overview

Plain-JS Chrome extension (Manifest V3) — no build toolchain, no package manager.

## File roles

| File | Role |
|---|---|
| `content.js` | Injected into every page/frame. Intercepts keydown, controls local media, reports play/pause state to background, receives remote commands. |
| `background.js` | Service worker. Tracks which tab is playing (via `chrome.storage.session` key `mkb_playing_tabs`), routes remote commands. |
| `popup.html` | Static popup showing shortcut reference. |
| `popup.js` | No-op placeholder for future settings UI. |

## Key mapping and routing

Keys are mapped in **two places** within `content.js` `handleKeyDown` — a `keyMap` (by `event.key`) and a `codeMap` (by `event.code`). When adding a shortcut, **both maps** must be updated, plus the popup UI in `popup.html`.

For cross-tab forwarding, `background.js` has a hardcoded `switch` in the `requestMediaControl` case (line ~64). Any new action must be added there too.

Remote commands are only received by the **top frame** (`window === window.top`) in `content.js`.

## State tracking

`background.js` uses `chrome.storage.session` key `mkb_playing_tabs` with shape:
```
{ tabs: { <tabId>: <playCount> }, last: <lastPlayingTabId> }
```
Each frame counts its own playing elements and sends `mediaPlaying`/`mediaPaused` messages. `playCount` transitions from 0→1 trigger `mediaPlaying`; from 1→0 trigger `mediaPaused`. This is per-frame, NOT per-tab — the background aggregates frame counts by tab.

## Gotchas

- **No test/CI for code** — Manual install in `chrome://extensions` is the only verification. There is no lint, typecheck, or unit-test command.
- **Flat file structure** — All JS lives at repo root. Nothing in `src/`, no modules, no imports.
- **Version lives only in `manifest.json`** — The release workflow triggers on `v*` tags.
- **`skipMedia` now calls `play()`** — As of the recent change, skip-back/forward also unpauses media. If you need a "dry skip" for any reason, be aware of this.
- **Editable guard runs first** — `isEditableFocused()` check happens before key mapping lookup, so new keys automatically skip when typing.

## Git & GitHub workflow

- **`gh` CLI is available and authenticated** — use it for PRs, releases, and other GitHub operations.
- **Commit messages in English**, following open-source conventions (imperative mood, concise summary).
- **Push after local commit** — unless the user asks otherwise, push the committed branch to remote right after committing. If the push is rejected (e.g. non-fast-forward), stop and notify the user instead of force-pushing.
