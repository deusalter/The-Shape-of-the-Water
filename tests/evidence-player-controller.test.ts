import { describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { EvidencePlayerController } from '../src/components/EvidencePlayer';
import { EvidenceStore } from '../src/persistence/evidence-store';
import { GameStore } from '../src/persistence/store';
import { evidenceFixture as content } from '../src/engine/evidence-fixture';
import { fixtureContent as legacy } from '../src/content/fixture';
import { createGame } from '../src/engine/game';
import { createGameV2, exportPortableV2, importPortableV2, projectPlayerV2, validateContentV2, type ContentV2, type MigrationManifestV2, type ReplayContextV2 } from '../src/engine/evidence-v2';
import { contentHash, stateHash } from '../src/engine/hash';
import { move } from './helpers';
import { slotKey } from '../src/persistence/checkpoint-store';

let database = 0;
function setup(value: ContentV2 = content, context?: ReplayContextV2, factory = new IDBFactory(), name = `controller-${++database}`, owner = 'tab-a') {
  const store = new EvidenceStore(factory, name, context);
  let id = 0;
  const controller = new EvidencePlayerController(value, store, context, () => `${owner}.command.${id++}`, owner);
  return { controller, store, factory, name };
}
async function choose(controller: EvidencePlayerController, choiceId: string) {
  const pending = controller.requestAction({ type: 'choose', choiceId });
  if (pending) pending.run();
  await controller.idle();
}
async function physical(controller: EvidencePlayerController) {
  await choose(controller, 'test-rinse'); await choose(controller, 'return-sink');
}
async function prove(controller: EvidencePlayerController) {
  controller.requestAction({ type: 'submitDeduction', questionId: 'ring-account', candidateId: 'rinsing', selectedRefs: ['ring', 'rinse'] });
  await controller.idle();
}
function quota() { return vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('Injected full storage', 'QuotaExceededError'); }); }
async function committed(store: EvidenceStore, value: ContentV2 = content) { const result = await store.load(value); if (result.kind !== 'loaded') throw new Error(`Unexpected load ${result.kind}`); return result; }
async function storedRecords(factory: IDBFactory, name: string) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = factory.open(name); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  return new Promise<Record<string, { key: IDBValidKey; value: unknown }[]>>((resolve, reject) => {
    const names = ['slots', 'recovery', 'archives'], tx = db.transaction(names), image: Record<string, { key: IDBValidKey; value: unknown }[]> = {};
    for (const name of names) { const object = tx.objectStore(name), keys = object.getAllKeys(), values = object.getAll(); values.onsuccess = () => { image[name] = values.result.map((value, index) => ({ key: keys.result[index], value })); }; }
    tx.oncomplete = () => { db.close(); resolve(image); }; tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function corruptCheckpoints(factory: IDBFactory, name: string) {
  const image = await storedRecords(factory, name), slot = structuredClone(image.slots.find(item => item.key === slotKey(content))!.value) as Record<string, unknown>;
  slot.current = { damaged: 'exact current bytes' }; slot.backups = [{ damaged: 'first backup' }, { damaged: 'second backup' }]; slot.preEnding = { damaged: 'protected bytes' };
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = factory.open(name); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  await new Promise<void>((resolve, reject) => { const tx = db.transaction('slots', 'readwrite'); tx.objectStore('slots').put(slot, slotKey(content)); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
  return slot;
}

describe('actual v2 player controller', () => {
  it('offers explicit repair for the corrupt-owned-slot reproduction without automatically stealing ownership or replacing memory', async () => {
    const { controller, store, factory, name } = setup(); await controller.initialize(); await physical(controller);
    const earlier = controller.getSnapshot().game; controller.prepareRestart()!.run(); await controller.idle(); await physical(controller);
    const memory = controller.getSnapshot().game, portable = controller.exportRun(), metadata = await store.getRunMetadata(content), owner = await store.getOwnership(content);
    await corruptCheckpoints(factory, name); await controller.loadProgress();
    expect(controller.getSnapshot()).toMatchObject({ blocked: true, readOnly: false, repairRequired: true, unsavedAcknowledged: false });
    expect(controller.getSnapshot().game).toBe(memory); expect(controller.exportRun()).toBe(portable); expect(await store.getOwnership(content)).toEqual(owner);
    expect(controller.canAct()).toBe(false); expect(controller.prepareTakeover()).toBeNull();
    const before = await storedRecords(factory, name), preview = controller.prepareRepair()!;
    expect(preview.detail).toContain('2 accepted actions'); expect(preview.detail).toContain(projectPlayerV2(content, memory).passage.title);
    await controller.retrySaving(); expect(controller.getSnapshot().feedback?.code).toBe('repair-required'); expect(await storedRecords(factory, name)).toEqual(before);
    preview.run(); await controller.idle();
    expect(controller.getSnapshot()).toMatchObject({ blocked: false, readOnly: false, repairRequired: false, unsavedAcknowledged: false });
    expect(controller.getSnapshot().game).toBe(memory); expect(controller.exportRun()).toBe(portable); expect(controller.hasUnsavedProgress()).toBe(false);
    expect((await committed(store)).state).toEqual(memory); expect((await store.getRunMetadata(content))?.runId).not.toBe(metadata?.runId);
    expect(await store.getRunMetadata(content)).toMatchObject({ origin: 'new', parent: null });
    const after = await storedRecords(factory, name); expect(after.archives).toEqual(before.archives); expect(after.recovery).toEqual(expect.arrayContaining(before.recovery));
    const archive = (await store.listArchives(content))[0]; expect(await store.loadArchive(content, archive.id)).toEqual(earlier);
    const repairedOwner = await store.getOwnership(content); expect(repairedOwner?.ownerId).not.toBe(owner?.ownerId); expect(repairedOwner!.epoch).toBeGreaterThan(owner!.epoch);
    await choose(controller, 'cup'); expect((await committed(store)).state).toEqual(controller.getSnapshot().game);
    const formerIdentity = setup(content, undefined, factory, name, 'tab-a'); await formerIdentity.controller.initialize(); expect(formerIdentity.controller.getSnapshot().readOnly).toBe(true);
    await store.close(); await formerIdentity.store.close();
  });
  it('binds repair confirmation to the exact in-memory state and requires a new preview after unsaved play', async () => {
    const { controller, store, factory, name } = setup(); await controller.initialize(); await corruptCheckpoints(factory, name); await controller.loadProgress();
    const before = await storedRecords(factory, name), preview = controller.prepareRepair()!;
    controller.acknowledgeUnsaved(); await choose(controller, 'cup'); const memory = controller.getSnapshot().game;
    preview.run(); await controller.idle(); expect(controller.getSnapshot().feedback?.code).toBe('changed');
    expect(controller.getSnapshot().game).toBe(memory); expect(await storedRecords(factory, name)).toEqual(before);
    const fresh = controller.prepareRepair()!; expect(fresh.detail).toContain('1 accepted actions'); fresh.run(); await controller.idle();
    expect((await committed(store)).state).toEqual(memory); fresh.run(); expect(controller.getSnapshot().feedback?.code).toBe('changed'); await store.close();
  });
  it('conflicts when another document repairs after the preview, retaining memory until a verified load is chosen', async () => {
    const { controller, store, factory, name } = setup(); await controller.initialize(); await choose(controller, 'cup'); await corruptCheckpoints(factory, name); await controller.loadProgress();
    const memory = controller.getSnapshot().game, preview = controller.prepareRepair()!, raw = (await storedRecords(factory, name)).slots[0].value as { commit: number };
    const other = new EvidenceStore(factory, name), alternate = createGameV2(content);
    const repair = await other.repairAndTakeOwnership(content, alternate, raw.commit, 'other-repair'); expect(repair.ok).toBe(true);
    const repairedBytes = await storedRecords(factory, name); preview.run(); await controller.idle();
    expect(controller.getSnapshot()).toMatchObject({ blocked: true, repairRequired: true, unsavedAcknowledged: false });
    expect(controller.getSnapshot().notice).toContain('changed'); expect(controller.getSnapshot().game).toBe(memory); expect(await storedRecords(factory, name)).toEqual(repairedBytes);
    await controller.loadProgress(); expect(controller.getSnapshot().game).toEqual(alternate); expect(controller.getSnapshot()).toMatchObject({ readOnly: true, repairRequired: false });
    expect(controller.prepareRepair()).toBeNull(); expect(controller.prepareTakeover()).not.toBeNull(); await store.close(); await other.close();
  });
  it('keeps exact memory and all stored bytes after failed repair, then saves newly confirmed unsaved continuation', async () => {
    const { controller, store, factory, name } = setup(); await controller.initialize(); await physical(controller); await corruptCheckpoints(factory, name); await controller.loadProgress();
    const memory = controller.getSnapshot().game, before = await storedRecords(factory, name), pending = controller.prepareRepair()!, original = IDBObjectStore.prototype.put;
    const fault = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) { if (this.name === 'slots') throw new DOMException('Injected full storage', 'QuotaExceededError'); return original.apply(this, args); });
    try { pending.run(); await controller.idle(); } finally { fault.mockRestore(); }
    expect(controller.getSnapshot()).toMatchObject({ blocked: true, repairRequired: true, unsavedAcknowledged: false }); expect(controller.getSnapshot().notice).toContain('full');
    expect(controller.getSnapshot().game).toBe(memory); expect(importPortableV2(content, controller.exportRun()).ok).toBe(true); expect(await storedRecords(factory, name)).toEqual(before);
    controller.acknowledgeUnsaved(); await choose(controller, 'cup'); const continued = controller.getSnapshot().game; expect(continued.revision).toBe(memory.revision + 1);
    const repair = controller.prepareRepair()!; repair.run(); await controller.idle(); expect(controller.getSnapshot().game).toBe(continued); expect((await committed(store)).state).toEqual(continued); await store.close();
  });
  it('persists and claims the initial checkpoint before allowing actions', async () => {
    const { controller, store } = setup();
    expect(controller.canAct()).toBe(false);
    await controller.initialize();
    expect(controller.canAct()).toBe(true);
    expect((await committed(store)).state.revision).toBe(0);
    expect(await store.getOwnership(content)).toEqual({ ownerId: 'tab-a', epoch: 1 });
    expect(controller.hasUnsavedProgress()).toBe(false);
    await store.close();
  });
  it('serializes rapid accepted actions with the current ownership receipt and saves the latest exact state', async () => {
    const { controller, store } = setup(); await controller.initialize();
    controller.requestAction({ type: 'choose', choiceId: 'test-rinse' });
    controller.requestAction({ type: 'choose', choiceId: 'return-sink' });
    await controller.idle();
    expect((await committed(store)).state).toEqual(controller.getSnapshot().game);
    expect(controller.getSnapshot()).toMatchObject({ blocked: false, saving: false, notice: 'Progress saved in this browser.' });
    expect(controller.getSnapshot().game.revision).toBe(2);
    await store.close();
  });
  it('keeps rejected factual feedback accessible in status without changing or saving the fiction', async () => {
    const { controller, store } = setup(); await controller.initialize(); await physical(controller);
    const before = controller.getSnapshot().game, saved = await committed(store);
    controller.requestAction({ type: 'submitDeduction', questionId: 'ring-account', candidateId: 'rinsing', selectedRefs: ['ring'] });
    await controller.idle();
    expect(controller.getSnapshot().feedback).toMatchObject({ code: 'premature' });
    expect(controller.getSnapshot().game).toBe(before);
    expect((await committed(store)).commit).toBe(saved.commit);
    controller.requestAction({ type: 'submitDeduction', questionId: 'ring-account', candidateId: 'rinsing', selectedRefs: ['worker-private'] });
    expect(controller.getSnapshot().feedback?.message).not.toMatch(/PRIVATE|rinse|film|rinsing/);
    expect(controller.exportRun()).not.toContain('PRIVATE_NPC');
    await prove(controller);
    expect(controller.getSnapshot().feedback?.message).toContain('supports');
    expect((await committed(store)).state.deductions).toHaveLength(1);
    await store.close();
  });
  it('previews a reveal without applying it and rejects a stale confirmation', async () => {
    const { controller, store } = setup(); await controller.initialize();
    const pending = controller.requestAction({ type: 'requestHint', hintId: 'film-reveal' });
    expect(pending?.detail).toContain('reveals evidence');
    expect(controller.getSnapshot().game.sources.map(source => source.id)).toEqual(['ring']);
    await choose(controller, 'cup'); pending!.run();
    expect(controller.getSnapshot().feedback?.code).toBe('stale-command');
    expect(controller.getSnapshot().game.sources.map(source => source.id)).toEqual(['ring']);
    const current = controller.requestAction({ type: 'requestHint', hintId: 'film-reveal' }); current!.run(); await controller.idle();
    expect(controller.getSnapshot().game.sources.map(source => source.id)).toEqual(['ring', 'film']);
    expect(controller.getSnapshot().game.deductions).toEqual([]);
    await store.close();
  });
  it('does not write a duplicate command a second time', async () => {
    const { controller, store } = setup(); await controller.initialize();
    const command = { type: 'choose' as const, id: 'exact-command', expectedRevision: 0, choiceId: 'cup' };
    controller.dispatch(command); await controller.idle(); const saved = await committed(store);
    controller.dispatch(command); await controller.idle();
    expect((await committed(store)).commit).toBe(saved.commit);
    expect(controller.getSnapshot().game.revision).toBe(1);
    await store.close();
  });
  it('retains exact protected-ending lineage and completed archives when branching', async () => {
    const { controller, store } = setup(); await controller.initialize(); await physical(controller); await prove(controller);
    const parent = controller.getSnapshot().game, metadata = await store.getRunMetadata(content);
    const closing = controller.requestAction({ type: 'choose', choiceId: 'finish' });
    expect(controller.getSnapshot().game.ended).toBe(false);
    closing!.run(); await controller.idle();
    expect(controller.getSnapshot().game.ended).toBe(true);
    expect(controller.getSnapshot().protectedCheckpoint).toEqual(parent);
    controller.prepareProtectedBranch()!.run(); await controller.idle();
    expect(controller.getSnapshot().game).toEqual(parent);
    expect(await store.getRunMetadata(content)).toMatchObject({ origin: 'branch', parent: { runId: metadata!.runId, revision: parent.revision, stateChecksum: stateHash(parent) } });
    expect((await store.listArchives(content)).some(item => item.ended)).toBe(true);
    await store.close();
  });
  it('preserves restart replacement intent through quota failure, acknowledged unsaved play and retry', async () => {
    const { controller, store } = setup(); await controller.initialize(); await physical(controller);
    const original = controller.getSnapshot().game;
    const restart = controller.prepareRestart()!;
    const fault = quota(); try { restart.run(); await controller.idle(); } finally { fault.mockRestore(); }
    expect(controller.getSnapshot()).toMatchObject({ blocked: true, unsavedAcknowledged: false });
    controller.requestAction({ type: 'choose', choiceId: 'cup' }); expect(controller.getSnapshot().game.revision).toBe(0);
    controller.acknowledgeUnsaved(); controller.requestAction({ type: 'choose', choiceId: 'cup' });
    expect(controller.getSnapshot().game.revision).toBe(1);
    expect((await committed(store)).state).toEqual(original);
    await controller.retrySaving();
    const archives = await store.listArchives(content);
    expect(archives).toHaveLength(1); expect(await store.loadArchive(content, archives[0].id)).toEqual(original);
    expect((await store.getRunMetadata(content))?.origin).toBe('restart');
    expect((await committed(store)).state).toEqual(controller.getSnapshot().game);
    await store.close();
  });
  it('preserves import origin after a failed replacement and continued unsaved play', async () => {
    const { controller, store } = setup(); await controller.initialize(); await physical(controller);
    const original = controller.getSnapshot().game, importAction = controller.prepareImport(exportPortableV2(createGameV2(content)))!;
    const fault = quota(); try { importAction.run(); await controller.idle(); } finally { fault.mockRestore(); }
    controller.acknowledgeUnsaved(); controller.requestAction({ type: 'choose', choiceId: 'cup' });
    await controller.retrySaving();
    expect((await store.getRunMetadata(content))?.origin).toBe('import');
    const archives = await store.listArchives(content); expect(archives).toHaveLength(1); expect(await store.loadArchive(content, archives[0].id)).toEqual(original);
    await store.close();
  });
  it('preserves an archive branch’s exact parent after quota failure and retry', async () => {
    const { controller, store } = setup(); await controller.initialize(); await physical(controller);
    const parent = controller.getSnapshot().game, parentMetadata = await store.getRunMetadata(content);
    controller.prepareRestart()!.run(); await controller.idle();
    const archive = (await store.listArchives(content))[0], branch = await controller.prepareArchive(archive.id);
    const fault = quota(); try { branch!.run(); await controller.idle(); } finally { fault.mockRestore(); }
    controller.acknowledgeUnsaved(); controller.requestAction({ type: 'choose', choiceId: 'cup' }); await controller.retrySaving();
    expect(await store.getRunMetadata(content)).toMatchObject({ origin: 'branch', parent: { runId: parentMetadata!.runId, revision: parent.revision, stateChecksum: stateHash(parent) } });
    expect(await store.loadArchive(content, archive.id)).toEqual(parent);
    await store.close();
  });
  it('abandons failed replacement intent only when verified committed progress is explicitly loaded', async () => {
    const { controller, store } = setup(); await controller.initialize(); await physical(controller);
    const original = controller.getSnapshot().game, metadata = await store.getRunMetadata(content), restart = controller.prepareRestart()!;
    const fault = quota(); try { restart.run(); await controller.idle(); } finally { fault.mockRestore(); }
    await controller.loadProgress(); expect(controller.getSnapshot().game).toEqual(original);
    await choose(controller, 'cup');
    expect((await store.getRunMetadata(content))?.runId).toBe(metadata!.runId);
    expect(await store.listArchives(content)).toEqual([]);
    await store.close();
  });
  it('validates imports before confirmation and detects changes while an import preview is open', async () => {
    const { controller, store } = setup(); await controller.initialize();
    const original = controller.getSnapshot().game;
    expect(controller.prepareImport('{broken')).toBeNull(); expect(controller.getSnapshot().game).toBe(original);
    const envelope = JSON.parse(controller.exportRun()); envelope.seen.sources.push({ text: 'invented' });
    expect(controller.prepareImport(envelope)).toBeNull(); expect(controller.getSnapshot().game).toBe(original);
    const valid = controller.prepareImport(controller.exportRun())!; await choose(controller, 'cup'); valid.run();
    expect(controller.getSnapshot().feedback?.code).toBe('changed');
    expect(controller.getSnapshot().game.revision).toBe(1);
    await store.close();
  });
  it('supports explicitly acknowledged in-memory play when storage is unavailable', async () => {
    const store = new EvidenceStore(undefined, 'unavailable-controller'), controller = new EvidencePlayerController(content, store, undefined, () => 'memory-command', 'memory-tab');
    await controller.initialize(); expect(controller.canAct()).toBe(false);
    controller.acknowledgeUnsaved(); expect(controller.canAct()).toBe(true); controller.requestAction({ type: 'choose', choiceId: 'cup' });
    expect(controller.getSnapshot().game.revision).toBe(1);
    expect(importPortableV2(content, controller.exportRun()).ok).toBe(true);
    expect(controller.getSnapshot().notice).not.toContain('Progress saved');
    await store.close();
  });
  it('keeps a second controller read-only until explicit takeover and rejects the old owner’s next save', async () => {
    const first = setup(), second = setup(content, undefined, first.factory, first.name, 'tab-b');
    await first.controller.initialize(); await choose(first.controller, 'cup'); await second.controller.initialize();
    expect(second.controller.getSnapshot().readOnly).toBe(true); expect(second.controller.canAct()).toBe(false);
    expect(second.controller.requestAction({ type: 'choose', choiceId: 'test-rinse' })).toBeNull();
    expect(second.controller.prepareRestart()).toBeNull();
    expect(second.controller.getSnapshot().game.revision).toBe(1);
    expect(second.controller.prepareTakeover()).not.toBeNull(); await second.controller.takeOver();
    expect(second.controller.canAct()).toBe(true); await choose(second.controller, 'test-rinse');
    const shared = await committed(second.store);
    await choose(first.controller, 'inspect-aside');
    expect(first.controller.getSnapshot().readOnly).toBe(true); expect(first.controller.canAct()).toBe(false);
    expect((await committed(second.store)).state).toEqual(shared.state);
    expect(importPortableV2(content, first.controller.exportRun()).ok).toBe(true);
    await first.store.close(); await second.store.close();
  });
  it('keeps a reloaded document read-only instead of silently stealing prior-session ownership', async () => {
    const first = setup(); await first.controller.initialize(); await choose(first.controller, 'cup');
    const reloaded = setup(content, undefined, first.factory, first.name, 'fresh-document'); await reloaded.controller.initialize();
    expect(reloaded.controller.getSnapshot().game).toEqual(first.controller.getSnapshot().game);
    expect(reloaded.controller.canAct()).toBe(false);
    expect(await reloaded.store.getOwnership(content)).toMatchObject({ ownerId: 'tab-a' });
    await first.store.close(); await reloaded.store.close();
  });
  it('preserves unsaved memory and the existing owner if explicit takeover hits quota failure', async () => {
    const first = setup(), second = setup(content, undefined, first.factory, first.name, 'tab-b');
    await first.controller.initialize(); await choose(first.controller, 'cup'); await second.controller.initialize();
    second.controller.acknowledgeUnsaved(); await choose(second.controller, 'inspect-aside');
    const memory = second.controller.getSnapshot().game, shared = await committed(first.store), owner = await first.store.getOwnership(content);
    const fault = quota(); try { await second.controller.takeOver(); } finally { fault.mockRestore(); }
    expect(second.controller.getSnapshot().game).toBe(memory);
    expect(second.controller.getSnapshot()).toMatchObject({ blocked: true, readOnly: true, unsavedAcknowledged: false });
    expect(await first.store.getOwnership(content)).toEqual(owner);
    expect((await committed(first.store)).state).toEqual(shared.state);
    expect(importPortableV2(content, second.controller.exportRun()).ok).toBe(true);
    await first.store.close(); await second.store.close();
  });
});

describe('actual controller migration preview', () => {
  function migrationFixture() {
    const raw = structuredClone(content); raw.id = legacy.id;
    const checked = validateContentV2(raw); if (!checked.ok) throw new Error(checked.errors.join('\n'));
    const target = checked.value, oldState = move(move(createGame(legacy), 'cup'), 'inspect-drain');
    const manifest: MigrationManifestV2 = { id: 'reviewed-controller-map', fromHash: contentHash(legacy), toHash: contentHash(target), sceneMap: { bench: 'bench', sink: 'sink', worker: 'worker', finish: 'finish' }, flagMap: { 'cup-seen': 'cup-seen', water: 'water' }, sourceMap: { ring: 'ring', rinse: 'rinse' }, disclosures: [] };
    const context: ReplayContextV2 = { legacyBundles: { [manifest.fromHash]: legacy }, manifests: { [manifest.id]: manifest } };
    return { target, oldState, manifest, context };
  }
  it('previews preserved old text/counts without adopting it, then explicitly saves a migration and retains the old slot', async () => {
    const { target, oldState, manifest, context } = migrationFixture(), factory = new IDBFactory(), name = `controller-migration-${++database}`, oldStore = new GameStore(factory, name);
    await oldStore.save(legacy, oldState, 0); const original = await oldStore.load(legacy);
    const { controller, store } = setup(target, context, factory, name); await controller.initialize();
    const item = controller.getSnapshot().incompatible[0], before = controller.getSnapshot().game;
    expect(controller.migrationOptions(item)).toHaveLength(1); controller.previewMigration(item, manifest.id);
    expect(controller.getSnapshot().game).toBe(before);
    const preview = controller.getSnapshot().migrationPreview!; expect(preview.sourceVersion).toBe(1);
    expect(projectPlayerV2(target, preview.state).sources).toHaveLength(2);
    expect(preview.state.transcript).toEqual(oldState.transcript);
    controller.prepareMigration()!.run(); await controller.idle();
    expect((await store.getRunMetadata(target))?.origin).toBe('migration');
    expect((await committed(store, target)).state.transcript).toEqual(oldState.transcript);
    expect(await oldStore.load(legacy)).toEqual(original);
    expect(controller.exportRun()).not.toMatch(/PRIVATE_NPC|npcState|UNSEEN_FILM/);
    await oldStore.close(); await store.close();
  });
  it('offers retained export without inventing migration when context is missing', async () => {
    const { target, oldState } = migrationFixture(), factory = new IDBFactory(), name = `no-migration-${++database}`, oldStore = new GameStore(factory, name);
    await oldStore.save(legacy, oldState, 0); const { controller, store } = setup(target, undefined, factory, name); await controller.initialize();
    const retained = controller.getSnapshot().incompatible[0]; expect(retained.json).toContain('Rinse water');
    expect(controller.migrationOptions(retained)).toEqual([]); controller.previewMigration(retained, 'uninstalled');
    expect(controller.getSnapshot().migrationPreview).toBeUndefined();
    expect(controller.getSnapshot().game.revision).toBe(0);
    expect((await oldStore.load(legacy)).kind).toBe('loaded');
    await oldStore.close(); await store.close();
  });
  it('retains migration intent after failed saving, continued unsaved v2 commands and retry', async () => {
    const { target, oldState, manifest, context } = migrationFixture(), factory = new IDBFactory(), name = `migration-retry-${++database}`, oldStore = new GameStore(factory, name);
    await oldStore.save(legacy, oldState, 0); const original = await oldStore.load(legacy);
    const { controller, store } = setup(target, context, factory, name); await controller.initialize();
    controller.previewMigration(controller.getSnapshot().incompatible[0], manifest.id);
    const pending = controller.prepareMigration()!, fault = quota();
    try { pending.run(); await controller.idle(); } finally { fault.mockRestore(); }
    expect(controller.getSnapshot().game.transcript).toEqual(oldState.transcript);
    controller.acknowledgeUnsaved(); await choose(controller, 'return-sink'); await controller.retrySaving();
    expect((await store.getRunMetadata(target))?.origin).toBe('migration');
    expect((await committed(store, target)).state.revision).toBe(3);
    expect(await oldStore.load(legacy)).toEqual(original);
    expect(importPortableV2(target, controller.exportRun(), context).ok).toBe(true);
    await oldStore.close(); await store.close();
  });
});
