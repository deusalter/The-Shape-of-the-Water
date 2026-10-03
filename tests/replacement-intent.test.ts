import { describe,expect,it,vi } from 'vitest';
import { IDBFactory,IDBObjectStore } from 'fake-indexeddb';
import { ReplacementIntent } from '../src/App';
import { fixtureContent } from '../src/content/fixture';
import { createGame } from '../src/engine/game';
import { GameStore } from '../src/persistence/store';
import { move } from './helpers';

describe('replacement intent survives failed saves',()=>{
  it.each([
    {kind:'restart',route:[],continued:'cup'},
    {kind:'import',route:['cup'],continued:'inspect-drain'},
    {kind:'archive branch',route:['cup','inspect-drain'],continued:'return-sink'},
  ])('archives the prior committed run after a failed $kind, continued unsaved play and retry through the shared controller policy',async({route,continued})=>{
    const store=new GameStore(new IDBFactory(),'replacement-intent-test'),intent=new ReplacementIntent();
    const original=move(move(createGame(fixtureContent),'cup'),'accuse');await store.save(fixtureContent,original,0);
    let candidate=createGame(fixtureContent);for(const choice of route)candidate=move(candidate,choice);intent.request();const replacement=intent.snapshot();
    const put=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(()=>{throw new DOMException('Injected full storage','QuotaExceededError');});
    try { expect(await store.save(fixtureContent,candidate,1,{archiveCurrent:intent.needsArchive(replacement)})).toMatchObject({ok:false,code:'quota'}); } finally {put.mockRestore();}
    // The player acknowledges unsaved mode and continues this replacement run.
    candidate=move(candidate,continued);expect(intent.needsArchive(intent.snapshot())).toBe(true);
    const retry=intent.snapshot(),saved=await store.save(fixtureContent,candidate,1,{archiveCurrent:intent.needsArchive(retry)});expect(saved.ok).toBe(true);if(saved.ok)intent.committed(retry);
    expect(intent.needsArchive(intent.snapshot())).toBe(false);const archives=await store.listArchives(fixtureContent);expect(archives).toHaveLength(1);expect(await store.loadArchive(fixtureContent,archives[0].id)).toEqual(original);
    await store.close();
  });
  it('does not clear a newer queued replacement when an earlier save succeeds',()=>{
    const intent=new ReplacementIntent(),ordinary=intent.snapshot();intent.request();const first=intent.snapshot();intent.request();const second=intent.snapshot();
    expect(intent.needsArchive(ordinary)).toBe(false);intent.committed(first);expect(intent.needsArchive(second)).toBe(true);intent.committed(second);expect(intent.needsArchive(second)).toBe(false);
  });
  it('discards abandoned replacement intent when the player explicitly reloads committed progress',()=>{
    const intent=new ReplacementIntent();intent.request();expect(intent.needsArchive(intent.snapshot())).toBe(true);intent.discard();expect(intent.needsArchive(intent.snapshot())).toBe(false);intent.request();expect(intent.needsArchive(intent.snapshot())).toBe(true);
  });
});
