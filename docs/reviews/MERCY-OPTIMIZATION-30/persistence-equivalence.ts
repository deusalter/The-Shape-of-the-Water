import { writeFileSync } from 'node:fs';
import { IDBFactory } from '/workspace/literary-detective/node_modules/fake-indexeddb/build/esm/index.js';
import { CheckpointStore as PreviousStore } from 'baseline-store';
import { CheckpointStore as CurrentStore, slotKey } from '/workspace/literary-detective/src/persistence/checkpoint-store';
import { fixtureContent } from '/workspace/literary-detective/src/content/fixture';
import { createGame, validateState, serializePlayerExport, stateHash, canonicalJSON } from '/workspace/literary-detective/src/engine/game';
import { move } from '/workspace/literary-detective/tests/helpers';
const content=fixtureContent;
const states=[createGame(content)];
for(const id of ['cup','inspect-drain','return-sink','propose-rinse','finish-fixture'])states.push(move(states.at(-1)!,id));
const envelope=(state:any)=>({saveVersion:1,schemaVersion:1,engineVersion:1,contentHash:state.contentHash,stateChecksum:stateHash(state),state});
const oldRun={runId:'run-prior',origin:'new',parent:null};
function rawSlot(){return structuredClone({commit:20,current:envelope(states[4]),backups:[envelope(states[3]),envelope(states[2]),envelope(states[1])],preEnding:null,run:oldRun,checkpointRuns:states.map((s,i)=>({stateChecksum:stateHash(s),run:{runId:`run-old-${i}`,origin:'new',parent:null}}))});}
const cases:any[]=[
 {name:'mature-save',mutate:()=>{},state:states[4]},
 {name:'corrupt-first-backup',mutate:(r:any)=>{r.backups[0].stateChecksum='bad'},state:states[4]},
 {name:'corrupt-first-two-backups',mutate:(r:any)=>{r.backups[0].stateChecksum='bad';r.backups[1].stateChecksum='bad'},state:states[4]},
 {name:'recomputed-checksum-current-tamper',mutate:(r:any)=>{r.current.state.transcript[0].paragraphs[0]='tampered';r.current.stateChecksum=stateHash(r.current.state)},state:states[4]},
 {name:'recomputed-checksum-backup-tamper',mutate:(r:any)=>{r.backups[0].state.transcript[0].paragraphs[0]='tampered';r.backups[0].stateChecksum=stateHash(r.backups[0].state)},state:states[4]},
 {name:'corrupt-current',mutate:(r:any)=>{r.current.stateChecksum='bad'},state:states[4]},
 {name:'corrupt-current-and-first-backup',mutate:(r:any)=>{r.current.stateChecksum='bad';r.backups[0].stateChecksum='bad'},state:states[4]},
 {name:'all-corrupt',mutate:(r:any)=>{r.current.stateChecksum='bad';r.backups.forEach((b:any)=>b.stateChecksum='bad')},state:states[4]},
 {name:'protected-retention',mutate:(r:any)=>{r.preEnding=envelope(states[2])},state:states[4]},
 {name:'protected-corrupt',mutate:(r:any)=>{r.preEnding={...envelope(states[2]),stateChecksum:'bad'}},state:states[4]},
 {name:'ending-protection',mutate:()=>{},state:states[5]},
 {name:'replacement-import',mutate:()=>{},state:states[0],options:{archiveCurrent:true,origin:'import'}},
 {name:'protected-branch',mutate:(r:any)=>{r.preEnding=envelope(states[2])},state:states[2],options:{branchFrom:{kind:'protected'}}},
 {name:'invalid-protected-branch',mutate:(r:any)=>{r.preEnding=envelope(states[3])},state:states[1],options:{branchFrom:{kind:'protected'}}},
 {name:'missing-checkpoint-metadata',mutate:(r:any)=>{r.checkpointRuns=[]},state:states[4]},
 {name:'damaged-run-metadata',mutate:(r:any)=>{r.run={bad:true};r.checkpointRuns=[]},state:states[4]},
 {name:'ownership-rejection',mutate:(r:any)=>{r.ownership={ownerId:'owner-prior',epoch:2}},state:states[4]},
 {name:'ownership-accepted',mutate:(r:any)=>{r.ownership={ownerId:'owner-prior',epoch:2}},state:states[4],options:{ownership:{ownerId:'owner-prior',epoch:2}}},
];
async function run(Store:any,test:any){
 const factory=new IDBFactory();const runtime={schemaVersion:1,engineVersion:1,validateState,exportPortable:serializePlayerExport};
 const store=new Store(runtime,factory,'equivalence');await store.load(content);
 const db:any=await new Promise((resolve,reject)=>{const req=factory.open('equivalence',2);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
 const raw=rawSlot();test.mutate(raw);
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction('slots','readwrite');tx.objectStore('slots').put(raw,slotKey(content));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});
 const result=await store.save(content,test.state,20,test.options);
 const contents=await new Promise((resolve,reject)=>{const tx=db.transaction(['slots','archives']);const slot=tx.objectStore('slots').get(slotKey(content));const archives=tx.objectStore('archives').getAll();tx.oncomplete=()=>resolve({slot:slot.result,archives:archives.result});tx.onerror=()=>reject(tx.error)});
 db.close();await store.close();
 return {result,contents};
}
// IDs are nondeterministic by design; hold their generator constant only in this isolated diagnostic.
Object.defineProperty(globalThis.crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-000000000001',configurable:true});
const results=[];
for(const test of cases){const baseline=await run(PreviousStore,test),candidate=await run(CurrentStore,test);const equal=JSON.stringify(baseline)===JSON.stringify(candidate);results.push({case:test.name,equal,result:candidate.result});if(!equal){writeFileSync('/tmp/mercy-opt-review/equivalence-mismatch.json',JSON.stringify({test:test.name,baseline,candidate},null,2));throw new Error('Mismatch '+test.name)}}
writeFileSync('/tmp/mercy-opt-review/equivalence.json',JSON.stringify({scope:'Exact JSON equality of save result, raw persisted slot, and archives between HEAD baseline and candidate, across 18 controlled legacy mechanical-fixture cases; UUID generation held constant in this isolated process only.',results},null,2));
console.log(JSON.stringify(results));
