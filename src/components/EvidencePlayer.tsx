import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  applyCommandV2, confirmationForV2, createGameV2, exportPortableV2,
  importPortableV2, projectPlayerV2, type CommandV2, type ContentV2,
  type GameStateV2, type LegacySeedV2, type ReplayContextV2,
} from '../engine/evidence-v2';
import { contentHash, stateHash } from '../engine/hash';
import { validateContent as validateLegacyContent, validateState as validateLegacyState } from '../engine/game';
import { isObject } from '../engine/validate';
import { EvidenceStore } from '../persistence/evidence-store';
import { ReplacementIntent } from '../persistence/replacement-intent';
import type { SaveOptions } from '../persistence/checkpoint-store';
import type { RunMetadata } from '../persistence/run-metadata';
import type { OwnershipReceipt } from '../persistence/ownership';
import { useOfflineStatus } from '../offline';
import { InvestigationNotebook, type InvestigationAction } from './InvestigationNotebook';
import { EncounterArt } from './EncounterArt';
import { ConfirmationDialog, download, type PendingAction } from './RunControls';
import './evidence-player.css';

type PlayerAction = InvestigationAction | { type: 'choose'; choiceId: string };
type RetainedRun = { id: string; contentVersion: unknown; contentHash: unknown; json: string };
interface Feedback { code: string; message: string; sequence: number }
interface MigrationPreview { state: GameStateV2; sourceVersion: number; manifestId: string }
interface PlayerStatus {
  game: GameStateV2; ready: boolean; saving: boolean; blocked: boolean; readOnly: boolean; repairRequired: boolean;
  unsavedAcknowledged: boolean; notice: string; feedback: Feedback | null;
  archives: { id: string; revision: number; ended: boolean }[];
  incompatible: RetainedRun[]; metadata?: RunMetadata;
  protectedCheckpoint?: GameStateV2; migrationPreview?: MigrationPreview;
}

const documentOwners = new Map<string, string>();
function documentOwner(scope = 'player') { let id = documentOwners.get(scope); if (!id) { id = crypto.randomUUID(); documentOwners.set(scope, id); } return id; }

/** Actual UI policy, shared with behavioral tests; fictional changes stay in the engine. */
export class EvidencePlayerController {
  private status: PlayerStatus;
  private listeners = new Set<() => void>();
  private commit = 0;
  private queue: Promise<void> = Promise.resolve();
  private pendingSaves = 0;
  private initialLoad: Promise<void> | undefined;
  private readonly replacement = new ReplacementIntent();
  private readonly context: ReplayContextV2 | undefined;
  private feedbackSequence = 0;
  private lastSavedHash: string | undefined;
  private ownership: OwnershipReceipt | undefined;
  private ownerId: string;
  constructor(
    readonly content: ContentV2,
    readonly persistence: EvidenceStore,
    context?: ReplayContextV2,
    private readonly commandId: () => string = () => crypto.randomUUID(),
    ownerId?: string,
  ) {
    this.ownerId = ownerId ?? documentOwner();
    this.context = context ? structuredClone(context) : undefined;
    this.status = { game: createGameV2(content), ready: false, saving: false, blocked: false, readOnly: false, repairRequired: false, unsavedAcknowledged: false, notice: 'Loading saved progress…', feedback: null, archives: [], incompatible: [] };
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.status;
  private update(change: Partial<PlayerStatus>) { this.status = { ...this.status, ...change }; for (const listener of this.listeners) listener(); }
  private feedback(code: string, message: string) { this.update({ feedback: { code, message, sequence: ++this.feedbackSequence } }); }
  private adopt(game: GameStateV2) { this.update({ game, migrationPreview: undefined, feedback: null }); }
  canAct() { return this.status.ready && ((!this.status.blocked && !!this.ownership) || this.status.unsavedAcknowledged); }
  hasUnsavedProgress() { return this.lastSavedHash !== stateHash(this.status.game); }
  initialize() { return this.initialLoad ??= this.loadProgress(); }
  async idle() { await this.queue; }
  acknowledgeUnsaved() { if (this.status.blocked) this.update({ unsavedAcknowledged: true }); }
  async refreshRunDetails() {
    const results = await Promise.allSettled([this.persistence.listArchives(this.content), this.persistence.getRunMetadata(this.content), this.persistence.loadProtectedCheckpoint(this.content)]);
    const change: Partial<PlayerStatus> = {};
    if (results[0].status === 'fulfilled') change.archives = results[0].value;
    if (results[1].status === 'fulfilled') change.metadata = results[1].value;
    if (results[2].status === 'fulfilled') change.protectedCheckpoint = results[2].value;
    this.update(change);
  }
  private async claim(takeOver = false) {
    const result = await this.persistence.claimOwnership(this.content, this.commit, this.ownerId, takeOver);
    if (result.ok) { this.commit = result.commit; this.ownership = result.ownership; this.update({ blocked: false, readOnly: false, unsavedAcknowledged: false }); return true; }
    this.ownership = undefined;
    this.update({ blocked: true, readOnly: result.code === 'conflict', unsavedAcknowledged: false, notice: result.message }); return false;
  }
  private async establishCheckpoint() {
    const previousOwner = await this.persistence.getOwnership(this.content);
    if (previousOwner && previousOwner.ownerId !== this.ownerId) { this.update({ blocked: true, readOnly: true, unsavedAcknowledged: false, notice: 'Another tab controls saving. This tab can read and export progress; explicitly take over to save.' }); return; }
    this.ownership = previousOwner;
    const generation = this.replacement.snapshot();
    const saved = await this.persistence.save(this.content, this.status.game, this.commit, { ...this.replacement.saveOptions(generation), ...(this.ownership ? { ownership: this.ownership } : {}) });
    if (!saved.ok) { this.update({ blocked: true, readOnly: saved.code === 'conflict', unsavedAcknowledged: false, notice: saved.message }); return; }
    this.commit = saved.commit; this.lastSavedHash = stateHash(this.status.game); this.replacement.committed(generation);
    if (await this.claim()) this.update({ notice: 'Progress saved in this browser.' });
  }
  async loadProgress() {
    this.update({ ready: false, notice: 'Loading saved progress…', migrationPreview: undefined });
    await this.queue;
    try {
      const loaded = await this.persistence.load(this.content);
      if (loaded.kind === 'loaded' || loaded.kind === 'recovered') {
        this.replacement.discard(); this.commit = loaded.commit; this.lastSavedHash = stateHash(loaded.state);
        this.adopt(loaded.state);
        this.update({ blocked: false, repairRequired: false, unsavedAcknowledged: false, incompatible: [], notice: loaded.kind === 'recovered' ? 'A verified earlier checkpoint was recovered. Damaged data was retained locally.' : 'Saved progress loaded.' });
        await this.claim();
      } else if (loaded.kind === 'empty') {
        this.commit = loaded.commit;
        this.update({ blocked: false, repairRequired: false, unsavedAcknowledged: false, incompatible: [], notice: 'No saved run for this exact text revision. Progress saves after accepted actions.' });
        await this.establishCheckpoint();
      } else if (loaded.kind === 'corrupt') {
        this.commit = loaded.commit; this.ownership = undefined; this.lastSavedHash = undefined;
        this.update({ blocked: true, readOnly: false, repairRequired: true, unsavedAcknowledged: false, incompatible: [], notice: 'The stored run has no verified checkpoint. Damaged data is retained; your current in-memory run can be explicitly saved through repair.' });
      } else if (loaded.kind === 'incompatible') {
        this.commit = 0;
        this.update({ blocked: false, repairRequired: false, unsavedAcknowledged: false, incompatible: loaded.retained, notice: loaded.message });
        await this.establishCheckpoint();
        if (!this.status.blocked) this.update({ notice: 'A new run for this text revision is saved. Earlier incompatible runs remain retained below.' });
      } else if (loaded.kind === 'error') {
        this.update({ blocked: true, unsavedAcknowledged: false, notice: loaded.message });
      }
    } catch {
      this.update({ blocked: true, unsavedAcknowledged: false, notice: 'Loading failed. Your active run remains in memory and can be exported.' });
    }
    await this.refreshRunDetails();
    this.update({ ready: true });
  }
  private saveProgress(next: GameStateV2, options?: SaveOptions) {
    if (options) this.replacement.request(options);
    const generation = this.replacement.snapshot();
    if (this.status.blocked) return;
    this.pendingSaves += 1; this.update({ saving: true });
    this.queue = this.queue.then(async () => {
      if (this.status.blocked) return;
      const saved = await this.persistence.save(this.content, next, this.commit, { ...this.replacement.saveOptions(generation), ...(this.ownership ? { ownership: this.ownership } : {}) });
      if (saved.ok) {
        this.replacement.committed(generation); this.commit = saved.commit; this.lastSavedHash = stateHash(next);
        this.update({ unsavedAcknowledged: false, notice: next === this.status.game ? 'Progress saved in this browser.' : 'An earlier checkpoint was saved; newer actions are still being saved.' });
        if (!this.ownership) await this.claim();
        await this.refreshRunDetails();
      } else { if (saved.code === 'conflict') this.ownership = undefined; this.update({ blocked: true, readOnly: saved.code === 'conflict', unsavedAcknowledged: false, notice: saved.message }); }
    }).catch(() => { this.update({ blocked: true, unsavedAcknowledged: false, notice: 'Saving failed. Your active run remains in memory; export it before closing.' }); }).finally(() => {
      this.pendingSaves -= 1; this.update({ saving: this.pendingSaves > 0 });
    });
  }
  async retrySaving() {
    await this.queue;
    if (this.status.repairRequired) { this.feedback('repair-required', 'No verified saved checkpoint remains. Preview and confirm repair with this in-memory run before saving.'); return; }
    if (this.status.readOnly) { this.feedback('read-only', 'Another tab controls saving. Export your unsaved actions before taking over and loading its latest checkpoint.'); return; }
    this.update({ blocked: false, unsavedAcknowledged: false }); this.saveProgress(this.status.game); await this.queue;
  }
  prepareTakeover(): PendingAction | null {
    if (!this.status.ready || this.status.saving || this.status.repairRequired) return null;
    return { label: 'Take over saving and load the latest checkpoint.', detail: 'This tab becomes the saving tab. Your current unsaved actions will be replaced by the latest committed run. Export them first if you want to keep them.', run: () => { void this.takeOver(); } };
  }
  async takeOver() {
    this.update({ ready: false }); await this.queue;
    try {
      const loaded = await this.persistence.load(this.content);
      if (loaded.kind !== 'loaded' && loaded.kind !== 'recovered') { this.update({ blocked: true, readOnly: true, notice: 'Load a verified checkpoint before taking over saving. Your current run remains exportable.' }); return; }
      const claimed = await this.persistence.claimOwnership(this.content, loaded.commit, this.ownerId, true);
      if (!claimed.ok) { this.update({ blocked: true, readOnly: true, unsavedAcknowledged: false, notice: claimed.message }); return; }
      this.commit = claimed.commit; this.ownership = claimed.ownership; this.lastSavedHash = stateHash(loaded.state); this.replacement.discard(); this.adopt(loaded.state);
      this.update({ blocked: false, readOnly: false, repairRequired: false, unsavedAcknowledged: false, notice: 'Saving taken over. The latest committed progress is loaded.' });
      await this.refreshRunDetails();
    } catch { this.update({ blocked: true, readOnly: true, unsavedAcknowledged: false, notice: 'Saving could not be taken over. Your current run remains exportable.' }); }
    finally { this.update({ ready: true }); }
  }
  prepareRepair(): PendingAction | null {
    if (!this.status.repairRequired || !this.status.ready || this.status.saving) return null;
    const candidate = this.status.game, expectedHash = stateHash(candidate), expectedCommit = this.commit;
    const view = projectPlayerV2(this.content, candidate), newOwnerId = crypto.randomUUID();
    return { label: 'Repair saving with the run currently shown.', detail: `This saves version ${view.contentVersion}, ${view.revision} accepted actions, at “${view.passage.title}”. Damaged stored data and existing archives are retained. This tab takes control of saving; no missing history is reconstructed.`, run: () => {
      if (!this.status.repairRequired || !this.status.ready || this.status.saving || this.commit !== expectedCommit || stateHash(this.status.game) !== expectedHash) { this.feedback('changed', 'The in-memory run or storage preview changed. Preview and confirm repair again.'); return; }
      this.update({ ready: false, saving: true, unsavedAcknowledged: false, notice: 'Repairing saving with the confirmed in-memory run…' });
      this.queue = this.queue.then(async () => {
        const result = await this.persistence.repairAndTakeOwnership(this.content, candidate, expectedCommit, newOwnerId);
        if (!result.ok) { this.update({ blocked: true, readOnly: false, repairRequired: true, unsavedAcknowledged: false, notice: result.message }); return; }
        for (const [scope, id] of documentOwners) if (id === this.ownerId) documentOwners.set(scope, result.ownership.ownerId);
        this.ownerId = result.ownership.ownerId; this.commit = result.commit; this.ownership = result.ownership; this.lastSavedHash = expectedHash; this.replacement.discard();
        this.update({ blocked: false, readOnly: false, repairRequired: false, unsavedAcknowledged: false, notice: 'Saving repaired. The exact confirmed in-memory run is saved; damaged data remains retained.' });
        await this.refreshRunDetails();
      }).catch(() => { this.update({ blocked: true, readOnly: false, repairRequired: true, unsavedAcknowledged: false, notice: 'Repair failed. Your in-memory run remains unchanged and exportable.' }); }).finally(() => { this.update({ ready: true, saving: false }); });
    } };
  }
  dispatch(command: CommandV2) {
    if (!this.canAct()) { this.feedback('paused', 'Acknowledge unsaved play or load saved progress before continuing.'); return; }
    const result = applyCommandV2(this.content, this.status.game, command);
    if (!result.ok) { this.feedback(result.error.code, result.error.message); return; }
    if (result.duplicate) return;
    this.adopt(result.state);
    if (result.feedback) this.feedback('recorded', result.feedback);
    this.saveProgress(result.state);
  }
  requestAction(action: PlayerAction): PendingAction | null {
    if (!this.canAct()) return null;
    const view = projectPlayerV2(this.content, this.status.game);
    const command = { ...action, id: this.commandId(), expectedRevision: view.revision } as CommandV2;
    const choice = action.type === 'choose' ? view.choices.find(choice => choice.id === action.choiceId) : undefined;
    const hint = action.type === 'requestHint' ? view.hintsAvailable.find(hint => hint.id === action.hintId) : undefined;
    if (choice?.ending || choice?.irreversible || hint?.reveals) {
      const confirmed = { ...command, confirmation: confirmationForV2(this.status.game, command) };
      return { label: choice?.label ?? hint!.label, detail: hint?.reveals ? 'This explicitly reveals evidence. It will be recorded in your encountered transcript.' : choice?.ending ? 'This action closes the run. Its transcript remains available, and a saved checkpoint can support another ending.' : 'This action cannot be undone within this run.', run: () => this.dispatch(confirmed) };
    }
    this.dispatch(command); return null;
  }
  private replacementAction(next: GameStateV2, options: SaveOptions, label: string, detail: string): PendingAction {
    const expectedHash = stateHash(this.status.game);
    return { label, detail, run: () => {
      if (!this.canAct() || this.status.saving || stateHash(this.status.game) !== expectedHash) { this.feedback('changed', 'The active run changed or saving became paused while this preview was open. Preview and confirm the action again.'); return; }
      this.adopt(next); this.saveProgress(next, options);
    } };
  }
  prepareRestart(): PendingAction | null {
    if (!this.canAct() || this.status.saving) return null;
    try { return this.replacementAction(createGameV2(this.content), { origin: 'restart' }, 'Start a new run.', 'The prior committed run will be archived after a successful save. Export any unsaved transcript first.'); }
    catch (error) { this.feedback('invalid', error instanceof Error ? error.message : 'A new run could not be created.'); return null; }
  }
  prepareImport(input: unknown): PendingAction | null {
    if (!this.canAct() || this.status.saving) return null;
    const checked = importPortableV2(this.content, input, this.context);
    if (!checked.ok) { this.feedback('invalid-import', `Run import rejected. ${checked.errors.join(' ')}`); return null; }
    const view = projectPlayerV2(this.content, checked.value);
    return this.replacementAction(checked.value, { origin: 'import' }, `Import this run with ${view.revision} accepted actions.`, `The captured passage is “${view.passage.title}”. The prior committed run will be archived after a successful save. Export unsaved progress first.`);
  }
  rejectImport(message: string) { this.feedback('invalid-import', message); }
  async prepareArchive(id: string): Promise<PendingAction | null> {
    if (!this.canAct() || this.status.saving) return null;
    this.update({ ready: false });
    try {
      const state = await this.persistence.loadArchive(this.content, id);
      if (!state) { this.feedback('invalid-archive', 'The archived run failed validation.'); return null; }
      return this.replacementAction(state, { branchFrom: { kind: 'archive', id } }, `Load the archived run with ${state.revision} actions.`, 'This starts a new branch from that exact checkpoint. The source archive is retained; the current committed run is archived after a successful save. Export unsaved progress first.');
    } catch { this.feedback('storage', 'The archived run could not be read. Your active run is unchanged.'); return null; }
    finally { this.update({ ready: true }); }
  }
  prepareProtectedBranch(): PendingAction | null {
    const state = this.status.protectedCheckpoint;
    if (!state || !this.canAct() || this.status.saving) return null;
    return this.replacementAction(state, { branchFrom: { kind: 'protected' } }, 'Return to the checkpoint before the ending.', 'This starts a new branch from the protected checkpoint. Your completed run and transcript remain archived. Export unsaved progress first.');
  }
  private legacyEnvelope(item: RetainedRun) {
    if (!this.context) throw new Error('No reviewed compatibility context is installed. Export the retained run for a compatible installation.');
    if (item.json.length > 10 * 1024 * 1024 || new TextEncoder().encode(item.json).byteLength > 10 * 1024 * 1024) throw new Error('The retained run exceeds the import limit.');
    const envelope: unknown = JSON.parse(item.json);
    if (!isObject(envelope) || Object.keys(envelope).length !== 5 || envelope.schemaVersion !== 1 || envelope.engineVersion !== 1 || envelope.kind !== 'encountered-run' || !isObject(envelope.state) || envelope.stateChecksum !== stateHash(envelope.state) || typeof envelope.state.contentHash !== 'string') throw new Error('This retained run is not a verified legacy export.');
    const hash = envelope.state.contentHash;
    const bundle = Object.hasOwn(this.context.legacyBundles, hash) ? this.context.legacyBundles[hash] : undefined;
    const legacy = validateLegacyContent(bundle);
    if (!legacy.ok || contentHash(legacy.value) !== hash) throw new Error('The exact legacy text revision is not installed. Keep the retained export.');
    const state = validateLegacyState(legacy.value, envelope.state);
    if (!state.ok) throw new Error('The retained legacy transcript failed validation.');
    return state.value;
  }
  migrationOptions(item: RetainedRun): { id: string; label: string }[] {
    try {
      const legacy = this.legacyEnvelope(item);
      return Object.entries(this.context!.manifests).filter(([id, manifest]) => manifest.id === id && manifest.fromHash === legacy.contentHash && manifest.toHash === contentHash(this.content)).map(([id], index) => ({ id, label: `Preview reviewed migration from version ${legacy.contentVersion} to ${this.content.version}${index ? `, mapping ${index + 1}` : ''}` }));
    } catch { return []; }
  }
  previewMigration(item: RetainedRun, manifestId: string) {
    if (!this.canAct() || this.status.saving) return;
    try {
      const legacy = this.legacyEnvelope(item);
      if (!this.migrationOptions(item).some(option => option.id === manifestId)) throw new Error('No matching reviewed compatibility mapping is installed.');
      const manifest = this.context!.manifests[manifestId];
      const seed: LegacySeedV2 = { manifestId, manifestHash: stateHash(manifest), legacyState: legacy, legacyStateHash: stateHash(legacy) };
      const state = createGameV2(this.content, seed, this.context);
      this.update({ migrationPreview: { state, sourceVersion: legacy.contentVersion, manifestId } });
    } catch (error) { this.feedback('invalid-migration', error instanceof Error ? error.message : 'This run cannot be migrated. Its retained export remains available.'); }
  }
  prepareMigration(): PendingAction | null {
    const preview = this.status.migrationPreview;
    if (!preview || !this.canAct() || this.status.saving) return null;
    return this.replacementAction(preview.state, { origin: 'migration' }, `Migrate the reviewed version ${preview.sourceVersion} run to version ${this.content.version}.`, 'The old committed run remains intact. Encountered text is preserved; no earlier choice is treated as a submitted factual proof. Confirming saves this as the active run.');
  }
  exportRun() { return exportPortableV2(this.status.game); }
}

export interface EvidencePlayerProps { content: ContentV2; persistence?: EvidenceStore; context?: ReplayContextV2; preview?: boolean }
export function EvidencePlayer({ content, persistence, context, preview = false }: EvidencePlayerProps) {
  const InitializationContainer = preview ? 'div' : 'main';
  const [prepared] = useState(() => {
    try { return { controller: new EvidencePlayerController(content, persistence ?? new EvidenceStore(globalThis.indexedDB, preview ? 'literary-detective-studio-preview-v2' : 'literary-detective-v1', context), context, undefined, documentOwner(preview ? 'preview' : 'player')), error: undefined }; }
    catch (error) { return { controller: undefined, error: error instanceof Error ? error.message : 'The run could not be initialized.' }; }
  });
  if (!prepared.controller) return <InitializationContainer className="evidence-player initialization-error"><h1>Unable to open this text</h1><p role="alert">{prepared.error}</p><p>The supplied text exceeds or does not satisfy the supported runtime bounds.</p></InitializationContainer>;
  return <EvidencePlayerView controller={prepared.controller} preview={preview} />;
}

function EvidencePlayerView({ controller, preview }: { controller: EvidencePlayerController; preview: boolean }) {
  const ReadingContainer = preview ? 'div' : 'main';
  const status = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const view = projectPlayerV2(controller.content, status.game);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showNotebook, setShowNotebook] = useState(false), [textSize, setTextSize] = useState('normal');
  const heading = useRef<HTMLHeadingElement>(null);
  const offline = useOfflineStatus(preview, view.contentHash);
  const disabled = !controller.canAct();
  const lastPassage = view.transcript.filter(entry => entry.kind === 'passage').at(-1);
  useEffect(() => { void controller.initialize(); }, [controller]);
  useEffect(() => { if (lastPassage?.revision) heading.current?.focus(); }, [lastPassage?.revision]);
  function act(action: PlayerAction) { const pending = controller.requestAction(action); if (pending) setPendingAction(pending); }
  function confirm(action: PendingAction | null) { if (action) setPendingAction(action); }
  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { controller.rejectImport('Run import rejected. This file exceeds the 10 MiB import limit.'); return; }
    try { confirm(controller.prepareImport(await file.text())); }
    catch { controller.rejectImport('Run import rejected. The selected file could not be read. Your active run is unchanged.'); }
  }
  const migration = status.migrationPreview ? projectPlayerV2(controller.content, status.migrationPreview.state) : undefined;
  return <div className={`reader evidence-player reader-${textSize}`}>
    <a className="skip-link" href="#evidence-reading">Skip to the passage</a>
    <header className="site-header"><div><p className="eyebrow">{preview ? 'Studio preview · separate local saves' : 'A literary investigation'}</p><h1>{view.title}</h1></div><div className="reader-controls"><label>Text size<select value={textSize} onChange={event => setTextSize(event.target.value)}><option value="small">Small</option><option value="normal">Standard</option><option value="large">Large</option></select></label><button className="quiet" aria-expanded={showNotebook} aria-controls="investigation-notebook" onClick={() => setShowNotebook(!showNotebook)}>{showNotebook ? 'Close notebook' : 'Open notebook'}</button></div></header>
    <div className="investigation-feedback" role="status" aria-live="polite" aria-atomic="true">{status.feedback && <p key={status.feedback.sequence}>{status.feedback.message}</p>}</div>
    <ReadingContainer id="evidence-reading" className={`game-layout ${showNotebook ? '' : 'notebook-closed'}`}>
      <article className="passage-card" aria-labelledby="passage-title"><p className="eyebrow">{view.ended ? 'Closing passage' : `Accepted actions: ${view.revision}`}</p><h2 id="passage-title" ref={heading} tabIndex={-1}>{view.passage.title}</h2><EncounterArt sceneId={view.passage.sceneId} /><div className="prose">{view.passage.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <div className="choices" aria-label="Available actions">{view.choices.map(choice => <button key={choice.id} disabled={disabled} onClick={() => act({ type: 'choose', choiceId: choice.id })}>{choice.label}</button>)}</div>
        {view.ended && <p className="ending-note">This run has ended. Your encountered passages and notes remain available.</p>}
        {!view.ended && status.ready && view.choices.length === 0 && view.questions.length === 0 && <p className="warning">No actions or factual questions are available here. Export your run before starting again.</p>}
      </article>
      {showNotebook && <aside id="investigation-notebook" className="notebook" aria-label="Encountered notes"><p className="eyebrow">Your notebook</p><InvestigationNotebook content={controller.content} state={status.game} disabled={disabled} onAction={act} /></aside>}
      <section className="run-tools" aria-label="Run and transcript">
        <div className="save-status" role="status" aria-live="polite">{status.saving ? 'Saving progress…' : status.notice}</div>
        {status.blocked && <div className="warning"><p>{status.repairRequired ? 'No verified saved checkpoint remains. The run currently shown stays in memory until you explicitly repair saving.' : status.readOnly ? 'This tab is read-only because another tab or prior session controls saving. The active run remains exportable.' : 'Progress is unsaved. The active run remains exportable.'}</p>{status.repairRequired ? <button disabled={!status.ready || status.saving} onClick={() => confirm(controller.prepareRepair())}>Repair saving with this run</button> : status.readOnly && <button disabled={!status.ready || status.saving} onClick={() => confirm(controller.prepareTakeover())}>Take over saving</button>}{!status.unsavedAcknowledged ? <button onClick={() => controller.acknowledgeUnsaved()}>I understand. Continue without saving.</button> : <p>Continuing without saving. Export before closing this page.</p>}</div>}
        <p className="offline-status" role="status">{offline}</p>
        <div className="toolbar"><button className="quiet" disabled={!status.ready || status.saving} onClick={() => { if (controller.hasUnsavedProgress()) confirm({ label: 'Load the committed saved run.', detail: 'Unsaved actions in memory will be replaced. Export them first if you want to keep them.', run: () => { void controller.loadProgress(); } }); else void controller.loadProgress(); }}>Load saved progress</button><button className="quiet" disabled={!status.ready || status.saving || status.readOnly || status.repairRequired} onClick={() => { void controller.retrySaving(); }}>Retry saving</button><button className="quiet" onClick={() => download(`${view.contentId}-encountered-run.json`, controller.exportRun())}>Export encountered run</button><details className="restart"><summary>Start or import a run</summary><p>Successful replacement saves archive the prior committed run. Export unsaved progress first.</p><button disabled={disabled || status.saving} onClick={() => confirm(controller.prepareRestart())}>Start a new run</button><label className="file-label">Import encountered run<input disabled={disabled || status.saving} type="file" accept=".json,application/json" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} /></label></details></div>
        {status.incompatible.length > 0 && <details className="transcript"><summary>Retained runs from other text revisions ({status.incompatible.length})</summary><p>These runs remain intact. Migration is available only when an exact reviewed compatibility mapping is installed.</p>{status.incompatible.map((item, index) => <div className="retained-run" key={index}><button className="quiet" onClick={() => download(`${item.id}-retained-run.json`, item.json)}>Export retained run, version {String(item.contentVersion)}</button>{controller.migrationOptions(item).map(option => <button className="quiet" key={option.id} disabled={disabled || status.saving} onClick={() => controller.previewMigration(item, option.id)}>{option.label}</button>)}</div>)}</details>}
        {migration && status.migrationPreview && <section className="migration-preview" aria-label="Reviewed migration preview"><h3>Reviewed migration preview</h3><p>From version {status.migrationPreview.sourceVersion} to version {view.contentVersion}. Preserves {migration.sources.length} mapped encountered sources, {migration.interpretations.length} selected interpretations and {migration.relationships.length} interpersonal records. No factual submission is invented.</p><h4>{migration.passage.title}</h4>{migration.passage.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<button disabled={!status.ready || status.saving} onClick={() => confirm(controller.prepareMigration())}>Confirm reviewed migration</button></section>}
        {status.metadata?.parent && <p className="branch-note">This branch starts from the saved source run at action {status.metadata.parent.revision}. The source and completed endings remain archived.</p>}
        {view.ended && status.protectedCheckpoint && <button className="quiet" disabled={disabled || status.saving} onClick={() => confirm(controller.prepareProtectedBranch())}>Explore another ending</button>}
        <details className="transcript"><summary>Archived runs ({status.archives.length})</summary>{status.archives.length ? <ul>{status.archives.map(item => <li key={item.id}>{item.ended ? 'Completed run' : 'Earlier run'}, {item.revision} actions <button className="quiet" disabled={disabled || status.saving} onClick={() => { void controller.prepareArchive(item.id).then(confirm); }}>Load as a branch</button></li>)}</ul> : <p>No archived runs yet.</p>}</details>
        <details className="transcript"><summary>Help, content note and credits</summary><p>Tab moves between controls; Enter or Space activates a focused button. Open the notebook to select a factual claim and specific encountered evidence. A statement records what someone said. Supported factual conclusions stay separate from possible readings and interpersonal decisions.</p><p>Revisiting a scene appends another captured passage. The earlier text stays in your transcript. Revealing hints and consequential actions ask for confirmation.</p><p>Progress stays in this browser. Export a run for an independent copy. After a reload, or in another tab, choose Take over saving to continue from the latest committed checkpoint. A retained earlier revision can migrate only with an installed, reviewed mapping.</p><p>Content note: includes temporary confinement, a hand injury, and discussion of a parent’s death.</p><p>Original provisional project. Player software uses React, TypeScript and Vite. Authoring materials are provided in the separate studio.</p></details>
        <details className="transcript"><summary>Read encountered transcript ({view.transcript.filter(entry => entry.kind === 'passage').length} passages)</summary><div>{view.transcript.map((entry, index) => entry.kind === 'passage' ? <section key={index}><h3>{entry.title}</h3>{entry.paragraphs.map((paragraph, position) => <p key={position}>{paragraph}</p>)}</section> : <div className="chosen-action" key={index}><p>You chose: {entry.label}</p>{entry.kind === 'action' && entry.feedback && <p>{entry.feedback}</p>}</div>)}</div></details>
      </section>
    </ReadingContainer>
    <footer>Runs stay in this browser · No live AI is needed to play</footer>
    {pendingAction && <ConfirmationDialog action={pendingAction} cancel={() => setPendingAction(null)} />}
  </div>;
}
