import {it,expect} from 'vitest';
import {firstNightCase as installedCase} from '../src/content/load-evidence';
import {injectedPreview} from '../src/studio/preview-scenario';
import {createGameV2,applyCommandV2,availableChoicesV2,exportPortableV2,importPortableV2} from '../src/engine/evidence-v2';
if(!installedCase.ok)throw Error('Installed case failed validation');
const content=installedCase.value;
it('runs injected conditions in a separate identity without changing canonical content or allowing canonical import',()=>{
  const before=JSON.stringify(content);
  const scenario=injectedPreview(content,{sceneId:'concourse',flags:['heard_miriam'],sourceIds:['request-before-cut'],characters:[{id:'simon',initial:{knows:['request-before-cut'],believes:[],claims:[]}}]});
  const start=createGameV2(scenario);const command={type:'choose',choiceId:availableChoicesV2(scenario,start)[0].id,id:'scenario-enter',expectedRevision:0};
  const next=applyCommandV2(scenario,start,command);expect(next.ok).toBe(true);if(!next.ok)throw Error(next.error.message);
  expect(next.state.flags).toContain('heard_miriam');expect(next.state.sources.map(item=>item.id)).toContain('request-before-cut');expect(next.state.npcState.find(person=>person.id==='simon')?.knows).toContain('request-before-cut');expect(next.state.deductions).toEqual([]);
  expect(importPortableV2(scenario,exportPortableV2(next.state)).ok).toBe(true);expect(importPortableV2(content,exportPortableV2(next.state)).ok).toBe(false);expect(JSON.stringify(content)).toBe(before);
});
it('rejects unknown flags, evidence and malformed character references instead of silently injecting them',()=>{
  expect(()=>injectedPreview(content,{sceneId:'arrival',flags:['not-declared'],sourceIds:[]})).toThrow('declared');
  expect(()=>injectedPreview(content,{sceneId:'arrival',flags:[],sourceIds:['unknown']})).toThrow('declared');
  expect(()=>injectedPreview(content,{sceneId:'arrival',flags:[],sourceIds:[],characters:[{id:'simon',initial:{knows:['unknown'],believes:[],claims:[]}}]})).toThrow();
});
