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
  for(const path of ['AGENTS.md','README.md','RESUME.md','CONTINUE_PROMPT.md','pnpm-lock.yaml','src/content/selection.json','narrative/rebuild/VOICE-V4.md','narrative/rebuild/VOICE-LATER.md','narrative/rebuild/LATER-CHECKPOINT.json','narrative/rebuild/LATER-STRUCTURE-AND-DISCLOSURE.md','narrative/rebuild/A-CAUSAL-LEDGER.md','narrative/rebuild/SELECTION-AND-DISPOSITIONS.md','research/philosophy/KANT.md','research/philosophy/SPINOZA.md','research/philosophy/COMPARISON.md','research/reference/hello-charlotte/DOSSIER.md','docs/execution/HANDOFF.md','docs/execution/STATE.json']){
    if(!manifest.files?.[path])errors.push(`Required pin absent: ${path}`);
  }
  if(state.baseline?.archiveSha256!==manifest.baselineArchiveSha256)errors.push('Stale baseline identity');
  for(const path of state.continuityFiles??[]){
    if(!manifest.files?.[path])errors.push(`Required current continuity pin absent: ${path}`);
  }
  try {
    const selection=JSON.parse(read('src/content/selection.json'));
    if(typeof selection.file!=='string'||!/^case[-a-z0-9]*\.json$/.test(selection.file))throw Error('Invalid selected content file');
    const selectedPath=`src/content/${selection.file}`;
    if(state.activeContent!==selectedPath)errors.push('Stale selected content path');
    if(!manifest.files?.[selectedPath])errors.push(`Required pin absent: ${selectedPath}`);
    if(state.currentContentSha256!==manifest.files?.[selectedPath])errors.push('Stale content identity');
    for(const file of selection.retainedFiles??[]){
      if(typeof file!=='string'||!/^case[-a-z0-9]*\.json$/.test(file))throw Error('Invalid retained content file');
      if(!manifest.files?.[`src/content/${file}`])errors.push(`Required retained pin absent: ${file}`);
    }
  }catch(error){errors.push(`Invalid content selection: ${error.message}`);}
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
