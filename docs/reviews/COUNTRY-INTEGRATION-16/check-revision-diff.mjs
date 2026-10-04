import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='docs/reviews/COUNTRY-INTEGRATION-16';
const previous=JSON.parse(readFileSync(`${folder}/prior-1ff7b7d9/case-v5.json`,'utf8'));
const bytes=readFileSync('src/content/case-v5.json');
const current=JSON.parse(bytes);
const sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,process.argv[2],'Pass the exact new case SHA as the first argument.');
const differences=[];
function diff(a,b,path=[]){
 if(JSON.stringify(a)===JSON.stringify(b))return;
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
  for(const key of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[key],b[key],[...path,key]);
 }else differences.push({path:path.join('.'),before:a,after:b});
}
diff(previous,current);
const sceneIndex=current.scenes.findIndex(scene=>scene.id==='o0.account-written');
const sourceIndex=current.sources.findIndex(source=>source.id==='o0.emil-written');
const allowed=differences.every(change=>change.path===`scenes.${sceneIndex}.title`||change.path.startsWith(`scenes.${sceneIndex}.paragraphs.`)||change.path===`sources.${sourceIndex}.text`);
const report={previousSha256:'1ff7b7d98abdf20428bb80dcd0436377422505c3e6622bf6c1c9c1dde51ddb8f',currentSha256:sha256,allowedOnly:allowed,differences,scene:current.scenes[sceneIndex],source:current.sources[sourceIndex]};
writeFileSync(`${folder}/revision-diff.json`,JSON.stringify(report,null,2)+'\n');
assert.ok(allowed,'Unexpected change beyond checked-account title/prose/source text.');
assert.ok(differences.length,'No new revision to review.');
console.log(JSON.stringify({currentSha256:sha256,allowedOnly:allowed,paths:differences.map(change=>change.path)},null,2));
