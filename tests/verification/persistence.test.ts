import { describe, expect, test, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { GameStore, slotKey } from '../../src/persistence/store';
import { applyChoice, confirmationFor, createGame, contentHash, validateContent, type GameState } from '../../src/engine/game';
import { fixtureContent } from '../../src/content/fixture';

function advance(state: GameState, choiceId: string): GameState {
  const result = applyChoice(fixtureContent, state, { id: `persist.${state.revision}`, choiceId, expectedRevision: state.revision });
  if (!result.ok) throw new Error(result.error.code);
  return result.state;
}
function open(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { const request = factory.open(name); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}
function editSlot(db: IDBDatabase, edit: (value: Record<string, unknown>) => Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('slots', 'readwrite'), store = tx.objectStore('slots'), request = store.get(slotKey(fixtureContent));
    request.onsuccess = () => { try { store.put(edit(request.result as Record<string, unknown>), slotKey(fixtureContent)); } catch (error) { tx.abort(); reject(error); } };
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
  });
}
function entries(db: IDBDatabase, store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => { const request = db.transaction(store, 'readonly').objectStore(store).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}

describe('independent IndexedDB failure/recovery verification (fake-indexeddb, not browser durability)', () => {
  test('aborted write retains the preceding committed state', async () => {
    const factory = new IDBFactory(), store = new GameStore(factory, 'verify-abort');
    const initial = createGame(fixtureContent), candidate = advance(initial, 'cup');
    expect(await store.save(fixtureContent, initial, 0)).toEqual({ ok: true, commit: 1 });
    const original = IDBObjectStore.prototype.put;
    const fault = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      const result = original.call(this, value, key);
      this.transaction.abort();
      return result;
    });
    const failed = await store.save(fixtureContent, candidate, 1); fault.mockRestore();
    expect(failed.ok).toBe(false);
    const loaded = await store.load(fixtureContent);
    expect(loaded.kind).toBe('loaded'); if (loaded.kind === 'loaded') { expect(loaded.commit).toBe(1); expect(loaded.state).toEqual(initial); }
    await store.close();
  });
  test('quota failure cannot replace a valid run and candidate remains exportable', async () => {
    const factory = new IDBFactory(), store = new GameStore(factory, 'verify-quota');
    const initial = createGame(fixtureContent), candidate = advance(initial, 'cup');
    await store.save(fixtureContent, initial, 0);
    const fault = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('Injected quota exhaustion', 'QuotaExceededError'); });
    const failed = await store.save(fixtureContent, candidate, 1); fault.mockRestore();
    expect(failed.ok).toBe(false); if (!failed.ok) expect(failed.code).toBe('quota');
    const loaded = await store.load(fixtureContent); expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') expect(loaded.state).toEqual(initial);
    expect(JSON.parse(JSON.stringify(candidate)).revision).toBe(1);
    await store.close();
  });
  test('parallel stale tabs cannot overwrite each other without cross-tab messages', async () => {
    const factory = new IDBFactory(), a = new GameStore(factory, 'verify-tabs'), b = new GameStore(factory, 'verify-tabs');
    const initial = createGame(fixtureContent), courtesy = advance(initial, 'ask-gently'), accusation = advance(initial, 'accuse');
    await a.save(fixtureContent, initial, 0); expect((await b.load(fixtureContent)).kind).toBe('loaded');
    const results = await Promise.all([a.save(fixtureContent, courtesy, 1), b.save(fixtureContent, accusation, 1)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok && result.code === 'conflict')).toHaveLength(1);
    const loaded = await a.load(fixtureContent); expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') { expect(loaded.commit).toBe(2); expect([courtesy, accusation]).toContainEqual(loaded.state); }
    await a.close(); await b.close();
  });
  test('corrupt current checksum recovers validated backup and retains exact damaged bytes', async () => {
    const factory = new IDBFactory(), name = 'verify-corrupt', store = new GameStore(factory, name);
    const initial = createGame(fixtureContent), candidate = advance(initial, 'cup');
    await store.save(fixtureContent, initial, 0); await store.save(fixtureContent, candidate, 1);
    const db = await open(factory, name);
    let damaged: Record<string, unknown> = {};
    await editSlot(db, slot => { damaged = { ...slot, current: { ...(slot.current as object), stateChecksum: 'broken-checksum' } }; return damaged; });
    const loaded = await store.load(fixtureContent);
    expect(loaded.kind).toBe('recovered');
    if (loaded.kind === 'recovered') expect(loaded.state).toEqual(initial);
    const retained = await entries(db, 'recovery');
    expect(retained.some(value => value && typeof value === 'object' && JSON.stringify((value as { previous?: unknown }).previous) === JSON.stringify(damaged))).toBe(true);
    db.close(); await store.close();
  });
  test('invalid same-version content/hash import does not replace saved progress', async () => {
    const factory = new IDBFactory(), store = new GameStore(factory, 'verify-invalid-import');
    const initial = createGame(fixtureContent); await store.save(fixtureContent, initial, 0);
    const hostile = JSON.parse(JSON.stringify(initial)); hostile.contentHash = 'unknown-hash'; hostile.flags = ['unearned'];
    const result = await store.save(fixtureContent, hostile, 1);
    expect(result.ok).toBe(false); if (!result.ok) expect(result.code).toBe('invalid');
    const loaded = await store.load(fixtureContent); if (loaded.kind === 'loaded') expect(loaded.state).toEqual(initial); else throw new Error(loaded.kind);
    expect(slotKey(fixtureContent)).toContain(contentHash(fixtureContent));
    await store.close();
  });
  test('a third older checkpoint survives corruption of current and two newer backups', async () => {
    const factory = new IDBFactory(), name = 'verify-three-backups', store = new GameStore(factory, name);
    let state = createGame(fixtureContent); const states = [state];
    await store.save(fixtureContent, state, 0);
    for (const choice of ['cup', 'ask-gently', 'return-worker', 'inspect-drain']) { state = advance(state, choice); states.push(state); await store.save(fixtureContent, state, states.length - 1); }
    const db = await open(factory, name);
    await editSlot(db, slot => {
      const backups = slot.backups as Record<string, unknown>[];
      expect(backups).toHaveLength(3);
      return { ...slot, current: { ...(slot.current as object), stateChecksum: 'bad' }, backups: backups.map((backup, i) => i < 2 ? { ...backup, stateChecksum: 'bad' } : backup) };
    });
    const loaded = await store.load(fixtureContent); expect(loaded.kind).toBe('recovered');
    if (loaded.kind === 'recovered') expect(loaded.state).toEqual(states[1]);
    db.close(); await store.close();
  });
  test('unknown text hash reports incompatibility and retains original slot/export', async () => {
    const factory = new IDBFactory(), store = new GameStore(factory, 'verify-changed-text');
    const initial = createGame(fixtureContent); await store.save(fixtureContent, initial, 0);
    const changed = validateContent({ ...fixtureContent, title: 'Same version, changed text' });
    if (!changed.ok) throw new Error(changed.errors.join('\n'));
    const loaded = await store.load(changed.value); expect(loaded.kind).toBe('incompatible');
    if (loaded.kind === 'incompatible') expect(JSON.parse(loaded.retained[0].json).state).toEqual(initial);
    const original = await store.load(fixtureContent); if (original.kind === 'loaded') expect(original.state).toEqual(initial); else throw new Error(original.kind);
    await store.close();
  });
  test('two ending archives preserve their common history and distinct dispositions', async () => {
    const checked = validateContent({ id: 'branch-sentinel', title: 'Noncanonical branch preservation', version: 1, start: 'start', scenes: [
      { id: 'start', title: 'Shared', paragraphs: ['Same known history.'], choices: [
        { id: 'a', label: 'Stay.', target: 'last', ending: true, relationship: { id: 'stay', text: 'You stayed.' } },
        { id: 'b', label: 'Leave.', target: 'last', ending: true, relationship: { id: 'leave', text: 'You left.' } },
      ] }, { id: 'last', title: 'Last', paragraphs: ['Same historical facts.'], choices: [] },
    ] });
    if (!checked.ok) throw new Error(checked.errors.join('\n'));
    const content = checked.value, initial = createGame(content), factory = new IDBFactory(), store = new GameStore(factory, 'verify-branches');
    const branch = (id: string) => { const base = { id: `branch.${id}`, choiceId: id, expectedRevision: 0 }; const result = applyChoice(content, initial, { ...base, confirmation: confirmationFor(initial, base) }); if (!result.ok) throw new Error(result.error.code); return result.state; };
    const a = branch('a'), b = branch('b');
    await store.save(content, initial, 0); await store.save(content, a, 1);
    await store.save(content, initial, 2, { archiveCurrent: true }); await store.save(content, b, 3);
    const archives = (await store.listArchives(content)).filter(item => item.ended);
    expect(archives).toHaveLength(2);
    const states = await Promise.all(archives.map(item => store.loadArchive(content, item.id)));
    expect(states).toContainEqual(a); expect(states).toContainEqual(b);
    for (const state of states) expect(state!.transcript.slice(0, initial.transcript.length)).toEqual(initial.transcript);
    await store.close();
    // Archive retention is tested. Explicit branchParent/runId metadata is not implemented.
  });
});
