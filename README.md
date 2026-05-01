# Media Keyboard Controls

A Chrome extension that lets you control audio/video playback with keyboard shortcuts — no mouse needed.

## Features

- **Play / Pause** — press `P` to toggle playback
- **Rewind 10s** — press `[` to jump back
- **Fast-forward 10s** — press `]` to jump forward

Shortcuts are automatically disabled when your cursor is in a text input field (input, textarea, contenteditable, code editors), so they won't interfere with typing.

Works with any webpage that uses `<audio>` or `<video>` elements, including Shadow DOM and same-origin iframes.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `P` | Play / Pause |
| `[` | Back 10 seconds |
| `]` | Forward 10 seconds |

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder

## How It Works

The extension injects a content script into every page that listens for `keydown` events. When a shortcut key is pressed and no text input is focused, it finds all `<audio>` and `<video>` elements on the page (including inside Shadow DOM and same-origin iframes) and controls them directly via the HTMLMediaElement API.

## License

MIT
