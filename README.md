# context-nudge

A marketplace (`amitauti-plugins`) with two plugins that keep a short session ledger and offer a clean restart (`/clear`, then `/context-restart`) when a long Claude Code conversation gets heavy.

| Plugin | What | Install |
|---|---|---|
| [`context-nudge`](plugins/context-nudge) | Skills only. Ledger, handoff and `/context-restart`. Claude checks for heaviness itself. | `/plugin install context-nudge@amitauti-plugins` |
| [`context-nudge-hook`](plugins/context-nudge-hook) | Optional add-on: a hook that measures context size automatically. Needs Node.js 18+. | `/plugin install context-nudge-hook@amitauti-plugins` |

```
/plugin marketplace add amitauti/context-nudge
```

`tools/make-icon.js` regenerates the icon (`node tools/make-icon.js`). MIT licensed; see [CHANGELOG.md](CHANGELOG.md).
