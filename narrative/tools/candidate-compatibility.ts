import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {contentHash} from '../../src/engine/hash';
const oldtext=readFileSync('src/content/case.json','utf8'),text=readFileSync('src/content/case-v2.json','utf8');
const old=JSON.parse(oldtext),current=JSON.parse(text);
const sceneMap=Object.fromEntries(old.scenes.map((s:any)=>[s.id,s.id]));
const flagMap=Object.fromEntries([...new Set<string>(old.scenes.flatMap((s:any)=>s.choices.flatMap((q:any)=>q.effects??[])))].sort().map(id=>[id,id]));
const oldRecords=Object.fromEntries(old.scenes.flatMap((s:any)=>s.choices.filter((q:any)=>q.observation).map((q:any)=>[q.observation.id,q.observation.text])));
const sourceMap:Record<string,string>={};
for(const [id,literal]of Object.entries(oldRecords)){const target=current.sources.find((s:any)=>s.id===id);if(!target||target.text!==literal)throw new Error('No exact literal source for '+id);sourceMap[id]=id;}
const manifest={id:'short-case-v1-to-blaise-v2-candidate-2026-10-03',fromHash:contentHash(old),toHash:contentHash(current),sceneMap,flagMap,sourceMap,disclosures:['report-public','report-private'].flatMap(choiceId=>['ada','simon','miriam'].map(characterId=>({choiceId,characterId,refId:'bounded-finding'})))};
writeFileSync('narrative/loop/V2-COMPATIBILITY-PROPOSAL.json',JSON.stringify(manifest,null,2)+'\n');
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const report={status:'candidate; root activation pending',legacyFileSha256:sha(oldtext),candidateFileSha256:sha(text),legacyContentHash:manifest.fromHash,candidateContentHash:manifest.toHash,sceneCount:current.scenes.length,sourceCount:current.sources.length,choiceCount:current.scenes.flatMap((s:any)=>s.choices).length,paragraphWords:current.scenes.reduce((n:number,s:any)=>n+s.paragraphs.join(' ').split(/\s+/).length,0),limits:['Only explicit legacy observation literals map to encountered v2 sources.','Old proof flags do not create accepted selected-evidence deductions.','Old heard_miriam_intimate flag does not acquire the private-confidence source; pressed refusal used the same flag.','Old saved transcript remains literal; new first-arrival protagonist paragraphs are not inserted into its past.','No loop occasion reset has been integrated.','Candidate route checks are targeted, not exhaustive; no human timing.']};
writeFileSync('narrative/loop/V2-CANDIDATE-IDENTITY.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
