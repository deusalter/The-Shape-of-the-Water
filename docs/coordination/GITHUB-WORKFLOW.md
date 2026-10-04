# Coordinating separate cloud chats through GitHub

Owner-selected repository: https://github.com/deusalter/The-Shape-of-the-Water

Commit author and committer: `deusalter <212029343+deusalter@users.noreply.github.com>`. Set this with repository-local Git configuration only. Do not add co-author trailers. Keep existing history intact.

The coordinator integrates `main`. Each external chat clones into its own authorized cloud workspace, reads the current AGENTS, owner supplements, handoff, work board and team request, then uses its assigned branch:

| Team | Branch | Writable proposal/report directory |
| --- | --- | --- |
| Protagonist | `team/protagonist` | `docs/coordination/protagonist/` |
| Loop and plot | `team/loop-plot` | `docs/coordination/loop-plot/` |
| Literary review | `team/literary` | `docs/coordination/literary/` |
| Integration QA | `team/integration-qa` | `docs/coordination/integration-qa/` |

Root owns each REQUEST.md and the central WORK-BOARD.json. Teams own their STATUS.json, RESPONSE.md and work/ only. Do not edit canonical source/narrative or another team's files. Additional writable scope requires a recorded assignment. Lead_writer in the main chat remains the only final literary authority.

At the start of a bounded assignment, fetch origin and inspect `origin/main` for the current request and work-board permit. Preserve local changes before switching or updating branches. Integrate current origin/main into the assigned team branch before beginning a new request so the code and source material match the latest assignment. Avoid force pushes. Never treat this local README as a live slot permit: fetch and inspect the board on origin/main. All four external subagent permits are initially zero while these new filesystem-isolated chats are being connected. Root assigns at most four active subagents in aggregate, including descendants. The external chat primaries are owner-created chats.

Commit and push finished proposals/reports to the assigned team branch. Include exact input commit/content hashes, sources actually read, actual model/configuration known, tests actually run and clear limitations. Mention the branch and commit in the chat's reply. Root can read chats, fetch branches and inspect the diffs. A branch push is not canon acceptance. Root records editorial decisions and follow-up requests on main; each team reads those before its next substantial revision.

For integration, root first checks that the team's diff stays within ownership, reviews the substance with the lead writer where needed, then imports or merges the accepted artifacts. Preserve rejected proposals and rationale. Do not replace a stronger accepted passage merely because another version is newer.

Native cross-chat send/dispatch is unavailable in the coordinator's current tool catalog. GitHub provides durable exchange; it does not automatically wake an idle chat. Active chats can fetch requests at checkpoints. The owner can resume an idle chat with “Read the latest team request on origin/main and continue.” No chat should poll forever after completing its bounded task.

Repository publication status and current integration revision are recorded in the work board and main chat; a configured origin is not proof of a successful push. No public site deployment, paid APIs, billing operations or personal-machine access is authorized.


If authenticated smart-HTTP git push returns 401 in the managed cloud, use the checked-in `python tools/publish-git-via-api.py --repository deusalter/The-Shape-of-the-Water --branch team/YOUR-TEAM --ref HEAD`. This uses authenticated gh REST, preserves exact Git object identities and refuses forced/non-ancestor ref updates. Fetch first and preserve remote work. The coordinator successfully used this fallback; do not print or paste credentials.
