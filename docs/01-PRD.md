> Active baseline reconciled 2026-10-03. Newer explicit owner instructions and docs/OWNER-KICKOFF-v4.md override this revision-3 specification. Existing work is preserved; see docs/execution/BASELINE-RECONCILIATION.md.

# Product requirements
## A compact literary role-playing investigation

Revision 3. Prepared 3 October 2026. All performance, duration, and content-size figures are design targets, not measurements of an existing application.

## 1. Product statement

Build a single-player, browser-first literary game about encountering incompatible accounts of a shared past and choosing how to act toward the people who give them. The player explores a compact place, enters conversations, notices physical details, and revisits scenes after learning more. The game supplies a coherent underlying history while allowing uncertainty about motives, self-understanding, and what people owe one another.

The central value is the writing and the player's participation in it. Software exists to preserve disclosure order, remember decisions, make revisits meaningful, and keep the reading experience dependable. A reusable engine is useful; a general-purpose content platform is not the first product.

The final setting and plot are developed in N0–N2 of the production plan. That work must yield a locked causal story before full-case implementation. The earlier administrative memory mechanism is retired.

## 2. Goals

G01. Create an original completed narrative that invites close reading without requiring a lore encyclopedia.

G02. Make the player participate through speech, action, attention, disclosure, and refusal. The experience must not be a novel broken into arbitrary Continue buttons.

G03. Recontextualize earlier material fairly. At least one complete opening-to-ending return must be demonstrated in the first release. This is a functional demonstration, not a symbolic quota.

G04. Distinguish factual reconstruction from judgments about people. A mechanically supported deduction must not award a correct moral opinion.

G05. Support consequences and lost optional opportunities without accidental plot softlocks. A relationship is not a progress bar.

G06. Deliver readable, accessible, interruption-tolerant play with trustworthy saves, offline play after installation, and no paid runtime API.

G07. Provide a minimal authoring workspace sufficient to inspect and revise the actual game. Expand into a full studio only after the game works and its prose has received substantive revision.

G08. Report evidence of actual tests and unresolved editorial concerns without self-certifying literary greatness.

G09. Investigate Kant and Spinoza substantially and accurately, and make the resulting questions consequential in the actual story. Do not equate a solved factual mystery with a certified moral doctrine.

G10. Establish provenance-based readable names and highly individual, variable voices that survive multiple encounters and later revision.

G11. Support persistent author-side state, accepted baselines, and safe continuation across actual authorized sessions. No automatic creation of future chats is assumed.

## 3. Audience and scope budget

The primary player is willing to read and enjoys character complexity, humor, unsettling implications, and discovery. They need not be experienced with adventure-game conventions. They should be able to leave and resume without forgetting every unresolved lead.

Planning envelope: one compact district or comparably connected setting, roughly five to seven recurring major characters, a few supporting appearances, and a first-route duration around two to four hours. A total authored-text budget around 25,000–40,000 words across branches is a ceiling for initial planning, not a completion target. Do not pad or cut a strong scene to obey a speculative number.

A first 15–25 minute slice tests the voice and interaction. A complete shorter release is preferable to an unfinished long one, but do not label a slice the complete game. Report actual content, reachable routes, and human playtime observations separately.

No 3D movement, combat, procedural plot, live AI dialogue, mandatory voice acting, real-time deadlines, inventory-combination maze, player accounts, telemetry, multiplayer, or public deployment requirement. No 24-skill imitation of another game. No full visual node editor before the first playable narrative.

## 4. Product milestones

| Gate | Deliverable | What does not satisfy it |
| --- | --- | --- |
| L0: literary proof | Two opening approaches, a selected and revised scene, a coherent human conflict, independent critique | A list of themes or a worldbuilding bible |
| M0: engine foundation | A tiny original fixture proves choices, observations, reinterpretation, state, save, reload | A landing page or empty editor |
| L1: story lock | Fixed history, protagonist, character relationships, disclosure map, ending consequences, route traces | An intriguing premise with an unexplained solution |
| M1: playable opening | Selected opening integrated with meaningful branches and a revisit | Polished prose pasted into a static page |
| M2: complete first draft | Entire story playable to genuine endings with no critical placeholders | A walkthrough describing scenes not implemented |
| M3: revised game | Dramatic, line, continuity, route, and accessibility repairs integrated | One agent saying the writing is excellent |
| M4: reliable package | Saves/recovery, release player, small author workspace, offline verification, honest handoff | Unit tests alone or an unauthorized deployment |

L0 and M0 may proceed in parallel. L1 also requires the revision-3 philosophy synthesis and voice/name gates. L1 precedes whole-story content implementation. Only generic engine work may expand before the story contract is locked.

## 5. Core player loop

Enter a place or continue a conversation. Read what happens. Choose an approach, action, or question. Record important observations unobtrusively. Follow a lead or return with a newly relevant detail. Experience the response to what you previously said or did. Resolve enough of the factual situation to make an informed consequential choice.

Not every scene contains a deduction. A meal, repair, rehearsal, walk, or failed conversation can be substantial gameplay when it changes the player's options or understanding. Do not require constant rewards to justify quiet scenes.

## 6. Functional requirements

### FR-START: begin and resume

Provide New game, Continue when a valid save exists, Load/export/import, Settings, Credits, and an optional plain content note. New game must not overwrite another run. The opening establishes an immediate situation before teaching a notebook interface.

Explain controls through the first actual interaction. Do not open with lore, skill selection, administrative forms, or a long rules tutorial. Offer an accessible controls/help view separately.

### FR-READ: prose and transcript

Use semantic HTML with adjustable text size, comfortable line length, clear paragraph spacing, and an instant-text option. Text must never require timed clicking. The player can reopen the transcript for the current scene and previously visited scenes with their actually seen variants.

Each displayed literary block has a stable ID, content version, speaker if any, and the context in which it appeared. Store the shown variant; do not regenerate or silently substitute a revised state-dependent sentence during reload. Revisits may add new text, but prior text remains inspectable.

Keep the current reading position across notebook use and save/reload. Avoid resetting scroll when a quiet state flag changes. New content announcements must not cause a screen reader to recite the entire scene again.

### FR-CHOICE: meaningful action

A choice label must faithfully communicate what the protagonist will say or do. Spoken choices show the actual sentence or an unmistakably descriptive action. Selecting a courteous label may not secretly produce an insult.

Support questions, statements, physical actions, deliberate silence, leaving, and guarded evidence presentation through one authored choice model. Do not force every encounter to offer every type.

Store the choice as an event. Authored consequences may change later dialogue, cooperation, available shared actions, or which people attend an ending. They must not change immutable history or retrospectively remove acquired observations.

For irreversible disclosure or major final action, show a brief confirmation that names the action without leaking its outcome. Routine dialogue needs no confirmation. A stale confirmation must not authorize a changed action.

### FR-DIALOGUE: conversation under changing knowledge

The same person can respond differently according to the current situation, what they have heard, and what the protagonist has already done. Every conditional response must specify its source knowledge. NPCs cannot know a private event merely because the player knows it.

Separate a character's beliefs from statements and from author truth. A lie requires motive and opportunity; a sincere mistake requires a plausible basis. Do not label either for the player through omniscient interface tags.

Avoid exhaustive topic-menu conversations by default. Present authored next actions and relevant optional questions. Repeated questions may receive a short acknowledgement instead of looping full exposition. A leave option must remain available unless the actual scene justifies a clearly signaled commitment.

### FR-ATTENTION: interior point of view

Use authored, conditionally available interior observations. They may reflect prior choices or history, but are not supernatural truth detectors. Mark interior thought consistently through typography and optional attribution without multiplying intrusive UI panels.

No large inner-voice system is required. A later extension must demonstrate that it creates distinct play rather than a running commentary that explains each scene. Mechanics must not impose a psychiatric diagnosis on the protagonist by accident.

### FR-NOTE: notebook and known leads

Keep a lightweight notebook with observed events, statements heard, unresolved questions, accepted factual conclusions, and optional player notes. The default reading screen remains the scene. The notebook may be a drawer or separate view with restored focus and reading position.

Differentiate "what you saw," "what they said," and "your current reading." Do not present every interpretation as an objective fact. Preserve provenance and exact earlier wording where it matters.

Search only acquired material. Unknown titles, future characters, location labels, accessible names, and snippets must not leak through search, notifications, empty states, or URL routes. Player notes never become automatically confirmed truth.

### FR-INTERPRET: conclusions and changed readings

Use explicit proof-backed questions only for factual conclusions that need mechanical verification. Candidate statements and selectable observations must be visible under appropriate knowledge conditions. Test valid alternative proof routes; do not demand a hidden single phrasing.

Separately support interpretive commitments through ordinary choices and finite authored flags. They do not have a correct-answer score. A factual discovery may undermine a previous commitment without deleting it from the transcript.

A later revelation may unlock a return question or action while appending an interpretation to the earlier clue. It may not replace the clue's literal content. Do not let selecting every notebook item bypass actual support rules.

### FR-PLACE: navigation and revisits

Represent a compact setting with a readable location list and an optional restrained map. Both provide equivalent access. No pixel hunt, mandatory dragging, or tiny hidden hotspot.

Unlock locations through encountered leads, not unexplained appearance in a menu. Show a known but unavailable location only when its name and current obstacle are legitimately known. Direct navigation to a locked scene must fail without exposing its contents.

Revisits can preserve ordinary work, alter behavior after a disclosure, or reveal a newly legible detail. Avoid resetting the room to its initial emotional state. A revisit should not automatically restate all previously acquired information.

### FR-CONSEQUENCE: failure and ending

A failed approach should produce a specific reaction or changed situation. It need not reward the same information as success. Required investigation routes must remain recoverable through plausible authored alternatives; optional trust or intimacy may be lost after a clearly signaled choice.

Do not display good/evil meters or numerical relationship scores. Internal finite flags are implementation tools, not claims that a relationship is numerically understood.

The first release includes meaningfully distinct consequences, with at least two ending routes sufficient to prove choice persistence. Exact ending count belongs to L1, not a forced three-way philosophical menu. The true past stays the same. Endings show actions and aftermath rather than issuing a final lecture.

Protect a pre-ending checkpoint. Replaying an ending creates another branch without overwriting the completed branch. An unresolved personal question is acceptable; a missing required plot explanation is not.

### FR-HINT: help without interpretation theft

Offer escalating, optional help for genuine progression problems. First remind the player of a known unresolved question. Next indicate a known comparison or revisitable scene. An explicit reveal can supply a concrete next step after confirmation.

Hints may help establish factual events. They must not declare which moral opinion to hold or tell the player the correct emotional response. Track assisted questions separately from fiction state.

### FR-SAVE: durability and recovery

Autosave after accepted consequential events and at safe navigation points. Saved means the IndexedDB transaction committed. Preserve the latest valid checkpoints, detect corrupted or incompatible data, support export/import, and protect against stale-tab overwrites.

On storage failure, preserve an exportable in-memory run and show an honest persistent unsaved warning. Never silently reset the game or pretend a save succeeded. Do not imply browser storage survives all eviction; encourage optional exported backups without nagging.

### FR-OFFLINE: independent runtime

After a verified installation, the release player should work without network access. No runtime AI, analytics, remote fonts, compulsory login, or metered service. Cache required content and assets atomically enough to distinguish Ready from Partial/Failed.

Offer updates at a safe point, preserve a checkpoint, and check content compatibility before switching. The studio is a separate build; author notes and debugging controls do not ship as public player UI.

### FR-AUTHOR: the small writer workspace

Provide structured editing of scenes, choices, observations, conditions, and interpretations; validation with exact locations; a searchable text/relationship view; preview from known story states; and export/reimport.

Prioritize a text-centered workspace and readable dependency table. A node graph is optional after the game is complete. A raw JSON textarea alone is not the editor, but a sophisticated visual programming platform is unnecessary.

Preserve last-valid preview when a draft is broken. Show whether preview state is canonical or injected. Reference-aware rename and guarded deletion must prevent silent broken links. A second tiny scene/case must be creatable without changing TypeScript.

## 7. Visual and accessibility requirements

Use a scene-dominant literary layout, a restrained navigation area, legible dialogue choices, and optional static imagery. No generic dashboard card wall. System fonts are acceptable for the first slice. Bundle appropriately licensed custom fonts only for the application, never redistribute font files as standalone user deliverables.

Target WCAG 2.2 AA interface behavior. Provide keyboard-only completion, visible focus, appropriate headings/labels, sufficient measured contrast, 200% zoom, narrow-view reflow, reduced motion, persistent mute, and complete text equivalents for necessary imagery or sound. Automated testing is not a full conformance claim. [S09]

Test representative layouts at 1440×900, 1280×800, 390×844, and 320×740. Story text must remain readable rather than shrinking to preserve a desktop composition.

## 8. Nonfunctional targets

Use a pure deterministic engine and schema-validated content. For the target-sized game, aim for p95 engine decision/apply below 50 ms and ordinary scene interactions responding visibly within 100 ms on the recorded test environment. Measure storage separately; do not claim universal hardware performance.

Do not block text input with full-project validation. Run larger validation/exploration in a worker with cancellation. Record bundle size, first usable render, and worst observed scene/preview transitions before optimizing.

All imported text remains inert. Restrict assets to approved local paths. No arbitrary content-authored JavaScript, HTML execution, network requests, or filesystem access.

## 9. Success evidence

A player can complete the game, resume safely, understand the factual reconstruction, notice a changed reading on returning to an earlier scene, and experience consequences of a prior choice. Real readers' descriptions matter more than an invented literary score.

The implementation report separates automated tests, browser checks, independent model critique, and actual human playtesting. No result can be inferred merely from a task being assigned or a test file existing.

## 10. Extension backlog

Only after M4: a richer authoring graph, additional cases, audio expansion, optional native packaging, translations, more substantial role-play systems, and longer fiction. Do not introduce these to avoid revising the first game's weak scenes.
