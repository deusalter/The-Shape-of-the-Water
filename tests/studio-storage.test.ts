import { describe,expect,it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureContent } from '../src/content/fixture';
import { validateContent,type Content } from '../src/engine/game';
import { StudioDraftStore } from '../src/persistence/studio';

let sequence=0;
function setup() { const factory=new IDBFactory(),name=`studio-draft-test-${sequence++}`;return{factory,name,store:new StudioDraftStore(factory,name)}; }
async function inject(factory:IDBFactory,name:string,value:unknown) {
  const db:IDBDatabase=await new Promise((resolve,reject)=>{const request=factory.open(name,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try { await new Promise<void>((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(value,fixtureContent.id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}); } finally {db.close();}
}
describe('recoverable bounded studio drafts',()=>{
  it('recovers empty titles, paragraphs and choice labels after reopening while retaining the independently valid preview',async()=>{
    const{factory,name,store}=setup(),draft=structuredClone(fixtureContent);
    draft.title='';draft.scenes[0].title='';draft.scenes[0].paragraphs[0]='';draft.scenes[0].choices[0].label='';draft.version=0;
    expect(validateContent(draft).ok).toBe(false);
    await store.save(draft,fixtureContent);
    const reopened=new StudioDraftStore(factory,name),saved=await reopened.load(draft.id);
    expect(saved?.draft).toEqual(draft);expect(saved?.lastValid).toEqual(fixtureContent);expect(validateContent(saved?.lastValid).ok).toBe(true);expect(saved?.lastValid).not.toBe(saved?.draft);
  });
  it('preserves unfinished flag spelling and dangling graph edits without treating them as a playable preview',async()=>{
    const{store}=setup(),draft=structuredClone(fixtureContent);draft.scenes[0].choices[0].requires=['unfinished flag spelling'];draft.scenes[0].choices[0].target='not-created-yet';
    await store.save(draft,fixtureContent);const saved=await store.load(draft.id);expect(saved?.draft).toEqual(draft);expect(validateContent(saved?.draft).ok).toBe(false);expect(validateContent(saved?.lastValid).ok).toBe(true);
  });
  it('rejects unsupported saves before replacing a recoverable draft',async()=>{
    const{store}=setup(),draft=structuredClone(fixtureContent);draft.scenes[0].title='';await store.save(draft,fixtureContent);
    const unsupported={...draft,execute:'arbitrary script'} as unknown as Content;await expect(store.save(unsupported,fixtureContent)).rejects.toThrow('unsupported shape');
    const oversized=structuredClone(draft);oversized.scenes[0].paragraphs[0]='x'.repeat(50001);await expect(store.save(oversized,fixtureContent)).rejects.toThrow('limits');
    const invalidPreview=structuredClone(fixtureContent);invalidPreview.scenes[0].title='';await expect(store.save(draft,invalidPreview)).rejects.toThrow('preview');
    expect((await store.load(draft.id))?.draft).toEqual(draft);
  });
  it.each(['envelope-field','prototype-field','bad-version','wrong-project','invalid-preview'])('rejects dangerous or unsupported stored envelopes: %s',async(kind)=>{
    const{factory,name,store}=setup();await store.save(fixtureContent,fixtureContent);
    let envelope:any={schemaVersion:1,draft:structuredClone(fixtureContent),lastValid:structuredClone(fixtureContent)};
    if(kind==='envelope-field')envelope.execute='unsupported';
    if(kind==='prototype-field')envelope.draft=JSON.parse(JSON.stringify(envelope.draft).replace('{','{"__proto__":{"polluted":true},'));
    if(kind==='bad-version')envelope.schemaVersion=2;
    if(kind==='wrong-project')envelope.draft.id='a-different-project';
    if(kind==='invalid-preview')envelope.lastValid.scenes[0].choices[0].target='missing';
    await inject(factory,name,envelope);await expect(store.load(fixtureContent.id)).rejects.toThrow();expect(({} as Record<string,unknown>).polluted).toBeUndefined();
  });
});
