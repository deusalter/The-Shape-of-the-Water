import { readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function checkHandoff(root) {
  const errors=[];
  const inside=(path)=>{const full=resolve(root,path), rel=relative(root,full);if(isAbsolute(path)||rel.startsWith('..'))throw Error(`Unsafe snapshot path: ${path}`);return full;};
  const read=(path)=>readFileSync(inside(path),'utf8');
  const digest=(path)=>createHash('sha256').update(readFileSync(inside(path))).digest('hex');
  let manifest,state;
  try { manifest=JSON.parse(read('docs/execution/CHECKPOINT.json'));state=JSON.parse(read('docs/execution/STATE.json')); }
  catch(error){return {status:'FAIL',errors:[String(error)]};}
  for(const [path,hash] of Object.entries(manifest.files??{})){
    try {if(digest(path)!==hash)errors.push(`Changed snapshot file: ${path}`);}
    catch(error){errors.push(`Missing or unreadable critical file: ${path}`);}
  }
  for(const path of ['AGENTS.md','README.md','RESUME.md','CONTINUE_PROMPT.md','pnpm-lock.yaml','src/content/case.json','narrative/VOICE.md','narrative/CANON.md','research/philosophy/KANT.md','research/philosophy/SPINOZA.md','research/philosophy/COMPARISON.md','docs/execution/HANDOFF.md']){
    if(!manifest.files?.[path])errors.push(`Required pin absent: ${path}`);
  }
  if(state.baseline?.archiveSha256!==manifest.baselineArchiveSha256)errors.push('Stale baseline identity');
  if(state.currentContentSha256!==manifest.files?.['src/content/case.json'])errors.push('Stale content identity');
  if(!Number.isInteger(state.maxActiveSubagents)||state.maxActiveSubagents>4)errors.push('Invalid worker limit');
  for(const worker of state.activeWorkers??[]){
    if(!state.ownership?.[worker.owner])errors.push(`Unknown worker ownership: ${worker.owner}`);
  }
  for(const claim of state.testClaims??[]){
    try {
      if(!manifest.files?.[claim.evidence])throw Error('Evidence is not pinned');
      const evidence=JSON.parse(read(claim.evidence));
      const actual=claim.field.split('.').reduce((value,key)=>value?.[key],evidence);
      if(actual!==claim.expected)throw Error(`Expected ${claim.expected}, found ${actual}`);
    } catch(error){errors.push(`Unverified test claim ${claim.name}: ${error.message}`);}
  }
  return {status:errors.length?'FAIL':'PASS',scope:'Static snapshot integrity and claim consistency only; not a fresh-chat resume or new gameplay test',pinnedFiles:Object.keys(manifest.files??{}).length,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=checkHandoff(resolve(process.argv[2]??'.'));
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.status==='PASS'?0:1;
}
