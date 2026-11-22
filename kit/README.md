# Long-Chat Handoff Kit

> Keep your decisions, drop the baggage. A zero-code way to restart long AI chats without starting over.

Long AI conversations get sluggish, cost more, and start giving generic or forgetful answers. But starting a fresh chat usually means losing all your background context, established rules, and settled choices.

This kit gives you two simple copy-paste prompts that let you hand off your project from an old, heavy chat to a fresh, fast one in 60 seconds.

**Works with any AI chat:** ChatGPT, Claude, Gemini, DeepSeek, Copilot, or any other web or desktop assistant. No code, no plugins, no installation, and completely free and private.

---

## The 60-Second How-To

When your chat starts feeling slow or forgetful:

### 1. In your current (heavy) chat: Create the handoff note
Copy the prompt in [ledger-prompt.md](ledger-prompt.md) and paste it into your chat.
The AI will generate a concise, 6-section **handoff ledger** (under 250 words) listing your goals, decisions with reasons, rules/preferences, references, open questions, and the immediate next step.

### 2. Copy the ledger
Copy the AI's generated ledger text. (You can also save it into a text document or notes app if you want a permanent project record.)

### 3. In a fresh chat: Resume without re-deciding
Open a brand-new chat window.
Copy the prompt in [restart-prompt.md](restart-prompt.md), paste it in, and paste your ledger directly underneath it.

The new AI chat will confirm your goal and next step, treat all previous decisions as settled, and ask if you are ready to proceed.

---

## What Is in This Kit

- **[ledger-prompt.md](ledger-prompt.md)**: The prompt to paste into your current chat to produce a 250-word structured handoff note.
- **[restart-prompt.md](restart-prompt.md)**: The prompt to paste into your new chat so it picks up where you left off and honors your settled decisions.
- **[how-to-know-a-chat-is-heavy.md](how-to-know-a-chat-is-heavy.md)**: Everyday signs that your chat needs a restart—no token counting or technical tools needed.
- **Worked Examples in [examples/](examples/)**:
  - [Novel chapter (Fiction writer)](examples/novel-chapter.md): Managing plot decisions, character arcs, and style rules across drafts.
  - [Literature review (Researcher)](examples/literature-review.md): Tracking screened papers, synthesis criteria, and open critique points.
  - [Small-business plan (Entrepreneur)](examples/small-business-plan.md): Locking in budget constraints, pricing models, and launch milestones.

---

## Why It Works

Large language models re-read the entire conversation history on every single message. As chats grow beyond 30–40 turns:
1. **Context rot sets in:** The model pays less attention to instructions you gave early on.
2. **Answers get generic:** The AI loses sharp focus and repeats errors you already corrected.
3. **The app slows down:** Large chat threads cause browser tabs to lag and use excessive memory.

The handoff kit acts like a relay baton: you condense only the decisions, constraints, and current state into a tight 250-word note, discard the accumulated conversational clutter, and sprint forward in a fresh session.

---

## Feedback

Did you try the kit? We'd love to know how it went:
- Open a quick issue using our [Kit Feedback template](https://github.com/amitauti/context-nudge/issues/new?template=handoff-kit-feedback.md) to tell us which chat app you used and what worked or broke.
