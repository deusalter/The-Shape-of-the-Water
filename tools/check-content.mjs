import { build } from 'esbuild';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const bundled = await build({entryPoints:['src/engine/game.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const path='src/content/case.json';
const bytes=readFileSync(path); const input=JSON.parse(bytes); const result=engine.validateContent(input);
const issues=[];let words=0,paragraphs=0;
function inspect(text,path){words+=text.trim().split(/\s+/).length;if(text.includes('\u2014'))issues.push({severity:'error',path,issue:'Em dash in original narrative'});for(const match of text.matchAll(/\b(?:tapestry of|architecture of grief|weight of memory|held its breath)\b/gi))issues.push({severity:'warning',path,offset:match.index,issue:`Review in context: ${match[0]}`});}
for(const [i,scene] of input.scenes.entries()){
 for(const [j,text] of scene.paragraphs.entries()){inspect(text,`scenes[${i}].paragraphs[${j}]`);paragraphs++;}
 for(const [k,variant] of (scene.variants??[]).entries())for(const [j,text] of variant.paragraphs.entries()){inspect(text,`scenes[${i}].variants[${k}].paragraphs[${j}]`);paragraphs++;}
 for(const [j,choice] of scene.choices.entries()){inspect(choice.label,`scenes[${i}].choices[${j}].label`);for(const kind of ['observation','interpretation','relationship'])if(choice[kind])inspect(choice[kind].text,`scenes[${i}].choices[${j}].${kind}.text`);}
}
const report={status:result.ok&&!issues.some(x=>x.severity==='error')?'PASS':'FAIL',scope:'Content schema, graph references and original-narrative punctuation only; not solvability, playtime or literary quality',sha256:createHash('sha256').update(bytes).digest('hex'),canonicalContentHash:result.ok?engine.contentHash(result.value):null,scenes:input.scenes.length,choices:input.scenes.reduce((n,s)=>n+s.choices.length,0),authoredWordsIncludingVariantsChoicesAndNotes:words,paragraphs,validation:result.ok?'PASS':result.errors,issues};
mkdirSync('docs/execution/evidence',{recursive:true});writeFileSync('docs/execution/evidence/content-check.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.status==='FAIL')process.exitCode=1;
