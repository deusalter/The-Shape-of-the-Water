import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

// Use a real encountered-run export. Never hand the blind reader a content bundle or author ledger.
const [sourcePath,runPath,directory]=process.argv.slice(2);
if(!sourcePath||!runPath||!directory)throw Error('Usage: node tools/prepare-blind-reading.mjs CASE REAL-RUN OUTPUT-DIRECTORY');
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const bundle=await build({entryPoints:['src/engine/evidence-v2.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const engine=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const checked=engine.validateContentV2(JSON.parse(readFileSync(sourcePath,'utf8')));
if(!checked.ok)throw Error(checked.errors.join('\n'));
const run=JSON.parse(readFileSync(runPath,'utf8'));
const replayed=engine.importPortableV2(checked.value,run);
if(!replayed.ok)throw Error(replayed.errors.join('\n'));
let state=engine.createGameV2(checked.value),seenCount=0;
const lines=['# Encountered reading','', 'This is one actually captured route. Only passages, actions and notebook material available in that route appear below. It is not the whole game.',''];
function appendNewSeen(){
 const view=engine.projectPlayerV2(checked.value,state);
 for(const entry of view.transcript.slice(seenCount)){
  if(entry.kind==='passage')lines.push(`## ${entry.title}`,'',...entry.paragraphs.flatMap(text=>[text,'']));
  else{lines.push(`Chosen action: ${entry.label}`,'');if(entry.feedback)lines.push(entry.feedback,'');}
 }
 seenCount=view.transcript.length;
}
appendNewSeen();
for(const command of run.commands){
 const view=engine.projectPlayerV2(checked.value,state);
 if(command.type==='choose'&&view.choices.length)lines.push('Available actions at this point:','',...view.choices.map(choice=>`- ${choice.label}`),'');
 if(command.type==='submitDeduction'){
  const question=view.questions.find(item=>item.id===command.questionId);
  if(!question)throw Error('Submitted question was unavailable');
  const candidates=question.candidates.filter(item=>item.id===command.candidateId);
  const refs=[...view.sources,...view.deductions].filter(item=>command.selectedRefs.includes(item.id));
  lines.push('Factual claim submitted:','',question.text,'',...candidates.flatMap(item=>[item.text,'']),'Selected encountered support:','',...refs.flatMap(item=>[item.text,'']));
 }
 const result=engine.applyCommandV2(checked.value,state,command);if(!result.ok)throw Error(result.error.message);state=result.state;appendNewSeen();
}
const finalView=engine.projectPlayerV2(checked.value,state);
lines.push('## Notebook at the route boundary','');
for(const [label,entries]of [['Evidence',finalView.sources],['Supported conclusions',finalView.deductions],['Selected readings',finalView.interpretations],['Interpersonal decisions',finalView.relationships],['Requested help',finalView.hints]]){
 if(!entries.length)continue;lines.push(`### ${label}`,'');
 for(const entry of entries){if(entry.title)lines.push(entry.title,'');lines.push(entry.text,'');}
}
mkdirSync(directory,{recursive:true});const packet=`${directory}/ENCOUNTERED-READING.md`;writeFileSync(packet,lines.join('\n'));
writeFileSync(`${directory}/SOURCE-PINS.json`,JSON.stringify({scope:'Exact encountered route, replay-validated; automated capture is not human playtesting.',sourcePath,sourceSha256:hash(sourcePath),runPath,runSha256:hash(runPath),commands:run.commands.length,packetSha256:hash(packet),generatorSha256:hash('tools/prepare-blind-reading.mjs')},null,2)+'\n');
console.log(packet);
