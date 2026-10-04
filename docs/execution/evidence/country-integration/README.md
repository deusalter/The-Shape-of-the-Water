# Country chapter: executed integration evidence

The installed chapter is `case-v5.json`, SHA256 `d4b4cea49996aaa28d2e40a2a56577c833d2235b7c2fa9d0aa59ee27339c24e8`, canonical content hash `cf2af7418826e5bcbd9797e6d2b1822e63f242ae3e4adf97cd3d5d64abc75622`. It contains 63 scenes, 86 choices, 52 sources and one factual question. This is the first country/house chapter, not the completed long game. Production source/build files are pinned in SOURCE-PINS.json. Version4 and version 2 remain separate playable editions with exact historical saves.

| Executed check | Result and scope | Evidence |
| --- | --- | --- |
| `pnpm verify` | PASS, 496 tests in 36 files, typecheck, current content validation and both production builds | VERIFY.json and verify-final.txt |
| Lead actual engine routes | Six routes PASS, 7,609–8,131 encountered passage words; no duration claim | narrative/rebuild/ROUTE-CHECK-V5.json and readings-v5/ |
| Independent content/engine review | PASS, 303 continuation states, 36 terminal combinations, all 24 new scenes/29 continuation choices/four variants/new sources; privacy, ancestry, unavailable actions, exact replay and cross-edition rejection | docs/reviews/COUNTRY-INTEGRATION-16/REPORT.md and boundary-check.json |
| Actual built Chromium routes | PASS, six routes/247 story actions, all 24 new scenes; displayed paragraphs compared stepwise to engine projections; exact saved exports replay and reload | browser/report.json, output.txt, captured exports/screenshots, executed-runner.mjs |
| Integrated spatial behavior | Walking grants no source/action. Actual near-E `o0.inspect-source-floor` enters the story engine and replayable save | browser/report.json and corrected rerun |
| Offline and layout | Three separately saved editions and their original GLBs load offline; 1440/390/320 widths fit; axe 0 violations, 1 incomplete | browser/report.json and axe.json |
| Ready-before-takeover recheck | Corrected helper PASS on 45-action dry route, offline three-edition roundtrip, exact exports, widths and axe | browser-reload-confirmed/report.json and output.txt |
| Independent actual save ownership | PASS, four actual v5 actions saved and replayed, including actions after reload and offline v5→v4→v2→v5 navigation; explicit claim restores enabled controls | docs/reviews/COUNTRY-INTEGRATION-16/reload-report.md and reload-check.json |
| Built author application | PASS exact v5/v4/v2 selection, one edited paragraph saved/reloaded/previewed; preview export replays only against edited content; preview and author databases isolated from release | studio-check.json, studio-output.txt and actual exports |
| Original country renderer fixture | PASS movement/collision route, far/near E, disabled/stale rejection, all 24 scenes/28 base-or-variant projections, narrow widths, unknown fallback and cleanup | visual/country/renderer-check.json; docs/visual/COUNTRY-WORLD.md |
| Literary review and revision | Reader17's forced written misstatement objection revised and narrowly rechecked; source pins and first review retained | docs/reviews/COUNTRY-READER-17/ |

## Readiness correction and scope

The first six-route runner inherited a helper that checked whether Take over saving was visible before initialization had completed. A provisional “Saved progress loaded” notice could satisfy its wait, after which the app correctly exposed read-only ownership. Export/reload identity assertions still passed, but they did not establish owned saving after each reload. Inspection of the mobile capture exposed that gap.

The current helper waits for the actual Load saved progress control to become enabled before deciding whether takeover is required, confirms any takeover, and verifies the prompt disappears. It was rerun through the complete 45-action dry route with all offline/layout checks. An independent browser review additionally performed and saved new actions after both online reload and an offline edition roundtrip. No product code or compiled bundle changed for this correction. `browser/executed-runner.mjs` preserves the exact first runner; SOURCE-PINS-before-ready-wait.json preserves its original hash, and the corrected report pins the new harness. The initial mobile capture's read-only notice is expected product behavior, not evidence of data loss.

The new focused edition-retention test also initially compared a serialized export string to a parsed object. Parsing the export corrected that test assertion; all 496 tests subsequently passed. No production repair followed from that harness-only mismatch.

## Limits and reproduction

Software WebGL in headless Chromium is not hardware performance, human playtesting or assistive-technology certification. Axe's remaining incomplete item needs manual review. The continuation expansion is exhaustive only from its six supplied first-movement prefixes, not the whole game's state space. Source facts and witness ancestry do not establish a total metaphysics. The bodily-return audition, Ethics V washing encounter and ending manuscripts are not played by these routes.

Serve the built player on localhost 4190 and studio on 4191. Run `tools/browser-country-check.mjs` with the six actual route files, putting `kept-test-dry-tracing-pipe-written.run.json` first to exercise its near-E assertion. Set BROWSER_REPORT_DIR for separate evidence rather than overwriting an accepted report. Run `tools/browser-country-studio.mjs` for the bounded studio workflow. The independent review scripts and exact inputs are retained in their own directories. No external network request or browser page error occurred in the executed player routes.
