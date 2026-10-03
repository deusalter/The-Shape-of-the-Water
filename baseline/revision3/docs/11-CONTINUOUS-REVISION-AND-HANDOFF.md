# Continuous revision and multi-chat continuity
## Revision 3

The owner wants ongoing substantive iteration and expects work may span multiple chats before the declared 4 October 2026 subscription change. Treat that date as a planning boundary, not a verified exact cutoff. The packet cannot see account allowance, reset state, or an entitlement end time. Do not invent them or redeem anything automatically.

The operating objective is to leave the best available playable work and faithful continuation materials at each checkpoint. More chats or more rewrites are not themselves improvements.

## 1. What persists

The authorized project's files are the authoritative working state. A conversational summary is a convenience. It is not a substitute for the exact scene, canon, sources, or test result.

Codex documents AGENTS.md as project guidance read at session start. Keep root instructions compact and point to role-relevant files. Do not assume that this loads an entire PRD, every attachment, or another chat's transcript. Client behavior and accessible paths still require inspection. [S23]

Use the existing canonical narrative files, with the following additions:

- `narrative/PHILOSOPHY-MAP.md` and `narrative/NAMES.md` contain accepted links between research, fiction, and name provenance.
- `narrative/VOICE.md` retains exact representative passages, speaker IDs, current relationship context, and intentional deviations.
- `docs/execution/STATE.json` contains the current task, content revision, build status, exact cutoff if actually verified, and active assignment ownership.
- `docs/execution/HANDOFF.md` is a short entry point with current facts and the next executable action.
- `docs/execution/DECISIONS.md`, `docs/execution/CRITIQUE-QUEUE.md`, and `docs/execution/REVISION-HISTORY.md` preserve consequential choices, outstanding weaknesses, and before/after comparisons.

Do not create new competing canonical files. Existing `CANON.md`, `CHARACTERS.md`, `DISCLOSURE-MAP.md`, and `ENDING-CONTRACTS.md` remain authoritative for their subjects. A blind reader is the exception: give that role a deliberately sanitized player-visible packet, not this author-side reading list.

## 2. A revision cycle that must produce work

For each bounded scene, relationship, mechanism, or route:

1. Read the exact current revision and relevant history. Record the baseline and the dominant problem to investigate. It may be a genuine uncertainty rather than a proven flaw.
2. Draft or implement a substantive candidate. Where the design is unclear, make a genuinely different alternative rather than changing synonyms. Keep canonical files untouched until integration.
3. Review the candidate against the stated concern. Use the relevant specialist: philosophical accuracy, dramatic behavior, voice, player-visible inference, or technical safety. Reviewers may report that the baseline was better or that no new defect was found.
4. The single lead writer accepts, revises, or rejects literary changes. The coordinator integrates technical changes with their owners. Do not average incompatible proposals or automatically obey every critic.
5. Rerun affected factual/disclosure and software checks. Inspect related scenes and ending consequences. A changed allusion or name may require a reference sweep; a changed fact may require new proof routes.
6. Save a coherent checkpoint with actual files, the acceptance decision, remaining concerns, exact tests, and the next highest-value action.

Repeat while authorized execution is active and a concrete improvement or unfinished deliverable remains. Do not respond with only a self-assessment after promising a revision.

Two passes are a checkpoint, not a lifetime ceiling. When two attempts address the same issue without a useful improvement, change the method: try a structurally different scene, seek a fresh diagnostic read, revise the underlying circumstance, or defer with a specific reason. Do not polish the same paragraph forever.

## 3. Protect good work from revision drift

Preserve a last accepted baseline. A new draft is not better merely because it is newer, longer, more explicit, or produced at a higher reasoning setting.

For substantial candidates use an A/B comparison without telling the reviewer which is newer. Give the same relevant context and ask about the target problem, what was lost, what was gained, and what remains uncertain. This is an editorial diagnostic, not a statistically valid experiment or an objective literary score.

Keep productive oddness. A critic's preference for smoothness is not sufficient reason to remove a character's syntax or a difficult idea. Conversely, do not defend obscure or empty prose merely because it is unusual.

Record rejected approaches succinctly so the next chat does not rediscover them as new proposals. Retain only the context needed to avoid the failure, with links to the full draft when useful. Do not grow a prohibitions encyclopedia.

## 4. Review at several scales

Scene review examines immediate action and language. Relationship review reads the same pair's encounters in order. Intellectual review checks actual arguments, distortions, and consequences against sources. Whole-story review checks pacing, distribution of knowledge, development, ending returns, and the cumulative effect of the prose.

A local improvement can damage the whole. After a substantial character or ending change, reopen affected earlier passages. After a small wording change, rerun only the proportionate checks unless it changes an evidence-bearing statement.

Priority is correctness of supported facts and progression, then dramatic and intellectual weaknesses, then line-level refinement and presentation. A runnable mediocre draft does not automatically outrank an unfinished strong scene in every decision; the coordinator must maintain both a playable baseline and serious literary progress.

## 5. Single authority across sessions

At most one active coordinator integrates the canonical project, and one active lead owns final literary files. Other sessions receive bounded tasks against a recorded input revision. Multiple authoring chats do not get simultaneous authority to rename characters or rewrite the ending.

An assignment names its owner/thread, task ID, input commit or snapshot, required sources, writable paths, excluded paths, expected result, and acceptance checks. At most four workers are active under the coordinator. Workers do not spawn workers.

Separate workspaces do not become shared because the prompts say they are shared. When a workspace is genuinely shared, use explicit ownership and available isolation. When copies are separate, return a patch or changed-file bundle and a manifest identifying the exact baseline. The coordinator reviews and integrates it. No remote push, publication, new credentials, or paid service is authorized.

Do not declare an old worker dead solely because the context moved. Inspect available runtime status. An unconfirmed worker remains unknown. Avoid its write surfaces until it is closed, its assignment is reclaimed explicitly, or new work is isolated for later reconciliation. Record transferred ownership.

## 6. Actual new-chat handoff

Before interruption or at each milestone, write HANDOFF with:

Current artifact/commit and content revision; build location and how to run it; verified capabilities and missing ones; completed and unfinished task IDs; locked and provisional creative decisions; active or unknown workers; tests actually executed; exact remaining issue; next executable action; and the files the next role must read.

Include the current project or a reproducible snapshot, source and license records, and necessary assets. A prompt without the accessible working files is not a complete handoff. Do not export account tokens, credentials, private user material, or unnecessary dependencies. Keep the current scene and voice anchors exact, not only summarized.

Place the continuation instructions in `CONTINUE_PROMPT.md` and a short root `RESUME.md`. A resumed coordinator must inspect STATE, HANDOFF, worktree/snapshot differences, and actual files before editing. It must not rerun creative ideation from scratch or assume a label such as Done proves that the deliverable exists.

A chat cannot assume permission or capability to open arbitrary future chats or keep running after it ends. Use native subagent/session continuation only when it is actually supported and authorized. Otherwise finish a checkpoint and return the files plus the continuation prompt for the owner to open in the next session. No fictitious background workers or future-delivery promises.

## 7. Context rotation

Rotate roles when the task naturally changes, when contamination would invalidate a blind review, or when the current session cannot retain enough exact context. Do not rotate merely to produce more chats.

Research workers receive primary texts and assigned questions. The lead receives accepted research and exact narrative. A voice critic receives selected scenes and appropriate voice anchors. A blind reader receives only the route disclosed to the player; remove spoilers from file names, IDs, metadata, alt text, choice keys, and role messages.

A fresh model using the same model family is an additional reading, not an independent human or a proof that the work will affect a real audience. Report model critique and human playtesting separately.

## 8. Deadline and interruption behavior

The user has supplied the date 2026-10-04, not a precise usable hour in this packet. Record the actual account cutoff only if visibly verified by the owner or an authorized surface. No assumption of midnight and no claim of allowance remaining.

Checkpoint after each completed unit. When available execution becomes limited, prefer integrating a defensible candidate, repairing a progression/save failure, or packaging exact current work over beginning a large new branch. Do not sacrifice the only recoverable version of the game to use more allowance.

If a tool fails, record the concrete limitation and continue independent authorized work. If a required task cannot finish, report its actual state and preserve partial output. Do not label a vertical slice a complete game.

## 9. Resume rehearsal

Before final handoff, have a fresh authorized session or a separately staged reviewer attempt to locate the exact next task using only the proposed handoff bundle. Ask it to identify locked names, the current scene baseline, outstanding objections, and the last actual test results. No creative rewrite is needed for this exercise.

When an actual fresh session is unavailable, perform a static handoff completeness check and label it accordingly. Do not mark a real cross-chat resume test passed on the strength of a JSON validator. Fault-inject stale revision, missing source, renamed file, ambiguous ownership, and a missing working build into safe test copies. The expected response is a precise discrepancy and safe reconciliation, not invented continuity.

## 10. End conditions

An individual session stops at a real runtime limit, owner interruption, a blocked dependency with no independent authorized work, the verified cutoff, or a completed assigned scope with no concrete next improvement. Save before stopping when the runtime permits.

An editorial issue is provisionally resolved when its targeted change is accepted and affected checks are complete or explicitly blocked. Other issues can continue in later chats. No declaration of a masterpiece, perfect philosophy, or automatic convergence is permitted.
