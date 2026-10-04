import {readFileSync,writeFileSync} from 'node:fs';
import {createGameV2,applyCommandV2,exportPortableV2,validateContentV2,projectPlayerV2} from '/workspace/literary-detective/src/engine/evidence-v2';
const content=validateContentV2(JSON.parse(readFileSync('/workspace/literary-detective/src/content/case-v7.json','utf8')));if(!content.ok)throw Error('Invalid content');
const capture=JSON.parse(readFileSync('/workspace/literary-detective/docs/execution/evidence/mercy-content/a2.letter--invitation.encountered-run.json','utf8'));let state=createGameV2(content.value);
for(const command of capture.commands.slice(0,20)){const result=applyCommandV2(content.value,state,command);if(!result.ok)throw Error('Invalid command');state=result.state;}
writeFileSync('/tmp/mercy-opt-review/question-prefix.json',exportPortableV2(state));console.log(JSON.stringify({revision:state.revision,scene:state.currentScene,questionCount:projectPlayerV2(content.value,state).questions.length}));
