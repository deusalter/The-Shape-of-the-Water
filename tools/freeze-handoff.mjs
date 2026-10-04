import {readFileSync,writeFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
// Freeze the actual tracked/eligible working project plus current static builds.
// Dependencies, credentials, ignored raw research and the archive being produced never enter this list.
const excluded=new Set(['docs/execution/CHECKPOINT.json','docs/execution/evidence/handoff-rehearsal.json']);
const trackedOnly=process.argv.includes('--tracked-only');
const names=execFileSync('git',trackedOnly?['ls-files','--cached','-z']:['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
function walk(path){return readdirSync(path).flatMap(name=>{const file=join(path,name);return statSync(file).isDirectory()?walk(file):[file];});}
for(const directory of ['dist-player','dist-studio'])if(existsSync(directory))names.push(...walk(directory));
const files={};for(const path of [...new Set(names)].sort())if(!excluded.has(path)&&existsSync(path)&&statSync(path).isFile())files[path]=createHash('sha256').update(readFileSync(path)).digest('hex');
const state=JSON.parse(readFileSync('docs/execution/STATE.json'));
const manifest={schemaVersion:2,scope:trackedOnly?'Selected tracked checkpoint; parallel untracked work is outside this freeze':'Current eligible working project',date:new Date().toISOString(),sourceBaseCommit:execFileSync('git',['rev-parse','HEAD']).toString().trim(),baselineArchiveSha256:state.baseline.archiveSha256,note:'Exact working files and current static builds. Manifest and its safe-copy rehearsal result exclude themselves to avoid circular hashes. Check Git history/publication receipt for commit identity.',files};
writeFileSync('docs/execution/CHECKPOINT.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({pinnedFiles:Object.keys(files).length,activeContent:state.activeContent}));
