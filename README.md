# context-nudge

A marketplace (`amitauti-plugins`) with two plugins that keep a short session ledger and offer a clean restart (`/clear`, then `/context-restart`) when a long Claude Code conversation gets heavy.

| Plugin | What | Install |
|---|---|---|
| [`context-nudge`](plugins/context-nudge) | Skills only. Ledger, handoff and `/context-restart`. Claude judges heaviness itself at decisions and finished tasks; `/context-nudge` always works. | `/plugin install context-nudge@amitauti-plugins` |
| [`context-nudge-hook`](plugins/context-nudge-hook) | Optional add-on: a hook that measures context size automatically, which also catches long stretches with no decisions. Needs Node.js 18+. | `/plugin install context-nudge-hook@amitauti-plugins` |

```
/plugin marketplace add amitauti/context-nudge
```

## Not coding? Use the Portable Handoff Kit

If you use ChatGPT, Claude (web or desktop), Gemini, or other chat apps for writing, research, or business planning, see the **[Long-Chat Handoff Kit](kit/)**. It requires no code, no plugins, and no installation: just two copy-paste prompts that let you restart heavy chats without losing your decisions.

`tools/make-icon.js` regenerates the icon (`node tools/make-icon.js`). MIT licensed; see [CHANGELOG.md](CHANGELOG.md).
