# Media Keyboard Controls

A Chrome extension to control audio/video playback on any tab using keyboard shortcuts — without switching tabs.

## Why

Listening to a podcast on one tab while browsing on another? Press `P` to pause, press again to resume — no need to find that tab and hunt for the play button.

## Shortcuts

| Key | Action |
|-----|--------|
| `P` | Play / Pause |
| `[` | Rewind 10s |
| `]` | Forward 10s |

Shortcuts are disabled when typing in input fields, textareas, code editors, or any `contenteditable` element. Modifier combos (`Ctrl+P`, etc.) are ignored — only bare key presses work.

## Cross-tab control

The extension tracks which tab has audio playing. When you press a shortcut on a tab that has no media, the command is forwarded to the tab that does. The most recently started tab takes priority; if it stops or closes, control falls back to the next one.

## Compatibility

Works with any `<audio>` or `<video>` element, including Shadow DOM and same-origin iframes. Cross-origin iframes support local control only (on the same page).

## Privacy

Uses `chrome.storage.session` — data lives only in the current browser session and is erased when you quit Chrome. No analytics, no network requests.

## Install

1. Clone or download this repo
2. Go to `chrome://extensions/`, enable **Developer mode**
3. Click **Load unpacked** and select the project folder

## License

MIT
