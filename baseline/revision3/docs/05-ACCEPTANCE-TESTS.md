# Acceptance and review plan

These tests are requirements for the future implementation. They have not been run against a game in this package. The current packet's executed checks concern document structure, task dependencies, template syntax, and packaging only.

## 1. Reporting standard

For each test, record revision/content hash, environment, exact command or manual steps, outcome, and retained evidence. Use Passed, Failed, Blocked, Not run, or Inconclusive. A written test is not a passing result. A model's imagined player reaction is not human playtesting.

Full-route browser tests must use actual UI controls, engine, and storage. State injection is appropriate for isolated fixtures but must be labeled and cannot replace normal route tests.

## 2. Literary production gates

| ID | Review action | Required evidence |
| --- | --- | --- |
| AC-L01 | Inspect L0 outputs | Two genuinely different dramatic approaches, actual scenes, selected/revised opening, and passage-specific critique |
| AC-L02 | Inspect narrative premise and source history | No retired registry/identity-plate plot or renamed administrative equivalent |
| AC-L03 | Read major-character scenes without dossiers | Reviewer identifies wants and distinguishing behavior from actual lines; gaps are reported, not scored away |
| AC-L04 | Trace a central intellectual question | A lived conflict, serious challenge, and consequence exist; explanatory theme labels alone fail |
| AC-L05 | Read opening after each ending | Earlier text remains literally defensible and changed significance has support |
| AC-L06 | Compare integrated prose with reviewer edits | Lead makes documented choices; distinct voices and deliberate roughness are not normalized blindly |
| AC-L07 | Inspect story lock | Fixed chronology, knowledge limits, source paths, actual ending scenes, and representative routes exist |
| AC-L08 | Inspect final required scenes and branches | No critical placeholder dialogue, unwritten ending, or stage direction presented as finished prose |
| AC-L09 | Run narrative style checks and editorial review | Hard punctuation restriction enforced; candidate clichés reviewed with context; no automatic synonym cleanup |
| AC-L10 | Audit claims of excellence or approval | No fabricated human readers, owner approval, playtime results, or numeric masterpiece certification |

These are evidence gates for a serious production process. Passing them does not prove artistic greatness.

## 3. Player behavior

| ID | Setup and action | Required observable result |
| --- | --- | --- |
| AC-G01 | Complete tiny fixture, reload, revisit | Choices, transcript variants, observations, and consequences survive |
| AC-G02 | Observe an item, later learn a relevant fact | Original literal text remains unchanged; later interpretation and return action are separately available |
| AC-G03 | Choose two approaches to an encounter in separate runs | Exact offered action is honored; downstream scene behavior reflects the difference where authored |
| AC-G04 | Hear a private statement, speak to an uninformed NPC | NPC cannot know it until an actual disclosure event |
| AC-G05 | Change interpretation without new objective evidence | Subjective commitment changes; no false factual evidence is acquired |
| AC-G06 | Submit a factual conclusion through each valid proof route | All specified alternatives succeed; no hidden single-route requirement |
| AC-G07 | Submit correct claim with unsupported or unknown references | Safely rejected without fiction mutation or answer leakage |
| AC-G08 | Select every notebook item | Irrelevant extras cannot bypass support rules |
| AC-G09 | Return after a consequential disclosure | Relevant behavior changes without erasing earlier observations or dialogue |
| AC-G10 | Make a signaled relationship-damaging choice | Optional access may change; required story remains completable through authored plausible routes |
| AC-G11 | Request help at early/late states | Hints respect known material; explicit factual reveal requires confirmation; no moral answer is prescribed |
| AC-G12 | Search for hidden titles and use locked URLs | Unknown content does not appear in results, DOM labels, accessible names, or route previews |
| AC-G13 | Reopen transcript after state-dependent text changes | Previously shown variant is preserved under its original occurrence |
| AC-G14 | Open a major-action confirmation, change state/payload, submit | Old confirmation cannot authorize a different action |
| AC-G15 | Leave tab, change device clock, return | Fiction does not advance through wall-clock time |
| AC-G16 | Play all ending routes | Historical events agree; chosen actions and prior consequences differ visibly |
| AC-G17 | Revisit ending checkpoint and complete another branch | Original completed branch is preserved |
| AC-G18 | Remove images/audio from necessary clues | Full textual equivalents preserve the reasoning information |

## 4. Engine correctness

| ID | Test | Required result |
| --- | --- | --- |
| AC-E01 | Replay same commands against pinned bundle | Canonically equivalent consequential state and event sequence |
| AC-E02 | Freeze input state/content and dispatch | No mutation of source inputs or literal observations |
| AC-E03 | Repeat acquisition, choice, and committed command ID | Defined repeat behavior and no duplicated consequences |
| AC-E04 | Fuzz invalid IDs/types/enums/deep conditions | Bounded safe rejection, stable diagnostics, no arbitrary execution |
| AC-E05 | Test nested AND/OR factual proofs | Semantics preserved; malformed or empty proof rejected |
| AC-E06 | Trigger multiple new interpretations | Deterministic finite closure, no automatic moral judgment or submitted conclusion |
| AC-E07 | Project author truth, hidden beliefs, future text | Only permitted player material reaches normal UI |
| AC-E08 | Inspect engine dependencies | No DOM, network, storage, randomness, or wall clock |
| AC-E09 | Exhaust exploration budget | INCONCLUSIVE plus coverage/frontier, never an invented PASS |
| AC-E10 | Reproduce softlock fixture and valid ending trace | Failure is concrete; successful trace replays through actual engine |

## 5. Saves and content updates

### AC-S01: committed durability

Delay and abort a transaction around a consequential choice. Saved must not appear before commit. Reload recovers the previous committed revision. Any unsaved current state stays clearly marked and exportable.

### AC-S02: latest checkpoint corruption

Damage the latest checkpoint while retaining a valid older one. Load rejects the bad state, offers recovery, and preserves backups. It must not overwrite every copy with the damaged data.

### AC-S03: safe import

Import malformed, oversized, unknown-version, invalid-reference, and hostile-shaped data while a valid run exists. Validation must precede replacement. Original state stays loadable. A valid import requires explicit slot/overwrite selection.

### AC-S04: migration and historical transcript

Migrate each supported old save and inject parse, transformation, validation, and commit failures. Preserve the original. Previously shown text must still resolve correctly; unknown content hashes need a declared compatibility path or a clear refusal, not a silent restart.

### AC-S05: stale tabs

Open one run in two tabs. Test ownership takeover and a stale write with cross-tab notifications disabled. Transaction revision checks prevent lost updates independent of BroadcastChannel delivery.

### AC-S06: storage unavailable

Deny storage or simulate quota exhaustion. Show a persistent truthful warning, preserve exportable memory state, and require acknowledgement to continue unsaved. No infinite retries or false Saved label.

### AC-S07: export privacy and transfer

Export with and without notes, import into a fresh browser profile, and compare state. Include no credentials, machine paths, environment variables, or hidden analytics IDs. Notes are optional.

### AC-S08: protected ending branches

Finish two endings from the same protected checkpoint. Both remain available with correct parent metadata; the common history matches and disposition effects remain separate.

## 6. Author workspace

| ID | Test | Required result |
| --- | --- | --- |
| AC-A01 | Edit prose, choice, guard, and observation through controls | Actual compiled preview changes without TypeScript edits |
| AC-A02 | Add alternative factual support route | OR semantics survive export/reimport and work in the engine |
| AC-A03 | Rename/delete referenced ID | Reference-aware update or clear repair/cancel; no dangling link |
| AC-A04 | Make draft invalid | Exact diagnostics; preview clearly labeled last-valid |
| AC-A05 | Export/reimport project | Canonical prose, conditions, provenance, and author annotations retained appropriately |
| AC-A06 | Create a second tiny fixture from UI | It compiles and plays without source edits |
| AC-A07 | Inject author-preview state | Noncanonical label; separate storage; no player Continue/export contamination |
| AC-A08 | Start and cancel large validation | Editor remains responsive; cancelled work cannot report success |

## 7. Offline, access, and security

| ID | Test | Required result |
| --- | --- | --- |
| AC-X01 | Complete a required route using keyboard only | Every action reachable; visible focus and restored context |
| AC-X02 | Use 200% zoom, enlarged text, narrow viewport | No lost choices or horizontal reading trap |
| AC-X03 | Enable reduced motion and inspect announcements | Nonessential motion removed; status announced without whole-scene repetition |
| AC-X04 | Install, go offline, reload, play | Verified cached content works with no AI/API dependency |
| AC-X05 | Interrupt cache/install/update | Never claim Ready from partial assets; preserve active compatible run |
| AC-X06 | Block optional audio/autoplay | Complete playable experience remains; settings persist |
| AC-X07 | Inspect production network and assets | No telemetry, remote fonts, live-AI SDK, exposed author notes, or debug routes |
| AC-X08 | Render hostile notes/dialogue/imports | Text inert, asset traversal blocked, no code execution |
| AC-X09 | Inspect asset origin/license inventory | Every release asset accounted for; placeholders identified |
| AC-X10 | Compare offered dialogue choice and actual response | No misleading paraphrase that reverses the chosen intention |

## 8. Traceability

FR-READ maps to G01/G02/G13, S04, X01–X03. FR-CHOICE/FR-DIALOGUE map to G03/G04/G09/G14, X10. FR-ATTENTION maps to G05/E07. FR-NOTE maps to G07/G12/S07. FR-INTERPRET maps to G02/G05–G08/E05–E06. FR-PLACE maps to G09/G12/X01. FR-CONSEQUENCE maps to G10/G16–G17/S08. FR-HINT maps to G11. FR-SAVE maps to S01–S08. FR-OFFLINE maps to X04–X07. FR-AUTHOR maps to A01–A08. Creative direction maps to L01–L10 and requires actual editorial judgment beyond mechanical checks.

## 9. Release decision

M2 requires full factual routes, actual ending prose, and core save/reload. M3 requires integrated literary revision and actual UI review. M4 requires no unresolved blocker in durability, required access, runtime safety, or spoiler boundaries.

Real human readers should test interpretation and pacing when available. Record what they actually say and where they struggle. Do not substitute an agent-generated focus group. An implementation may be handed off with human testing explicitly Not run; it must not claim otherwise.

## Revision 3: Philosophy investigation

| ID | Check | Required evidence or result |
| --- | --- | --- |
| AC-P01 | Primary-source inspection | Claims in completed dossiers have inspected primary locations, translator/edition, and accurate quotation/paraphrase labels; planned reading is not reported as done. |
| AC-P02 | Kant distinctions | Research and fiction distinguish transcendental limits from ordinary missing evidence, and autonomy from arbitrary preference; intentional character errors are identified in author notes. |
| AC-P03 | Spinoza distinctions | Necessity, adequacy, striving, and affect are not collapsed into fatalism, clue-count omniscience, or a selfishness meter. |
| AC-P04 | Comparative disagreement | Synthesis records substantive differences and objections without a manufactured unified doctrine or unsupported consensus. |
| AC-P05 | Detection method | Hypothesis generation, explanatory appeal, and testing are distinguished; a satisfying story alone cannot certify a factual inference. |
| AC-P06 | Dramatic consequence | PHILOSOPHY-MAP links central questions to actual scenes, choices, and returns; source names and epigraphs alone do not satisfy the gate. |
| AC-P07 | Explicit thought and subtraction | At least one developed conversational experiment exists; removing philosopher labels preserves the problem; blanket anti-exposition editing has not erased all actual argument. |
| AC-P08 | Ending and player truth | Author history stays consistent across responses. No morality-correctness score, philosopher faction menu, or true-ending doctrine is silently introduced. |

## Revision 3: Naming and voice

| ID | Check | Required evidence or result |
| --- | --- | --- |
| AC-V01 | Naming provenance | Selected names follow the working historical-given/literary-family method with inspected provenance or a documented explicit exception; candidates and approved names remain distinct. |
| AC-V02 | Name usability and stability | Similar names and display forms are reviewed; a display-name change preserves stable IDs and does not reveal hidden character roles. |
| AC-V03 | Actual voice auditions | Major speakers have actual ordinary, pressured, and relational exchanges; a character adjective sheet alone fails. |
| AC-V04 | Shared dialogue | A shared scene demonstrates voices affecting one another rather than isolated monologues concatenated. |
| AC-V05 | Anonymous diagnosis | Balanced extracts remove easy identity tokens; reader guesses include uncertainty and textual reasons; confusing pairs are investigated without a numeric greatness threshold. |
| AC-V06 | Transfer and register | A speech-transfer experiment and relationship/pressure review distinguish speakers beyond catchphrases while permitting contextually ordinary shared wording. |
| AC-V07 | Caricature and cadence | Strong stylization does not depend on stereotype, permanent loudness, identical aphoristic endings, or a single occupational metaphor repeated everywhere. |
| AC-V08 | Exact continuity anchors | The accepted voice reference retains exact passages and revisions. Resumed editing compares them and explains intentional departures. |

## Revision 3: Continued iteration and handoff

| ID | Check | Required evidence or result |
| --- | --- | --- |
| AC-C01 | Honest working state | STATE/HANDOFF identify actual files, revision, next task, active/unknown owners, and real test evidence. Seed state is not treated as completed work. |
| AC-C02 | Single integration authority | Canonical prose has one lead owner and project integration one coordinator; concurrent assignments have distinct write surfaces and recorded baselines. |
| AC-C03 | Substantive iteration | A candidate was actually produced and reviewed against a specific target, then accepted/revised/rejected; a self-evaluation alone fails. |
| AC-C04 | Regression protection | Last accepted baseline is recoverable; affected scenes and checks are revisited; newer or smoother is not assumed better. |
| AC-C05 | Fresh-session continuation | Actual fresh-session recovery is reported only when performed with accessible files; otherwise label static completeness review and remaining gaps. |
| AC-C06 | Stale or missing context | Safe fault-injection copies reveal stale baselines, missing required files, and ambiguous ownership; no invented reconstruction or blind overwrite. |
| AC-C07 | Blind packet integrity | A blind reader cannot see future truth through filename, metadata, research notes, voice-card spoilers, or prompt contamination. |
| AC-C08 | Deadline and runtime honesty | Exact cutoff and allowance remain unknown unless verified. No unsupported automatic new chats, background workers, reset redemption, or paid continuation. |

G09 maps to AC-P01–P08; G10 to AC-V01–V08; G11 to AC-C01–C08. These are future implementation and editorial gates, not tests already passed by this specification.
