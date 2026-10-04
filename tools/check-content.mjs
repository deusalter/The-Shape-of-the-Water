import { build } from 'esbuild';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const selection=JSON.parse(readFileSync('src/content/selection.json','utf8'));
if(!/^case(?:-v[0-9]+|-expanded)?\.json$/.test(selection.file)||![1,2].includes(selection.schemaVersion))throw new Error('Invalid installed content selection.');
const bundled = await build({entryPoints:[selection.schemaVersion===2?'src/engine/evidence-v2.ts':'src/engine/game.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const path=`src/content/${selection.file}`;
const bytes=readFileSync(path); const input=JSON.parse(bytes); const result=(selection.schemaVersion===2?engine.validateContentV2:engine.validateContent)(input);
const hashModule=await build({entryPoints:['src/engine/hash.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {contentHash}=await import(`data:text/javascript;base64,${Buffer.from(hashModule.outputFiles[0].text).toString('base64')}`);
const issues=[];let words=0,paragraphs=0;
function inspect(text,path){words+=text.trim().split(/\s+/).length;if(text.includes('\u2014'))issues.push({severity:'error',path,issue:'Em dash in original narrative'});for(const match of text.matchAll(/\b(?:tapestry of|architecture of grief|weight of memory|held its breath)\b/gi))issues.push({severity:'warning',path,offset:match.index,issue:`Review in context: ${match[0]}`});}
for(const [i,scene] of input.scenes.entries()){
 for(const [j,text] of scene.paragraphs.entries()){inspect(text,`scenes[${i}].paragraphs[${j}]`);paragraphs++;}
 for(const [k,variant] of (scene.variants??[]).entries())for(const [j,text] of variant.paragraphs.entries()){inspect(text,`scenes[${i}].variants[${k}].paragraphs[${j}]`);paragraphs++;}
 for(const [j,choice] of scene.choices.entries()){inspect(choice.label,`scenes[${i}].choices[${j}].label`);for(const kind of ['observation','interpretation','relationship'])if(choice[kind])inspect(choice[kind].text,`scenes[${i}].choices[${j}].${kind}.text`);}
}
for(const source of input.sources??[])inspect(source.text,`sources.${source.id}.text`);
for(const question of input.questions??[]){inspect(question.text,`questions.${question.id}.text`);for(const candidate of question.candidates)inspect(candidate.text,`questions.${question.id}.candidates.${candidate.id}`);for(const feedback of question.feedback)inspect(feedback.text,`questions.${question.id}.feedback.${feedback.code}`);}
for(const reading of input.interpretationRules??[])inspect(reading.text,`interpretations.${reading.id}`);
for(const hint of input.hints??[])inspect(hint.text,`hints.${hint.id}`);
const report={status:result.ok&&!issues.some(x=>x.severity==='error')?'PASS':'FAIL',path,schemaVersion:selection.schemaVersion,scope:'Content schema, graph references and original-narrative punctuation only; not solvability, playtime or literary quality',sha256:createHash('sha256').update(bytes).digest('hex'),canonicalContentHash:result.ok?contentHash(result.value):null,scenes:input.scenes.length,choices:input.scenes.reduce((n,s)=>n+s.choices.length,0),authoredWordsIncludingVariantsChoicesAndNotes:words,paragraphs,validation:result.ok?'PASS':result.errors,issues};
mkdirSync('docs/execution/evidence',{recursive:true});writeFileSync('docs/execution/evidence/content-check.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.status==='FAIL')process.exitCode=1;
