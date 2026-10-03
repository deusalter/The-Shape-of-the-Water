# Resume the existing playable project

Both supplied inputs are present: controlling docs/OWNER-KICKOFF-v4.md and unchanged baseline/revision3. The latter is a specification/planning package that arrived during execution, not a previous implementation. The source, research and narrative developed before its arrival were preserved. See docs/execution/BASELINE-RECONCILIATION.md. No earlier game snapshot or owner-approved canon was supplied.

Current case: The Shape of the Water, 21 scenes / 50 choices. Sole lead-writer editorial baseline: narrative/accepted/case-2026-10-03.json. Runtime source src/content/case.json SHA256 267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086. Preserve that snapshot and exact anchors in narrative/VOICE.md before changing prose. The assembly script under narrative/drafts is historical and must not regenerate over current content.

Read AGENTS.md; README.md; docs/execution/STATE.json, HANDOFF.md, BOARD.md, DECISIONS.md and CRITIQUE-QUEUE.md; full v4; active numbered specifications; narrative/REVISION-LOG.md, CANON.md, PHILOSOPHY-MAP.md and AUTHOR-NOTES.md; source-backed research; then real code and tests. CHECKPOINT.json pins the critical bytes. Run node tools/check-handoff.mjs before edits; it is a static integrity check, not a fresh-session test.

Next engineering task: extend the bounded engine with explicit, source-visible selected-evidence proof submission and its negative/alternate-route tests before claiming AC-E05/AC-G06–08. Preserve current playable behavior and exact-text saves. Choose one engineering owner, root owns shared contracts, one lead owns final fiction. Reuse the two actual case evidence routes; do not create a doctrine correctness meter. See HANDOFF for smaller independent literary/recovery tasks and other unimplemented requirements.

Maximum four active subagents, no recursion. Prior agents are completed and must not be assumed to exist in another chat. Model configuration acceptance is not attestation of actual execution; docs/execution/CAPABILITIES.md records the available controls. Nothing is deployed or pushed. The continuation prompt is self-contained; no shared chat memory is required.
