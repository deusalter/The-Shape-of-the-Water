# Selected edition loading and repeated UI work

The browser player and studio now read lightweight edition metadata before importing story content. The player validates only the selected v7/v5/v4/v2 edition. The v2 player also loads the exact installed v1 compatibility mapping. The studio explicitly loads that mapping regardless of its initial edition, preserving later imported v2 drafts and migrated preview runs. The synchronous author/test loaders remain available, but neither browser entry imports them.

Each world implementation loads only when selected. World loading and failure are bounded by a local Suspense/error boundary, leaving prose and story actions available. Selected-story download errors offer an explicit document retry; this reload occurs before a run mounts and bypasses cached failed module imports.

Game projections now follow immutable game identity rather than save/status updates. The notebook shares the player's encountered projection, mounts on first opening, and retains its form state after closing. While hidden it retains its previous projection; reopening refreshes the current projection, available actions and run identity before interaction. Actual run replacement still resets notebook state through its runId key. Native transcript details build their passage tree only while open.

`entry-graph.json` records the tracked baseline commit, selected-content hash, and independent minified esbuild module graphs for both entries. The eager player JavaScript falls from 2,097,670 bytes to 794,266 bytes (62.1%), with gzip falling from 537,672 to 198,537 bytes. Both optimized eager graphs contain zero story JSON files, world renderer/profile modules, or Three modules. These are module-graph measurements, not final Vite/browser performance timings. Root verification owns final browser transfers, offline precaching, layouts and delivery packaging.

Checks completed in this workstream:

- TypeScript checking passed.
- Edition loading, retained edition replay, encountered notebook labels, player controller and pinned v2 migration route checks passed: 108 tests across five files.
- Two additional initial-UI rendering checks passed: the opening passage appears once, unopened notebook/transcript contents are absent, and the notebook renders the supplied encountered projection without duplicating projection work.
- The selected v7 file retains SHA-256 `b7b1a30575d90493f3a4d34a24fcd647955f663b6044337625f9b1460e930475`; no story JSON, selection, staging or literary source was edited.

Browser acceptance must additionally cover retained editions opened offline, notebook candidate/evidence/search preservation after closing, hidden updates and actual replacement refresh on reopening, and the exact transcript after opening its native details control. Server-render checks do not establish those browser behaviors.
