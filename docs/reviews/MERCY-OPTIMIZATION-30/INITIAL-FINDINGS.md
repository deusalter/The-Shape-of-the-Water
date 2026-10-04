# Mercy optimization: independent implementation review

Scope: read-only review of performance and reliability changes against source HEAD `915243fe2b56c0d4ead1f3b275aac2d053f8bf4a`. No literary changes or production-code edits. The diagnostic uses the exact current `a2.letter--invitation.encountered-run.json` witness and selected case-v7, canonical hash `09fc3576b1c788c95989c18b2fafa3fd53c8ad540549b904a995e54bf03f504b`. Individual source hashes and raw measurements are in `hotpaths-baseline.json`.

## Measured bottleneck

The late story checkpoint at revision 48 is 303,418 bytes. Same-machine Node CPU diagnostics measured median action application 13.13 ms, player projection 0.922 ms and complete deterministic validation 333.47 ms. Opening validation is 0.329 ms. These are real captured-run states, not fabricated repeated transcripts. They do not measure a physical device or disk.

One mature save at revision 48 took 2,737 ms in fake IndexedDB, of which 2,471 ms was spent in eight complete validation calls. The incoming state was replayed; persisted current/backups at revisions 47/46/45/44 were verified; then newly constructed, already verified backup envelopes at revisions 47/46/45 were replayed again solely to construct their metadata. The post-save metadata refresh added 409 ms. Source timing is diagnostic and is not a browser responsiveness claim.

A bounded safe change is to retain validated states in the synchronous save transaction and construct `checkpointRuns` from those states, while preserving validation of every persisted envelope, incoming state, CAS, ownership, branch source, checksum and full replay. Do not cache validation across transactions. Backup order, raw valid `preEnding` preservation, and checkpoint run metadata fallback must stay exact. The three redundant replays account for approximately 0.95 seconds in this late-save sample. Computing the immutable state checksum once per synchronous `checkpointRun` invocation also preserves semantics.

No broader engine refactor is recommended from these measurements. Full replay and export checks are intentional integrity boundaries. Action application and projection are materially smaller than the repeated save replay at current game length.

## Early patch review

Notebook search, selected candidate and evidence selections must survive close/reopen. Deferring mount until first opening and keeping that mount thereafter is appropriate; actual run replacements must still reset by committed run identity. State projection caching must use immutable game identity.

Mercy physical-stage reuse currently keys every visible environment input: location, the exact gathered-resident condition, ordered props and actors. Interaction checks reject stale staged choices before dispatch. Final scheduler cleanup, visibility wake, lazy chunk failures, offline updates and retained-edition loading remain subject to the final-patch review and actual browser evidence.

The original review files and evidence are preserved. No commits were made by this reviewer.
