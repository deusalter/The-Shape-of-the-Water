import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const folder='docs/reviews/COUNTRY-INTEGRATION-16';
const raw=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const runs=readdirSync('narrative/rebuild/readings-v5').filter(name=>name.endsWith('.run.json')).sort().map(name=>`narrative/rebuild/readings-v5/${name}`);
const files=['src/content/case-v5.json','src/content/case-v4.json','src/content/case-v2.json','narrative/rebuild/BUILD-V5.json','narrative/rebuild/STAGING-V5.json',...readdirSync('src/engine').filter(name=>name.startsWith('evidence-')&&name.endsWith('.ts')).map(name=>`src/engine/${name}`),...runs];
const pins=()=>Object.fromEntries(files.map(path=>[path,hash(path)]));
const report={status:'RUNNING',scope:'Independent candidate content/engine review. Exhaustive country choices from six genuine earlier-movement prefixes, not exhaustive whole-game search or UI/renderer verification.',pinsBefore:pins(),checks:[],endpoints:[],failures:[]};
const bundled=await build({stdin:{contents:"export * from './src/engine/evidence-v2.ts'; export {ancestralOriginsV2} from './src/engine/evidence-occasions.ts'; export {contentHash,stateHash} from './src/engine/hash.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const e=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const content=raw('src/content/case-v5.json'),v4=raw('src/content/case-v4.json'),v2=raw('src/content/case-v2.json');
const oldScenes=new Set(v4.scenes.map(scene=>scene.id)),newScenes=content.scenes.filter(scene=>!oldScenes.has(scene.id)),countryScenes=new Set([...newScenes.map(scene=>scene.id),'o0.orchard-departure','o0.dry-departure']);
const allNewChoices=content.scenes.filter(scene=>countryScenes.has(scene.id)).flatMap(scene=>scene.choices.map(choice=>choice.id));
const sceneSeen=new Set(),choiceSeen=new Set(),variantSeen=new Set(),sourceSeen=new Set();
let steps=0,negativeChecks=0,confirmations=0;
const expectedOrigins={
 'o0.country-mechanism-report':['o0.cast-installation','o0.direct-braid-material','o0.release-mechanism'],
 'o0.house-report':['o0.cast-installation','o0.cast-removed','o0.direct-braid-material','o0.release-mechanism'],
 'o0.orchard-tool-report':['o0.alma-memory','o0.cradle-material'],
 'o0.cradle-rubbing':['o0.alma-memory','o0.cradle-material'],
 'o0.floor-tracing':['o0.basil-memory','o0.source-floor-material'],
 'o0.emil-cut-account':['o0.emil-cut-memory'],
 'o0.emil-consent-account':['o0.emil-cut-memory'],
 'o0.emil-written':['o0.emil-cut-memory'],
 'o0.emil-oral-offer':['o0.emil-cut-memory'],
};
const npc=(state,id)=>state.npcState.find(actor=>actor.id===`o0.${id}`);
const has=(state,id)=>state.sources.some(source=>source.id===`o0.${id}`);
const knows=(state,actor,id)=>npc(state,actor).knows.includes(`o0.${id}`);
function inspect(state,seed,path){
 sceneSeen.add(state.currentScene);variantSeen.add(e.currentPassageV2(state).variantId);
 for(const source of state.sources){
  sourceSeen.add(source.id);
  for(const parent of source.derivedFrom??[]){const encountered=state.sources.find(item=>item.id===parent)??state.deductions.find(item=>item.id===parent);assert.ok(encountered,`${source.id} lacks encountered parent ${parent}`);assert.ok(encountered.revision<=source.revision);}
  if(expectedOrigins[source.id])assert.deepEqual([...e.ancestralOriginsV2(state,source.id)].sort(),expectedOrigins[source.id]);
 }
 assert.deepEqual(state.transcript.slice(0,seed.prefix.transcript.length),seed.prefix.transcript,'new journey rewrote first-movement transcript');
 assert.deepEqual(state.deductions,seed.prefix.deductions,'new testimony silently generated a culprit/physical-fit deduction');
 for(const actor of seed.side==='orchard'?['noor','dora-table','basil']:['noor','dora-orchard','alma'])assert.deepEqual(npc(state,actor),npc(seed.prefix,actor),`absent ${actor} gained country knowledge`);
 for(const id of ['alma-account','cradle-marks'])assert.equal(knows(state,'dora-orchard',id),false,'root received distant private original source');
 for(const actor of ['alma','basil','emil','rene'])for(const id of ['closed-source','confession-source'])assert.equal(knows(state,actor,id),false,`${actor} received earlier private conduct`);
 for(const actor of ['noor','dora-table','dora-orchard','alma','basil','rene'])for(const id of ['emil-cut-account','emil-consent-account','emil-written','emil-oral-offer','emil-relationship'])assert.equal(knows(state,actor,id),false,`${actor} received private house testimony`);
 assert.equal(has(state,'cradle-loan')&&has(state,'cradle-rubbing'),false);
 assert.equal(has(state,'floor-tracing')&&has(state,'panel-arranged'),false);
 assert.equal(has(state,'emil-written')&&has(state,'emil-oral-offer'),false);
 if(seed.side==='orchard')assert.equal(has(state,'floor-source')||has(state,'basil-account')||has(state,'pipe-rehearsed'),false);
 else assert.equal(has(state,'rain-present')||has(state,'alma-account')||has(state,'cradle-loan'),false);
 if(state.currentScene==='o0.orchard-house-departure')assert.equal(knows(state,'dora-orchard','orchard-tool-report'),true);
 if(state.currentScene==='o0.house-window')assert.equal(e.currentPassageV2(state).variantId,seed.side==='dry'?'o0.house-window-with-lamp':has(state,'cradle-loan')?'o0.house-window-with-cradle':'o0.house-window.base');
 if(has(state,'emil-written'))assert.equal(state.sources.find(source=>source.id==='o0.emil-written').kind,'document');
 if(has(state,'emil-oral-offer'))assert.equal(state.sources.find(source=>source.id==='o0.emil-oral-offer').kind,'statement');
 if(has(state,'emil-earlier-control'))assert.equal(state.sources.find(source=>source.id==='o0.emil-earlier-control').kind,'statement');
 const view=e.projectPlayerV2(content,state);assert.equal(Object.hasOwn(view,'npcState'),false);
 const unchanged=e.stateHash(state);
 const forbidden=allNewChoices.find(id=>!content.scenes.find(scene=>scene.id===state.currentScene).choices.some(choice=>choice.id===id));
 const negative=e.applyCommandV2(content,state,{type:'choose',id:`negative.${seed.name}.${steps}`,expectedRevision:state.revision,choiceId:forbidden});
 assert.equal(negative.ok,false);assert.equal(negative.error.code,state.ended?'ended':'unavailable-choice');assert.equal(e.stateHash(state),unchanged);negativeChecks++;
}
function expand(state,seed,path=[]){
 assert.ok(path.length<30,'unexpected cycle in bounded new continuation');steps++;inspect(state,seed,path);
 const offered=e.availableChoicesV2(content,state);
 if(state.ended){
  assert.equal(state.currentScene,'o0.rene-arrival');assert.equal(offered.length,0);assert.equal(e.availableQuestionsV2(content,state).length,0);
  assert.equal(knows(state,'rene','house-report'),false);assert.equal(knows(state,'rene','rene-arrival-account'),true);assert.equal(knows(state,'emil','rene-arrival-account'),true);
  const portable=e.exportPortableV2(state);const restored=e.importPortableV2(content,portable);assert.equal(restored.ok,true);assert.deepEqual(restored.value,state);
  assert.equal(e.importPortableV2(v4,portable).ok,false);assert.equal(e.importPortableV2(v2,portable).ok,false);
  report.endpoints.push({prefix:seed.name,side:seed.side,suffix:path,commands:state.commands.length,sourceIds:state.sources.map(source=>source.id),variantIds:state.transcript.filter(entry=>entry.kind==='passage'&&countryScenes.has(entry.sceneId)).map(entry=>entry.variantId)});
  if(!report.exampleExport&&seed.side==='orchard'&&has(state,'cradle-rubbing')&&has(state,'emil-oral-offer')){writeFileSync(`${folder}/novel-rubbing-oral.run.json`,portable);report.exampleExport='novel-rubbing-oral.run.json';}
  return;
 }
 assert.ok(offered.length,`dead end at ${state.currentScene}`);
 const declared=content.scenes.find(scene=>scene.id===state.currentScene).choices.map(choice=>choice.id).sort();
 assert.deepEqual(offered.map(choice=>choice.id).sort(),declared,`declared new branch silently unavailable at ${state.currentScene}`);
 for(const choice of offered){
  const command={type:'choose',id:`country16.${seed.name}.${steps}.${choice.id}`,expectedRevision:state.revision,choiceId:choice.id};
  let result=e.applyCommandV2(content,state,command);
  if(choice.ending){assert.equal(result.ok,false);assert.equal(result.error.code,'confirmation-required');assert.equal(result.state,state);command.confirmation=e.confirmationForV2(state,command);result=e.applyCommandV2(content,state,command);confirmations++;}
  assert.equal(result.ok,true,JSON.stringify(result.error));choiceSeen.add(choice.id);expand(result.state,seed,[...path,choice.id]);
 }
}
try{
 assert.equal(e.validateContentV2(content).ok,true);
 const initialCaseHash=hash('src/content/case-v5.json');assert.equal(initialCaseHash,'1ff7b7d98abdf20428bb80dcd0436377422505c3e6622bf6c1c9c1dde51ddb8f');
 const scenesChanged=v4.scenes.filter(scene=>JSON.stringify(scene)!==JSON.stringify(content.scenes.find(item=>item.id===scene.id))).map(scene=>scene.id);
 assert.deepEqual(scenesChanged,['o0.orchard-agreement','o0.dry-agreement','o0.orchard-departure','o0.dry-departure']);
 for(const scene of v4.scenes){const next=content.scenes.find(item=>item.id===scene.id);for(const field of Object.keys(scene).filter(key=>key!=='choices'))assert.deepEqual(next[field],scene[field]);}
 for(const collection of ['sources','characters','questions','interpretationRules','hints'])for(const item of v4[collection])assert.deepEqual(content[collection].find(next=>next.id===item.id),item);
 report.checks.push('Earlier text and evidence contracts remain exact; only four first-movement scene choice lists changed to open the two country departures.');
 for(const file of runs){
  const portable=raw(file),restored=e.importPortableV2(content,portable);assert.equal(restored.ok,true,`${file} does not replay`);
  let state=e.createGameV2(content);
  for(const command of portable.commands){const result=e.applyCommandV2(content,state,command);assert.equal(result.ok,true);state=result.state;if(['o0.orchard-departure','o0.dry-departure'].includes(state.currentScene))break;}
  assert.equal(state.ended,false);const side=state.currentScene==='o0.orchard-departure'?'orchard':'dry';expand(state,{name:file.split('/').at(-1).replace('.run.json',''),side,prefix:state});
 }
 report.coverage={statesVisited:steps,terminalCombinations:report.endpoints.length,negativeShortcuts:negativeChecks,endingConfirmations:confirmations,newScenesReached:newScenes.filter(scene=>sceneSeen.has(scene.id)).length,newSceneTotal:newScenes.length,newChoicesReached:choiceSeen.size,newChoiceTotal:allNewChoices.length,missingScenes:newScenes.filter(scene=>!sceneSeen.has(scene.id)).map(scene=>scene.id),missingChoices:allNewChoices.filter(id=>!choiceSeen.has(id)),newVariantsReached:newScenes.flatMap(scene=>scene.variants??[]).filter(variant=>variantSeen.has(variant.id)).map(variant=>variant.id),missingNewSources:content.sources.filter(source=>!v4.sources.some(old=>old.id===source.id)&&!sourceSeen.has(source.id)).map(source=>source.id)};
 assert.equal(report.endpoints.length,36);assert.deepEqual(report.coverage.missingScenes,[]);assert.deepEqual(report.coverage.missingChoices,[]);assert.deepEqual(report.coverage.missingNewSources,[]);
 report.checks.push('All 24 new scenes and every continuation choice are reached across 36 complete branch combinations from six genuine first-movement prefixes; no offered-branch dead end or orphan new source.');
 report.checks.push('At every reached state, absent listeners remain unchanged, the distant root receives no Alma original source, house testimony stays private, and physical-loan/document/arrangement branches remain mutually exclusive.');
 report.checks.push('Checked documents and oral forms preserve expected ancestral origins; no new culprit or performed-fit deduction is generated. Terminal confirmation is required and all endpoint exports replay exactly.');
 const oldPortable=raw('narrative/rebuild/readings/kept-declined-orchard.run.json');assert.equal(e.importPortableV2(v4,oldPortable).ok,true);assert.equal(e.importPortableV2(content,oldPortable).ok,false);
 const currentRun=e.exportPortableV2(e.createGameV2(content)),olderRun=e.exportPortableV2(e.createGameV2(v2));assert.equal(e.importPortableV2(v2,olderRun).ok,true);assert.equal(e.importPortableV2(content,olderRun).ok,false);assert.equal(e.importPortableV2(v4,currentRun).ok,false);
 const changed=structuredClone(content);changed.scenes[0].paragraphs[0]+=' Review-only hash mismatch.';assert.equal(e.importPortableV2(changed,currentRun).ok,false);
 report.checks.push('Real completed v4 archive rejects in v5; v2 rejects in v5; v5 rejects in v4/v2, and a same-version prose change rejects the original v5 export. No migration or remapping was supplied.');
 report.status='PASS';
}catch(error){report.status='FAIL';report.failures.push(String(error));process.exitCode=1;}
finally{report.pinsAfter=pins();report.stable=JSON.stringify(report.pinsBefore)===JSON.stringify(report.pinsAfter);writeFileSync(`${folder}/boundary-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks,coverage:report.coverage,failures:report.failures,stable:report.stable},null,2));}
