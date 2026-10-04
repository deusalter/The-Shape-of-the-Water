import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { checkHandoff } from './check-handoff.mjs';

const root=resolve('.'), manifest=JSON.parse(readFileSync('docs/execution/CHECKPOINT.json','utf8'));
const report={scope:'Static checks and safe-copy fault injection. No new chat, transferred memory or human reader.',baseline:checkHandoff(root),checks:[]};
const mutations={
  stale_baseline:(copy)=>edit(copy,'docs/execution/STATE.json',s=>{s.baseline.archiveSha256='older-unverified-package';}),
  missing_voice_anchor:(copy)=>rmSync(join(copy,'narrative/VOICE.md')),
  unknown_worker_ownership:(copy)=>edit(copy,'docs/execution/STATE.json',s=>{s.activeWorkers=[{owner:'unassigned_worker'}];}),
  unverified_test_claim:(copy)=>edit(copy,'docs/execution/STATE.json',s=>{s.testClaims.push({name:'invented human playtest',evidence:'never-run.json',field:'status',expected:'PASS'});}),
};
const expected={stale_baseline:'Stale baseline identity',missing_voice_anchor:'Missing or unreadable critical file: narrative/VOICE.md',unknown_worker_ownership:'Unknown worker ownership: unassigned_worker',unverified_test_claim:'Unverified test claim invented human playtest'};
function edit(copy,path,fn){const file=join(copy,path),value=JSON.parse(readFileSync(file,'utf8'));fn(value);writeFileSync(file,JSON.stringify(value));}
for(const [name,mutate] of Object.entries(mutations)){
  const copy=mkdtempSync(join(tmpdir(),'literary-handoff-'));
  try{
    for(const path of [...Object.keys(manifest.files),'docs/execution/CHECKPOINT.json']){
      const dest=join(copy,path);mkdirSync(dirname(dest),{recursive:true});cpSync(join(root,path),dest);
    }
    mutate(copy);const result=checkHandoff(copy);
    report.checks.push({name,status:result.status==='FAIL'&&result.errors.some(x=>x.startsWith(expected[name]))?'PASS':'FAIL',detected:result.errors});
  }finally{rmSync(copy,{recursive:true,force:true});}
}
report.status=report.baseline.status==='PASS'&&report.checks.every(x=>x.status==='PASS')?'PASS':'FAIL';
writeFileSync('docs/execution/evidence/handoff-rehearsal.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exitCode=report.status==='PASS'?0:1;
