# The Shape of the Water

A literary detective game in active development. Working title and fictional canon are provisional editorial choices, not owner-approved. A broken borrowed mirror and an injured volunteer lead to a reconstruction whose factual answer cannot settle the participants' accounts of reality.

The current project preserves work begun from the supplied v4 kickoff and integrates the subsequently supplied revision-3 specification. It is not a restored earlier game. Read docs/execution/BASELINE-RECONCILIATION.md for provenance and current specification gaps. Newer explicit owner instructions control, then docs/OWNER-KICKOFF-v4.md, then compatible revision-3 requirements.

Implementation: React, TypeScript, Vite, a pure deterministic engine, validated authored content and IndexedDB. Player and author tools have separate builds. Finished play uses no live AI, login or paid API. Keep public deployment separate from this authorized cloud work.

Development commands and precise tested/not-tested status are being finalized in the current checkpoint. Start with RESUME.md and docs/execution/HANDOFF.md; do not infer completion from the presence of a file. Research is in research/philosophy; actual narrative and exact voice anchors are in narrative; playable structured prose is src/content/case.json when integrated.

Run the available development shell with `pnpm dev:player` or `pnpm dev:studio` after installation. See package.json for commands. The source is preserved in Git checkpoints and current handoff archives. No human playtesting or measured play duration is claimed.
