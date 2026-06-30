# 🔗 AI Context Bridge

A Chrome extension that lets you carry conversation context between AI chatbots. Summarize an entire chat on ChatGPT, Claude, or Gemini, then copy that summary into a fresh chat (on the same platform or a different one) to pick up right where you left off.

## Why

Long AI conversations eventually hit context limits, get slow, or you just want to switch tools mid-task. AI Context Bridge scrapes the full conversation from the page, sends it to the Gemini API for a structured summary, and gives you a one-click copy so you can paste it into your next chat as a ready-made prompt.

## Features

- 🤖 Works on **ChatGPT**, **Claude**, and **Gemini**
- 📝 Generates a structured summary: Goal, What Was Done, Current State, What's Next
- 📋 One-click copy to clipboard
- 🎨 Renders the summary as formatted Markdown (via [marked.js](https://github.com/markedjs/marked))
- 🔑 Bring your own Gemini API key (stored locally via `chrome.storage.sync`)

## How It Works

1. Open a supported chat (ChatGPT, Claude, or Gemini) and click the extension icon.
2. Click **Summarize Entire Chat**.
3. The extension scrolls to the top of the page and scrapes the full message history directly from the DOM.
4. The transcript is sent to the Gemini API (`gemini-2.5-flash-lite`) with a prompt asking for a structured summary.
5. The summary renders in the popup as formatted Markdown.
6. Click **Copy to Clipboard** and paste it into your next AI conversation.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension icon to your toolbar for easy access.

## Setup

You'll need a free Gemini API key:

1. Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click the extension icon, then click **⚙️ API Key**.
3. Paste your key when prompted. It's saved locally via Chrome's sync storage and never leaves your browser except to call the Gemini API directly.

## Project Structure

```
.
├── manifest.json     # Extension config (Manifest V3)
├── popup.html        # Popup UI
├── popup.js          # UI logic, DOM scraping, message passing
├── background.js     # Service worker — calls the Gemini API
└── marked.min.js      # Third-party Markdown parser (renders the summary)
```

## Permissions

| Permission | Why it's needed |
|---|---|
| `activeTab` | Access the current tab only when you click the extension |
| `storage` | Save your Gemini API key locally |
| `scripting` | Inject the scraping script into the page |
| `clipboardWrite` | Copy the summary to your clipboard |
| Host permissions for ChatGPT, Claude, Gemini | Scrape conversation content |
| Host permission for `generativelanguage.googleapis.com` | Call the Gemini API |

## Tech Stack

- Vanilla JavaScript (no build step)
- Chrome Extension Manifest V3
- [Gemini API](https://ai.google.dev/) (`gemini-2.5-flash-lite`)
- [marked.js](https://github.com/markedjs/marked) for Markdown rendering

## Known Limitations

- DOM scraping relies on each platform's current HTML structure — UI changes on ChatGPT/Claude/Gemini's end can break extraction until selectors are updated.
- Requires your own Gemini API key (no key is bundled with the extension).
- Very long conversations may take longer to summarize or hit Gemini API rate limits.

## License

MIT — feel free to fork, modify, and use.

## Disclaimer

This is an independent project and is not affiliated with OpenAI, Anthropic, or Google.
