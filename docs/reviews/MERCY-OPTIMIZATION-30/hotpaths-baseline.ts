import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { IDBFactory } from '/workspace/literary-detective/node_modules/fake-indexeddb/build/esm/index.js';
import { validateContentV2, importPortableV2, createGameV2, applyCommandV2, projectPlayerV2, validateStateV2, exportPortableV2 } from '/workspace/literary-detective/src/engine/evidence-v2';
import { contentHash, stateHash } from '/workspace/literary-detective/src/engine/hash';
import { CheckpointStore } from '/workspace/literary-detective/src/persistence/checkpoint-store';
const root='/workspace/literary-detective/';
const capture='docs/execution/evidence/mercy-content/a2.letter--invitation.encountered-run.json';
const contentFile='src/content/case-v7.json';
const content=validateContentV2(JSON.parse(readFileSync(root+contentFile,'utf8')));
if(!content.ok) throw new Error(content.errors.join('\n'));
const story=content.value;
const portable=JSON.parse(readFileSync(root+capture,'utf8'));
const imported=importPortableV2(story,portable);
if(!imported.ok) throw new Error(imported.errors.join('\n'));
const states=[createGameV2(story)];
for(const command of portable.commands){const result=applyCommandV2(story,states.at(-1)!,command);if(!result.ok||result.duplicate)throw new Error('Replay failed');states.push(result.state);}
if(stateHash(states.at(-1))!==stateHash(imported.value))throw new Error('Capture mismatch');
const stats=(samples:number[])=>({medianMs:[...samples].sort((a,b)=>a-b)[Math.floor(samples.length/2)],minMs:Math.min(...samples),maxMs:Math.max(...samples),samplesMs:samples});
function bench(fn:()=>unknown,repeat=5){fn();const times=[];for(let i=0;i<repeat;i++){const start=performance.now();fn();times.push(performance.now()-start);}return stats(times);}
const scalar=[];
for(const revision of [0,1,25,48,49]){
 const state=states[revision];
 scalar.push({revision,scene:state.currentScene,checkpointBytes:Buffer.byteLength(JSON.stringify(state)),projection:bench(()=>projectPlayerV2(story,state)),validateReplay:bench(()=>{const checked=validateStateV2(story,state);if(!checked.ok)throw new Error('Invalid');},3),stateHash:bench(()=>stateHash(state)),nextCommand:bench(()=>{const r=applyCommandV2(story,state,portable.commands[revision]);if(!r.ok)throw new Error('Invalid command');},3)});
}
const saves=[];
for(const startRevision of [0,44]){
 let validated:any[]=[];
 const runtime={schemaVersion:2,engineVersion:2,validateState:(content:any,input:any)=>{const start=performance.now();const result=validateStateV2(content,input);validated.push({revision:input?.revision,ms:performance.now()-start});return result;},exportPortable:exportPortableV2};
 const store=new CheckpointStore(runtime,new IDBFactory(),`review-${startRevision}`);
 let commit=0;
 for(let revision=startRevision;revision<=startRevision+4;revision++){
  validated=[];const start=performance.now();const result=await store.save(story,states[revision],commit);const ms=performance.now()-start;
  if(!result.ok)throw new Error(JSON.stringify(result));commit=result.commit;
  const details={revision,ms,validationCalls:validated.length,validationMs:validated.reduce((sum,x)=>sum+x.ms,0),validated};
  validated=[];const refreshStart=performance.now();await Promise.all([store.listArchives(story),store.getRunMetadata(story),store.loadProtectedCheckpoint(story)]);
  saves.push({...details,refreshMs:performance.now()-refreshStart,refreshValidated:validated});
 }
 await store.close();
}
const pins=Object.fromEntries([contentFile,capture,'src/engine/evidence-runtime.ts','src/engine/evidence-portable.ts','src/engine/evidence-budget.ts','src/engine/hash.ts','src/persistence/checkpoint-store.ts'].map(file=>[file,createHash('sha256').update(readFileSync(root+file)).digest('hex')]));
const report={scope:'Node same-machine CPU diagnostics using real final Mercy invitation capture replay; fake IndexedDB reproduces persistence code/checks but not physical disk timing. Three replay/action samples, five scalar samples after warmup; save transactions recorded once each. Engine source unchanged at time of measurement.',contentHash:contentHash(story),pins,scalar,saves};
writeFileSync('/tmp/mercy-opt-review/hotpaths.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
